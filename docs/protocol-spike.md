# Pi protocol spike — diagnostic-only

Status: deferred. This extension is not part of the validated Codex profile and is not required to run Inlay.

## Pinned test contract

Pi must first be tested through Pi's own existing-auth provider mechanism; Inlay must not require a separate API key or become a provider replacement. A live Inlay/Pi compatibility result is required before support is claimed.

## Legacy, unvalidated procedure

The custom hosted-provider flow below is retained only as an implementation reference. It is not the product route and is not a recommendation to obtain an API key.

1. Copy `.env.example` to a local `.env` equivalent without committing credentials, then start Inlay.
2. Configure one Pi custom provider to use `http://127.0.0.1:8787/v1` as its OpenAI-compatible base URL.
3. Run one small coding task with streaming and at least one tool result.
4. Verify incremental visible output, normal cancellation, final status, and proxy metrics.
5. Capture only sanitized structural fields: request/response and tool-result shape. Do not persist raw headers, payload values, tool names, credentials, or response bodies.
6. Store the sanitized capture and findings under `docs/research/`; never commit raw prompts, source code, credentials, or provider responses containing sensitive material.

## Diagnostic spool guarantees

When explicitly loaded, `extensions/protocol-spike.ts` resets `.inlay/protocol-spike/events.jsonl` for the session, converts values to structural types before writing, caps the spool at 256 KiB, and fails open. The spool is Git-ignored and is not an ObservationPack implementation.

## Future exit criteria

- Pi completes a real small task through the proxy with no transformations.
- The proxy observes request bytes and streams the upstream response without buffering the completion.
- The documented payload shape is sufficient to define the first ObservationPack eligibility rule.
- Failure, timeout, disconnect, and missing-usage behavior are documented.

