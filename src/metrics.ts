import type { ProviderUsage, RequestStructure } from "./observation.ts";

export interface RequestMetric {
  requestId: string;
  route: "/v1/chat/completions" | "/v1/responses";
  startedAt: string;
  durationMs: number;
  timeToUpstreamHeadersMs?: number;
  timeToFirstResponseBodyByteMs?: number;
  requestBytes: number;
  requestContentEncoding?: "identity" | "br" | "deflate" | "gzip" | "zstd" | "other";
  responseBytes?: number;
  completed?: boolean;
  cancelled?: boolean;
  terminalEventObserved?: boolean;
  cancelledAfterTerminalEvent?: boolean;
  responseStatus?: number;
  errorCategory?: "invalid_request" | "upstream_unavailable" | "upstream_timeout" | "client_disconnect" | "internal";
  requestStructure?: RequestStructure;
  requestStructureUnavailableReason?: "content_encoded" | "not_json";
  usage?: ProviderUsage;
}

export class MetricsStore {
  #recent: RequestMetric[] = [];
  #totalRequests = 0;
  #totalRequestBytes = 0;

  record(metric: RequestMetric): void {
    this.#totalRequests += 1;
    this.#totalRequestBytes += metric.requestBytes;
    this.#recent.unshift(metric);
    this.#recent.length = Math.min(this.#recent.length, 100);
  }

  snapshot(): object {
    return {
      totalRequests: this.#totalRequests,
      totalRequestBytes: this.#totalRequestBytes,
      recent: this.#recent,
      retention: "in-memory only; raw request and response bodies are never stored",
    };
  }
}
