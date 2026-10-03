# Pi C2 Valid Baseline

## Purpose

This is one content-free, observation-only baseline run. It establishes whether
Pi can complete the fixed C2 coding task through the local Inlay loopback
proxy; it does not evaluate an optimization.

## Frozen setup

- Harness: Pi 0.86.0.
- Authentication/provider flow: the existing `openai-codex` OAuth flow.
- Model profile: `gpt-5.6-terra`.
- Transport: `POST /v1/codex/responses` through the local Inlay proxy.
- Inlay mode: transparent forwarding with structural observation enabled.
- Fixture: a fresh detached worktree from the immutable, intentionally failing
  C2 baseline. Before launch, its verifier failed and its Git state was clean.
- Runner topology: Pi's resolved package executable was outside the fixture and
  its observed child working directory was the detached fixture.

## Capability result

| Check | Result |
| --- | --- |
| Pi process completed | Pass (exit status 0) |
| Predeclared verifier | Pass |
| Allowed source-change scope | Pass |
| Unexpected source/artifact changes | None; the sole local artifact was the expected content-free action spool |
| Task completion fabricated from HTTP status alone | No; the verifier and source-scope checks independently passed |

The only source change was within the predeclared implementation-file scope.
This record intentionally omits its path and all task content.

## Safe transport and action observations

| Measure | Observation |
| --- | --- |
| Provider requests through Inlay | 6 |
| HTTP status | 6 × 200 |
| Terminal SSE event observed | 6 / 6 |
| Incomplete response observation | 0 / 6 |
| Compressed request bytes | 32,451 total |
| Provider usage present | 6 / 6 requests |
| Provider usage totals | input 9,922; cached input 4,608; output 268; total 10,190 |
| End-to-end elapsed time | 23,614 ms |
| Fixed action outcomes | read: 1 success; edit: 1 success; verify: 1 success; other: 1 success, 1 failure |
| Incomplete/cancelled harness actions | 0 / 0 |

All six proxy exchanges were recorded as `client_disconnect` after a terminal
SSE event. This is the already-observed client connection lifecycle pattern;
it did not produce an incomplete SSE observation, an unfinished harness
action, or a failed verifier.

## Interpretation and limits

This run satisfies the C2 baseline capability gate: Pi ran in the intended
fixture, performed the task, and completed the independent verifier through
the validated Inlay transport route. It does not establish token savings,
cost savings, latency improvement, tool-loop generality, or any optimization
mechanism. Request bytes are transport measurements, not token counts; cached
token reporting is not a cost-saving result.

## Privacy boundary

Only fixed action categories/outcomes, aggregate transport/lifecycle fields,
numeric usage, and aggregate timing are retained here. No prompt, source,
file path, command, argument, tool output, identifier, credential, or provider
payload is included.
