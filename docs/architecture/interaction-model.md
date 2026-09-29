# Inlay interaction model

Inlay is a middleware research prototype. This vocabulary defines evidence boundaries; it is not a TypeScript abstraction or a universal agent protocol.

| Concept | Boundary | Current Codex evidence |
| --- | --- | --- |
| Agent / harness | Harness | Codex owns planning, tool execution, approval, and its session. Inlay does not replace these functions. |
| Session | Harness | Not a proxy-owned object. Inlay observes independent HTTP exchanges only. |
| Model request / provider response | Transport + provider | Inlay forwards buffered `/v1/responses` requests and streams upstream SSE bytes unchanged. |
| Context / input item | Provider | Inlay records only whitelisted structural counts and sizes; item meaning remains provider-specific. |
| Tool invocation / result | Harness + provider | A harness executes tools; later provider input may contain a provider-defined representation of their history. |
| Stream | Transport | SSE bytes, HTTP status, first-byte timing, terminal-event observation, and disconnect are observable. |
| Observation | Inlay core | Explicit opt-in, in-memory, scalar-free metadata derived while forwarding. |
| Transformation | Future core plus adapter | Must be feature-flagged, bounded, reversible, and proven against a task contract. None exists today. |
| Evidence / task outcome | Task | Immutable fixture baseline, verifier, allowed changed files, completion, and sanitized metrics. |
| Cancellation / failure | Multiple | Transport failures are observable; harness, provider, and task failures require separate classification. |

## Architectural boundary

```text
Harness adapter (future, agent-specific)
        ↓
Inlay exchange core (transport forwarding, bounded observation, evidence)
        ↓
Provider transport profile (currently Codex HTTP Responses)
```

Artifact retrieval, command policies, and tool schemas are harness capabilities. A future Inlay core may supply generic artifact representation and bounded storage only after a harness adapter can retrieve exact evidence safely. The Codex transport profile must not invent a retrieval tool to make an experiment possible.

## Evidence rules

- Wire bytes, canonical structural bytes, and provider-reported tokens are separate measurements.
- Cached-token fields do not establish cost savings.
- Structural accumulation does not establish semantic redundancy or removability.
- `responseObservationIncomplete` means the observer could not safely classify every SSE frame; missing usage or a terminal event is not negative evidence.
- A successful task requires the fixture verifier, allowed changed-file scope, agent completion, and any required tool-loop behavior.
