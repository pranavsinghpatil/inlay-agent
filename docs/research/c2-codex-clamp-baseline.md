# Codex transparent-routing baseline — clamp C2

## Identity

- Inlay commit family: Codex Responses observation work through PR #5.
- Agent: OpenAI Codex CLI `0.153.4` as observed during the study.
- Backend/model: existing ChatGPT-authenticated Codex backend; selected model `gpt-5.6-terra` as observed during the study.
- Transport profile: `POST /v1/responses` through loopback Inlay.
- Observation: structural, in memory only.

## Task contract

- Fixture baseline: `3d0945f4fa74c1fc9b8b22d0327c892ffcc11075`.
- Task: repair the intentionally broken non-negative clamp implementation.
- Verifier: `node verify.mjs`, expected marker `C2_VERIFY_OK`.
- Allowed changed file: `src/clamp.mjs` only.
- Required behavior: repository inspection, a real tool loop, a source change, then verification.

## Recorded repetitions

| Arm | Repetitions | Verifier result | Changed-file scope | Observed request count |
| --- | ---: | --- | --- | ---: |
| Direct control | 3 | 3/3 passed | `src/clamp.mjs` only | Not measured by Inlay |
| Observed treatment | 3 | 3/3 passed | `src/clamp.mjs` only | 5 per run |

Observed compressed request-byte totals were 162,662, 161,470, and 160,761. All observed requests reached HTTP 200 and terminal SSE events. Provider-reported input, output, total, and cached-input usage fields were captured in memory for the treatment runs. Some Codex connections closed after a terminal event and were classified as `client_disconnect` with `cancelledAfterTerminalEvent=true`; this is not an incomplete model response.

## Interpretation

This establishes transparent placement for this Codex HTTP profile and this task contract. It does **not** establish token reduction, cost reduction, latency improvement, semantic improvement, or a safe transformation candidate. Request bytes are not token counts, and cached-input reporting does not show that pruning would save cost.

The clamp task is retained as a development/regression smoke fixture, not as independent optimization evidence. The rule-precedence fixture is quarantined pending a new one-defect immutable baseline.

## Fresh validation pair — 2026-09-28 IST

The same immutable fixture baseline and task contract were rerun in fresh detached worktrees with Codex CLI `0.153.4`, model `gpt-5.6-terra`, existing ChatGPT authentication, and process-only `windows.sandbox="unelevated"` configuration.

| Arm | Result | Changed-file scope | Request and usage observations |
| --- | --- | --- | --- |
| Direct control | `C2_VERIFY_OK` | `src/clamp.mjs` only | Inlay metrics intentionally unavailable. |
| Observed treatment | `C2_VERIFY_OK` | `src/clamp.mjs` only | 3 HTTP 200 Responses requests; 98,418 compressed request bytes; input tokens 23,949 -> 24,303 -> 24,459; cached input tokens 6,912 -> 23,296 -> 23,296; output tokens 150 -> 120 -> 157. |

Observed first-body timings were 1,492 ms, 918 ms, and 1,117 ms. All three exchanges had terminal SSE events; one completed normally and two were client disconnects after a terminal event. No request or response payload was transformed.

### Cancellation probe

A separate read-only Codex probe through Inlay produced an HTTP 200 response with a first body byte at 945 ms, then a client disconnect before a terminal event. Inlay classified it as `cancelled=true`, `terminalEventObserved=false`, and `errorCategory=client_disconnect`; it remained healthy and did not fabricate a completion. This is transport cancellation evidence from a noninteractive process interruption, not a substitute for a future human interactive cancellation-usability check.

Live provider non-2xx behavior remains unobserved. The repository's synthetic non-2xx test is the current error-forwarding contract.
