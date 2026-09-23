import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`[inlay] ${name} must be set for the Step 3 baseline.`);
  return value;
}

function positiveInteger(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`[inlay] ${name} must be a positive integer.`);
  return parsed;
}

/** Registers one explicitly configured OpenAI Chat Completions provider for Step 3 only. */
export default function hostedOpenAIBaselineProvider(pi: ExtensionAPI): void {
  const baseUrl = new URL(requiredEnvironment("INLAY_PI_BASE_URL"));
  if (baseUrl.protocol !== "http:" && baseUrl.protocol !== "https:") {
    throw new Error("[inlay] INLAY_PI_BASE_URL must use http or https.");
  }

  const model = requiredEnvironment("INLAY_PROVIDER_MODEL");
  pi.registerProvider("inlay-hosted", {
    name: "Inlay hosted baseline",
    baseUrl: baseUrl.href.replace(/\/$/, ""),
    apiKey: requiredEnvironment("INLAY_PROVIDER_API_KEY"),
    api: "openai-completions",
    models: [{
      id: model,
      name: `${model} (Inlay baseline)`,
      reasoning: false,
      input: ["text"],
      contextWindow: positiveInteger("INLAY_PROVIDER_CONTEXT_WINDOW", 128_000),
      maxTokens: positiveInteger("INLAY_PROVIDER_MAX_TOKENS", 8_192),
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    }],
  });
}
