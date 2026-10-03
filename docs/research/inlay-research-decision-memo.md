# Inlay Research Decision Memo

## 1. Current research question

Inlay has established transparent Codex HTTP Responses observation and a narrow Pi action-lifecycle adapter, but the completed studies did not establish a safe optimization target. The current question is therefore:

> Which privacy-safe measurement can show where a real coding-agent run spends requests, time, and structured state well enough to state and test a preservation contract for a future mechanism?

This is intentionally a measurement question, not a request to select or implement one of the four originally considered mechanisms.

## 2. Evidence ledger

| Claim | Status | Consolidated evidence and boundary |
| --- | --- | --- |
| Codex HTTP Responses can be transparently routed through Inlay | **ESTABLISHED** | Real ChatGPT-authenticated Codex C2 tasks completed through local Inlay with HTTP/SSE forwarding and task verification. This is a validated Codex HTTP profile, not universal agent support. |
| Context/input growth occurs in the C2 trajectory | **ESTABLISHED** | Multiple observed C2 runs grew in input-item count, canonical structural bytes, and compressed request bytes across requests. Structural growth is not token or cost growth. |
| Exact canonical item recurrence occurs | **ESTABLISHED** | Process-local keyed comparison found recurring canonical items across successive C2 requests. The key/digests and scalar content were not retained. |
| Exact recurrence establishes semantic identity | **UNKNOWN** | Canonical equality is not semantic equality, task meaning, or necessity. |
| Recurring context is redundant | **UNKNOWN** | Messages, reasoning state, and opaque items may be required state. No causal or decision-relevance evidence exists. |
| Recognized tool-output recurrence exists in the Codex C2 trajectory | **REJECTED FOR CURRENT TRAJECTORY** | No recognized function/computer tool-output item type appeared in the completed C2 observations. Opaque `other` was not reclassified as tool output. |
| A recurring item is safely removable, replaceable, or retrievable | **UNKNOWN** | Reducer and ObservationPack eligibility criteria were not met; no preservation boundary or comparison contract exists. |
| A privacy-safe structural supersession/replacement signal exists | **REJECTED FOR CURRENT TRAJECTORY** | No protocol-state replacement/update marker, bounded snapshot, or replacement pattern was observed. Growth alone is insufficient. |
| Ordered action adjacency can be observed at one harness edge | **ESTABLISHED** | The Pi diagnostic adapter observed a successful edit immediately followed by the fixed verifier class in one real task. This is Pi-adapter evidence only. |
| The current compound-action treatment preserves capability | **REJECTED FOR CURRENT PILOT CONFIGURATION** | Pilot 1 is invalidated by an interface-contract defect. Revised Pilot 2 invoked the tool but rejected before edit with a fixed validation class, so the pilot stopped at its capability gate. |
| Action Fusion is generally infeasible | **NOT ESTABLISHED** | Pilot 2 rejects this closed interface/task configuration only; it does not make a cross-task or cross-harness claim. |
| Any efficiency improvement exists | **NOT ESTABLISHED** | No passing fusion control/treatment pair was available; provider request count and usage were unavailable in the Pi action study. |
| Token, cost, or cache savings follow from structural-byte reduction | **NOT ESTABLISHED** | Request bytes and canonical JSON bytes are not provider tokens or billing. Cached-token reporting was conditional and does not establish rewrite behavior. |

## 3. What Inlay can currently observe

| Boundary | Current content-free observation |
| --- | --- |
| Provider transport | Validated Codex `POST /v1/responses` routing; request byte count/encoding; HTTP status; upstream-header and first-response-byte timing when available; SSE terminal/completion/incomplete/cancellation classification; numeric provider usage only when emitted. |
| Request/response structure | Whitelisted top-level field names/counts and canonical byte totals; input-item counts; approved item-category counts and canonical byte totals; bounded zstd structural decoding without changing forwarding. |
| Item categories | `message`, `reasoning`, recognized call/output families when present, protocol-state families when present, and opaque `other`. Unknown raw type strings are not retained. |
| Recurrence | Process-local exact canonical recurrence as bounded category/size/span aggregates. It exposes no raw item, stable digest, or cross-process identity. |
| Harness-side action lifecycle | In the explicitly loaded Pi diagnostic adapter only: fixed action category, order, success/failure, rounded duration, adjacency, and fixed verifier class. |
| Fixed action categories | Read, edit, verify, other, plus fixed compound stage/rejection codes in the experimental Pi treatment. No tool names, command strings, arguments, paths, or output are retained. |
| Task/verifier outcomes | Experiment-runner evidence can establish verifier exit/scope success and final completion. The Codex transport proxy cannot itself map an individual provider request to a task stage. |

## 4. What Inlay currently cannot observe

- Model reasoning cost or internal model work.
- Actual token economics when the provider does not emit numeric usage, and billing/cost even when it does.
- Semantic message, reasoning, tool-output, or opaque-item content; this is an intentional privacy boundary.
- The meaning of `other`, including whether it is tool output, required protocol state, or task information.
- Causal dependency between any input item and a later decision, action, verifier result, or task outcome.
- Decision relevance, semantic redundancy, necessity, removability, or a safe preservation boundary.
- Provider cache semantics under a changed request shape; emitted cached-token counts do not answer this.
- Provider-only latency attribution: current timings include local networking/proxy effects and do not isolate backend work.
- Model-side decision boundaries, reasoning steps, or why an action was chosen.
- Reliable cross-request mapping to `before_edit`, `after_edit`, or `after_verify` for Codex transport observations.
- A general action lifecycle across agents; only the Pi diagnostic adapter has been measured.

## 5. Unmeasured efficiency dimensions

| Dimension | Why it matters | Currently measurable? | Privacy-safe measurement possible? | Required instrumentation |
| --- | --- | --- | --- | --- |
| Model/provider usage | Bounds reported input/output activity when available | Conditional for proxied Codex; unavailable in Pi action runs | Yes, numeric fields only | Run-scoped capture of emitted numeric usage plus explicit `unavailable` state |
| Provider request count | Indicates sampling turns, not quality or cost by itself | Yes for proxied Codex; not in direct/Pi action records | Yes | Run-level experiment record and, where needed, harness/proxy correlation |
| End-to-end latency | Shows user-visible task duration | Inconsistent; not captured as a stable metric in every arm | Yes | Monotonic runner start/end timestamps and a fixed completion marker |
| Provider latency | Separates response wait from agent/tool work | Partial: proxy can time upstream headers/first body byte, not backend-only time | Yes | Standardize per-request proxy timing and record timing availability |
| Tool execution latency | Identifies whether local action execution dominates | Pi-only fixed duration data; not Codex transport | Yes | Harness adapter action spans with fixed categories only |
| Agent action count | Measures interaction count, not efficiency alone | Pi-only | Yes | Harness adapter summary of fixed categories/order |
| Retries/fallbacks | Can add latency and requests without useful work | Partial in Codex transport logs; not a stable experiment field | Yes | Fixed retry/fallback counters at the adapter/proxy boundary |
| Failed actions | Distinguishes productive from failed tool loops | Pi-only | Yes | Fixed action outcome counters |
| Cancellation | Distinguishes normal terminal disconnects from incomplete work | Proxy lifecycle is partial; controlled Pi cancellation was not reached | Yes | Fixed cancellation stage/outcome recording in a completed test cell |
| Context bytes | Quantifies local structural accumulation | Yes for observed Codex | Yes | Existing structural observer |
| Compressed transport bytes | Quantifies wire payload only | Yes for observed Codex | Yes | Existing request-byte metric |
| Cache usage | Can reveal provider-reported cache activity, not savings | Conditional for Codex; unavailable in some runs | Yes, numeric fields only | Repeated run records with explicit availability; no cache-behavior inference |
| Repeated decision loops | Would show whether repeated sampling/action cycles occur | No reliable cross-boundary measure | Yes, at category/ordinal level | Privacy-safe harness action spans correlated with proxy request ordinals |

## 6. Instrumentation gaps

The smallest changes that would unlock new questions without expanding the privacy boundary are:

1. **Run-scoped experiment timeline.** An external local runner can emit only a run ordinal, monotonic start/end times, fixed task milestones, verifier outcome, and allowed-scope outcome. It would not write task content, paths, commands, or provider data.
2. **Harness-to-proxy timing correlation.** A harness adapter and the locally scoped proxy can publish independent, process-local ordinal/timestamp streams for the same experiment run. This would correlate categories and timing windows without attaching identifiers or modifying provider requests.
3. **Normalized timing availability.** Record whether each request has upstream-header, first-body-byte, terminal-event, completion, cancellation, retry, and provider-usage fields, rather than treating missing fields as zero.
4. **Fixed action-span outcome record.** Extend only a harness adapter that already supports it to capture fixed action start/end/outcome classes, including retry and cancellation class, without tool names or content.
5. **Fixed task-stage markers.** In a predeclared fixture experiment, record content-free lifecycle markers such as baseline-verified, allowed-scope-mutated, verifier-passed, and task-complete. These are experiment facts, not inferred model decisions.

None of these changes optimize context or alter requests. They make efficiency and preservation hypotheses falsifiable.

## 7. Information-gain analysis

| Measurement | Uncertainty resolved | Positive result would mean | Negative result would mean |
| --- | --- | --- | --- |
| Run-scoped task timeline | Whether observed request growth occurs before or after externally verified task milestones | Structural growth can be placed relative to fixed task stages, without assigning semantic causality | The current runner cannot produce stable experiment staging; no stage-based claim is justified |
| Harness-to-proxy timing correlation | Whether provider requests, tool actions, and waits form repeated decision/action cycles | A future study can measure category-level loop shape and where elapsed time is spent | The selected harness boundary is insufficient for cross-layer research; keep claims transport-only |
| Standardized provider timing/usage availability | Whether numeric usage and response timing are reliable enough to include in a study | A future experiment can distinguish available reported usage/timing from unavailable values | Token/cache/latency hypotheses cannot be evaluated on that provider profile |
| Fixed action spans including failures/retries/cancellation | Whether agent time is spent on successful work, retry, failure, or cancellation | Action-loop overhead becomes measurable without inspecting commands or output | A content-free action taxonomy is too coarse for that harness/task |
| Fixed task-stage markers | Whether accumulated structure persists after objective task completion milestones | A future preservation hypothesis can use externally verified phase boundaries | Structural persistence cannot be connected even to task phase; no lifecycle-based mechanism claim |

These measurements are alternatives, not a ranking of mechanisms. Their value is that each can change a currently material unknown about where the run spends interaction, transport, and action time.

## 8. Research pivot

**No optimization mechanism is currently evidence-eligible.**

The Codex studies show measurable structural growth and exact recurrence, but no semantic redundancy, recognized recurring tool observation, supersession signal, or preservation contract. The Pi feasibility study shows one action adjacency, while the closed compound-action pilot did not preserve capability. The appropriate pivot is measurement integrity across transport, harness actions, and task milestones—not more transformation prototypes.

## 9. Candidate next measurement experiments

| Experiment | Question | Minimal instrumentation | Expected evidence | Positive result establishes | Negative result establishes | Privacy risk | Implementation complexity |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Content-free cross-boundary timeline | Do proxied provider requests cluster around fixed action and verifier phases, and where is elapsed time spent? | Local run ordinal/timestamps; existing proxy request timings; Pi fixed action spans; fixed task markers | Ordered timestamp/category spans only | A measurable category-level interaction timeline for one harness/profile | The selected adapter cannot safely correlate action and provider phases | Low: no content or reusable IDs | Medium |
| Codex provider-metric coverage study | Across repeated normal C2 runs, how often are usage, cache, header-time, first-byte, terminal, retry, and cancellation fields available and stable? | Existing observer plus a sanitized run template; no new request fields | Availability/variance of numeric and lifecycle fields | Which provider metrics are fit for later study design | Provider usage/cache/latency claims are not supportable on this profile | Low | Low |
| Fixed task-stage calibration | Can externally verified milestones be aligned with request-structure growth without reading model or tool content? | Local runner emits baseline-verified, allowed-scope-mutated, verifier-passed, task-complete; existing ordinal ledger | Stage-to-request windows and task outcome only | A nonsemantic lifecycle reference for future eligibility studies | Transport-only observation remains unable to support phase-related claims | Low | Medium |

## 10. Decision gate

Inlay may implement its next optimization mechanism only when all of the following are demonstrated for a named harness/provider/task profile:

1. A repeated, successful baseline task contract with a deterministic verifier and allowed-change scope.
2. A mechanism-specific candidate observed through an approved privacy-safe signal—not inferred from byte growth, type, age, or recurrence alone.
3. A clear preservation contract that states what remains available/unchanged and how failure/cancellation is handled.
4. A content-free, measurable primary outcome and explicit availability rules for usage, timing, actions, retries, or bytes.
5. A control/treatment design in which capability preservation is evaluated before efficiency.
6. An experiment-specific stop condition that rejects the mechanism if the candidate signal, preservation contract, or capability gate fails.

## 11. Threats to validity

- The evidence comes from one or a few small deterministic tasks, not a representative coding-task suite.
- Codex and Pi are distinct single-profile integrations; neither establishes general harness or provider behavior.
- Codex context evidence is structural rather than semantic by design.
- Provider numeric usage/cache fields are conditional and absent in some completed runs.
- Model choices, tool paths, timing, and failures are nondeterministic across runs.
- Samples are too small for generality or statistical claims.
- The privacy boundary intentionally withholds content, semantic role detail, identifiers, and causal dependencies that could otherwise increase observability.
- Pilot 1 was invalidated by an interface-contract defect; Pilot 2 stopped at its first capability failure. Neither supplies an efficiency comparison.

## 12. Owner decision

Before implementation resumes, Pranav should decide:

1. Which one of the three measurement-only experiments to authorize first, if any.
2. Whether the project may add only process-local run/timing ordinals and fixed lifecycle markers as the next privacy-safe instrumentation boundary.
3. Which metrics are required for a future optimization decision, especially whether provider-emitted usage/timing availability is sufficient for the chosen profile.
4. Whether to pursue a second validated harness adapter only after the selected measurement establishes a useful cross-boundary question.
5. Whether, if these content-free measurements remain inconclusive, to formally review a different privacy model rather than silently broadening data retention.

Until those decisions are made, Inlay should remain a transparent measurement and research tool, not a transformation system.
