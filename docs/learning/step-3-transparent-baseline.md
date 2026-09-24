# Step 3: transparent proxy baseline

Goal: establish that one pinned OpenAI Chat Completions provider/model has the same useful Pi behavior both directly and through Inlay. This is not an optimization test.

## Freeze the experiment

Choose exactly one hosted provider and record its public base URL, exact model ID, Pi version, date, model capabilities, and public pricing source in a new sanitized experiment record. Do not record the API key. The provider must support `POST /v1/chat/completions` with server-sent-event streaming.

Set these variables in each PowerShell window; they are deliberately not read from a committed file:

```powershell
$env:INLAY_PROVIDER_API_KEY = "<your API key>"
$env:INLAY_PROVIDER_MODEL = "<exact model id>"
$env:INLAY_PROVIDER_REASONING = "true" # actual model capability: true or false
$env:INLAY_PROVIDER_INPUTS = "text" # actual supported inputs: text, or text,image
$env:INLAY_PROVIDER_CONTEXT_WINDOW = "<published context window>"
$env:INLAY_PROVIDER_MAX_TOKENS = "<published max output tokens>"
$env:INLAY_PROVIDER_COST_INPUT = "<published input USD per million tokens>"
$env:INLAY_PROVIDER_COST_OUTPUT = "<published output USD per million tokens>"
$env:INLAY_PROVIDER_COST_CACHE_READ = "<published cache-read USD per million tokens>"
$env:INLAY_PROVIDER_COST_CACHE_WRITE = "<published cache-write USD per million tokens>"
```

All metadata is required because Pi's provider schema requires it. Set a cache price to `0` only when the provider documents that the category is free or unavailable; never use `0` to mean unknown. The provider extension does not invent thinking support, token limits, or prices.

## A. Direct control run

Set Pi to the provider's exact OpenAI-compatible `/v1` base URL, then run a small read-only task. This establishes the control using the same Pi provider definition that the proxied run will use.

```powershell
$env:INLAY_PI_BASE_URL = "https://provider.example/v1"
corepack pnpm exec pi -e .\extensions\hosted-openai-baseline-provider.ts --provider inlay-hosted --model $env:INLAY_PROVIDER_MODEL "List the files in this project, then state how many TypeScript source files it contains."
```

Record whether streaming was incremental, whether Pi completed the task, elapsed wall time, and provider-reported usage if Pi exposes it. Do not compare generated wording byte-for-byte: separate model requests are nondeterministic.

## B. Proxied treatment run

In a first PowerShell window, start the transparent proxy. Its upstream is the same exact provider URL used by the direct control.

```powershell
$env:INLAY_UPSTREAM_BASE_URL = "https://provider.example/v1"
node --experimental-strip-types src/server.ts
```

In a second window, set the same key/model values and point Pi at the loopback proxy:

```powershell
$env:INLAY_PI_BASE_URL = "http://127.0.0.1:8787/v1"
corepack pnpm exec pi -e .\extensions\hosted-openai-baseline-provider.ts --provider inlay-hosted --model $env:INLAY_PROVIDER_MODEL "List the files in this project, then state how many TypeScript source files it contains."
Invoke-RestMethod http://127.0.0.1:8787/metrics | ConvertTo-Json -Depth 5
```

## Pass criteria

- Pi receives visibly incremental output in both runs.
- Both runs complete the same small task successfully.
- The proxied run records a successful request and timing in `/metrics`.
- When the model chooses a tool call, Pi receives and executes it normally; Inlay does not parse or rewrite the SSE event stream.
- Provider status, error body, and applicable response headers are forwarded unchanged. Inlay excludes HTTP hop-by-hop headers and adds `x-inlay-request-id` to the downstream response and forwarding request.
- Usage fields, if sent by the provider, reach Pi unchanged because all response bytes are streamed verbatim.

The repository test suite verifies byte-preserving request forwarding, incremental SSE delivery including tool-call and usage chunks, and non-2xx error passthrough. The live run establishes compatibility with the selected provider/model.

## Record the result

Create `docs/research/step-3-<provider>-<model>.md` with only sanitized metadata:

```markdown
# Step 3 transparent baseline

- Date:
- Pi version:
- Provider public base URL:
- Model ID:
- Model capabilities and token limits source:
- Public pricing source and rates used:
- Direct task outcome / elapsed time / reported usage:
- Proxied task outcome / elapsed time / reported usage:
- Proxy metric request ID and timings:
- Tool-call result (if exercised):
- Error-path result (if exercised):
- Verdict: pass or fail, with reason
```

Never commit prompts containing private source, raw request or response bodies, credentials, or unredacted provider trace IDs.
