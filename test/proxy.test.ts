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

    const snapshot = metrics.snapshot() as { totalRequests: number; recent: Array<{ route: string; responseStatus: number; timeToFirstByteMs: number; requestBytes: number }> };
    assert.equal(snapshot.totalRequests, 1);
    assert.equal(snapshot.recent[0].route, "/v1/chat/completions");
    assert.equal(snapshot.recent[0].responseStatus, 200);
    assert.ok(snapshot.recent[0].timeToFirstByteMs >= 0);
    assert.ok(snapshot.recent[0].requestBytes > 0);
  } finally {
    await close(proxy);
    await close(upstream);
  }
});

test("forwards a Codex Responses SSE request without interpreting it", async () => {
  const upstream = createServer(async (request, response) => {
    assert.equal(request.url, "/backend-api/codex/responses");
    assert.equal(request.headers.authorization, "Bearer subscription-token");
    const received: Buffer[] = [];
    for await (const chunk of request) received.push(Buffer.from(chunk));
    assert.equal(Buffer.concat(received).toString("utf8"), '{"model":"test","stream":true,"input":"Reply exactly INLAY_ROUTE_OK"}');
    response.writeHead(200, { "content-type": "text/event-stream" });
    response.write('event: response.output_text.delta\ndata: {"delta":"INLAY_ROUTE_OK"}\n\n');
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
  }, metrics);
  const proxyPort = await listen(proxy);

  try {
    const response = await fetch(`http://127.0.0.1:${proxyPort}/v1/responses`, {
      method: "POST",
      headers: { authorization: "Bearer subscription-token", "content-type": "application/json" },
      body: '{"model":"test","stream":true,"input":"Reply exactly INLAY_ROUTE_OK"}',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "text/event-stream");
    assert.equal(await response.text(), 'event: response.output_text.delta\ndata: {"delta":"INLAY_ROUTE_OK"}\n\nevent: response.completed\ndata: {"type":"response.completed"}\n\n');

    const snapshot = metrics.snapshot() as { totalRequests: number; recent: Array<{ route: string; responseStatus: number }> };
    assert.equal(snapshot.totalRequests, 1);
    assert.equal(snapshot.recent[0].route, "/v1/responses");
    assert.equal(snapshot.recent[0].responseStatus, 200);
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
