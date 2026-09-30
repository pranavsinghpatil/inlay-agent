# C2 Codex structural trajectory probe

## Scope and result

This is one successful, observation-only Codex `POST /v1/responses` coding-task run. It establishes a content-free request trajectory; it does **not** establish ObservationPack eligibility, semantic redundancy, token savings, cache savings, or a safe transformation.

| Frozen field | Value |
| --- | --- |
| Inlay revision | `60c1a17` |
| Agent | Codex CLI `0.153.4`, existing ChatGPT authentication |
| Model | `gpt-5.6-terra` |
| Fixture baseline | `3d0945f4fa74c1fc9b8b22d0327c892ffcc11075` |
| Observation mode | `INLAY_OBSERVATION=structural` |
| Task outcome | Passed its verifier marker; only the predeclared implementation file changed |
| Retention | In-memory only during the run; no request/response body, scalar content, IDs, paths, headers, credentials, or hashes retained |

`observationSequence` starts at 1 for each proxy process and is only a local ordering key. It does not correlate requests across proxy restarts or sessions.

## Measurement definitions

- **Compressed request bytes** are the buffered wire bytes received by Inlay. Every request in this run declared `Content-Encoding: zstd`; these values are not tokens or decoded size.
- **Canonical structural total** is the UTF-8 size of the complete transient decoded request after recursive key sorting, array-order preservation, and `JSON.stringify`. It is a stable local structural measure, not wire bytes, provider tokens, or billing data.
- **Per-type canonical bytes** use that same procedure for each transient input item, then aggregate only whitelisted type categories. Unknown type strings are grouped as `other` and are never retained.
- Provider token and cache fields are reported by the upstream provider. They do not demonstrate cost, cache behavior under rewriting, or savings.

## Sanitized request trajectory

All five requests had a decoded structural record, HTTP `200`, a terminal SSE event, and `responseObservationIncomplete=false`.

| Sequence | Compressed request bytes | Canonical structural total | Input items (`other`, `message`, `reasoning`) | Per-type canonical bytes (`other`; `message`; `reasoning`) | Provider input / output / cached tokens | Lifecycle |
| ---: | ---: | ---: | --- | --- | --- | --- |
| 1 | 30,824 | 101,373 | 1, 6, 0 | 38,864; 60,944; 0 | 23,953 / 232 / 2,816 | terminal observed; client disconnect after terminal |
| 2 | 33,539 | 105,738 | 3, 7, 1 | 40,401; 61,431; 2,337 | 24,385 / 121 / 23,296 | terminal observed; client disconnect after terminal |
| 3 | 35,017 | 108,466 | 5, 7, 2 | 41,493; 61,431; 3,970 | 24,553 / 167 / 23,296 | terminal observed; client disconnect after terminal |
| 4 | 36,584 | 111,640 | 7, 8, 3 | 42,534; 61,947; 5,583 | 24,744 / 97 / 24,320 | terminal observed; client disconnect after terminal |
| 5 | 38,018 | 114,638 | 9, 8, 4 | 43,936; 61,947; 7,176 | 25,008 / 54 / 24,320 | completed normally |

## Structural observations only

- Five provider requests occurred and the input-item count grew from 7 to 21.
- `message`, `reasoning`, and `other` categories persisted or grew structurally in this trajectory.
- No recognized `function_call_output`, `computer_call_output`, or other whitelisted tool-output item type appeared. `other` must not be interpreted as tool output.
- The trajectory therefore supplies no evidence that a recognized observation/tool-result item recurred, was expensive, was semantically redundant, or could be replaced safely.
- The four post-terminal disconnect classifications did not prevent task success and are not evidence of a failed provider completion.

## Stop point

This probe makes the Codex request structure observable enough to identify a candidate if one appears in a future normal task. It does not provide a candidate in this run. No ObservationPack design, artifact storage, retrieval capability, payload rewrite, or optimization follows from this record.
