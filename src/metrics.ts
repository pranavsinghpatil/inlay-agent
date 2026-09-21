export interface RequestMetric {
  requestId: string;
  startedAt: string;
  durationMs: number;
  timeToFirstByteMs?: number;
  requestBytes: number;
  responseStatus?: number;
  errorCategory?: "invalid_request" | "upstream_unavailable" | "upstream_timeout" | "client_disconnect" | "internal";
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
