import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export const zai = createOpenAICompatible({
  name: "zai",
  apiKey: process.env.ZAI_API_KEY,
  baseURL: "https://api.z.ai/api/paas/v4",
});

export const ZAI_MODEL = process.env.ZAI_MODEL ?? "glm-5.1";
export const ZAI_MODEL_FAST = process.env.ZAI_MODEL_FAST ?? "glm-5-turbo";

export type Speed = "quality" | "fast";

export function pickModel(speed: Speed | undefined): string {
  return speed === "fast" ? ZAI_MODEL_FAST : ZAI_MODEL;
}
