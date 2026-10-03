# Content-Free Cross-Boundary Timeline — Final Attempt Record

## 1. Frozen setup

- Harness: Pi 0.86.0 using the existing `openai-codex` OAuth flow.
- Model profile: `gpt-5.6-terra`.
- Transport: local Inlay loopback proxy at `POST /v1/codex/responses`.
- Inlay modes: structural observation and explicit content-free timeline timing.
- Fixture: a fresh detached worktree from the immutable intentionally failing
  C2 baseline, launched through `scripts/pi-c2-runner.ts` with an explicit
  fixture working directory.

No task, transport, provider, tool, or observation policy was changed.

## 2. Run count

One launch was attempted. It was not a valid coding trajectory, so the
predefined protocol did not authorize the second or third repetition.

Before launch, the fixture baseline was present, clean, and its verifier
failed as expected. Pi exited with status 1 after 85 ms. The fixture did not
reach the verifier-passing state or the allowed mutation state.

## 3. Sanitized timeline

| Event | Relative time | Availability |
| --- | ---: | --- |
| Baseline preflight | before launch | available |
| Pi launch | 0 ms | available |
| Pi exit | 85 ms | available |
| Proxied provider request | — | unavailable |
| Provider headers / first byte / terminal / completion | — | unavailable |
| Harness action lifecycle | — | unavailable |
| Post-task verifier / allowed-scope milestone | — | unavailable |

The proxy observed zero supported provider requests and the local action spool
was not created. This record intentionally contains no process error text,
prompt, source, path, command, argument, tool output, credential, identifier,
or provider payload.

## 4. Metric availability

| Measure | State |
| --- | --- |
| Process elapsed time | available |
| Provider request count | available: zero |
| Provider timing, HTTP status, cancellation, retry, usage | unavailable |
| Harness ordinal/category/outcome/duration | unavailable |
| Task verifier, mutation scope, completion | unavailable |
| Cross-boundary timestamp alignment | unavailable |

Unavailable is not zero, except for the directly observed count of supported
provider requests.

## 5. Measurable observations

The detached-fixture preflight and explicit runner topology remained valid.
The attempted Pi process ended before either side of the intended correlation
boundary emitted an observable event. No timing relationship, action/request
ordering, retry, cancellation, usage, or task milestone can be inferred.

## 6. What remains unknowable

This attempt cannot establish provider-to-harness ordering, elapsed gaps,
milestone clustering, time allocation, or a cross-boundary measurement model.
It also cannot establish semantic redundancy, causal dependency, optimization
opportunity, token or cost savings, latency improvement, model reasoning, or
general harness behavior.

## 7. Threats to validity

- The sole launch stopped before a provider exchange and before a tool action.
- There is no task-completion evidence to correlate with timestamps.
- The probe deliberately retains no raw diagnostics, so the immediate
  pre-task exit cause is not classified by this research record.
- A zero count on the supported route does not prove why the harness exited.

## 8. Measurement gate

**Not passed.** A valid trajectory requires a task-completing Pi run with both
provider timing and harness action timing available. That prerequisite was not
met, and additional repetitions were correctly not run.

## 9. Implications for future research

The next decision is a bounded pre-task compatibility diagnosis for this
frozen Pi profile. It should determine why the harness exits before the
supported Responses exchange, without broadening telemetry or changing the
task. The current record does not justify any optimization work.
