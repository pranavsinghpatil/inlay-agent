# Action Fusion feasibility protocol

## Question

Can a harness adapter expose enough content-free, ordered action metadata for Inlay to identify an **observed** edit-to-verifier pattern? This is not an Action Fusion implementation and does not change any tool execution.

## Boundary

The Pi extension is a first harness adapter only. It maps Pi's transient lifecycle events into the generic Inlay action-observation core:

```text
Pi adapter -> fixed action event -> Inlay research recorder
```

The core does not import Pi and receives neither Pi tool names nor arguments. A future adapter for another harness would map its own lifecycle events into the same fixed categories.

## Fixed categories and privacy boundary

| Pi event, processed transiently | Stored category |
| --- | --- |
| built-in read/search/list tools | `read` |
| built-in edit/write tools | `edit` |
| exact allowlisted `node verify.mjs` shell command | `verify`, `node_verify` |
| every other tool or command | `other` |

The adapter retains no tool name, command text, path, tool input, tool output, prompt, source, provider payload, credential, call ID, or hash. Call IDs are used only as process-local correlation keys so a result can complete its action record.

The local spool is Git-ignored, permissioned for the current user, capped at 64 KiB, reset for every explicitly loaded session, and fail-open. It contains only action ordinal, fixed category, success/failure, rounded duration, edit adjacency, a fixed verifier class when applicable, and a count of unfinished actions.

## Interpretation boundary

`verify` immediately following `edit` means only that the adapter observed an adjacent, allowlisted action sequence. It does not mean the actions are safe to fuse, causally dependent, efficient, repeatable, or an optimization. Pi can preflight sibling tool calls sequentially while executing them concurrently, so ordinal adjacency is not proof of execution causality.

## Eligibility outcome

The study is interesting only if a real existing-auth Pi session completes a deterministic task, produces an ordered lifecycle, and includes a successful edit immediately followed by an allowlisted verifier. A passing result merely justifies a separate design decision for a future, constrained compound-action experiment; it does not authorize fusion.
