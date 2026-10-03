# Pi Action Fusion controlled pilot

## Result: invalidated — treatment interface contract defect

The frozen pilot stopped during repetition 1. The first fresh control arm passed;
the paired treatment arm invoked the compound tool but received its fixed
`rejected` stage outcome. Later interface review established that the compound
schema omitted the exact-once requirement that Pi's ordinary edit schema
communicates. The rejected arm is therefore not a valid treatment observation
and must not be pooled with a revised pilot.

## Frozen setup

| Field | Value |
| --- | --- |
| Inlay branch | `codex/action-fusion-compound-prototype` |
| Pi | `0.86.0` |
| Authentication | Existing `openai-codex` OAuth flow |
| Model | `gpt-5.6-terra` |
| Fixture baseline | `3d0945f4fa74c1fc9b8b22d0327c892ffcc11075` |
| Treatment policy | `c2_clamp_implementation` |
| Treatment verifier class | `node_verify` |
| Session persistence | Disabled |
| Persisted measurement | Fixed-category local action spool only |

No prompt, source content, tool argument, command, output, path, identifier,
credential, provider payload, or payload hash was retained for this record.

## Completed arms

| Repetition | Arm | Task verifier | Scope | Intended route | Pi exit | Action count | Unfinished / cancelled | Elapsed (ms) |
| ---: | --- | --- | --- | --- | ---: | ---: | --- | ---: |
| 1 | Control | pass | pass | normal edit + fixed verifier | 0 | 6 | 0 / 0 | 20,254 |
| 1 | Treatment | fail | fail | compound invoked; stage `rejected` | 0 | 4 | 0 / 0 | 20,615 |

Provider request count and provider usage were unavailable from this
content-free Pi action measurement. They are reported as unavailable, not zero.

## Fixed action telemetry

### Control

| Ordinal | Category | Outcome | Duration (ms) | Verifier class |
| ---: | --- | --- | ---: | --- |
| 1 | verify | failure | 277 | node_verify |
| 2 | read | success | 15 | — |
| 3 | read | success | 15 | — |
| 4 | read | failure | 6 | — |
| 5 | edit | success | 20 | — |
| 6 | verify | success | 170 | node_verify |

### Treatment

| Ordinal | Category | Outcome | Compound stage | Duration (ms) | Verifier class |
| ---: | --- | --- | --- | ---: | --- |
| 1 | read | success | — | 12 | — |
| 2 | read | success | — | 14 | — |
| 3 | read | success | — | 13 | — |
| 4 | compound_edit_verify | failure | rejected | 5 | node_verify |

Ordinary mutation and shell tools were unavailable to the treatment model. No
ordinary-tool fallback was observed in the fixed action spool. The closed,
privacy-preserving telemetry cannot distinguish which precheck caused a
`rejected` result, and this record does not attempt to infer it from content.

## Cancellation and protocol status

The separate cancellation test was not run: it was scheduled only after six
normal capability runs, and the pilot's capability stop condition occurred
first. No transport or provider protocol deviation was observed; the measured
deviation was the treatment tool's own closed precheck rejection.

## Threats to validity

- This is one completed pair, not the planned exploratory three-pair pilot.
- The compound tool's privacy-safe `rejected` stage intentionally omits the
  rejected scalar input and precheck detail, so root cause is not established.
- No request-count, token, cache, or provider-latency measurement is available
  from this Pi-only action study.
- The result makes no claim about other tasks, models, providers, or harnesses.

## Decision

Pilot 1 is **invalidated by a treatment interface contract defect**, not counted
as a capability or efficiency result. A revised contract needs a newly frozen
pilot. Pilot 1 measurements must not be pooled with Pilot 2. No efficiency,
cancellation, optimization, or general Action Fusion claim is justified.
