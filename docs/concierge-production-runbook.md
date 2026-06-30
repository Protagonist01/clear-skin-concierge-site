# Concierge Production Runbook

## Provider Split

- Concierge model and tool calling: OpenRouter via `OPENROUTER_API_KEY`.
- Embeddings: OpenAI via `OPENAI_API_KEY`.
- Vector database: Pinecone via `PINECONE_API_KEY` and `PINECONE_INDEX_HOST`.

## Required Vector Setup

Create a Pinecone dense vector index for `text-embedding-3-small`:

- Dimension: `1536`
- Metric: `cosine`
- Namespace: `clear-skin-concierge`

With `PINECONE_AUTO_SEED=true`, the app lazily upserts the current Clear Skin knowledge chunks the first time retrieval runs.

## Diagnostics

Development:

```bash
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Then open:

```text
http://127.0.0.1:3000/api/concierge/diagnostics?query=What%20is%20your%20return%20policy%3F
```

Production requires:

```env
CONCIERGE_DIAGNOSTICS_TOKEN=
```

Send it as:

```text
x-concierge-debug-token: your-token
```

The diagnostics response intentionally reports only booleans, model names, retrieval source IDs, and recent cost event summaries. It does not expose API keys.

## Guardrail Smoke Test

With the dev server running:

```bash
npm run test:concierge:guardrails
```

The test verifies:

- Pinecone retrieval is active.
- Policy questions still answer through the model/RAG path or semantic cache.
- Cart mutation requires confirmation.
- Booking handoff requires confirmation.
- Pregnancy and adverse-reaction prompts do not trigger unsafe cart or booking actions.

## Booking And Scheduling

The concierge opens a booking handoff; it does not directly confirm appointments from chat.

Booking handoff options:

- Leave `CALENDLY_SCHEDULING_URL` blank to use the built-in `/book` flow.
- Set `CALENDLY_SCHEDULING_URL` to a Calendly event URL to hand off externally.

The built-in `/book` flow always saves a request locally in My Account. After local save, it can optionally forward the request to an external scheduler:

```env
CLEAR_SKIN_SCHEDULING_WEBHOOK_URL=
CLEAR_SKIN_SCHEDULING_API_KEY=
```

`CLEAR_SKIN_SCHEDULING_WEBHOOK_URL` is a webhook endpoint you own or configure in a workflow tool such as Make, Zapier, n8n, a custom backend, or a clinic scheduling system. The app sends:

```json
{
  "source": "clear-skin-site",
  "submittedAt": "ISO timestamp",
  "booking": {}
}
```

`CLEAR_SKIN_SCHEDULING_API_KEY` is optional. If set, the app sends it as:

```text
Authorization: Bearer your-key
```

Use whatever secret your webhook receiver expects. If the receiver does not require bearer auth, leave it blank.

The webhook should return a 2xx response. Optional response fields:

```json
{
  "status": "confirmed",
  "scheduleStatus": "confirmed",
  "externalReference": "provider-id",
  "message": "Booking forwarded to the clinic schedule."
}
```

If no webhook URL is configured, the booking remains safely saved locally as `requested`.
