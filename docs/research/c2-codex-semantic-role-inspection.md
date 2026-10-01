# C2 Codex local semantic-role inspection

## Result

This fresh, observation-only C2 run confirms exact canonical recurrence and adds fixed protocol-role categories without retaining request content. It does **not** identify the semantics of the largest recurring opaque item: its raw protocol type was intentionally not exposed, and it is categorized as `unknown_item_type`.

The result is therefore **mixed/ambiguous**. It supports improving measurement only if a future privacy review approves it; it does not support an ObservationPack, retrieval capability, context substitution, or any transformation.

## Frozen run

| Field | Value |
| --- | --- |
| Inlay revision | `5b8af0e` |
| Agent | Codex CLI `0.153.4`, existing ChatGPT authentication |
| Model | `gpt-5.6-terra` |
| Fixture baseline | `3d0945f4fa74c1fc9b8b22d0327c892ffcc11075` |
| Direct control | Passed; exactly one predeclared implementation file changed |
| Observed treatment | Passed; exactly one predeclared implementation file changed |
| Observation settings | `structural`, `exact-item`, `role-categories` |

No request or response bytes were changed. The proxy held its process-local HMAC comparison state and decoded request data only transiently. No raw payload, scalar, item ID, call ID, path, header, credential, or raw type string is recorded here.

## Transport and completeness

The observed treatment issued five `/v1/responses` requests. Each used `zstd`, returned HTTP `200`, and exposed a terminal SSE event. Structural and recurrence observation were complete in every request.

One request completed normally. Four were classified as a client disconnect after the terminal SSE event; this was previously observed Codex lifecycle behavior and is not a failed completion because the task verifier passed. No non-terminal disconnect, non-200 response, parsing failure, or recurrence-capacity limit appeared.

## Safe trajectory

| Sequence | Compressed request bytes | Input items (`other`, `message`, `reasoning`) | Canonical structural bytes | Previously seen items | Provider input / cached tokens |
| ---: | ---: | --- | ---: | ---: | --- |
| 1 | 28,540 | 1, 6, 0 | 91,523 | 0 | 21,480 / 11,008 |
| 2 | 29,228 | 3, 7, 0 | 93,513 | 7 | 21,776 / 21,248 |
| 3 | 31,125 | 5, 7, 1 | 96,590 | 10 | 21,983 / 21,248 |
| 4 | 32,661 | 7, 8, 2 | 99,620 | 13 | 22,154 / 21,248 |
| 5 | 32,937 | 9, 8, 2 | 101,061 | 17 | 22,411 / 21,248 |

Compressed request bytes are transport bytes. Canonical structural bytes are a local JSON-size measure. Neither is a token count, decoded wire size, billing measure, or evidence of cost savings. Cached-token reporting is not evidence that pruning would save cost or preserve cache behavior.

## Recurring role categories

The tracker found 17 recurring exact-canonical groups. The following groups demonstrate the role-level outcome while remaining content-free.

| Structural type | Fixed role category | Canonical bytes per item | Request span | Interpretation and uncertainty |
| --- | --- | ---: | --- | --- |
| `other` | `unknown_item_type` | 38,913 | 1–5 | The largest exact recurring representation. It is neither identified as a tool result nor known to be protocol state, task content, or removable. |
| `message` | `message_system_or_developer` | 24,712 | 1–5 | Persistent message-role state. Role alone does not establish whether it is task-relevant or required. |
| `message` | `message_system_or_developer` | 18,170 | 1–5 | Same interpretation boundary; not content inspection. |
| `message` | `message_user` | 4,480 | 1–5 | Persistent user-role representation. Exact recurrence does not imply task redundancy. |
| `reasoning` | `reasoning_state` | 1,997 | 3–5 | Persistent Responses reasoning state. It must not be treated as chain-of-thought, redundant, or removable. |
| `other` | `unknown_item_type` | 1,023 | 2–5 | Smaller opaque recurring representation; role remains unknown. |
| `message` | `message_assistant` | 446 | 2–5 | Persistent assistant-role representation; semantic role and necessity remain unmeasured. |

The remaining recurring groups are smaller instances of `unknown_item_type`, message-role categories, or `reasoning_state`. No recognized `function_call_output`, `computer_call_output`, or other recognized tool-output category occurred.

## What the evidence means

| Proposition | Evidence status |
| --- | --- |
| An item has the same canonical representation across later requests | Established for 17 bounded groups within this run |
| A recurrent item has the same semantic meaning | Not established |
| A recurrent item is unnecessary task information | Not established |
| A recurrent item is safely removable, replaceable, or retrievable | Not tested |
| The large opaque item is a tool result | Not established; current evidence says only `unknown_item_type` |
| The large opaque item materially contributes to later structural request size | Established as a structural-size contribution only |

The documented Responses input union permits legitimate non-message items beyond this fixed classifier. In particular, protocol state, compaction, built-in tool families, and provider-specific variants remain plausible explanations for an opaque item. This study did not inspect or retain the raw type/value needed to distinguish them.

## Decision gate

Outcome **C/D**: ambiguous evidence. ObservationPack eligibility remains unestablished. A future measurement proposal would need a new privacy review and a falsifiable way to distinguish the opaque item's protocol family without persisting or exporting sensitive fields. It must also show, separately, whether any candidate is task-relevant and whether changing it preserves agent behavior.

No artifact storage, retrieval handle, payload rewrite, context deletion, summarization, reducer, threshold, or optimization was implemented.
