# Frozen delivery plan

Inlay is a local-first middleware layer between an existing coding agent and that agent's existing model backend. It is not a replacement agent, harness platform, or universal protocol layer. The validated profile is ChatGPT-authenticated Codex CLI using HTTP `POST /v1/responses` through the loopback proxy; Pi, Claude Code, Codex WebSockets, `GET /v1/models`, and every transformation remain unvalidated. See [the interaction model](architecture/interaction-model.md) for the boundary between provider transport, harness behavior, and task evaluation.

Non-negotiables: no public binding, no raw audit archive by default, fail open on uncertainty, per-task paired evaluation, and no universal savings claims. Proxy metrics remain in memory; the separately activated Pi diagnostic spool is structural-only, reset for each session, bounded to 256 KiB, and Git-ignored. Bytes are transport measurements, not token counts; provider-reported cache fields are not cost claims; structural growth is not semantic redundancy.

| Mechanism | Status / gate |
| --- | --- |
| ObservationPack | Not implemented; requires an exact artifact-retrieval need in a stable real-agent tool loop. |
| Deterministic transformation | Not implemented; requires a repeatable candidate and paired task preservation. |
| Action Fusion | Not implemented; requires a narrow command policy and unfused control. |
| Evidence-Preserving Reducer | Not implemented; requires comparison against deterministic extraction. |
| Online Context Compact | Not implemented; requires measured provider cache behavior. |

ObservationPack is the next **eligibility hypothesis**, not an implementation commitment. The current Codex profile must first demonstrate recognized, materially repeated tool-result structure in successful runs. A three-run eligibility gate is exploratory only; it does not establish generality, efficiency, or safe removability.

The clamp fixture is a development/regression smoke fixture. The rule-precedence fixture is quarantined until a new immutable one-defect baseline exists. No fixture becomes optimization evidence until its verifier contract and agent reliability are demonstrated repeatedly.

