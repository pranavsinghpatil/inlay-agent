import assert from "node:assert/strict";
import test from "node:test";
import { loadConfig } from "../src/config.ts";

test("defaults to a loopback transparent proxy", () => {
  const config = loadConfig({});
  assert.equal(config.host, "127.0.0.1");
  assert.equal(config.port, 8787);
  assert.equal(config.upstreamBaseUrl, undefined);
  assert.equal(config.observationMode, "off");
  assert.equal(config.recurrenceProbe, "off");
});

test("enables structural observation only when explicitly requested", () => {
  assert.equal(loadConfig({ INLAY_OBSERVATION: "structural" }).observationMode, "structural");
  assert.throws(() => loadConfig({ INLAY_OBSERVATION: "enabled" }), /INLAY_OBSERVATION/);
});

test("requires explicit structural observation for exact-item recurrence", () => {
  assert.equal(
    loadConfig({ INLAY_OBSERVATION: "structural", INLAY_RECURRENCE_PROBE: "exact-item" }).recurrenceProbe,
    "exact-item",
  );
  assert.throws(() => loadConfig({ INLAY_RECURRENCE_PROBE: "exact-item" }), /requires INLAY_OBSERVATION/);
  assert.throws(() => loadConfig({ INLAY_RECURRENCE_PROBE: "anything" }), /INLAY_RECURRENCE_PROBE/);
});

test("requires exact-item recurrence for local semantic role inspection", () => {
  assert.equal(
    loadConfig({
      INLAY_OBSERVATION: "structural",
      INLAY_RECURRENCE_PROBE: "exact-item",
      INLAY_SEMANTIC_INSPECTION: "role-categories",
    }).semanticInspection,
    "role-categories",
  );
  assert.throws(() => loadConfig({ INLAY_SEMANTIC_INSPECTION: "role-categories" }), /requires INLAY_RECURRENCE_PROBE/);
  assert.throws(() => loadConfig({ INLAY_SEMANTIC_INSPECTION: "raw" }), /INLAY_SEMANTIC_INSPECTION/);
});

test("rejects non-loopback binding", () => {
  assert.throws(() => loadConfig({ INLAY_HOST: "0.0.0.0" }), /loopback-only/);
});

test("reads an OpenAI-compatible upstream endpoint", () => {
  const config = loadConfig({ INLAY_UPSTREAM_BASE_URL: "https://example.test/v1" });
  assert.equal(config.upstreamBaseUrl?.href, "https://example.test/v1");
});

