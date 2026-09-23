# Step 2: Tiny Pi extension

Goal: prove that Pi loads a project-local extension and emits one useful lifecycle event.

The extension listens only for `session_start` and writes the current working directory to the terminal. It does not inspect prompts, call a provider, persist data, alter tools, or transform context.

Run it from the repository after configuring a provider for Pi:

```powershell
corepack pnpm exec pi -e ./extensions/session-start-logger.ts "List the files in this project."
```

Expected first observation:

```text
[inlay] Pi session started in D:\sol-harness
```

Stop after confirming that message and completing one simple read-only task. The next step is not started until this extension behavior is observed.
