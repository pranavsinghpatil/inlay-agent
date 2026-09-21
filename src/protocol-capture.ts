import { appendFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";

type Shape = null | boolean | number | string | Shape[] | { [key: string]: Shape };

const SENSITIVE_KEY = /(?:api[_-]?key|authorization|content|prompt|secret|text|token)/i;
const MAX_DEPTH = 5;

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
  timestamp: string;
  sessionId: string;
  event: "session_start" | "provider_request" | "provider_response" | "tool_result";
  details: Record<string, unknown>;
}

export async function appendProtocolCapture(projectDirectory: string, event: ProtocolCaptureEvent): Promise<void> {
  const root = resolve(projectDirectory, ".inlay", "protocol-spike");
  const file = join(root, "events.jsonl");
  if (!file.startsWith(`${root}\\`) && !file.startsWith(`${root}/`)) {
    throw new Error("Protocol capture path escaped its local spool.");
  }
  await mkdir(root, { recursive: true });
  await appendFile(file, `${JSON.stringify(event)}\n`, { encoding: "utf8", mode: 0o600 });
}

