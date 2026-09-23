import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

/** Step 2: verify that a project-local Pi extension loads and receives one event. */
export default function sessionStartLogger(pi: ExtensionAPI): void {
  pi.on("session_start", (_event, ctx) => {
    console.log(`[inlay] Pi session started in ${ctx.cwd}`);
  });
}
