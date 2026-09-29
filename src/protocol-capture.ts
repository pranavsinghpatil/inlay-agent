import { appendFile, mkdir, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

type Shape = null | boolean | number | string | Shape[] | { [key: string]: Shape };

const SENSITIVE_KEY = /(?:api[_-]?key|authorization|content|prompt|secret|text|token)/i;
const MAX_DEPTH = 5;
export const MAX_PROTOCOL_CAPTURE_BYTES = 256 * 1024;

const captureQueues = new Map<string, Promise<void>>();

/** Returns field structure and scalar types without retaining scalar values. */
export function structuralShape(value: unknown, depth = 0): Shape {
  if (value === null) return null;
  if (depth >= MAX_DEPTH) return "max-depth";
  if (Array.isArray(value)) {
    return value.slice(0, 10).map((entry) => structuralShape(entry, depth + 1));
  }
  switch (typeof value) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "object": {
      const record: Record<string, Shape> = {};
      for (const [key, entry] of Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right))) {
        record[key] = SENSITIVE_KEY.test(key) ? "redacted" : structuralShape(entry, depth + 1);
      }
      return record;
    }
    default:
      return typeof value;
  }
}

export interface ProtocolCaptureEvent {
  event: "session_start" | "provider_request" | "provider_response" | "tool_result";
  details: Record<string, unknown>;
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

/**
 * Appends only structural metadata to the Pi diagnostic spool.
 * Raw values are converted to their structural shape before writing.
 */
export async function appendProtocolCapture(projectDirectory: string, event: ProtocolCaptureEvent): Promise<"recorded" | "truncated"> {
  const { root, file } = captureFile(projectDirectory);
  const stored = JSON.stringify({ event: event.event, details: structuralShape(event.details) }) + "\n";
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

