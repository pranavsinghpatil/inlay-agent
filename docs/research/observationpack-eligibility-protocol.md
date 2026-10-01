# ObservationPack eligibility protocol

## Purpose

Determine whether the validated Codex HTTP Responses profile shows the structural conditions that could justify a future, harness-adapter-based ObservationPack experiment. This protocol does not test an optimization.

## Configuration

- Inlay commit and observation mode: `INLAY_OBSERVATION=structural`.
- Agent, version, backend/model, existing-auth environment, sandbox setting, task prompt, and fixture baseline: frozen for all runs.
- Fixture: a reliable, existing deterministic coding task that naturally produces recognized tool-result items. Do not create oversized output to force eligibility.
- Retention: sanitized record and in-memory structural ledger only. Never retain request or response bodies, prompts, tool output, paths, headers, credentials, IDs, or payload hashes.

## Measurements

For each `/v1/responses` request, record request count, wire/compressed request bytes, approved input-item counts, `inputItemTypeCanonicalJsonBytes`, provider-reported usage where available, HTTP status, first-byte timing, lifecycle fields, and task-verifier outcome.

`inputItemTypeCanonicalJsonBytes` is computed by recursively sorting object keys, preserving array order, serializing the transient item with `JSON.stringify`, and counting UTF-8 bytes. It is a stable local structural-size proxy only: it is neither original wire size nor decoded transport size nor provider token/billing data.

## Exploratory gate

Run at least three successful repetitions. A result is eligible for a separate design review only when all repetitions show a recognized tool-output item type with a material, repeated structural-byte contribution in later requests, successful task completion, expected changed-file scope, HTTP 200, terminal SSE observation, and `responseObservationIncomplete=false`.

This is a minimum exploratory screen, not statistical evidence of generality or proof of ObservationPack benefit. If any condition is absent, classify the result as unsupported or inconclusive and stop. Do not implement artifact storage, handles, retrieval, payload rewriting, or thresholds.
