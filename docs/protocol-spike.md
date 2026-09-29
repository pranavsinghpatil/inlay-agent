# Pi protocol spike — diagnostic-only

Status: deferred. This extension is not part of the validated Codex profile and is not required to run Inlay.

## Pinned test contract

Pi must first be tested through Pi's own existing-auth provider mechanism; Inlay must not require a separate API key or become a provider replacement. A live Inlay/Pi compatibility result is required before support is claimed.

## Explicit, unvalidated diagnostic procedure

Load this extension explicitly with Pi's `-e` option. It does not create or configure a provider, and it must not require an API key.

1. Run Pi through its own existing-auth flow and load `-e .\extensions\protocol-spike.ts`.
2. Run one small coding task with streaming and at least one tool result.
3. Verify incremental visible output, normal cancellation, final status, and proxy metrics.
4. Capture only sanitized structural fields: fixed categories, bounded counts, and approved numeric byte counts. Do not persist keys, headers, payload values, tool names, credentials, or response bodies.
5. Store the sanitized capture and findings under `docs/research/`; never commit raw prompts, source code, credentials, or provider responses containing sensitive material.

## Diagnostic spool guarantees

When explicitly loaded, `extensions/protocol-spike.ts` resets `.inlay/protocol-spike/events.jsonl` for the session, converts events to fixed scalar-free categories before writing, caps the spool at 256 KiB, and fails open. The spool is Git-ignored and is not an ObservationPack implementation.

## Future exit criteria

- Pi completes a real small task through the proxy with no transformations.
- The proxy observes request bytes and streams the upstream response without buffering the completion.
- The documented payload shape is sufficient to define the first ObservationPack eligibility rule.
- Failure, timeout, disconnect, and missing-usage behavior are documented.

