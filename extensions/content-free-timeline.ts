import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import {
  ActionObservationRecorder,
  resetActionObservation,
  type ActionCategory,
  type ApprovedVerifierClass,
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

function classifyPiTimelineAction(toolName: string, input: unknown): ClassifiedAction {
  if (toolName === "read" || toolName === "grep" || toolName === "find" || toolName === "ls") return { category: "read" };
  if (toolName === "edit" || toolName === "write") return { category: "edit" };
  const command = commandFrom(input);
  if ((toolName === "bash" || toolName === "powershell") && command && /^\s*node\s+(?:\.?[\\/])?verify\.mjs\s*$/.test(command)) {
    return { category: "verify", verifierClass: "node_verify" };
  }
  return { category: "other" };
}

function localProxyBaseUrl(value: string | undefined): string {
  if (!value) throw new Error("INLAY_TIMELINE_PROXY_BASE_URL must be set for the content-free timeline experiment.");
  const url = new URL(value);
  if (
    url.protocol !== "http:"
    || !["127.0.0.1", "localhost", "::1"].includes(url.hostname)
    || url.pathname.replace(/\/$/, "") !== "/v1"
    || url.search
    || url.hash
    || url.username
    || url.password
  ) {
    throw new Error("INLAY_TIMELINE_PROXY_BASE_URL must be a loopback http://.../v1 URL without credentials, query, or fragment.");
  }
  return url.href.replace(/\/$/, "");
}

/**
 * Pi-only, explicitly loaded measurement adapter. It applies an in-process
 * base-URL override to the built-in OAuth provider and records only fixed,
 * local action timing metadata. It does not alter provider payloads or tools.
 */
export default function contentFreeTimeline(pi: ExtensionAPI): void {
  pi.registerProvider("openai-codex", { baseUrl: localProxyBaseUrl(process.env.INLAY_TIMELINE_PROXY_BASE_URL) });

  let recorder: ActionObservationRecorder | undefined;

  pi.on("session_start", async (_event, ctx) => {
    try {
      await resetActionObservation(ctx.cwd, "content-free-timeline");
      recorder = new ActionObservationRecorder(ctx.cwd, {
        spool: "content-free-timeline",
        includeProcessTimestamps: true,
      });
      if (ctx.hasUI) ctx.ui.notify("Inlay content-free timeline observation is active; no tool behavior is changed.", "info");
    } catch {
      recorder = undefined;
    }
  });

  pi.on("tool_call", (event) => {
    const action = classifyPiTimelineAction(event.toolName, event.input);
    recorder?.start(event.toolCallId, action.category, action.verifierClass);
  });

  pi.on("tool_result", (event) => {
    void recorder?.complete(event.toolCallId, !event.isError).catch(() => undefined);
  });

  pi.on("session_shutdown", () => {
    void recorder?.finish().catch(() => undefined);
  });
}
