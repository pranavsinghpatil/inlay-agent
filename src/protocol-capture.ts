import { appendFile, mkdir, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const MAX_COLLECTION_ITEMS = 10;
export const MAX_PROTOCOL_CAPTURE_BYTES = 256 * 1024;

const captureQueues = new Map<string, Promise<void>>();

type StructuralKind = "null" | "array" | "boolean" | "number" | "object" | "string" | "undefined" | "other";

export interface StructuralShape {
  kind: StructuralKind;
  itemCount?: number;
  fieldCount?: number;
  truncated?: boolean;
}

/** Returns only fixed structural categories and bounded collection counts. */
export function structuralShape(value: unknown): StructuralShape {
  if (value === null) return { kind: "null" };
  if (Array.isArray(value)) {
    return {
      kind: "array",
      itemCount: Math.min(value.length, MAX_COLLECTION_ITEMS),
      ...(value.length > MAX_COLLECTION_ITEMS ? { truncated: true } : {}),
    };
  }
  switch (typeof value) {
    case "string": return { kind: "string" };
    case "number": return { kind: "number" };
    case "boolean": return { kind: "boolean" };
    case "undefined": return { kind: "undefined" };
    case "object": {
      const fieldCount = Object.keys(value as Record<string, unknown>).length;
      return {
        kind: "object",
        fieldCount: Math.min(fieldCount, MAX_COLLECTION_ITEMS),
        ...(fieldCount > MAX_COLLECTION_ITEMS ? { truncated: true } : {}),
      };
    }
    default:
      return { kind: "other" };
  }
}

export interface ProtocolCaptureEvent {
  event: "session_start" | "provider_request" | "provider_response" | "tool_result";
  details: Record<string, unknown>;
}

interface ToolContentSummary {
  partCount: number;
  textPartCount: number;
  otherPartCount: number;
  textBytes: number;
}

function toolContentSummary(value: unknown): ToolContentSummary {
  if (!Array.isArray(value)) return { partCount: 0, textPartCount: 0, otherPartCount: 0, textBytes: 0 };

  let textPartCount = 0;
  let otherPartCount = 0;
  let textBytes = 0;
  for (const part of value) {
    const record = typeof part === "object" && part !== null ? part as Record<string, unknown> : undefined;
    if (record?.type === "text" && typeof record.text === "string") {
      textPartCount += 1;
      textBytes += Buffer.byteLength(record.text, "utf8");
    } else {
      otherPartCount += 1;
    }
  }
  return { partCount: value.length, textPartCount, otherPartCount, textBytes };
}

function statusCategory(value: unknown): "success" | "redirect" | "client_error" | "server_error" | "other" {
  if (typeof value !== "number" || !Number.isInteger(value)) return "other";
  if (value >= 200 && value < 300) return "success";
  if (value >= 300 && value < 400) return "redirect";
  if (value >= 400 && value < 500) return "client_error";
  if (value >= 500 && value < 600) return "server_error";
  return "other";
}

/** Converts every extension event into a fixed, scalar-free capture schema. */
function sanitizeCaptureEvent(event: ProtocolCaptureEvent): object {
  switch (event.event) {
    case "session_start":
      return { event: event.event, details: {} };
    case "provider_request":
      return { event: event.event, details: { payload: structuralShape(event.details.payload) } };
    case "provider_response":
      return { event: event.event, details: { status: statusCategory(event.details.status) } };
    case "tool_result":
      return {
        event: event.event,
        details: {
          content: toolContentSummary(event.details.content),
          input: structuralShape(event.details.input),
        },
      };
  }
}

function captureFile(projectDirectory: string): { root: string; file: string } {
  const root = resolve(projectDirectory, ".inlay", "protocol-spike");
  const file = join(root, "events.jsonl");
  if (!file.startsWith(`${root}\\`) && !file.startsWith(`${root}/`)) {
    throw new Error("Protocol capture path escaped its local spool.");
  }
  return { root, file };
}

function serializeCapture<T>(file: string, operation: () => Promise<T>): Promise<T> {
  const previous = captureQueues.get(file) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(operation);
  const queued = next.then(() => undefined, () => undefined);
  captureQueues.set(file, queued);
  void queued.finally(() => {
    if (captureQueues.get(file) === queued) captureQueues.delete(file);
  });
  return next;
}

/** Starts a fresh, bounded local spool for one explicitly enabled Pi diagnostic session. */
export async function resetProtocolCapture(projectDirectory: string): Promise<void> {
  const { root, file } = captureFile(projectDirectory);
  await serializeCapture(file, async () => {
    await mkdir(root, { recursive: true });
    await writeFile(file, "", { encoding: "utf8", mode: 0o600 });
  });
}

/** Appends only event-specific fixed-category metadata to the Pi diagnostic spool. */
export async function appendProtocolCapture(projectDirectory: string, event: ProtocolCaptureEvent): Promise<"recorded" | "truncated"> {
  const { root, file } = captureFile(projectDirectory);
  const stored = JSON.stringify(sanitizeCaptureEvent(event)) + "\n";
  const storedBytes = Buffer.byteLength(stored, "utf8");

  return serializeCapture(file, async () => {
    await mkdir(root, { recursive: true });
    const existingBytes = await stat(file).then((entry) => entry.size).catch((error: unknown) => {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return 0;
      throw error;
    });
    if (existingBytes + storedBytes > MAX_PROTOCOL_CAPTURE_BYTES) return "truncated";
    await appendFile(file, stored, { encoding: "utf8", mode: 0o600 });
    return "recorded";
  });
}

