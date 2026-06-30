import { NextRequest, NextResponse } from 'next/server'
import { hasEmbeddingCredentials } from '@/lib/concierge/embeddings'
import { hasPineconeCredentials } from '@/lib/concierge/pinecone'
import { retrieveBusinessKnowledge } from '@/lib/concierge/rag'
import { getDb } from '@/lib/db'

export const dynamic = 'force-dynamic'

function hasValue(value?: string) {
  return Boolean(value?.trim())
}

function isAuthorized(req: NextRequest) {
  if (process.env.NODE_ENV !== 'production') return true

  const token = process.env.CONCIERGE_DIAGNOSTICS_TOKEN?.trim()
  if (!token) return false

  return req.headers.get('x-concierge-debug-token') === token
    || req.nextUrl.searchParams.get('token') === token
}

function readRecentEvents() {
  return getDb().prepare(`
    SELECT event_type, created_at, prompt_tokens, completion_tokens, total_tokens, estimated_usd, metadata_json
    FROM concierge_cost_events
    ORDER BY created_at DESC
    LIMIT 12
  `).all().map((event) => {
    const row = event as Record<string, unknown>
    let metadata: unknown = null

    if (typeof row.metadata_json === 'string' && row.metadata_json.trim()) {
      try {
        metadata = JSON.parse(row.metadata_json)
      } catch {
        metadata = null
      }
    }

    return {
      eventType: row.event_type,
      createdAt: row.created_at,
      promptTokens: row.prompt_tokens,
      completionTokens: row.completion_tokens,
      totalTokens: row.total_tokens,
      estimatedUsd: row.estimated_usd,
      metadata,
    }
  })
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { success: false, error: 'Diagnostics are not available.' },
      { status: 404 },
    )
  }

  const query = req.nextUrl.searchParams.get('query')?.trim()
  const retrievalProbe = query
    ? await retrieveBusinessKnowledge(query, 5).then((chunks) => ({
        query,
        chunks: chunks.map(({ id, title, score, retrieval }) => ({
          id,
          title,
          score,
          retrieval,
        })),
      })).catch((error) => ({
        query,
        error: error instanceof Error ? error.message : 'Retrieval probe failed.',
      }))
    : null

  return NextResponse.json({
    success: true,
    config: {
      model: {
        openRouterApiKey: hasValue(process.env.OPENROUTER_API_KEY),
        openRouterModel: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
      },
      embeddings: {
        openAiApiKey: hasEmbeddingCredentials(),
        model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
        dimensions: process.env.OPENAI_EMBEDDING_DIMENSIONS || '1536 native',
      },
      pinecone: {
        ready: hasPineconeCredentials(),
        namespace: process.env.PINECONE_NAMESPACE || 'clear-skin-concierge',
        autoSeed: process.env.PINECONE_AUTO_SEED !== 'false',
        semanticCacheNamespace: process.env.PINECONE_CACHE_NAMESPACE || 'clear-skin-concierge-cache',
      },
      booking: {
        mode: 'in_chat',
        schedulingWebhookUrl: hasValue(process.env.CLEAR_SKIN_SCHEDULING_WEBHOOK_URL),
        schedulingApiKey: hasValue(process.env.CLEAR_SKIN_SCHEDULING_API_KEY),
      },
    },
    retrievalProbe,
    recentEvents: readRecentEvents(),
  })
}
