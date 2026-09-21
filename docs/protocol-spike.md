# Protocol spike: Pi to Inlay

Status: required before enabling any mechanism.

## Pinned test contract

Record the exact Pi version, Pi provider configuration, hosted provider/model, and date in the experiment record. This project supports only the resulting contract; it does not infer compatibility from an "OpenAI-compatible" label.

## Procedure

1. Copy `.env.example` to a local `.env` equivalent without committing credentials, then start Inlay.
2. Configure one Pi custom provider to use `http://127.0.0.1:8787/v1` as its OpenAI-compatible base URL.
3. Run one small coding task with streaming and at least one tool result.
4. Verify incremental visible output, normal cancellation, final status, and proxy metrics.
5. Capture only sanitized structural fields: route, headers excluding authorization, message roles, tool-call/result shape, SSE event boundaries, usage fields, and cache fields.
6. Store the sanitized capture and findings under `docs/research/`; never commit raw prompts, source code, credentials, or provider responses containing sensitive material.

## Exit criteria

- Pi completes a real small task through the proxy with no transformations.
- The proxy observes request bytes and streams the upstream response without buffering the completion.
- The documented payload shape is sufficient to define the first ObservationPack eligibility rule.
- Failure, timeout, disconnect, and missing-usage behavior are documented.

