import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { appendProtocolCapture, resetProtocolCapture, structuralShape } from "../src/protocol-capture.ts";

/**
 * A non-transforming extension used to validate the exact installed Pi/provider
 * lifecycle before Inlay enables ObservationPack or any context reduction.
 */
export default function inlayProtocolSpike(pi: ExtensionAPI): void {
  let truncationNotified = false;

  const record = async (cwd: string, event: "session_start" | "provider_request" | "provider_response" | "tool_result", details: Record<string, unknown>, ctx?: { hasUI: boolean; ui: { notify(message: string, level: "info" | "warning" | "error"): void } }) => {
    try {
      const outcome = await appendProtocolCapture(cwd, { event, details });
      if (outcome === "truncated" && !truncationNotified) {
        truncationNotified = true;
        if (ctx?.hasUI) ctx.ui.notify("Inlay protocol capture reached its 256 KiB limit; subsequent metadata is omitted.", "warning");
      }
    } catch {
      // Capture must never interrupt a coding session.
    }
  };

  pi.on("session_start", async (_event, ctx) => {
    try {
      await resetProtocolCapture(ctx.cwd);
    } catch {
      // Capture must never interrupt a coding session.
    }
    await record(ctx.cwd, "session_start", {}, ctx);
    if (ctx.hasUI) ctx.ui.notify("Inlay protocol capture is active; no transformations are enabled.", "info");
  });

  pi.on("before_provider_request", (event, ctx) => {
    void record(ctx.cwd, "provider_request", { payload: structuralShape(event.payload) }, ctx);
  });

  pi.on("after_provider_response", (event, ctx) => {
    void record(ctx.cwd, "provider_response", {
      statusClass: `${Math.floor(event.status / 100)}xx`,
    }, ctx);
  });

  pi.on("tool_result", (event, ctx) => {
    void record(ctx.cwd, "tool_result", {
      content: event.content.map((part) => ({ type: part.type, bytes: part.type === "text" ? Buffer.byteLength(part.text, "utf8") : undefined })),
      input: structuralShape(event.input),
    }, ctx);
  });
}

