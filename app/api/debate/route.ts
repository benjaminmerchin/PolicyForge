import { generateText, streamText } from "ai";
import { zai, pickModel, type Speed } from "@/lib/zai";
import {
  AGENTS,
  DEBATE_PRESETS,
  buildAgentSystemPrompt,
  type Bill,
  type DebateEvent,
  type DebateLength,
} from "@/lib/cabinet";
import { supabaseServer, type CabinetRow } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const { bill, cabinetId, length, speed } = (await req.json()) as {
    bill: Bill;
    cabinetId?: string | null;
    length?: DebateLength;
    speed?: Speed;
  };
  const sequence =
    DEBATE_PRESETS[length ?? "standard"]?.sequence ??
    DEBATE_PRESETS.standard.sequence;
  const model = pickModel(speed);
  const sb = supabaseServer();

  // Resolve cabinet (default to Helios if none provided).
  let cabinet: CabinetRow | null = null;
  if (cabinetId) {
    const { data } = await sb.from("cabinets").select("*").eq("id", cabinetId).single();
    if (data) cabinet = data as CabinetRow;
  }
  if (!cabinet) {
    const { data } = await sb
      .from("cabinets")
      .select("*")
      .eq("slug", "helios")
      .single();
    if (data) cabinet = data as CabinetRow;
  }
  const cabinetLens = cabinet?.lens ?? null;
  const cabinetDbId = cabinet?.id ?? null;
  const cabinetMembers = cabinet?.members ?? null;

  // Create debate row up front so we can stream the id back to the client.
  const { data: debateRow, error: debateErr } = await sb
    .from("debates")
    .insert({
      bill_code: bill.code,
      bill_title: bill.title,
      bill_summary: bill.summary,
      status: "running",
      cabinet_id: cabinetDbId,
    })
    .select("id")
    .single();

  if (debateErr || !debateRow) {
    return new Response(
      JSON.stringify({ error: debateErr?.message ?? "DB insert failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  const debateId = debateRow.id;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const emit = (event: DebateEvent | { type: "debate_id"; id: string }) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      emit({ type: "debate_id", id: debateId });

      if (cabinet) {
        emit({
          type: "cabinet",
          id: cabinet.id,
          name: cabinet.name,
          accent: cabinet.accent,
          members: cabinet.members ?? null,
        });
      }

      const transcript: { role: string; text: string }[] = [];

      const billBlock = `BILL UNDER REVIEW
Title: ${bill.title}
Code: ${bill.code}
Summary: ${bill.summary}`;

      try {
        for (let i = 0; i < sequence.length; i++) {
          const turn = sequence[i];
          emit({
            type: "turn_start",
            agentId: turn.agentId,
            intent: turn.intent,
            index: i,
          });

          const transcriptText =
            transcript.length === 0
              ? "(Session opening — no prior turns.)"
              : transcript.map((t) => `${t.role}: ${t.text}`).join("\n\n");

          const userPrompt = `${billBlock}

TRANSCRIPT SO FAR:
${transcriptText}

YOUR TURN — ${turn.intent.toUpperCase()}:
${turn.instruction}`;

          const result = streamText({
            model: zai(model),
            system: buildAgentSystemPrompt(turn.agentId, cabinetLens, cabinetMembers),
            prompt: userPrompt,
          });

          let fullText = "";
          for await (const delta of result.textStream) {
            fullText += delta;
            emit({ type: "delta", text: delta });
          }

          emit({ type: "turn_end" });
          const member = cabinetMembers?.[turn.agentId];
          const transcriptRole = member
            ? `${member.name} (${member.title})`
            : AGENTS[turn.agentId].role;
          transcript.push({
            role: transcriptRole,
            text: fullText,
          });

          // Persist the completed turn (one DB write per turn — keeps it cheap).
          await sb.from("turns").insert({
            debate_id: debateId,
            idx: i,
            agent_id: turn.agentId,
            intent: turn.intent,
            text: fullText,
          });
        }

        const verdictPrompt = `You are the recording secretary of the cabinet. Based on the debate transcript below, produce a structured verdict.

DEBATE TRANSCRIPT:
${transcript.map((t) => `${t.role}: ${t.text}`).join("\n\n")}

Output ONLY a JSON object (no markdown fences, no commentary). Schema:
{
  "decision": "approve" | "reject" | "amend",
  "headline": "ONE punchy sentence (15-25 words) summarizing the cabinet's verdict. Tweet-length, citation-worthy. Active voice.",
  "counterProposal": "1-2 sentence concrete counter-proposal capturing the cabinet's position.",
  "amendments": ["3-5 concrete numbered changes the cabinet wants. Each item: one specific change, 1 sentence. Include numbers/thresholds/mechanisms when raised."],
  "winners": ["2-4 short stakeholder groups that benefit from the cabinet's position (e.g. 'Mid-cap manufacturers', 'Displaced workers in the Midwest')."],
  "losers": ["2-4 short stakeholder groups that lose from the cabinet's position. Be honest."],
  "numbers": ["2-4 quantitative claims raised IN THE DEBATE (do not invent — pull from minister statements). Format: short statement with the number, e.g. 'Surcharge raises ~$11.4B/year'. If no numbers were raised, return []."],
  "dissent": "ONE sentence describing whether the cabinet was unified or had a sharp internal split, AND whether the Opposition Shadow scored any point worth flagging. Null only if the debate was fully unanimous and Opposition was unconvincing.",
  "tradeoffs": ["3-5 short bullet points naming the cost or risk of the cabinet's position. Be honest about what's lost."]
}`;

        const verdictResult = await generateText({
          model: zai(model),
          system:
            "You are a precise legislative recorder. You output only valid JSON. No markdown. No prose outside the JSON object.",
          prompt: verdictPrompt,
        });

        const verdict = parseVerdict(verdictResult.text);
        if (verdict) {
          emit({ type: "verdict", ...verdict });
          await sb
            .from("debates")
            .update({
              status: "done",
              decision: verdict.decision,
              counter_proposal: verdict.counterProposal,
              tradeoffs: verdict.tradeoffs,
              headline: verdict.headline,
              amendments: verdict.amendments,
              winners: verdict.winners,
              losers: verdict.losers,
              numbers: verdict.numbers,
              dissent: verdict.dissent,
              finished_at: new Date().toISOString(),
            })
            .eq("id", debateId);
        } else {
          emit({ type: "error", message: "Failed to parse verdict JSON." });
          await sb
            .from("debates")
            .update({
              status: "error",
              error_message: "Failed to parse verdict JSON.",
              finished_at: new Date().toISOString(),
            })
            .eq("id", debateId);
        }

        emit({ type: "done" });
      } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown debate error";
        emit({ type: "error", message });
        await sb
          .from("debates")
          .update({
            status: "error",
            error_message: message,
            finished_at: new Date().toISOString(),
          })
          .eq("id", debateId);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}

function parseVerdict(raw: string): {
  decision: "approve" | "reject" | "amend";
  headline: string;
  counterProposal: string;
  amendments: string[];
  winners: string[];
  losers: string[];
  numbers: string[];
  dissent: string | null;
  tradeoffs: string[];
} | null {
  const trimmed = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  const slice = trimmed.slice(start, end + 1);

  try {
    const obj = JSON.parse(slice);
    if (
      typeof obj?.decision !== "string" ||
      !["approve", "reject", "amend"].includes(obj.decision) ||
      typeof obj?.counterProposal !== "string" ||
      !Array.isArray(obj?.tradeoffs)
    ) {
      return null;
    }
    const arr = (v: unknown): string[] =>
      Array.isArray(v) ? v.map((x) => String(x)).filter(Boolean) : [];
    const dissent =
      typeof obj.dissent === "string" && obj.dissent.trim().length > 0
        ? obj.dissent
        : null;
    return {
      decision: obj.decision,
      headline: typeof obj.headline === "string" ? obj.headline : "",
      counterProposal: obj.counterProposal,
      amendments: arr(obj.amendments),
      winners: arr(obj.winners),
      losers: arr(obj.losers),
      numbers: arr(obj.numbers),
      dissent,
      tradeoffs: arr(obj.tradeoffs),
    };
  } catch {
    return null;
  }
}
