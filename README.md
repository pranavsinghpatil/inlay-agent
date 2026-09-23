# Inlay Agent

Inlay is a local-first, evidence-driven Pi extension and loopback proxy for investigating coding-agent context overhead without hiding its trade-offs.

It is not a replacement coding agent or a generic LLM wrapper. Its first milestone is deliberately boring: proxy one pinned Pi configuration to one OpenAI-compatible hosted endpoint, preserve streaming, and measure what actually happens. Optimizations follow only when the integration contract and task-level evaluation support them.

## Current status

**Milestone 1 — transparent proxy and Pi protocol capture:** implemented locally. A real Pi/provider task is still required to freeze the supported protocol contract. All mechanisms are disabled by default.

## Run locally

1. Copy the variables from `.env.example` into your local shell. Do not commit API keys.
2. Start the proxy with `node --experimental-strip-types src/server.ts`.
3. Check `http://127.0.0.1:8787/health`.
4. Run Pi with `-e ./extensions/protocol-spike.ts` and follow [the protocol-spike procedure](docs/protocol-spike.md) before enabling a mechanism.

The proxy exposes `POST /v1/chat/completions`, `GET /health`, and `GET /metrics`; it is loopback-only and retains metrics in memory only.

## Roadmap

1. Run Pi on one simple read-only task and observe its behavior.
2. Load the [tiny session-start extension](docs/learning/step-2-tiny-extension.md) and verify one lifecycle event.
3. Validate transparent proxy streaming.
4. Establish baseline evaluation.
5. Add one reversible transformation only after baseline evidence exists.

See [the frozen plan](docs/frozen-plan.md) and [protocol contract](docs/protocol-spike.md). The project is inspired by [SoL-Pi](https://arxiv.org/pdf/2609.20519), but makes no claim of reproducing its mechanisms until each is validated under Inlay's own documented setup.
