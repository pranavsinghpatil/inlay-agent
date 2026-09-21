import assert from "node:assert/strict";
import test from "node:test";
import { loadConfig } from "../src/config.ts";

test("defaults to a loopback transparent proxy", () => {
  const config = loadConfig({});
  assert.equal(config.host, "127.0.0.1");
  assert.equal(config.port, 8787);
  assert.equal(config.upstreamBaseUrl, undefined);
});

test("rejects non-loopback binding", () => {
  assert.throws(() => loadConfig({ INLAY_HOST: "0.0.0.0" }), /loopback-only/);
});

test("reads an OpenAI-compatible upstream endpoint", () => {
  const config = loadConfig({ INLAY_UPSTREAM_BASE_URL: "https://example.test/v1" });
  assert.equal(config.upstreamBaseUrl?.href, "https://example.test/v1");
});

