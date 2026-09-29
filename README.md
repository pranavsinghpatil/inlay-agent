# Inlay Agent

Inlay is a local-first, evidence-driven middleware layer between an existing coding agent and its existing model backend.

It is not a coding agent, agent runner, generic LLM wrapper, or universal agent protocol. It first proves transparent routing and task preservation; context or tool-output reduction is investigated only after evidence identifies a safe candidate.

## Current status

**Codex HTTP Responses is the only validated transport profile.** An existing ChatGPT-authenticated Codex CLI completed real multi-request coding tasks through Inlay's `POST /v1/responses` route with no payload transformation enabled. Pi is pinned diagnostic code, not a product prerequisite or validated integration.

## Run locally

1. Set `INLAY_UPSTREAM_BASE_URL` to the existing agent backend in your local shell; do not commit credentials.
2. Start the proxy with `node --experimental-strip-types src/server.ts`.
3. Check `http://127.0.0.1:8787/health`.
4. Follow the [Codex baseline record](docs/research/c2-codex-clamp-baseline.md) and [experiment-record template](docs/research/experiment-record-template.md) before enabling any mechanism.

The proxy exposes `POST /v1/chat/completions`, `POST /v1/responses`, `GET /health`, and `GET /metrics`; it is loopback-only and retains metrics in memory only. Codex WebSocket transport and `GET /v1/models` are intentionally unsupported; Codex may probe them before falling back to the supported HTTP route. Request bodies are buffered for forwarding, while upstream SSE response bytes are streamed without semantic rewriting.

## Roadmap

1. Freeze and reproduce the transparent Codex baseline.
2. Establish task-level evaluation criteria and separate development smoke fixtures from evaluation fixtures.
3. Add one reversible transformation only after repeated evidence identifies a deterministic candidate.

## Capability boundaries

| Capability | Status |
| --- | --- |
| Transparent Codex HTTP `/v1/responses` forwarding | Implemented and live-validated |
| SSE pass-through, status/error forwarding, and in-memory metrics | Implemented |
| Bounded structural observation, including zstd request structure | Implemented for Codex Responses only |
| Pi lifecycle protocol spool | Diagnostic-only, explicitly activated, bounded, and Git-ignored |
| ObservationPack, deterministic transformation, Action Fusion, Evidence-Preserving Reducer, Online Context Compact | Not implemented |

See [the frozen plan](docs/frozen-plan.md) and the [Pi diagnostic notes](docs/protocol-spike.md). The project is inspired by [SoL-Pi](https://arxiv.org/pdf/2609.20519), but makes no claim of reproducing its mechanisms until each is validated under Inlay's own documented setup.
