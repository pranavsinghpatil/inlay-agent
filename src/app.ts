import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { ProxyConfig } from "./config.ts";
import { copyResponseHeaders, forwardHeaders, readBody, sendJson } from "./http.ts";
import { MetricsStore } from "./metrics.ts";
import { deriveResponsesRequestStructure, ResponsesStreamObserver } from "./observation.ts";

type SupportedUpstreamPath = "chat/completions" | "responses";

function downstreamRoute(upstreamPath: SupportedUpstreamPath): "/v1/chat/completions" | "/v1/responses" {
  return `/v1/${upstreamPath}`;
}

function requestContentEncoding(request: IncomingMessage): "identity" | "br" | "deflate" | "gzip" | "zstd" | "other" {
  const value = request.headers["content-encoding"];
  const encoding = (Array.isArray(value) ? value.join(",") : value ?? "identity").split(",")[0].trim().toLowerCase();
  if (encoding === "" || encoding === "identity") return "identity";
  if (encoding === "br" || encoding === "deflate" || encoding === "gzip" || encoding === "zstd") return encoding;
  return "other";
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

  const observe = config.observationMode === "structural" && upstreamPath === "responses";
  const contentEncoding = observe ? requestContentEncoding(request) : undefined;
  const requestStructure = observe && contentEncoding === "identity" ? deriveResponsesRequestStructure(body.bytes) : undefined;
  const requestStructureUnavailableReason = observe && !requestStructure
    ? contentEncoding === "identity" ? "not_json" : "content_encoded"
    : undefined;

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
  let timeToUpstreamHeadersMs: number | undefined;
  const responseObserver = observe ? new ResponsesStreamObserver() : undefined;
  try {
    const upstreamUrl = new URL(upstreamPath, `${config.upstreamBaseUrl.href.replace(/\/$/, "")}/`);
    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: forwardHeaders(request.headers, body.requestId),
      body: new Uint8Array(body.bytes),
      signal: abortController.signal,
    });
    timeToUpstreamHeadersMs = performance.now() - started;
    upstreamStatus = upstream.status;

    copyResponseHeaders(upstream.headers, response);
    response.setHeader("x-inlay-request-id", body.requestId);
    response.writeHead(upstream.status, upstream.statusText);

    if (upstream.body) {
      const source = Readable.fromWeb(upstream.body as Parameters<typeof Readable.fromWeb>[0]);
      if (responseObserver) {
        const observer = new Transform({
          transform(chunk, _encoding, callback) {
            const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            responseObserver.observe(bytes, performance.now() - started);
            callback(null, chunk);
          },
        });
        await pipeline(source, observer, response);
      } else {
        await pipeline(source, response);
      }
    } else {
      response.end();
    }
    const stream = responseObserver?.snapshot();
    metrics.record({
      requestId: body.requestId,
      route: downstreamRoute(upstreamPath),
      startedAt,
      durationMs: performance.now() - started,
      timeToUpstreamHeadersMs,
      timeToFirstResponseBodyByteMs: stream?.timeToFirstResponseBodyByteMs,
      requestBytes: body.bytes.length,
      requestContentEncoding: contentEncoding,
      responseBytes: stream?.responseBytes,
      responseStatus: upstream.status,
      requestStructure,
      requestStructureUnavailableReason,
      usage: stream?.usage,
      ...(observe ? {
        completed: true,
        cancelled: false,
        terminalEventObserved: stream?.terminalEventObserved,
        cancelledAfterTerminalEvent: false,
      } : {}),
    });
  } catch (error) {
    const isTimeout = abortController.signal.aborted && !clientDisconnected;
    const stream = responseObserver?.snapshot();
    metrics.record({
      requestId: body.requestId,
      route: downstreamRoute(upstreamPath),
      startedAt,
      durationMs: performance.now() - started,
      timeToUpstreamHeadersMs,
      timeToFirstResponseBodyByteMs: stream?.timeToFirstResponseBodyByteMs,
      requestBytes: body.bytes.length,
      requestContentEncoding: contentEncoding,
      responseBytes: stream?.responseBytes,
      responseStatus: upstreamStatus,
      errorCategory: clientDisconnected ? "client_disconnect" : isTimeout ? "upstream_timeout" : "upstream_unavailable",
      requestStructure,
      requestStructureUnavailableReason,
      usage: stream?.usage,
      ...(observe ? {
        completed: false,
        cancelled: clientDisconnected,
        terminalEventObserved: stream?.terminalEventObserved,
        cancelledAfterTerminalEvent: clientDisconnected && Boolean(stream?.terminalEventObserved),
      } : {}),
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
