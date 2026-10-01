import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  ActionObservationRecorder,
  type ActionCategory,
  type ApprovedVerifierClass,
  resetActionObservation,
} from "../src/action-observation.ts";

interface ClassifiedAction {
  category: ActionCategory;
  verifierClass?: ApprovedVerifierClass;
}

function commandFrom(input: unknown): string | undefined {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return undefined;
  const command = (input as Record<string, unknown>).command;
  return typeof command === "string" ? command : undefined;
}

/**
 * Maps Pi-specific inputs to a closed category without retaining the Pi tool
 * name, command, path, arguments, or output. The verifier allowlist has no
 * shell chaining, arguments, or dynamic path component.
 */
export function classifyPiAction(toolName: string, input: unknown): ClassifiedAction {
  if (toolName === "read" || toolName === "grep" || toolName === "find" || toolName === "ls") {
    return { category: "read" };
  }
  if (toolName === "edit" || toolName === "write") return { category: "edit" };

  const command = commandFrom(input);
  if ((toolName === "bash" || toolName === "powershell") && command && /^\s*node\s+(?:\.?[\\/])?verify\.mjs\s*$/.test(command)) {
    return { category: "verify", verifierClass: "node_verify" };
  }
  return { category: "other" };
}

/**
 * Pi-only harness adapter for Action Fusion feasibility research. It never
 * blocks, mutates, replaces, or executes a tool. All persisted output is fixed,
 * scalar-free action metadata from the generic Inlay recorder.
 */
export default function inlayActionFusionFeasibility(pi: ExtensionAPI): void {
  let recorder: ActionObservationRecorder | undefined;
  let truncationNotified = false;

  const noteTruncation = (ctx: { hasUI: boolean; ui: { notify(message: string, level: "info" | "warning" | "error"): void } }) => {
    if (truncationNotified) return;
    truncationNotified = true;
    if (ctx.hasUI) ctx.ui.notify("Inlay action observation reached its local limit; subsequent metadata is omitted.", "warning");
  };

  pi.on("session_start", async (_event, ctx) => {
    try {
      await resetActionObservation(ctx.cwd);
      recorder = new ActionObservationRecorder(ctx.cwd);
      if (ctx.hasUI) ctx.ui.notify("Inlay action observation is active; no tool behavior is changed.", "info");
    } catch {
      recorder = undefined;
    }
  });

  pi.on("tool_call", (event) => {
    // This hook intentionally returns nothing: Pi executes the original tool unchanged.
    const action = classifyPiAction(event.toolName, event.input);
    recorder?.start(event.toolCallId, action.category, action.verifierClass);
  });

  pi.on("tool_result", (event, ctx) => {
    void recorder?.complete(event.toolCallId, !event.isError).then((outcome) => {
      if (outcome === "truncated") noteTruncation(ctx);
    }).catch(() => undefined);
  });

  pi.on("session_shutdown", (_event, ctx) => {
    void recorder?.finish().then((outcome) => {
      if (outcome === "truncated") noteTruncation(ctx);
    }).catch(() => undefined);
  });
}
