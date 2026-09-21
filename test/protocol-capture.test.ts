import assert from "node:assert/strict";
import test from "node:test";
import { structuralShape } from "../src/protocol-capture.ts";

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
