# Evidence-Preserving Reducer eligibility — Codex C2 observation

## 1. Frozen setup

- **Study type:** observation-only; no control/treatment comparison and no payload or tool-execution change.
- **Agent:** Codex CLI 0.153.4 using the existing ChatGPT-authenticated `openai` provider flow.
- **Model:** `gpt-5.6-terra`.
- **Transport:** Codex HTTP `POST /v1/responses` through local Inlay, with structural observation, exact-item recurrence, and fixed semantic-role categories enabled.
- **Fixture:** the pre-existing deterministic C2 repair fixture at immutable baseline `3d0945f4fa74c1fc9b8b22d0327c892ffcc11075`.
- **Success contract:** the fixture verifier passed and the predeclared implementation-file scope was the only changed scope.

This record contains no prompt, source, path, tool argument, tool output, identifier, credential, payload, or payload fingerprint.

## 2. Trajectory summary

Five `/v1/responses` requests reached the upstream with HTTP 200. Every request had zstd content encoding, a decoded structural observation, a terminal SSE event, and `responseObservationIncomplete=false`.

| Request | Input items | Compressed request bytes | Canonical structural bytes | Exact-recurring items | Exact-recurring canonical bytes |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 7 | 30,900 | 101,546 | 0 | 0 |
| 2 | 11 | 33,019 | 105,258 | 7 | 99,973 |
| 3 | 14 | 34,822 | 108,422 | 11 | 103,681 |
| 4 | 18 | 36,326 | 111,509 | 14 | 106,842 |
| 5 | 21 | 37,773 | 114,505 | 18 | 109,925 |

Compressed request bytes are transport measurements. Canonical structural bytes are local `JSON.stringify` UTF-8 measurements of decoded, whitelisted values. Neither measure is a token count, decoded wire size, or billing measurement. No provider usage fields were available in this run.

The proxy recorded normal terminal lifecycle evidence for all requests. Three requests were marked as client disconnects after a terminal event, the already documented Codex client lifecycle pattern; this is not treated as a failed task or as an incomplete observation.

## 3. Candidate observations

The only recurring groups available to the privacy-safe observer were fixed categories and fixed role categories:

| Group category / role | Largest exact group size | Request span | Persistence | Candidate status |
| --- | ---: | --- | --- | --- |
| `other` / `unknown_item_type` | 38,986 canonical bytes | 1–5 | 5 requests | Rejected: role is unknown; it must not be called a tool output or observation. |
| `message` / system-or-developer | 34,622 canonical bytes | 1–5 | 5 requests | Rejected: recognized conversation/protocol message history, not a separately identified observation. |
| `message` / user | 4,515 canonical bytes | 1–5 | 5 requests | Rejected: task/conversation history; no removability evidence. |
| `reasoning` / reasoning-state | 1,953 canonical bytes | 3–5 | 3 requests | Rejected: persistent protocol state; neither semantic necessity nor removability is observable. |

The fixed reporting buckets are `<1 KiB`, `1–8 KiB`, `8–32 KiB`, and `>=32 KiB` canonical bytes. They describe only local structural magnitude and are not an optimization threshold. The largest opaque group and the largest system-or-developer message group are in the `>=32 KiB` bucket.

## 4. Recurrence measurements

Input composition grew from `{ message: 6, other: 1 }` to `{ message: 8, reasoning: 4, other: 9 }`. The exact-recurrence tracker found 18 bounded groups; its comparison was complete and not truncated.

No `function_call_output`, `computer_call_output`, or other recognized tool-output item type occurred in any request. Therefore the study has no recognized observation/tool-output candidate to classify as deterministic-verifier, file/search/read observation, command/tool result, or other recognized tool output.

Exact recurrence establishes only canonical equality within this local process and request span. It does not establish semantic sameness beyond canonical equality, task relevance, causal use, redundancy, or safe removability.

## 5. Role classification

The observer recognizes messages, reasoning, known tool calls, known tool outputs, protocol state, and opaque `other` values through a fixed allowlist. This run contained message roles, reasoning state, and opaque unknown items only.

`other` is deliberately not interpreted as tool output. Its structural recurrence and material size are facts; its logical role remains unknown. The observer retains neither the item value nor a reusable item identity, so it cannot decide whether it represents task information, required provider state, or another protocol construct.

## 6. Size measurements

The largest opaque recurring group contributed 38,986 canonical bytes in each of five requests. At request 5, all recurring `other` groups accounted for 42,799 canonical bytes; recurring messages accounted for 61,927; recurring reasoning state accounted for 5,199.

These values show structural contribution, not token contribution or a possible reduction. Cached-token data was unavailable in this run; even if it had been available, cache reporting would not establish that removing any item saves cost or preserves behavior.

## 7. Evidence and necessity signals

The task completed successfully, but the Codex transport observer has no harness-side, content-free mapping between a particular opaque input item and a later tool action, verifier result, or decision. Accordingly:

- no related-action signal: **not observable at this boundary**;
- repeated related action: **not observable at this boundary**;
- successful final verification: **observed at task level only**;
- failed verification: **not observed**;
- task completion: **observed**.

Temporal coexistence with task completion does not show that any particular item was unnecessary or necessary.

## 8. Removability status

Every candidate is **UNKNOWN** for removability. No candidate qualifies for an Evidence-Preserving Reducer experiment because none satisfies all required conditions:

1. recognized observation/tool-output role — **not met**;
2. material size — present for some groups;
3. recurrence across requests — present;
4. recurrence is not merely conversation history — **not established**;
5. a content-free evidence-preservation boundary — **not definable**;
6. concrete full-versus-reduced comparison — **not definable**.

## 9. Privacy boundary

The observer transiently decodes zstd only to derive whitelisted structural metadata. It retains fixed item categories, fixed role categories, canonical-byte totals, request ordinals, bounded recurrence spans, and lifecycle fields. It does not retain raw or decoded bodies, scalar values, prompts, source, tool names or arguments, tool outputs, paths, IDs, credentials, headers, or reusable payload hashes.

No privacy boundary was weakened for this study. In particular, no semantic inspection or content-derived classification was added to classify opaque `other` values.

## 10. Decision gate

**Decision: reject Evidence-Preserving Reducer eligibility for this Codex trajectory.**

The trajectory demonstrates context growth and exact recurrence, but it exposes no recognized recurring tool-output observation and no privacy-safe evidence-preservation boundary. This is a negative eligibility result, not evidence against all reducers or all coding agents.

## 11. Threats to validity

- One deterministic C2 trajectory is not representative of other tasks, models, providers, or harnesses.
- Opaque protocol values may conceal several legitimate Responses constructs; the fixed privacy taxonomy intentionally declines to classify them.
- Message and reasoning recurrence can be normal state accumulation.
- Request/structural bytes are not tokens, and no provider usage was available in this run.
- No causal relation between a recurring item and later agent behavior was measured.

## 12. Next research question

Before revisiting a reducer, identify a validated harness boundary that can expose a **recognized** observation/result role and a content-free capability contract for testing full versus reduced evidence. That requires a separate privacy and experimental design decision; it must not be inferred from opaque Codex transport items or implemented as a payload transformation.
