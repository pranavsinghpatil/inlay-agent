# Content-Free Cross-Boundary Timeline

## 1. Research question

Can Inlay correlate a real Pi harness action lifecycle with proxied Codex provider-request timing and fixed task milestones using only process-local ordinals and timestamps?

This is a measurement-only study. It did not alter provider requests, execute a transformation, or retain semantic content.

## 2. Historical frozen setup

- Harness: Pi 0.86.0, using its existing `openai-codex` OAuth flow.
- Proxy: loopback-only Inlay with structural observation and the content-free timeline flag explicitly enabled.
- Task: one fresh detached instance of the immutable C2 clamp baseline, with the predeclared verifier and allowed implementation scope.
- Run ordinal: 1.

The direct OAuth/model readiness check succeeded. The baseline verifier failed as expected before the attempted task, confirming an unmodified starting state.

## 3. Instrumentation changes

The opt-in probe adds only:

- local provider timestamps for request start, upstream headers, first response byte, terminal event, and completion when those events occur;
- a fixed `unavailable` retry classification until a provider-side retry boundary is observable;
- a separate local Pi spool with action ordinal, closed action category, fixed verifier class, outcome, duration, and process-local start/end timestamps.

The harness adapter applies a process-only loopback provider-base override. It does not alter tools, provider payloads, request bytes, or response bytes.

## 4. Privacy boundary

Persisted fields are limited to run ordinal, local timestamps, closed categories, fixed outcomes, counts, and numeric provider usage if emitted. The study stores no prompts, source, file paths, tool names, commands, arguments, tool output, provider payloads, credentials, reusable identifiers, hashes, or semantic content.

## 5. Per-run sanitized timeline

| Run | Event | Relative time | Availability |
| --- | --- | ---: | --- |
| 1 | Frozen baseline verified | before run | available |
| 1 | Pi process start | 0 ms | available |
| 1 | Pi process end | 1,664 ms | available |
| 1 | Proxied `POST /v1/responses` request | — | unavailable |
| 1 | Provider header / first-byte / terminal / completion timing | — | unavailable |
| 1 | Pi action event | — | unavailable |
| 1 | Allowed-scope mutation / verifier pass / task completion | — | unavailable |

The run stopped before the first *supported* provider Responses request because
Pi sent `POST /v1/codex/responses` while this historical proxy revision accepted
only `POST /v1/responses`. This was a route-shape mismatch, not a failure caused
by `GET /v1/models` or a model-discovery prerequisite. The proxy reported zero
requests on its then-supported route and the adapter created no action spool.
This is a protocol-compatibility boundary, not evidence about task behavior.

The narrow `POST /v1/codex/responses` alias was subsequently added and passed
transport compatibility validation. See [the Pi transport check](pi-c2-transport-compatibility-check.md)
and [valid Pi C2 baseline](pi-c2-valid-baseline.md). This historical record is
retained because it explains the original negative result.

## 6. Metric availability

| Metric | State | Interpretation |
| --- | --- | --- |
| Process elapsed time | available | Startup-to-exit duration only; not task or model timing. |
| Provider request count | available: zero | No supported Responses request reached Inlay. |
| Provider timings and numeric usage | unavailable | No provider Responses exchange occurred. |
| Harness action count and duration | unavailable | Pi did not reach a tool lifecycle. |
| Fixed task milestones after baseline | unavailable | The coding task did not begin. |
| Retry/cancellation classification | unavailable | No provider exchange or tool action existed to classify. |

Unavailable is not zero, except the directly observed count of supported provider requests, which was zero.

## 7. What can be measured

The implementation can emit content-free timing streams when a harness reaches the supported Responses boundary and tool lifecycle. This run confirms the probe remains isolated and does not add content capture. It does not establish cross-boundary correlation for Pi.

## 8. What remains unknowable

- The ordering or elapsed relationship between Pi actions and provider Responses requests.
- Provider header, first-byte, terminal, completion, usage, retry, or cancellation timing for Pi.
- Any task-stage alignment, causal relationship, efficiency claim, or model-decision timing.

## 9. Threats to validity

- This is one blocked pre-task attempt, not a completed coding trajectory.
- The historical proxy did not accept Pi's exact Responses route shape.
- No raw diagnostic content was retained, so the record intentionally does not characterize model-catalog response semantics.
- Timestamps can establish order only; they cannot establish causality or semantic dependency.

## 10. Decision against the measurement gate

**Negative result — gate not met.** The task did not complete; no provider Responses events, harness actions, or post-baseline task milestones were available for alignment. No second or third repetition was run.

The study must not respond by broadening telemetry. A future, separately authorized transport-compatibility decision would be needed before retrying this Pi cross-boundary measurement.

## 11. Subsequent outcome

The route-shape question was resolved by the narrow alias. A later
content-free timeline launch still did not produce a valid completed trajectory,
but it exited before a supported provider request or action lifecycle for an
unknown privacy-preserving reason. That later finding is recorded separately in
[the final timeline attempt](content-free-cross-boundary-timeline-final.md).
