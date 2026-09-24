import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { ProxyConfig } from "./config.ts";
import { copyResponseHeaders, forwardHeaders, readBody, sendJson } from "./http.ts";
import { MetricsStore } from "./metrics.ts";

type SupportedUpstreamPath = "chat/completions" | "responses";

function downstreamRoute(upstreamPath: SupportedUpstreamPath): "/v1/chat/completions" | "/v1/responses" {
  return `/v1/${upstreamPath}`;
}

async function forwardModelRequest(
  config: ProxyConfig,
  metrics: MetricsStore,
  request: IncomingMessage,
  response: ServerResponse,
  upstreamPath: SupportedUpstreamPath,
): Promise<void> {
  if (!config.upstreamBaseUrl) {
    sendJson(response, 503, {
      error: {
        code: "inlay_upstream_not_configured",
        message: "Set INLAY_UPSTREAM_BASE_URL to enable forwarding.",
      },
    });
    return;
  }

  const startedAt = new Date().toISOString();
  const started = performance.now();
  let body;
  try {
    body = await readBody(request, config.maxBodyBytes);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request body.";
    metrics.record({ requestId: "unavailable", route: downstreamRoute(upstreamPath), startedAt, durationMs: performance.now() - started, requestBytes: 0, errorCategory: "invalid_request" });
    sendJson(response, 413, { error: { code: "inlay_request_too_large", message } });
    return;
  }

  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), config.upstreamTimeoutMs);
  let clientDisconnected = false;
  const cancelUpstream = () => {
    if (!response.writableEnded) {
      clientDisconnected = true;
      abortController.abort();
    }
  };
  request.once("aborted", cancelUpstream);
  response.once("close", cancelUpstream);

  let upstreamStatus: number | undefined;
  try {
    const upstreamUrl = new URL(upstreamPath, `${config.upstreamBaseUrl.href.replace(/\/$/, "")}/`);
    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: forwardHeaders(request.headers, body.requestId),
      body: new Uint8Array(body.bytes),
      signal: abortController.signal,
    });
    const timeToFirstByteMs = performance.now() - started;
    upstreamStatus = upstream.status;

    copyResponseHeaders(upstream.headers, response);
    response.setHeader("x-inlay-request-id", body.requestId);
    response.writeHead(upstream.status, upstream.statusText);

    if (upstream.body) {
      await pipeline(Readable.fromWeb(upstream.body as Parameters<typeof Readable.fromWeb>[0]), response);
    } else {
      response.end();
    }
    metrics.record({
      requestId: body.requestId,
      route: downstreamRoute(upstreamPath),
      startedAt,
      durationMs: performance.now() - started,
      timeToFirstByteMs,
      requestBytes: body.bytes.length,
      responseStatus: upstream.status,
    });
  } catch (error) {
    const isTimeout = abortController.signal.aborted && !clientDisconnected;
    metrics.record({
      requestId: body.requestId,
      route: downstreamRoute(upstreamPath),
      startedAt,
      durationMs: performance.now() - started,
      requestBytes: body.bytes.length,
      responseStatus: upstreamStatus,
      errorCategory: clientDisconnected ? "client_disconnect" : isTimeout ? "upstream_timeout" : "upstream_unavailable",
    });
    if (!response.headersSent) {
      sendJson(response, isTimeout ? 504 : 502, {
        error: {
          code: isTimeout ? "inlay_upstream_timeout" : "inlay_upstream_unavailable",
          message: "The upstream provider could not complete this request.",
          request_id: body.requestId,
        },
      });
    } else {
      response.destroy(error instanceof Error ? error : undefined);
    }
  } finally {
    clearTimeout(timeout);
    request.removeListener("aborted", cancelUpstream);
    response.removeListener("close", cancelUpstream);
  }
}

export function createInlayServer(config: ProxyConfig, metrics = new MetricsStore()): Server {
  return createServer(async (request, response) => {
    if (request.method === "GET" && request.url === "/health") {
      sendJson(response, 200, { status: "ok", upstreamConfigured: Boolean(config.upstreamBaseUrl), mode: "transparent" });
      return;
    }
    if (request.method === "GET" && request.url === "/metrics") {
      sendJson(response, 200, metrics.snapshot());
      return;
    }
    if (request.method === "POST" && request.url === "/v1/chat/completions") {
      await forwardModelRequest(config, metrics, request, response, "chat/completions");
      return;
    }
    if (request.method === "POST" && request.url === "/v1/responses") {
      await forwardModelRequest(config, metrics, request, response, "responses");
      return;
    }
    sendJson(response, 404, { error: { code: "inlay_route_not_found", message: "Supported routes: GET /health, GET /metrics, POST /v1/chat/completions, POST /v1/responses." } });
  });
}
