import { randomUUID } from "node:crypto";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { appendProtocolCapture, structuralShape } from "../src/protocol-capture.ts";

/**
 * A non-transforming extension used to validate the exact installed Pi/provider
 * lifecycle before Inlay enables ObservationPack or any context reduction.
 */
export default function inlayProtocolSpike(pi: ExtensionAPI): void {
  const sessionId = randomUUID();

  const record = (cwd: string, event: "session_start" | "provider_request" | "provider_response" | "tool_result", details: Record<string, unknown>) =>
    appendProtocolCapture(cwd, { timestamp: new Date().toISOString(), sessionId, event, details }).catch(() => {
      // Capture must never interrupt a coding session.
    });

  pi.on("session_start", async (_event, ctx) => {
    await record(ctx.cwd, "session_start", { extension: "inlay-protocol-spike", mode: ctx.mode });
    if (ctx.hasUI) ctx.ui.notify("Inlay protocol capture is active; no transformations are enabled.", "info");
  });

  pi.on("before_provider_headers", (event) => {
    event.headers["x-inlay-session-id"] = sessionId;
  });

  pi.on("before_provider_request", (event, ctx) => {
    void record(ctx.cwd, "provider_request", { payload: structuralShape(event.payload) });
  });

  pi.on("after_provider_response", (event, ctx) => {
    void record(ctx.cwd, "provider_response", {
      status: event.status,
      headerNames: Object.keys(event.headers).sort(),
    });
  });

  pi.on("tool_result", (event, ctx) => {
    void record(ctx.cwd, "tool_result", {
      toolName: event.toolName,
      isError: event.isError,
      content: event.content.map((part) => ({ type: part.type, bytes: part.type === "text" ? Buffer.byteLength(part.text, "utf8") : undefined })),
      input: structuralShape(event.input),
    });
  });
}

