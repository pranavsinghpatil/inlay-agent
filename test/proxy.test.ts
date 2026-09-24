import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import test from "node:test";
import { once } from "node:events";
import { createInlayServer } from "../src/app.ts";
import { MetricsStore } from "../src/metrics.ts";

async function listen(server: Server): Promise<number> {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Expected a TCP address.");
  return address.port;
}

async function close(server: Server): Promise<void> {
  server.close();
  await once(server, "close");
}

async function waitFor(condition: () => boolean, timeoutMs = 1_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!condition()) {
    if (Date.now() >= deadline) throw new Error("Timed out waiting for proxy metric.");
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

test("forwards an OpenAI-compatible streaming response without transforming it", async () => {
  const upstream = createServer(async (request, response) => {
    assert.equal(request.url, "/v1/chat/completions");
    assert.equal(request.headers["x-inlay-request-id"]?.length, 36);
    assert.equal(request.headers.authorization, "Bearer test-key");
    assert.equal(request.headers["x-provider-trace"], "trace-123");
    const received: Buffer[] = [];
    for await (const chunk of request) received.push(Buffer.from(chunk));
    assert.deepEqual(JSON.parse(Buffer.concat(received).toString("utf8")), {
      model: "test",
      stream: true,
      stream_options: { include_usage: true },
      messages: [{ role: "user", content: "hello" }],
      tools: [{ type: "function", function: { name: "list_files", parameters: { type: "object" } } }],
    });
    response.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache" });
    response.write('data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_1","type":"function","function":{"name":"list_files","arguments":"{\\\"path\\\":\\\"."}}]}}]}\n\n');
    setTimeout(() => response.write('data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"\\\"}"}}]}}]}\n\n'), 25);
    setTimeout(() => response.end('data: {"choices":[],"usage":{"prompt_tokens":12,"completion_tokens":8,"total_tokens":20}}\n\ndata: [DONE]\n\n'), 50);
  });
  const upstreamPort = await listen(upstream);
  const metrics = new MetricsStore();
  const proxy = createInlayServer({
    host: "127.0.0.1",
    port: 0,
    upstreamBaseUrl: new URL(`http://127.0.0.1:${upstreamPort}/v1`),
    maxBodyBytes: 1024,
    upstreamTimeoutMs: 1_000,
    observationMode: "off",
  }, metrics);
  const proxyPort = await listen(proxy);

  try {
    const response = await fetch(`http://127.0.0.1:${proxyPort}/v1/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer test-key", "x-provider-trace": "trace-123" },
      body: JSON.stringify({
        model: "test",
        stream: true,
        stream_options: { include_usage: true },
        messages: [{ role: "user", content: "hello" }],
        tools: [{ type: "function", function: { name: "list_files", parameters: { type: "object" } } }],
      }),
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "text/event-stream");
    assert.match(response.headers.get("x-inlay-request-id") ?? "", /^[0-9a-f-]{36}$/);
    const reader = response.body?.getReader();
    assert.ok(reader);
    const first = await reader.read();
    assert.equal(new TextDecoder().decode(first.value), 'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"id":"call_1","type":"function","function":{"name":"list_files","arguments":"{\\\"path\\\":\\\"."}}]}}]}\n\n');
    const remaining: Uint8Array[] = [];
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      if (next.value) remaining.push(next.value);
    }
    assert.equal(new TextDecoder().decode(Buffer.concat(remaining)), 'data: {"choices":[{"delta":{"tool_calls":[{"index":0,"function":{"arguments":"\\\"}"}}]}}]}\n\ndata: {"choices":[],"usage":{"prompt_tokens":12,"completion_tokens":8,"total_tokens":20}}\n\ndata: [DONE]\n\n');

    const snapshot = metrics.snapshot() as { totalRequests: number; recent: Array<{ route: string; responseStatus: number; timeToUpstreamHeadersMs: number; requestBytes: number }> };
    assert.equal(snapshot.totalRequests, 1);
    assert.equal(snapshot.recent[0].route, "/v1/chat/completions");
    assert.equal(snapshot.recent[0].responseStatus, 200);
    assert.ok(snapshot.recent[0].timeToUpstreamHeadersMs >= 0);
    assert.ok(snapshot.recent[0].requestBytes > 0);
  } finally {
    await close(proxy);
    await close(upstream);
  }
});

test("forwards a Codex Responses SSE request without interpreting it", async () => {
  const requestBody = JSON.stringify({
    model: "test",
    stream: true,
    input: [
      { type: "message", role: "user", content: [{ type: "input_text", text: "PRIVATE_PROMPT" }] },
      { type: "function_call_output", call_id: "call-private", output: "PRIVATE_TOOL_OUTPUT" },
    ],
    client_metadata: { cwd: "C:\\private\\project" },
  });
  const firstEvent = 'event: response.output_text.delta\ndata: {"delta":"INLAY_ROUTE_OK"}\n\n';
  const completedEvent = 'event: response.completed\ndata: {"response":{"usage":{"input_tokens":12,"output_tokens":8,"total_tokens":20,"input_tokens_details":{"cached_tokens":3}}}}\n\n';
  const upstream = createServer(async (request, response) => {
    assert.equal(request.url, "/backend-api/codex/responses");
    assert.equal(request.headers.authorization, "Bearer subscription-token");
    const received: Buffer[] = [];
    for await (const chunk of request) received.push(Buffer.from(chunk));
    assert.equal(Buffer.concat(received).toString("utf8"), requestBody);
    response.writeHead(200, { "content-type": "text/event-stream" });
    response.write(firstEvent);
    setTimeout(() => {
      response.write(completedEvent.slice(0, 37));
      response.end(completedEvent.slice(37));
    }, 10);
  });
  const upstreamPort = await listen(upstream);
  const metrics = new MetricsStore();
  const proxy = createInlayServer({
    host: "127.0.0.1",
    port: 0,
    upstreamBaseUrl: new URL(`http://127.0.0.1:${upstreamPort}/backend-api/codex`),
    maxBodyBytes: 1024,
    upstreamTimeoutMs: 1_000,
    observationMode: "structural",
  }, metrics);
  const proxyPort = await listen(proxy);

  try {
    const response = await fetch(`http://127.0.0.1:${proxyPort}/v1/responses`, {
      method: "POST",
      headers: { authorization: "Bearer subscription-token", "content-type": "application/json" },
      body: requestBody,
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "text/event-stream");
    const reader = response.body?.getReader();
    assert.ok(reader);
    const first = await reader.read();
    assert.equal(new TextDecoder().decode(first.value), firstEvent);
    const remaining: Uint8Array[] = [];
    for (;;) {
      const next = await reader.read();
      if (next.done) break;
      if (next.value) remaining.push(next.value);
    }
    assert.equal(new TextDecoder().decode(Buffer.concat(remaining)), completedEvent);

    const snapshot = metrics.snapshot() as {
      totalRequests: number;
      recent: Array<{
        route: string;
        responseStatus: number;
        responseBytes?: number;
        completed?: boolean;
        cancelled?: boolean;
        terminalEventObserved?: boolean;
        timeToUpstreamHeadersMs?: number;
        timeToFirstResponseBodyByteMs?: number;
        requestStructure?: { inputItemCount?: number; inputItemTypeCounts?: Record<string, number>; topLevelFields: Array<{ name: string }> };
        usage?: Record<string, number>;
      }>;
    };
    assert.equal(snapshot.totalRequests, 1);
    assert.equal(snapshot.recent[0].route, "/v1/responses");
    assert.equal(snapshot.recent[0].responseStatus, 200);
    assert.equal(snapshot.recent[0].responseBytes, Buffer.byteLength(firstEvent + completedEvent));
    assert.equal(snapshot.recent[0].completed, true);
    assert.equal(snapshot.recent[0].cancelled, false);
    assert.equal(snapshot.recent[0].terminalEventObserved, true);
    assert.ok(snapshot.recent[0].timeToUpstreamHeadersMs !== undefined);
    assert.ok(snapshot.recent[0].timeToFirstResponseBodyByteMs !== undefined);
    assert.deepEqual(snapshot.recent[0].usage, { inputTokens: 12, outputTokens: 8, totalTokens: 20, cachedInputTokens: 3 });
    assert.equal(snapshot.recent[0].requestStructure?.inputItemCount, 2);
    assert.deepEqual(snapshot.recent[0].requestStructure?.inputItemTypeCounts, { message: 1, function_call_output: 1 });
    assert.deepEqual(snapshot.recent[0].requestStructure?.topLevelFields.map((field) => field.name), ["client_metadata", "input", "model", "stream"]);
    assert.doesNotMatch(JSON.stringify(snapshot.recent[0]), /PRIVATE_PROMPT|PRIVATE_TOOL_OUTPUT|private\\project|subscription-token|call-private/);
  } finally {
    await close(proxy);
    await close(upstream);
  }
});

test("records a client disconnect after response.completed as a transport cancellation", async () => {
  let interval: NodeJS.Timeout | undefined;
  const upstream = createServer((_request, response) => {
    response.writeHead(200, { "content-type": "text/event-stream" });
    response.write('event: response.completed\ndata: {"type":"response.completed","detail":"PRIVATE_STREAM_CONTENT"}\n\n');
    interval = setInterval(() => response.write(': keepalive\n\n'), 10);
    response.once("close", () => clearInterval(interval));
  });
  const upstreamPort = await listen(upstream);
  const metrics = new MetricsStore();
  const proxy = createInlayServer({
    host: "127.0.0.1",
    port: 0,
    upstreamBaseUrl: new URL(`http://127.0.0.1:${upstreamPort}/backend-api/codex`),
    maxBodyBytes: 1024,
    upstreamTimeoutMs: 1_000,
    observationMode: "structural",
  }, metrics);
  const proxyPort = await listen(proxy);

  try {
    const response = await fetch(`http://127.0.0.1:${proxyPort}/v1/responses`, {
      method: "POST",
      body: JSON.stringify({ input: [{ type: "message", content: "PRIVATE_PROMPT" }] }),
    });
    const reader = response.body?.getReader();
    assert.ok(reader);
    await reader.read();
    await reader.cancel();

    await waitFor(() => (metrics.snapshot() as { totalRequests: number }).totalRequests === 1);
    const metric = (metrics.snapshot() as { recent: Array<{ completed?: boolean; cancelled?: boolean; terminalEventObserved?: boolean; cancelledAfterTerminalEvent?: boolean; responseBytes?: number; errorCategory?: string }> }).recent[0];
    assert.equal(metric.completed, false);
    assert.equal(metric.cancelled, true);
    assert.equal(metric.terminalEventObserved, true);
    assert.equal(metric.cancelledAfterTerminalEvent, true);
    assert.equal(metric.errorCategory, "client_disconnect");
    assert.ok((metric.responseBytes ?? 0) > 0);
    assert.doesNotMatch(JSON.stringify(metric), /PRIVATE_STREAM_CONTENT|PRIVATE_PROMPT/);
  } finally {
    clearInterval(interval);
    await close(proxy);
    await close(upstream);
  }
});

test("classifies a content-encoded Responses request without inspecting its body", async () => {
  const upstream = createServer(async (request, response) => {
    assert.equal(request.headers["content-encoding"], "zstd");
    for await (const _chunk of request) {
      // Forwarding is exercised; the proxy must not decode or retain this body.
    }
    response.writeHead(200, { "content-type": "text/event-stream" });
    response.end('event: response.completed\ndata: {"type":"response.completed"}\n\n');
  });
  const upstreamPort = await listen(upstream);
  const metrics = new MetricsStore();
  const proxy = createInlayServer({
    host: "127.0.0.1",
    port: 0,
    upstreamBaseUrl: new URL(`http://127.0.0.1:${upstreamPort}/backend-api/codex`),
    maxBodyBytes: 1024,
    upstreamTimeoutMs: 1_000,
    observationMode: "structural",
  }, metrics);
  const proxyPort = await listen(proxy);

  try {
    const response = await fetch(`http://127.0.0.1:${proxyPort}/v1/responses`, {
      method: "POST",
      headers: { "content-encoding": "zstd" },
      body: "not-inspected-content",
    });
    await response.text();
    const metric = (metrics.snapshot() as { recent: Array<{ requestContentEncoding?: string; requestStructure?: unknown; requestStructureUnavailableReason?: string }> }).recent[0];
    assert.equal(metric.requestContentEncoding, "zstd");
    assert.equal(metric.requestStructure, undefined);
    assert.equal(metric.requestStructureUnavailableReason, "content_encoded");
  } finally {
    await close(proxy);
    await close(upstream);
  }
});

test("preserves an upstream status and error body", async () => {
  const upstream = createServer((_request, response) => {
    response.writeHead(429, { "content-type": "application/json", "retry-after": "2" });
    response.end('{"error":{"message":"rate limited","type":"rate_limit_error"}}');
  });
  const upstreamPort = await listen(upstream);
  const proxy = createInlayServer({
    host: "127.0.0.1",
    port: 0,
    upstreamBaseUrl: new URL(`http://127.0.0.1:${upstreamPort}/v1`),
    maxBodyBytes: 1024,
    upstreamTimeoutMs: 1_000,
    observationMode: "off",
  });
  const proxyPort = await listen(proxy);

  try {
    const response = await fetch(`http://127.0.0.1:${proxyPort}/v1/chat/completions`, {
      method: "POST",
      body: "{}",
    });
    assert.equal(response.status, 429);
    assert.equal(response.headers.get("retry-after"), "2");
    assert.equal(await response.text(), '{"error":{"message":"rate limited","type":"rate_limit_error"}}');
  } finally {
    await close(proxy);
    await close(upstream);
  }
});
