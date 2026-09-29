import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { appendProtocolCapture, MAX_PROTOCOL_CAPTURE_BYTES, resetProtocolCapture, structuralShape } from "../src/protocol-capture.ts";

test("protocol capture retains shape but never scalar prompt or credential values", () => {
  const shape = structuralShape({
    model: "private-model",
    messages: [{ role: "user", content: "private source code" }],
    authorization: "Bearer private-key",
    tool_choice: { type: "function", function: { name: "bash" } },
  });

  assert.deepEqual(shape, {
    authorization: "redacted",
    messages: [{ content: "redacted", role: "string" }],
    model: "string",
    tool_choice: { function: { name: "string" }, type: "string" },
  });
  assert.doesNotMatch(JSON.stringify(shape), /private|Bearer/);
});

test("protocol capture resets the prior session and never persists raw values", async () => {
  const directory = await mkdtemp(join(tmpdir(), "inlay-protocol-capture-"));
  const file = join(directory, ".inlay", "protocol-spike", "events.jsonl");
  await resetProtocolCapture(directory);
  await writeFile(file, "stale\n", "utf8");
  await resetProtocolCapture(directory);

  assert.equal(await appendProtocolCapture(directory, {
    event: "provider_request",
    details: { authorization: "Bearer private-key", prompt: "private source code", model: "private-model" },
  }), "recorded");

  const stored = await readFile(file, "utf8");
  assert.doesNotMatch(stored, /stale|private|Bearer/);
  assert.match(stored, /"authorization":"redacted"/);
  assert.match(stored, /"model":"string"/);
});

test("protocol capture enforces a bounded spool without failing the caller", async () => {
  const directory = await mkdtemp(join(tmpdir(), "inlay-protocol-capture-"));
  await resetProtocolCapture(directory);
  const oversizedStructure = Object.fromEntries(Array.from({ length: 30_000 }, (_, index) => [`field-${index}`, "string"]));

  assert.equal(await appendProtocolCapture(directory, { event: "provider_request", details: oversizedStructure }), "truncated");
  assert.equal(await appendProtocolCapture(directory, { event: "session_start", details: {} }), "recorded");

  const stored = await readFile(join(directory, ".inlay", "protocol-spike", "events.jsonl"));
  assert.ok(stored.byteLength <= MAX_PROTOCOL_CAPTURE_BYTES);
  assert.match(stored.toString("utf8"), /session_start/);
});
