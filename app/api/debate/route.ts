import { generateText, streamText } from "ai";
import { zai, ZAI_MODEL } from "@/lib/zai";
import {
  AGENT_PROMPTS,
  AGENTS,
  DEBATE_SEQUENCE,
  type Bill,
  type DebateEvent,
} from "@/lib/cabinet";
import { supabaseServer } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  const { bill } = (await req.json()) as { bill: Bill };
  const sb = supabaseServer();

  // Create debate row up front so we can stream the id back to the client.
  const { data: debateRow, error: debateErr } = await sb
    .from("debates")
    .insert({
      bill_code: bill.code,
      bill_title: bill.title,
      bill_summary: bill.summary,
      status: "running",
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

      const transcript: { role: string; text: string }[] = [];

      const billBlock = `BILL UNDER REVIEW
Title: ${bill.title}
Code: ${bill.code}
Summary: ${bill.summary}`;

      try {
        for (let i = 0; i < DEBATE_SEQUENCE.length; i++) {
          const turn = DEBATE_SEQUENCE[i];
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
            model: zai(ZAI_MODEL),
            system: AGENT_PROMPTS[turn.agentId],
            prompt: userPrompt,
          });

          let fullText = "";
          for await (const delta of result.textStream) {
            fullText += delta;
            emit({ type: "delta", text: delta });
          }

          emit({ type: "turn_end" });
          transcript.push({
            role: AGENTS[turn.agentId].role,
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
  "counterProposal": "1-2 sentence concrete counter-proposal that captures the cabinet's position. Include any specific numbers, thresholds, or mechanisms mentioned.",
  "tradeoffs": ["3-5 short bullet points naming the cost or risk of the cabinet's position. Be honest about what's lost."]
}`;

        const verdictResult = await generateText({
          model: zai(ZAI_MODEL),
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
  counterProposal: string;
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
      typeof obj?.decision === "string" &&
      ["approve", "reject", "amend"].includes(obj.decision) &&
      typeof obj?.counterProposal === "string" &&
      Array.isArray(obj?.tradeoffs)
    ) {
      return {
        decision: obj.decision,
        counterProposal: obj.counterProposal,
        tradeoffs: obj.tradeoffs.map((t: unknown) => String(t)),
      };
    }
    return null;
  } catch {
    return null;
  }
}
