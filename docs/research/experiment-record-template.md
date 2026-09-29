# Inlay experiment record template

## Identity

- Date and local time zone:
- Inlay commit:
- Agent and exact version:
- Existing-auth backend and selected model:
- Transport profile and route:
- Observation mode:

## Task contract

- Fixture repository and immutable baseline SHA:
- Task identifier:
- Verifier command and expected marker:
- Allowed changed-file scope:
- Tool-loop requirement:

## Results

| Arm | Task/verifier outcome | Changed-file scope | Request count | Request/response bytes | Provider usage | First-byte and completion timing | Lifecycle/status/retry notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Direct control | | | unavailable unless independently observed | unavailable unless independently observed | unavailable unless independently observed | unavailable unless independently observed | |
| Observed treatment | | | | | | | |

## Safety and interpretation

- Retained data: only this sanitized record and permitted structural metrics.
- Not retained: prompts, source excerpts, request/response bodies, headers, credentials, payload hashes, tool arguments, tool output, or paths.
- Bytes are not tokens. Cached-token reporting is not a cost-savings claim.
- Payload transformation enabled: no.
- Verdict and limitations:
