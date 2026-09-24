import { StringDecoder } from "node:string_decoder";

const MAX_SSE_EVENT_CHARS = 64 * 1024;

const RESPONSE_TOP_LEVEL_FIELDS = new Set([
  "background",
  "client_metadata",
  "conversation",
  "include",
  "input",
  "instructions",
  "max_output_tokens",
  "max_tool_calls",
  "metadata",
  "model",
  "parallel_tool_calls",
  "previous_response_id",
  "prompt_cache_key",
  "reasoning",
  "service_tier",
  "store",
  "stream",
  "temperature",
  "text",
  "tool_choice",
  "tools",
  "top_p",
  "truncation",
  "user",
]);

const RESPONSE_INPUT_ITEM_TYPES = new Set([
  "computer_call",
  "computer_call_output",
  "function_call",
  "function_call_output",
  "item_reference",
  "message",
  "reasoning",
]);

export interface TopLevelFieldMetric {
  name: string;
  count: number;
  canonicalJsonBytes: number;
}

export interface RequestStructure {
  topLevelFieldCount: number;
  topLevelFields: TopLevelFieldMetric[];
  inputItemCount?: number;
  inputItemTypeCounts?: Record<string, number>;
}

export interface ProviderUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cachedInputTokens?: number;
}

export interface ResponseStreamObservation {
  responseBytes: number;
  timeToFirstResponseBodyByteMs?: number;
  usage?: ProviderUsage;
  terminalEventObserved: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function canonicalJsonBytes(value: unknown): number {
  const encoded = JSON.stringify(value);
  return encoded === undefined ? 0 : Buffer.byteLength(encoded, "utf8");
}

/** Derives content-free structure from a Responses request already buffered for forwarding. */
export function deriveResponsesRequestStructure(body: Buffer): RequestStructure | undefined {
  let payload: unknown;
  try {
    payload = JSON.parse(body.toString("utf8"));
  } catch {
    return undefined;
  }
  if (!isRecord(payload)) return undefined;

  const fields = new Map<string, TopLevelFieldMetric>();
  for (const [key, value] of Object.entries(payload)) {
    const name = RESPONSE_TOP_LEVEL_FIELDS.has(key) ? key : "other";
    const existing = fields.get(name) ?? { name, count: 0, canonicalJsonBytes: 0 };
    existing.count += 1;
    existing.canonicalJsonBytes += canonicalJsonBytes(value);
    fields.set(name, existing);
  }

  const structure: RequestStructure = {
    topLevelFieldCount: Object.keys(payload).length,
    topLevelFields: [...fields.values()].sort((left, right) => left.name.localeCompare(right.name)),
  };

  if (Array.isArray(payload.input)) {
    const inputItemTypeCounts: Record<string, number> = {};
    for (const item of payload.input) {
      const type = isRecord(item) && typeof item.type === "string" && RESPONSE_INPUT_ITEM_TYPES.has(item.type)
        ? item.type
        : "other";
      inputItemTypeCounts[type] = (inputItemTypeCounts[type] ?? 0) + 1;
    }
    structure.inputItemCount = payload.input.length;
    structure.inputItemTypeCounts = inputItemTypeCounts;
  }

  return structure;
}

function numeric(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function extractUsage(value: unknown): ProviderUsage | undefined {
  if (!isRecord(value)) return undefined;
  const candidates = [value.usage, isRecord(value.response) ? value.response.usage : undefined];
  let result: ProviderUsage | undefined;

  for (const candidate of candidates) {
    if (!isRecord(candidate)) continue;
    const details = isRecord(candidate.input_tokens_details) ? candidate.input_tokens_details : undefined;
    const usage: ProviderUsage = {
      inputTokens: numeric(candidate.input_tokens),
      outputTokens: numeric(candidate.output_tokens),
      totalTokens: numeric(candidate.total_tokens),
      cachedInputTokens: numeric(details?.cached_tokens) ?? numeric(candidate.cached_input_tokens),
    };
    if (Object.values(usage).some((entry) => entry !== undefined)) {
      result = { ...result, ...Object.fromEntries(Object.entries(usage).filter(([, entry]) => entry !== undefined)) };
    }
  }

  return result;
}

/** Observes Responses SSE frames while immediately discarding their content. */
export class ResponsesStreamObserver {
  #decoder = new StringDecoder("utf8");
  #pending = "";
  #responseBytes = 0;
  #timeToFirstResponseBodyByteMs: number | undefined;
  #usage: ProviderUsage | undefined;
  #terminalEventObserved = false;

  observe(chunk: Buffer, elapsedMs: number): void {
    this.#responseBytes += chunk.length;
    if (chunk.length > 0 && this.#timeToFirstResponseBodyByteMs === undefined) {
      this.#timeToFirstResponseBodyByteMs = elapsedMs;
    }

    this.#pending += this.#decoder.write(chunk);
    if (this.#pending.length > MAX_SSE_EVENT_CHARS) {
      this.#pending = "";
      return;
    }

    for (;;) {
      const boundary = this.#pending.search(/\r?\n\r?\n/);
      if (boundary === -1) return;
      const event = this.#pending.slice(0, boundary);
      const boundaryLength = this.#pending.startsWith("\r\n", boundary) ? 4 : 2;
      this.#pending = this.#pending.slice(boundary + boundaryLength);
      this.#observeEvent(event);
    }
  }

  snapshot(): ResponseStreamObservation {
    return {
      responseBytes: this.#responseBytes,
      timeToFirstResponseBodyByteMs: this.#timeToFirstResponseBodyByteMs,
      usage: this.#usage,
      terminalEventObserved: this.#terminalEventObserved,
    };
  }

  #observeEvent(event: string): void {
    if (event.length > MAX_SSE_EVENT_CHARS) return;
    const lines = event.split(/\r?\n/);
    if (lines.some((line) => line.startsWith("event:") && line.slice("event:".length).trim() === "response.completed")) {
      this.#terminalEventObserved = true;
    }
    const data = lines
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice("data:".length).trimStart())
      .join("\n");
    if (data === "" || data.length > MAX_SSE_EVENT_CHARS) return;

    try {
      const payload = JSON.parse(data);
      if (isRecord(payload) && payload.type === "response.completed") this.#terminalEventObserved = true;
      const usage = extractUsage(payload);
      if (usage) this.#usage = { ...this.#usage, ...usage };
    } catch {
      // Non-JSON SSE data and malformed provider events are ignored.
    }
  }
}
