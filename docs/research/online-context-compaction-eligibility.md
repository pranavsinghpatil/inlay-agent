# Online Context Compaction eligibility — Codex C2 observation

## 1. Frozen setup

- **Study type:** observation-only. No control/treatment arm, compaction, summarization, request mutation, or agent-behavior change was performed.
- **Agent:** Codex CLI 0.153.4 using the existing ChatGPT-authenticated `openai` provider flow.
- **Model:** `gpt-5.6-terra`.
- **Transport:** Codex HTTP `POST /v1/responses` through local Inlay, with structural observation, exact-item recurrence, and fixed semantic-role categories enabled.
- **Fixture:** the pre-existing deterministic C2 repair fixture at immutable baseline `3d0945f4fa74c1fc9b8b22d0327c892ffcc11075`.
- **Task contract:** the fixture verifier passed and only the predeclared implementation-file scope changed.

No prompt, message text, source, path, tool argument or output, identifier, payload, payload fingerprint, header, or credential is retained in this record.

## 2. Trajectory

Four `/v1/responses` requests reached the upstream with HTTP 200. All had zstd request encoding, complete structural observation, and a terminal SSE event. The task completed successfully after the run.

| Request | Canonical request bytes | Compressed request bytes | Input items | New items | Exact-recurring items | Fixed item categories | Transport-visible task stage |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- |
| 1 | 101,640 | 30,797 | 7 | 7 | 0 | message 6; other 1 | Not observable |
| 2 | 106,497 | 33,900 | 11 | 4 | 7 | message 7; other 3; reasoning 1 | Not observable |
| 3 | 110,093 | 36,121 | 14 | 3 | 11 | message 7; other 5; reasoning 2 | Not observable |
| 4 | 113,845 | 38,162 | 18 | 4 | 14 | message 8; other 7; reasoning 3 | Not observable |

Canonical request bytes are local UTF-8 sizes of whitelisted decoded JSON values. Compressed request bytes are received transport bytes. Neither is a token count, decoded wire size, cache measurement, or billing measurement. Numeric provider usage/cache fields were not available in this run.

The proxy cannot safely map a provider request ordinal to `before_edit`, `after_edit`, or `after_verify` without a harness-side lifecycle signal. It can establish only the post-run task-level `task_complete` outcome. No per-request lifecycle stage was inferred.

## 3. Context growth

The trajectory accumulated 11 input items and 12,205 canonical structural bytes from request 1 to request 4. All fixed categories grew or persisted:

| Category | Request 1 canonical bytes | Request 4 canonical bytes | Interpretation |
| --- | ---: | ---: | --- |
| message | 61,066 | 62,066 | Structural persistence/growth only |
| reasoning | 0 | 7,547 | New persistent reasoning-state items only |
| other | 38,986 | 42,633 | Structural persistence/growth only; role is unknown |

This establishes accumulated context. It does not show that any accumulated item is stale, redundant, superseded, or removable.

## 4. Persistence measurements

The exact-recurrence tracker found 14 groups that persisted across at least two requests. Its comparison was complete and its bounded group list was not truncated.

- Largest recurring opaque group: `other` / `unknown_item_type`, 38,986 canonical bytes, first request 1, last request 4, present in all 4 requests.
- Largest recurring recognized message group: system-or-developer message category, 34,612 canonical bytes, requests 1–4.
- Recurring reasoning-state groups began after request 1 and persisted for two or three requests.

The observer holds a process-local keyed HMAC only transiently to calculate exact recurrence. It emits no digest, item identity, or scalar value. Exact canonical recurrence is not semantic sameness or a removability result.

## 5. Supersession signals

The observer’s fixed taxonomy can recognize protocol-state forms such as `item_reference`, `compaction`, and `configuration_update`, along with known tool calls and known tool outputs. This trajectory exposed none of those categories.

No privacy-safe structural supersession signal was observed:

- no later protocol-state item replacing an earlier state snapshot;
- no explicit replacement/update marker;
- no bounded snapshot sequence;
- no category whose earlier representation stopped changing while a later replacement appeared;
- no provider usage/cache metadata from which to inspect state behavior.

Messages, reasoning state, and opaque `other` items persisted. Age, recurrence, type, and structural size are not supersession signals.

## 6. Candidate state boundaries

| Potential boundary | Material accumulation | Privacy-safe supersession signal | Defensible compaction boundary | Status |
| --- | --- | --- | --- | --- |
| Opaque `other` items | Yes | No; role unknown | No | Rejected |
| Message history | Yes | No | No | Rejected |
| Reasoning-state items | Modest | No | No | Rejected |
| Protocol-state snapshot/update | Not observed | Not observed | Not definable | Rejected |

No candidate state boundary meets the eligibility gate.

## 7. Removability status

All items remain **UNKNOWN** for decision relevance and removability. The study provides no safe way to distinguish required conversation/protocol state from stale context, and no content-free preservation contract can be stated.

The successful task outcome does not change this conclusion: temporal coexistence with a completed task does not establish that a particular item was unnecessary or necessary.

## 8. Privacy boundary

The existing observer transiently decodes zstd only to derive fixed structural categories, canonical byte totals, request ordinals, exact persistence spans, recurrence aggregates, and lifecycle fields. It does not retain raw or decoded payloads, scalar content, paths, IDs, tool data, credentials, headers, or reusable payload hashes.

No implementation change or additional inspection mechanism was needed. In particular, the study did not weaken privacy to classify opaque `other` items or infer task stages.

## 9. Eligibility decision

**Decision: reject Online Context Compaction eligibility for this Codex trajectory.**

The trajectory shows material context growth and persistence, but it supplies no structural supersession/replacement signal, no defensible state boundary, and no plausible content-free preservation contract. “The context got bigger” alone does not meet the gate for a future compaction experiment.

## 10. Threats to validity

- One small deterministic coding task cannot represent other tasks, models, providers, or harnesses.
- The Codex transport boundary does not expose harness lifecycle stages or semantic state roles.
- Opaque `other` values may contain legitimate protocol constructs that the privacy taxonomy deliberately declines to interpret.
- Request bytes and canonical structural bytes are not tokens; provider usage/cache fields were unavailable.
- No causal relationship between retained context and a later decision was measured.

## 11. Next research question

Before reconsidering compaction, identify a validated harness or protocol boundary that exposes an explicit, privacy-safe replacement/update semantic and a measurable preservation contract. That would require a new evidence and privacy design decision; it must not be inferred from accumulated Codex context alone.
