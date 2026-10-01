import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { appendProtocolCapture, MAX_PROTOCOL_CAPTURE_BYTES, resetProtocolCapture, structuralShape } from "../src/protocol-capture.ts";

test("protocol capture retains fixed shape categories but never keys or scalar values", () => {
  const shape = structuralShape({
    model: "private-model",
    messages: [{ role: "user", content: "private source code" }],
    authorization: "Bearer private-key",
    user_supplied_secret_key_name: { type: "function", function: { name: "bash" } },
  });

  assert.deepEqual(shape, { kind: "object", fieldCount: 4 });
  assert.doesNotMatch(JSON.stringify(shape), /private|Bearer|user_supplied/);
});

test("protocol capture resets the prior session and never persists raw values", async () => {
  const directory = await mkdtemp(join(tmpdir(), "inlay-protocol-capture-"));
  const file = join(directory, ".inlay", "protocol-spike", "events.jsonl");
  await resetProtocolCapture(directory);
  await writeFile(file, "stale\n", "utf8");
  await resetProtocolCapture(directory);

  assert.equal(await appendProtocolCapture(directory, {
    event: "provider_request",
    details: { payload: { authorization: "Bearer private-key", prompt: "private source code", model: "private-model" } },
  }), "recorded");

  const stored = await readFile(file, "utf8");
  assert.doesNotMatch(stored, /stale|private|Bearer/);
  assert.match(stored, /"payload":\{"kind":"object","fieldCount":3\}/);
});

test("protocol capture enforces a bounded spool without failing the caller", async () => {
  const directory = await mkdtemp(join(tmpdir(), "inlay-protocol-capture-"));
  await resetProtocolCapture(directory);
  const file = join(directory, ".inlay", "protocol-spike", "events.jsonl");
  await writeFile(file, "x".repeat(MAX_PROTOCOL_CAPTURE_BYTES - 50), "utf8");

  assert.equal(await appendProtocolCapture(directory, { event: "provider_request", details: { payload: { index: 1 } } }), "truncated");
  assert.equal(await appendProtocolCapture(directory, { event: "session_start", details: {} }), "recorded");

  const stored = await readFile(file);
  assert.ok(stored.byteLength <= MAX_PROTOCOL_CAPTURE_BYTES);
  assert.match(stored.toString("utf8"), /session_start/);
});

test("protocol capture stores only fixed tool-result counters", async () => {
  const directory = await mkdtemp(join(tmpdir(), "inlay-protocol-capture-"));
  await resetProtocolCapture(directory);
  await appendProtocolCapture(directory, {
    event: "tool_result",
    details: {
      content: [{ type: "text", text: "PRIVATE_TOOL_OUTPUT" }, { type: "image", url: "private://image" }],
      input: { dynamic_private_field: "PRIVATE_INPUT" },
    },
  });

  const stored = await readFile(join(directory, ".inlay", "protocol-spike", "events.jsonl"), "utf8");
  assert.match(stored, /"partCount":2/);
  assert.match(stored, /"textPartCount":1/);
  assert.doesNotMatch(stored, /PRIVATE|dynamic_private_field|private:\/\//);
});
