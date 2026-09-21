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
    response.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache" });
    response.write('data: {"choices":[{"delta":{"content":"hel"}}]}\n\n');
    setTimeout(() => response.end('data: [DONE]\n\n'), 10);
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
      headers: { "content-type": "application/json", authorization: "Bearer test-key" },
      body: JSON.stringify({ model: "test", stream: true, messages: [] }),
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("content-type"), "text/event-stream");
    assert.match(response.headers.get("x-inlay-request-id") ?? "", /^[0-9a-f-]{36}$/);
    assert.equal(await response.text(), 'data: {"choices":[{"delta":{"content":"hel"}}]}\n\ndata: [DONE]\n\n');

    const snapshot = metrics.snapshot() as { totalRequests: number; recent: Array<{ responseStatus: number; timeToFirstByteMs: number; requestBytes: number }> };
    assert.equal(snapshot.totalRequests, 1);
    assert.equal(snapshot.recent[0].responseStatus, 200);
    assert.ok(snapshot.recent[0].timeToFirstByteMs >= 0);
    assert.ok(snapshot.recent[0].requestBytes > 0);
  } finally {
    await close(proxy);
    await close(upstream);
  }
});
