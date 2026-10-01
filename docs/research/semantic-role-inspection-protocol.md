# Local semantic-role inspection protocol

## Question

The exact-item recurrence probe can establish that a canonical input item repeated, but it intentionally does not retain the item's protocol role. This local-only probe asks a narrower question: what **fixed protocol-role category** does a recurring item occupy? It does not determine an item's meaning, necessity, redundancy, or removability.

## Protocol uncertainty

The OpenAI Responses input is a broad union, not just user and assistant messages. Official references describe message, reasoning, function-call/output, computer-call/output, file-search, web-search, program, compaction, configuration, and other built-in item variants. A local classifier that does not expose raw type strings must therefore treat `other` as genuinely ambiguous. It is not evidence of a tool result.

- [Responses create reference](https://developers.openai.com/api/reference/cli/resources/responses/methods/create)
- [Responses input-items reference](https://developers.openai.com/api/reference/java/resources/responses/subresources/input_items/methods/list)
- [Reasoning guide](https://developers.openai.com/api/docs/guides/reasoning)

## Explicit local-only mode

Enable this probe only with all three settings:

```text
INLAY_OBSERVATION=structural
INLAY_RECURRENCE_PROBE=exact-item
INLAY_SEMANTIC_INSPECTION=role-categories
```

For each transiently decoded item, Inlay reads only its protocol `type` and, for a message, its `role`. It maps those values immediately into this closed taxonomy:

| Category | Interpretation boundary |
| --- | --- |
| `protocol_state` | Known compaction/configuration/reference state; not proof it is removable |
| `message_user`, `message_assistant`, `message_system_or_developer`, `message_other_role` | Message protocol role only; no message content is retained |
| `reasoning_state` | Responses reasoning item; not chain-of-thought and not evidence of redundancy |
| `known_tool_call`, `known_tool_output` | Recognized tool protocol family only; no arguments or output are retained |
| `unknown_item_type`, `unknown_item_shape` | The raw type or malformed shape remains private and is not exported |

The raw type/role, item ID, call ID, canonical value, prompt, source, path, tool data, header, credential, HMAC digest, and payload body are never emitted, stored, logged, or written to a research note. Existing 1 MiB decoded-input, 512 in-memory group, and 64 exposed-group bounds remain in force. Forwarding is unchanged.

## Interpretation boundary

The evidence table must keep four propositions separate:

| Proposition | This probe establishes it? |
| --- | --- |
| Exact canonical recurrence | Yes, via the existing process-local HMAC recurrence tracker |
| Semantic sameness | No |
| Task redundancy | No |
| Safe removability or replaceability | No |

A recurring `protocol_state`, message, reasoning, or tool category can be required for correct later behavior. A recurring unknown item remains unknown. A finding can only guide the next measurement decision; it cannot authorize an ObservationPack, retrieval capability, payload transformation, or optimization.
