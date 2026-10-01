# Pi Action Fusion feasibility cell

## Result

This single real Pi run establishes that a harness adapter can expose a content-free, ordered action lifecycle sufficient to identify an observed edit-to-verifier pattern. It does **not** establish that the actions should be fused, are generally repeatable, reduce turns or latency, preserve behavior when combined, or constitute an optimization.

## Frozen setup

| Field | Value |
| --- | --- |
| Inlay revision | `5c0a817` |
| Harness adapter | Explicitly loaded Pi diagnostic extension |
| Pi version | `0.86.0` |
| Provider flow | Pi `openai-codex` using existing local OAuth authentication |
| Model | `gpt-5.6-terra` |
| Fixture baseline | `3d0945f4fa74c1fc9b8b22d0327c892ffcc11075` |
| Task result | Passed verifier; exactly one predeclared implementation file changed |

Pi remained the harness and retained its normal provider flow. Inlay supplied only the explicitly loaded harness-side adapter and generic action recorder. No HTTP request routing, provider payload rewrite, tool mutation, tool substitution, automatic command execution, or compound action occurred.

## Privacy and safety boundary

The Git-ignored local spool was reset for the session and contained only fixed action categories, ordinal, success/failure, rounded duration, adjacency, and the fixed verifier class `node_verify`. It retained no prompt, source, path, tool name, command string, argument, result content, call ID, provider payload, credential, or hash. The adapter's `tool_call` handler returned no result and therefore did not block or modify Pi's original tool execution.

## Observed action lifecycle

| Ordinal | Category | Outcome | Duration (ms) | Immediately followed an edit | Fixed verifier class |
| ---: | --- | --- | ---: | --- | --- |
| 1 | verify | failure | 177 | no | node_verify |
| 2 | other | success | 202 | no | — |
| 3 | read | success | 28 | no | — |
| 4 | edit | success | 11 | no | — |
| 5 | verify | success | 134 | yes | node_verify |

The session summary reported five completed actions and zero unfinished actions. The initial verifier failure, subsequent edit, and final verifier success match the fixed task's intended lifecycle; no action content was inspected to reach that conclusion.

## Eligibility assessment

| Criterion | Result |
| --- | --- |
| Existing Pi authentication succeeded | Yes |
| Ordered tool lifecycle was observable | Yes |
| Successful edit immediately followed by an approved deterministic verifier | Yes |
| Verifier represented without a raw command string | Yes, `node_verify` |
| Adapter remained isolated from Codex transport and provider implementation | Yes |
| Repeatability across tasks/harnesses | Not established |
| Safe compound-action semantics | Not tested |
| Capability or efficiency benefit | Not tested |

## Decision gate

The Action Fusion **feasibility hypothesis passes for this Pi adapter and task**. This only justifies a separately reviewed, constrained experiment design. That design would need an explicit command allowlist, controlled worktree, cancellation behavior, a direct unfused control, task-success contract, and a capability-versus-efficiency analysis.

No fused command, compound action, automatic command execution, provider rewrite, artifact store, retrieval mechanism, or optimization was implemented. This study does not claim Pi support beyond this specific diagnostic adapter cell, and it does not establish a general Inlay mechanism.
