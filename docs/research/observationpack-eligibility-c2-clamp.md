# ObservationPack eligibility: C2 clamp study

## Verdict

**Inconclusive — not eligible for a transformation experiment.**

This study did not pass the protocol's minimum exploratory gate. It produced two valid observed repetitions and one invalid repetition, rather than three successful repetitions. Further, the two valid repetitions did not consistently expose a recognized tool-output item type. This is not evidence that ObservationPack would be ineffective in every Codex task; it is evidence that this fixture and sample do not justify designing or implementing it.

No artifact store, retrieval handle, harness command, payload substitution, or request transformation was implemented.

## Frozen configuration

| Field | Value |
| --- | --- |
| Inlay revision | `f640d5c` |
| Agent | Codex CLI `0.153.4` using existing ChatGPT authentication |
| Model | `gpt-5.6-terra` |
| Transport | Codex HTTP `POST /v1/responses` through loopback Inlay; no payload changes |
| Observation | `INLAY_OBSERVATION=structural` |
| Sandbox | `windows.sandbox="unelevated"` |
| Fixture baseline | `3d0945f4fa74c1fc9b8b22d0327c892ffcc11075` |
| Success contract | Baseline verifier succeeds; only the predeclared implementation file changes |

The task and runtime configuration were held constant. The fixture was a pre-existing small clamp repair task; it was not expanded to induce context growth.

## Privacy boundary

This record contains only aggregate structural counts, sizes, provider-reported numeric usage, and transport/lifecycle fields. It retains no prompt or message content, reasoning content, tool arguments or outputs, source excerpts, paths, headers, credentials, request IDs, payload hashes, raw request bytes, or decompressed bytes.

`inputItemTypeCanonicalJsonBytes` is calculated transiently by recursively sorting object keys lexicographically, preserving array order, applying `JSON.stringify`, and measuring UTF-8 bytes. It is a stable local structural-size proxy. It is not wire bytes, decoded transport bytes, provider tokens, or billing data. The request-byte column below is the compressed wire request size because these Codex requests used `Content-Encoding: zstd`.

## Valid observed repetitions

Both valid repetitions satisfied the task success contract, returned HTTP 200 for every observed Responses request, observed a terminal SSE event for every request, and had `responseObservationIncomplete=false`. Client disconnects, where present, occurred after the terminal event and did not prevent verifier success.

### Repetition 1

| Request sequence | 1 | 2 | 3 | 4 |
| --- | ---: | ---: | ---: | ---: |
| Compressed request bytes | 30,853 | 33,692 | 35,468 | 36,974 |
| Input item count | 7 | 11 | 14 | 17 |
| Item counts (`other`, `message`, `reasoning`, `function_call`, `function_call_output`) | 1, 6, 0, 0, 0 | 3, 7, 1, 0, 0 | 3, 7, 2, 1, 1 | 5, 7, 3, 1, 1 |
| Canonical bytes by the same item types | 38,864; 61,015; 0; 0; 0 | 40,423; 61,512; 2,465; 0; 0 | 40,423; 61,512; 4,058; 844; 337 | 41,891; 61,512; 5,755; 844; 337 |
| Provider input / output / cached tokens | 23,954 / 255 / 0 | 24,411 / 107 / 23,296 | 24,565 / 213 / 23,296 | 24,834 / 157 / 24,320 |

This repetition structurally observed `function_call_output` on later requests, with a 337-canonical-byte contribution. It was not classified as material: it is small beside the surrounding structural totals, and type/size alone does not establish content identity, semantic redundancy, retrieval suitability, token savings, cache behavior, or task preservation after substitution.

### Repetition 2

| Request sequence | 1 | 2 | 3 | 4 | 5 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Compressed request bytes | 30,861 | 33,090 | 34,536 | 36,042 | 37,614 |
| Input item count | 7 | 11 | 14 | 18 | 21 |
| Item counts (`other`, `message`, `reasoning`) | 1, 6, 0 | 3, 7, 1 | 5, 7, 2 | 7, 8, 3 | 9, 8, 4 |
| Canonical bytes by the same item types | 38,864; 61,037; 0 | 40,429; 61,495; 1,825 | 41,479; 61,495; 3,458 | 42,534; 61,995; 5,007 | 43,824; 61,995; 6,728 |
| Provider input / output / cached tokens | 23,968 / 156 / 0 | 24,328 / 107 / 2,816 | 24,482 / 161 / 23,296 | 24,667 / 114 / 24,320 | 24,920 / 67 / 24,320 |

This repetition had no recognized `function_call_output` or other recognized tool-output category. Unknown types remain safely grouped as `other`, so this record cannot infer what `other` represents or treat its growth as tool-output overhead.

## Invalid repetition

The third fresh-baseline treatment made two successful HTTP 200 Responses exchanges with terminal SSE events and complete structural observation, but the agent did not make the permitted edit and the verifier remained at the expected baseline failure. It is an agent-task non-completion, not an Inlay transport failure. Per protocol it was not retried and does not count toward the study.

## What the study establishes

- The opt-in observer can measure safe, decoded structural totals over real compressed Codex requests without changing forwarding.
- Input-item count, compressed request bytes, provider input tokens, and some category totals grew over both valid task trajectories.
- Structural growth alone does not identify a removable component, semantic duplicate, artifact boundary, provider-token reduction, cache effect, cost effect, or safe context substitution.

## What remains required

Before a separate ObservationPack design review, the project needs a reliable task with repeated successful observed runs that naturally and consistently exposes a recognized tool-output item type with a material repeated structural contribution. That exploratory condition would still not prove generality or benefit; it would only justify designing a bounded, harness-adapter-based experiment. It would not authorize implementation automatically.
