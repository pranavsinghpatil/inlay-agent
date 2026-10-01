# C2 Codex exact-item recurrence probe

## Result

The privacy-bounded probe observed exact canonical-representation recurrence in one successful Codex C2 task. This establishes that some full input items persisted across requests in this trajectory. It does **not** establish that any item was semantically redundant, unnecessary, removable, retrievable, token-expensive, or safe to transform.

## Frozen setup

| Field | Value |
| --- | --- |
| Inlay revision | `f41b9d0` |
| Agent | Codex CLI `0.153.4`, existing ChatGPT authentication |
| Model | `gpt-5.6-terra` |
| Fixture baseline | `3d0945f4fa74c1fc9b8b22d0327c892ffcc11075` |
| Direct control | Passed verifier; only the predeclared implementation file changed |
| Observed treatment | Passed verifier; only the predeclared implementation file changed |
| Treatment configuration | `INLAY_OBSERVATION=structural`, `INLAY_RECURRENCE_PROBE=exact-item` |

The treatment ran through Codex HTTP Responses over Inlay. It forwarded the original compressed request and SSE response bytes without transformation.

## Privacy and comparison boundary

Each item was canonicalized and compared transiently with an HMAC-SHA-256 key generated for this proxy process. The key, HMAC digest, raw item, IDs, prompts, tool data, source code, paths, and headers were not retained or written here. The tables contain only approved type categories, byte sizes, local sequence spans, and aggregate counts.

An exact match means equality after canonical JSON key ordering within this process; it is not semantic equality. Different representations of equivalent information can miss, while a matching item can remain essential agent state.

## Per-request trajectory

All five observed requests were `zstd`-encoded, returned HTTP `200`, exposed a terminal SSE event, and had both `responseObservationIncomplete=false` and recurrence `comparisonIncomplete=false`. Requests 1–5 ended with a client disconnect after the terminal event; task success confirms this was not a failed completion.

| Sequence | Compressed request bytes | Input types (`other`, `message`, `reasoning`) | Exact items seen previously | Repeated canonical bytes | Provider input / cached tokens |
| ---: | ---: | --- | ---: | ---: | --- |
| 1 | 30,743 | 1, 6, 0 | 0 | 0 | 23,598 / 2,816 |
| 2 | 33,182 | 3, 7, 1 | 7 | 99,848 | 23,984 / 23,296 |
| 3 | 34,810 | 5, 7, 2 | 11 | 103,903 | 24,181 / 23,296 |
| 4 | 37,000 | 7, 8, 3 | 14 | 106,823 | 24,478 / 23,296 |
| 5 | 38,501 | 9, 8, 4 | 18 | 110,709 | 24,717 / 24,320 |

`other` remains an opaque category. Its recurrence does not identify it as a tool result, user data, an observation, or redundant context.

## Anonymous recurring groups

The bounded in-memory tracker found 18 groups that occurred in at least two provider requests. The list was not truncated and the tracker did not hit its capacity limit.

| Type | Canonical bytes per item | First–last sequence | Distinct requests |
| --- | ---: | --- | ---: |
| other | 38,913 | 1–5 | 5 |
| message | 34,593 | 1–5 | 5 |
| message | 18,170 | 1–5 | 5 |
| message | 4,492 | 1–5 | 5 |
| message | 2,605 | 1–5 | 5 |
| reasoning | 2,061 | 2–5 | 4 |
| reasoning | 1,785 | 3–5 | 3 |
| reasoning | 2,361 | 4–5 | 2 |
| other | 1,025 | 2–5 | 4 |
| message | 584 | 1–5 | 5 |
| message | 491 | 1–5 | 5 |
| other | 519 | 2–5 | 4 |
| message | 450 | 2–5 | 4 |
| other | 581 | 3–5 | 3 |
| other | 554 | 3–5 | 3 |
| other | 663 | 4–5 | 2 |
| message | 481 | 4–5 | 2 |
| other | 381 | 4–5 | 2 |

No recognized `function_call_output` or `computer_call_output` group appeared.

## Interpretation and stop point

The narrow recurrence hypothesis is not falsified for this task: multiple full canonical representations repeated across provider requests. That evidence alone is insufficient to call any representation redundant. In particular, repeated messages and reasoning items may be necessary agent state; substantial provider-reported cached input also makes any cost or cache claim unsupported. The large opaque `other` group is a candidate for **manual evidence review only**, not a candidate for rewriting.

No ObservationPack, artifact storage, retrieval, payload change, context deletion, summarization, reducer, or optimization was implemented. A future decision would need a separate semantic and task-preservation experiment with an explicitly approved privacy model.
