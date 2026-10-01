# Exact-item recurrence probe

## Question

Can a real Codex Responses trajectory contain the same full canonical input item in more than one provider request? This probe measures exact representation recurrence only. It does not measure semantic equivalence, usefulness, redundancy, token savings, cache behavior, or safety of removal.

## Privacy decision

The existing structural ledger can compare type and size, but those facts cannot identify the same logical item. Retaining canonical item values would answer that question but would violate Inlay's privacy boundary. Persisting an ordinary content hash would also be unsafe: a low-entropy prompt, path, or tool output could be guessed against an unkeyed digest.

The probe therefore uses a fresh random in-process HMAC key. For each transient decoded input item, it canonicalizes JSON by recursively sorting object keys and preserving array order, computes an HMAC-SHA-256 digest, and immediately discards the canonical value. The key and digest remain only in the local process memory needed for the current run. Neither is exposed by `/metrics`, written to a research artifact, or reusable after restart.

The retained output is limited to aggregate item type, canonical byte length, first and last local observation sequence, distinct-request count, occurrence count, and request-level aggregate recurrence totals. Unknown type strings remain `other`.

## Bounds and opt-in behavior

- Enable only with `INLAY_OBSERVATION=structural` and `INLAY_RECURRENCE_PROBE=exact-item`.
- The probe reads at most 1 MiB of decoded input per request. It uses the same bound for zstd expansion.
- It indexes at most 512 opaque in-memory item groups and exposes at most 64 anonymized recurring groups. Any capacity limit is marked incomplete; forwarding is unaffected.
- The proxy continues to forward original request bytes and response bytes unchanged.

## Interpretation

A match is an exact equality of the canonical JSON representation within one proxy process, subject to cryptographically negligible HMAC collision risk. It is not semantic equality: equivalent information encoded differently will not match, and an exact match can still be necessary agent state.

For one complete task, zero groups recurring across two or more request sequences falsifies the narrow hypothesis that this task repeated a full canonical input item. One or more groups only justifies further evidence review; it does not establish ObservationPack eligibility or authorize a transformation.
