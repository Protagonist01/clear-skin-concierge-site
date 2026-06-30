import type { KnowledgeChunk, RetrievedKnowledgeChunk } from '@/lib/concierge/rag'

const DEFAULT_NAMESPACE = 'clear-skin-concierge'
const DEFAULT_PINECONE_TIMEOUT_MS = 5000

export type PineconeMetadata = Record<string, string | number | boolean | string[] | undefined>

export interface PineconeMatch {
  id?: string
  score?: number
  metadata?: PineconeMetadata
}

interface PineconeQueryResponse {
  matches?: PineconeMatch[]
}

function normalizeHost(host: string) {
  const trimmed = host.trim().replace(/\/+$/, '')
  if (!trimmed) return ''
  return /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`
}

function getPositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function createTimeoutSignal(timeoutMs: number) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  return {
    signal: controller.signal,
    cancel: () => clearTimeout(timer),
  }
}

export function hasPineconeCredentials() {
  return Boolean(process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_HOST)
}

function pineconeConfig(namespaceOverride?: string) {
  const apiKey = process.env.PINECONE_API_KEY
  const host = normalizeHost(process.env.PINECONE_INDEX_HOST || '')
  const namespace = namespaceOverride || process.env.PINECONE_NAMESPACE || DEFAULT_NAMESPACE

  if (!apiKey || !host) {
    throw new Error('PINECONE_API_KEY and PINECONE_INDEX_HOST are required')
  }

  return { apiKey, host, namespace }
}

async function pineconeRequest<T>(path: string, body: Record<string, unknown>, namespace?: string): Promise<T> {
  const { apiKey, host } = pineconeConfig(namespace)
  const timeoutMs = getPositiveInteger(process.env.PINECONE_TIMEOUT_MS, DEFAULT_PINECONE_TIMEOUT_MS)
  const timeout = createTimeoutSignal(timeoutMs)
  let response: Response

  try {
    response = await fetch(`${host}${path}`, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: timeout.signal,
    })
  } catch (error) {
    throw timeout.signal.aborted
      ? new Error(`Pinecone request timed out after ${timeoutMs}ms`)
      : error
  } finally {
    timeout.cancel()
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Pinecone error ${response.status}: ${errorText}`)
  }

  return response.json() as Promise<T>
}

export async function upsertPineconeVectors(
  vectors: Array<{
    id: string
    values: number[]
    metadata?: PineconeMetadata
  }>,
  namespace?: string,
) {
  const { namespace: resolvedNamespace } = pineconeConfig(namespace)

  await pineconeRequest('/vectors/upsert', {
    namespace: resolvedNamespace,
    vectors,
  }, resolvedNamespace)
}

export async function queryPineconeVectors(
  embedding: number[],
  limit: number,
  namespace?: string,
) {
  const { namespace: resolvedNamespace } = pineconeConfig(namespace)

  return pineconeRequest<PineconeQueryResponse>('/query', {
    namespace: resolvedNamespace,
    vector: embedding,
    topK: limit,
    includeMetadata: true,
    includeValues: false,
  }, resolvedNamespace)
}

export async function upsertKnowledgeChunksToPinecone(
  chunks: KnowledgeChunk[],
  embeddings: number[][],
) {
  const vectors = chunks.map((chunk, index) => ({
    id: chunk.id,
    values: embeddings[index],
    metadata: {
      title: chunk.title,
      content: chunk.content,
      tags: chunk.tags,
    },
  }))

  await upsertPineconeVectors(vectors)
}

export async function queryPineconeKnowledge(
  embedding: number[],
  limit: number,
): Promise<RetrievedKnowledgeChunk[]> {
  const payload = await queryPineconeVectors(embedding, limit)

  return (payload.matches || []).flatMap((match) => {
    const id = match.id || ''
    const metadata = match.metadata || {}
    const title = typeof metadata.title === 'string' ? metadata.title : id
    const content = typeof metadata.content === 'string' ? metadata.content : ''
    const tags = Array.isArray(metadata.tags) ? metadata.tags : []

    if (!id || !content) return []

    return [{
      id,
      title,
      content,
      tags,
      score: match.score || 0,
      retrieval: 'pinecone' as const,
    }]
  })
}
