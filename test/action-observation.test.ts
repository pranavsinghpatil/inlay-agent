import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { ActionObservationRecorder, MAX_ACTION_OBSERVATION_BYTES, resetActionObservation } from "../src/action-observation.ts";
import { classifyPiAction } from "../extensions/action-fusion-feasibility.ts";

test("records only fixed completed-action categories and edit-to-verifier adjacency", async () => {
  const directory = await mkdtemp(join(tmpdir(), "inlay-action-observation-"));
  await resetActionObservation(directory);
  const recorder = new ActionObservationRecorder(directory);

  recorder.start("PRIVATE_CALL_READ", "read");
  await recorder.complete("PRIVATE_CALL_READ", true);
  recorder.start("PRIVATE_CALL_EDIT", "edit");
  await recorder.complete("PRIVATE_CALL_EDIT", true);
  recorder.start("PRIVATE_CALL_VERIFY", "verify", "node_verify");
  await recorder.complete("PRIVATE_CALL_VERIFY", false);
  await recorder.finish();

  const stored = await readFile(join(directory, ".inlay", "action-fusion-feasibility", "events.jsonl"), "utf8");
  assert.match(stored, /"ordinal":3,"category":"verify","outcome":"failure"/);
  assert.match(stored, /"immediatelyFollowsEdit":true,"verifierClass":"node_verify"/);
  assert.match(stored, /"completedActionCount":3,"incompleteActionCount":0/);
  assert.doesNotMatch(stored, /PRIVATE_CALL/);
});

test("records process-local timestamps only in the explicit content-free timeline spool", async () => {
  const directory = await mkdtemp(join(tmpdir(), "inlay-action-observation-"));
  await resetActionObservation(directory, "content-free-timeline");
  const recorder = new ActionObservationRecorder(directory, {
    spool: "content-free-timeline",
    includeProcessTimestamps: true,
  });

  recorder.start("PRIVATE_CALL_ID", "verify", "node_verify");
  await recorder.complete("PRIVATE_CALL_ID", true);
  await recorder.finish();

  const stored = await readFile(join(directory, ".inlay", "content-free-timeline", "events.jsonl"), "utf8");
  assert.match(stored, /"processStartedAtMs":\d+,"processEndedAtMs":\d+/);
  assert.match(stored, /"category":"verify","outcome":"success"/);
  assert.doesNotMatch(stored, /PRIVATE_CALL_ID|PRIVATE_PATH|PRIVATE_SOURCE|PRIVATE_COMMAND/);
});

test("maps Pi tools transiently to fixed action categories without retaining tool names or commands", () => {
  assert.deepEqual(classifyPiAction("read", { path: "PRIVATE_PATH" }), { category: "read" });
  assert.deepEqual(classifyPiAction("write", { path: "PRIVATE_PATH", content: "PRIVATE_SOURCE" }), { category: "edit" });
  assert.deepEqual(classifyPiAction("powershell", { command: "node verify.mjs" }), { category: "verify", verifierClass: "node_verify" });
  assert.deepEqual(classifyPiAction("powershell", { command: "node verify.mjs; PRIVATE_COMMAND" }), { category: "other" });
  assert.deepEqual(classifyPiAction("PRIVATE_TOOL", { command: "PRIVATE_COMMAND" }), { category: "other" });
});

test("fails open at its bounded spool limit", async () => {
  const directory = await mkdtemp(join(tmpdir(), "inlay-action-observation-"));
  await resetActionObservation(directory);
  const file = join(directory, ".inlay", "action-fusion-feasibility", "events.jsonl");
  await writeFile(file, "x".repeat(MAX_ACTION_OBSERVATION_BYTES - 5), "utf8");
  const recorder = new ActionObservationRecorder(directory);
  recorder.start("PRIVATE_CALL", "other");
  assert.equal(await recorder.complete("PRIVATE_CALL", true), "truncated");
});
