import { randomUUID } from "node:crypto";
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "node:http";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

export interface RequestBody {
  bytes: Buffer;
  requestId: string;
}

export async function readBody(request: IncomingMessage, maxBytes: number): Promise<RequestBody> {
  const parts: Buffer[] = [];
  let received = 0;

  for await (const part of request) {
    const chunk = Buffer.isBuffer(part) ? part : Buffer.from(part);
    received += chunk.length;
    if (received > maxBytes) {
      request.destroy();
      throw new Error(`Request body exceeds ${maxBytes} bytes.`);
    }
    parts.push(chunk);
  }

  return { bytes: Buffer.concat(parts), requestId: randomUUID() };
}

export function forwardHeaders(headers: IncomingHttpHeaders, requestId: string): Headers {
  const result = new Headers();
  for (const [name, value] of Object.entries(headers)) {
    const normalized = name.toLowerCase();
    if (value === undefined || HOP_BY_HOP_HEADERS.has(normalized) || normalized === "host" || normalized === "x-inlay-request-id") {
      continue;
    }
    result.set(name, Array.isArray(value) ? value.join(", ") : value);
  }
  result.set("x-inlay-request-id", requestId);
  return result;
}

export function copyResponseHeaders(source: Headers, target: ServerResponse): void {
  source.forEach((value, name) => {
    if (!HOP_BY_HOP_HEADERS.has(name.toLowerCase())) target.setHeader(name, value);
  });
}

export function sendJson(response: ServerResponse, statusCode: number, payload: unknown): void {
  const body = Buffer.from(JSON.stringify(payload));
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "content-length": String(body.length),
    "cache-control": "no-store",
  });
  response.end(body);
}

