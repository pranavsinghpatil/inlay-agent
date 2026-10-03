# Frozen delivery plan

Inlay is a local-first middleware layer between an existing coding agent and that agent's existing model backend. It is not a replacement agent, harness platform, or universal protocol layer. Validated evidence covers ChatGPT-authenticated Codex CLI using HTTP `POST /v1/responses` through the loopback proxy and one Pi 0.86.0 C2 capability baseline using its existing `openai-codex` OAuth flow through the narrow `POST /v1/codex/responses` alias. Neither result establishes general harness support. Claude Code, Codex WebSockets, `GET /v1/models`, and every transformation remain unsupported or unvalidated. See [the interaction model](architecture/interaction-model.md) for the boundary between provider transport, harness behavior, and task evaluation.

Non-negotiables: no public binding, no raw audit archive by default, fail open on uncertainty, per-task paired evaluation, and no universal savings claims. Proxy metrics remain in memory; the separately activated Pi diagnostic spool is structural-only, reset for each session, bounded to 256 KiB, and Git-ignored. Bytes are transport measurements, not token counts; provider-reported cache fields are not cost claims; structural growth is not semantic redundancy.

| Mechanism | Status / gate |
| --- | --- |
| ObservationPack | Not evidence-eligible for the observed Codex trajectory; no artifact store or retrieval exists. |
| Deterministic transformation | Not implemented; requires a repeatable candidate and paired task preservation. |
| Action Fusion v1 | Experimental Pi treatment retired as a release capability after its capability gate failed. |
| Evidence-Preserving Reducer | Not evidence-eligible for the observed Codex trajectory. |
| Online Context Compact | Not evidence-eligible for the observed Codex trajectory. |

The ObservationPack eligibility study did not identify recognized, materially repeated tool-result structure in successful Codex runs. A three-run eligibility screen is exploratory only; it would not establish generality, efficiency, or safe removability even if it passed.

The eligibility observer reports a canonical JSON byte total for each approved Responses input-item category. It recursively sorts object keys, preserves array order, serializes transiently with `JSON.stringify`, and counts UTF-8 bytes. This is intentionally distinct from received wire bytes (often zstd-compressed) and provider-reported tokens.

The clamp fixture is a development/regression smoke fixture. The rule-precedence fixture is quarantined until a new immutable one-defect baseline exists. No fixture becomes optimization evidence until its verifier contract and agent reliability are demonstrated repeatedly.

The content-free Pi cross-boundary timeline measurement gate did not pass: its latest run exited before any supported provider request or harness action. The immediate cause is unknown because the measurement privacy boundary retains no raw diagnostic content. The historical pre-alias Pi block was a `POST /v1/codex/responses` route-shape mismatch, not a `GET /v1/models` failure; the exact alias later passed transport compatibility validation.

