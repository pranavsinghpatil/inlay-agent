export interface ProxyConfig {
  host: string;
  port: number;
  upstreamBaseUrl?: URL;
  maxBodyBytes: number;
  upstreamTimeoutMs: number;
  observationMode: "off" | "structural";
}

function positiveInteger(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined || value === "") return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return parsed;
}

function observationMode(value: string | undefined): "off" | "structural" {
  const mode = value ?? "off";
  if (mode !== "off" && mode !== "structural") {
    throw new Error("INLAY_OBSERVATION must be 'off' or 'structural'.");
  }
  return mode;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): ProxyConfig {
  const host = env.INLAY_HOST ?? "127.0.0.1";
  if (host !== "127.0.0.1" && host !== "::1" && host !== "localhost") {
    throw new Error("INLAY_HOST must be loopback-only (127.0.0.1, ::1, or localhost).");
  }

  const upstream = env.INLAY_UPSTREAM_BASE_URL;
  let upstreamBaseUrl: URL | undefined;
  if (upstream) {
    upstreamBaseUrl = new URL(upstream);
    if (upstreamBaseUrl.protocol !== "https:" && upstreamBaseUrl.protocol !== "http:") {
      throw new Error("INLAY_UPSTREAM_BASE_URL must use http or https.");
    }
  }

  return {
    host,
    port: positiveInteger(env.INLAY_PORT, 8787, "INLAY_PORT"),
    upstreamBaseUrl,
    maxBodyBytes: positiveInteger(env.INLAY_MAX_BODY_BYTES, 10 * 1024 * 1024, "INLAY_MAX_BODY_BYTES"),
    upstreamTimeoutMs: positiveInteger(env.INLAY_UPSTREAM_TIMEOUT_MS, 120_000, "INLAY_UPSTREAM_TIMEOUT_MS"),
    observationMode: observationMode(env.INLAY_OBSERVATION),
  };
}

