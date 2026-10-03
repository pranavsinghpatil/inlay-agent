# Pi Action Fusion Pilot 2

## Decision: A — capability failure

Pilot 2 stopped during repetition 1. Its control arm passed. The paired
treatment invoked `inlay_edit_and_verify` but returned the fixed rejection
reason `expected_text_not_found`; no edit was committed. The frozen capability
gate therefore stopped R2, R3, and the separate cancellation test.

Pilot 1 is explicitly excluded: its schema omitted the exact-once contract and
is invalidated as a treatment interface defect. No Pilot 1 measurement is
pooled with this record.

## Frozen setup

| Field | Value |
| --- | --- |
| Inlay branch | `codex/action-fusion-compound-prototype` |
| Pi | `0.86.0` |
| Authentication | Existing `openai-codex` OAuth flow |
| Model | `gpt-5.6-terra` |
| Fixture baseline | `3d0945f4fa74c1fc9b8b22d0327c892ffcc11075` |
| Policy | `c2_clamp_implementation` |
| Verifier class | `node_verify` |
| Expected/replacement limit | 8,192 UTF-8 bytes each |
| Session persistence | Disabled |
| Model-visible schema fingerprint | `f483bf51a71a2f95ea6a326d0699a07c0a3b0fcab1af3beb37515c0ec841e2b9` |
| Treatment extension fingerprint | `30917dc031ca136f21e160d79fcd50aefcb36a2e309f1113cfd31deabbfc1eaa` |
| Schema | Closed; no additional properties |
| Ordinary treatment routes | edit, write, bash, powershell disabled |

The revised schema explicitly requires an exact, unique match from the
policy-owned target and accepts no path, command, argument, or working
directory. The treatment had no ordinary-tool fallback.

Only fixed action categories, outcomes, durations, stage/rejection labels,
verifier class, and counts were retained. No prompt, source, path, text input,
tool output, command, identifier, credential, provider payload, or payload hash
is included here.

## Arm table

| Repetition | Order | Arm | Verifier | Scope | Route | Action count | Unfinished / cancelled | Elapsed |
| ---: | --- | --- | --- | --- | --- | ---: | --- | --- |
| 1 | control → treatment | Control | pass | pass | normal edit + fixed verifier | 8 | 0 / 0 | not captured as a stable run metric |
| 1 | control → treatment | Treatment | fail | fail | compound invoked; `rejected / expected_text_not_found` | 6 | 0 / 0 | 22,821 ms |
| 2 | treatment → control | — | not run | not run | stopped by gate | — | — | — |
| 3 | control → treatment | — | not run | not run | stopped by gate | — | — | — |

Provider request count and numeric provider usage were unavailable from this
Pi action-only measurement and are not treated as zero.

## Fixed action telemetry

### R1 control

| Ordinal | Category | Outcome | Duration (ms) | Verifier class |
| ---: | --- | --- | ---: | --- |
| 1 | read | success | 1,386 | — |
| 2 | read | success | 1,481 | — |
| 3 | read | success | 152 | — |
| 4 | read | success | 161 | — |
| 5 | read | success | 252 | — |
| 6 | verify | failure | 406 | node_verify |
| 7 | edit | success | 10 | — |
| 8 | verify | success | 191 | node_verify |

### R1 treatment

| Ordinal | Category | Outcome | Stage | Rejection reason | Duration (ms) | Verifier class |
| ---: | --- | --- | --- | --- | ---: | --- |
| 1 | read | success | — | — | 14 | — |
| 2 | read | success | — | — | 122 | — |
| 3 | read | success | — | — | 90 | — |
| 4 | read | success | — | — | 120 | — |
| 5 | read | success | — | — | 6 | — |
| 6 | compound_edit_verify | failure | rejected | expected_text_not_found | 11 | node_verify |

## Capability, efficiency, and cancellation

The treatment fails capability because its submitted expected-text selection was
not found before edit. The task itself remains representable under the frozen
contract, but this run did not supply a contract-valid exact selection. It did
invoke the compound tool, had no cancellation or unfinished action, and no
ordinary mutation/verifier route was available for fallback. The required task
verifier and changed-file scope did not pass because no edit committed.

No efficiency comparison is valid: a passing control/treatment pair is required
before comparing elapsed time, action count, provider request count, or provider
usage. The cancellation test was not reached because it was conditional on all
six normal capability runs passing.

## Protocol deviations and threats to validity

- No provider or harness protocol deviation was observed; the recorded
  deviation was the treatment's fixed validation rejection.
- The control end-to-end elapsed value was not captured as a stable run metric
  by the suppressed launcher wrapper. It is unavailable rather than estimated.
- This is one attempted Pilot 2 pair, not an n=3 study.
- The fixed rejection reason identifies only the validation class. It does not
  expose or establish the scalar input that produced it.
- The result does not generalize beyond this task, model, provider, or Pi
  adapter.

## Final decision

This is outcome **A: capability failure**. Action Fusion is not viable for this
Pilot 2 configuration. No efficiency, safety-cancellation, optimization, or
general Action Fusion claim is supported.
