# Pi C2 Transport-Compatibility Check

## Purpose

This record documents the attempted Phase 2 of the release-candidate sequence. It is **invalid as a C2 task result** because the process runner changed Pi's working directory from the detached fixture to the package directory.

It is a capability result, not an optimization result.

## Frozen setup

- Pi 0.86.0 with the existing `openai-codex` OAuth flow.
- Inlay loopback proxy with structural observation enabled.
- Exact incoming provider route: `POST /v1/codex/responses`.
- A fresh detached fixture was verified at its immutable intentionally failing baseline before launch.
- No request transformation, tool substitution, payload retention, or fallback behavior.

## Sanitized outcome

| Check | Result |
| --- | --- |
| Detached-fixture baseline verifier failed before launch | pass |
| Pi working directory remained the detached fixture | **fail** |
| Provider Responses exchanges reached Inlay | 9 (not a valid fixture trajectory) |
| Provider Responses HTTP status | all 200 |
| Terminal SSE event observed | all 9 |
| Incomplete response observation | none observed |
| Fixture allowed-scope mutation | unavailable: task ran in the wrong directory |
| Fixture final verifier | unavailable: no valid task run occurred |
| Fixture task complete | unavailable |

No raw prompts, source, paths, tool names, commands, arguments, tool output, provider payloads, credentials, or identifiers were retained.

## Interpretation

The exact Pi-to-Inlay HTTP compatibility route worked for repeated provider Responses exchanges. The C2 capability gate was not evaluated because the task was not launched in its frozen fixture directory. Two accidental untracked files created outside the fixture were removed immediately after verification; the fixture itself remained unchanged.

This does not establish a Pi or Inlay task-capability failure. It establishes a
runner-topology defect. It is a historical negative result: the runner was
subsequently corrected, its topology was preflight-verified, and a separate Pi
C2 baseline completed successfully. See [the valid Pi C2 baseline](pi-c2-valid-baseline.md).

## Next decision

The corrective decision was to make the runner resolve Pi from the package while
explicitly setting the child process working directory to the detached fixture.
The later successful baseline retained the rule that HTTP success alone is not
task success: verifier and allowed-scope checks remain required.
