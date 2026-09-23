import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`[inlay] ${name} must be set for the Step 3 baseline.`);
  return value;
}

function positiveInteger(name: string): number {
  const value = requiredEnvironment(name);
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) throw new Error(`[inlay] ${name} must be a positive integer.`);
  return parsed;
}

function boolean(name: string): boolean {
  const value = requiredEnvironment(name).toLowerCase();
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`[inlay] ${name} must be true or false.`);
}

function inputs(): Array<"text" | "image"> {
  const values = requiredEnvironment("INLAY_PROVIDER_INPUTS").split(",").map((value) => value.trim());
  if (values.length === 0 || values.some((value) => value !== "text" && value !== "image")) {
    throw new Error("[inlay] INLAY_PROVIDER_INPUTS must be a comma-separated list containing text and/or image.");
  }
  return [...new Set(values)] as Array<"text" | "image">;
}

function pricePerMillionTokens(name: string): number {
  const parsed = Number(requiredEnvironment(name));
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`[inlay] ${name} must be a non-negative price per million tokens.`);
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
      reasoning: boolean("INLAY_PROVIDER_REASONING"),
      input: inputs(),
      contextWindow: positiveInteger("INLAY_PROVIDER_CONTEXT_WINDOW"),
      maxTokens: positiveInteger("INLAY_PROVIDER_MAX_TOKENS"),
      cost: {
        input: pricePerMillionTokens("INLAY_PROVIDER_COST_INPUT"),
        output: pricePerMillionTokens("INLAY_PROVIDER_COST_OUTPUT"),
        cacheRead: pricePerMillionTokens("INLAY_PROVIDER_COST_CACHE_READ"),
        cacheWrite: pricePerMillionTokens("INLAY_PROVIDER_COST_CACHE_WRITE"),
      },
    }],
  });
}
