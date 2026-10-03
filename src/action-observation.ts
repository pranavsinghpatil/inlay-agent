import { appendFile, mkdir, stat, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { join, resolve } from "node:path";

export const MAX_ACTION_OBSERVATION_BYTES = 64 * 1024;

export type ActionCategory = "read" | "edit" | "verify" | "compound_edit_verify" | "other";
export type ApprovedVerifierClass = "node_verify";
export type ActionOutcome = "success" | "failure" | "cancelled";
export type CompoundStageOutcome =
  | "rejected"
  | "edit_failed"
  | "cancelled_no_edit"
  | "cancelled_after_edit"
  | "verify_failed"
  | "verify_cancelled"
  | "success";
export type CompoundRejectionReason =
  | "invalid_shape"
  | "invalid_target"
  | "invalid_verifier"
  | "input_too_large"
  | "empty_expected_text"
  | "target_resolution_failed"
  | "expected_text_not_found"
  | "expected_text_not_unique"
  | "cancelled";

export type ActionObservationSpool = "action-fusion-feasibility" | "content-free-timeline";

export interface ActionObservationOptions {
  spool?: ActionObservationSpool;
  /** Enabled only by the local, content-free timeline experiment. */
  includeProcessTimestamps?: boolean;
}

interface PendingAction {
  ordinal: number;
  category: ActionCategory;
  startedAt: number;
  processStartedAtMs?: number;
  immediatelyFollowsEdit: boolean;
  verifierClass?: ApprovedVerifierClass;
}

export interface CompletedAction {
  ordinal: number;
  category: ActionCategory;
  outcome: ActionOutcome;
  durationMs: number;
  processStartedAtMs?: number;
  processEndedAtMs?: number;
  immediatelyFollowsEdit: boolean;
  verifierClass?: ApprovedVerifierClass;
  compoundStageOutcome?: CompoundStageOutcome;
  compoundRejectionReason?: CompoundRejectionReason;
}

const captureQueues = new Map<string, Promise<void>>();

function captureFile(projectDirectory: string, spool: ActionObservationSpool): { root: string; file: string } {
  const root = resolve(projectDirectory, ".inlay", spool);
  const file = join(root, "events.jsonl");
  if (!file.startsWith(`${root}\\`) && !file.startsWith(`${root}/`)) {
    throw new Error("Action observation path escaped its local spool.");
  }
  return { root, file };
}

function serializeCapture<T>(file: string, operation: () => Promise<T>): Promise<T> {
  const previous = captureQueues.get(file) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(operation);
  const queued = next.then(() => undefined, () => undefined);
  captureQueues.set(file, queued);
  void queued.finally(() => {
    if (captureQueues.get(file) === queued) captureQueues.delete(file);
  });
  return next;
}

/** Starts a fresh, local-only spool for an explicitly enabled action-observation session. */
export async function resetActionObservation(projectDirectory: string, spool: ActionObservationSpool = "action-fusion-feasibility"): Promise<void> {
  const { root, file } = captureFile(projectDirectory, spool);
  await serializeCapture(file, async () => {
    await mkdir(root, { recursive: true });
    await writeFile(file, "", { encoding: "utf8", mode: 0o600 });
  });
}

/**
 * Generic, content-free action recorder. Harness adapters keep their private tool
 * names, correlation IDs, and arguments at the edge; this core only receives
 * fixed categories and an opaque process-local correlation key.
 */
export class ActionObservationRecorder {
  #projectDirectory: string;
  #spool: ActionObservationSpool;
  #includeProcessTimestamps: boolean;
  #pending = new Map<string, PendingAction>();
  #nextOrdinal = 0;
  #completedCount = 0;
  #cancelledCount = 0;
  #previousStartedCategory: ActionCategory | undefined;

  constructor(projectDirectory: string, options: ActionObservationOptions = {}) {
    this.#projectDirectory = projectDirectory;
    this.#spool = options.spool ?? "action-fusion-feasibility";
    this.#includeProcessTimestamps = options.includeProcessTimestamps ?? false;
  }

  start(correlationId: string, category: ActionCategory, verifierClass?: ApprovedVerifierClass): void {
    const ordinal = ++this.#nextOrdinal;
    this.#pending.set(correlationId, {
      ordinal,
      category,
      startedAt: performance.now(),
      ...(this.#includeProcessTimestamps ? { processStartedAtMs: Date.now() } : {}),
      immediatelyFollowsEdit: category === "verify" && this.#previousStartedCategory === "edit",
      verifierClass,
    });
    this.#previousStartedCategory = category;
  }

  async complete(
    correlationId: string,
    outcome: boolean | ActionOutcome,
    compoundStageOutcome?: CompoundStageOutcome,
    compoundRejectionReason?: CompoundRejectionReason,
  ): Promise<"recorded" | "truncated" | "ignored"> {
    const pending = this.#pending.get(correlationId);
    if (!pending) return "ignored";
    this.#pending.delete(correlationId);
    this.#completedCount += 1;
    const normalizedOutcome: ActionOutcome = typeof outcome === "boolean" ? (outcome ? "success" : "failure") : outcome;
    if (normalizedOutcome === "cancelled") this.#cancelledCount += 1;
    const action: CompletedAction = {
      ordinal: pending.ordinal,
      category: pending.category,
      outcome: normalizedOutcome,
      durationMs: Math.max(0, Math.round(performance.now() - pending.startedAt)),
      ...(pending.processStartedAtMs !== undefined ? {
        processStartedAtMs: pending.processStartedAtMs,
        processEndedAtMs: Date.now(),
      } : {}),
      immediatelyFollowsEdit: pending.immediatelyFollowsEdit,
      ...(pending.verifierClass ? { verifierClass: pending.verifierClass } : {}),
      ...(compoundStageOutcome ? { compoundStageOutcome } : {}),
      ...(compoundRejectionReason ? { compoundRejectionReason } : {}),
    };
    return this.#append({ event: "action_completed", action });
  }

  async finish(): Promise<"recorded" | "truncated"> {
    return this.#append({
      event: "session_summary",
      completedActionCount: this.#completedCount,
      incompleteActionCount: this.#pending.size,
      cancelledActionCount: this.#cancelledCount,
    });
  }

  async #append(record: object): Promise<"recorded" | "truncated"> {
    const { root, file } = captureFile(this.#projectDirectory, this.#spool);
    const serialized = JSON.stringify(record) + "\n";
    const recordBytes = Buffer.byteLength(serialized, "utf8");
    return serializeCapture(file, async () => {
      await mkdir(root, { recursive: true });
      const existingBytes = await stat(file).then((entry) => entry.size).catch((error: unknown) => {
        if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return 0;
        throw error;
      });
      if (existingBytes + recordBytes > MAX_ACTION_OBSERVATION_BYTES) return "truncated";
      await appendFile(file, serialized, { encoding: "utf8", mode: 0o600 });
      return "recorded";
    });
  }
}
