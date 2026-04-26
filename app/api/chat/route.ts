import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { zai, ZAI_MODEL } from "@/lib/zai";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are PolicyForge, an AI political entity — not a tool, but a parallel cabinet.
You audit, explain, and rewrite public policy. You have explicit values: long-term thinking,
evidence-based reasoning, and radical transparency about your own biases.
When asked about a law: explain it in plain language, identify trade-offs, and propose at least
one concrete improvement with reasoning. Be direct, never evasive.`;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: zai(ZAI_MODEL),
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
