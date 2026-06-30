import { PRODUCTS } from '@/data/products'
import { TREATMENTS } from '@/data/treatments'
import { createEmbeddings, dotProduct, hasEmbeddingCredentials } from '@/lib/concierge/embeddings'
import {
  hasPineconeCredentials,
  queryPineconeKnowledge,
  upsertKnowledgeChunksToPinecone,
} from '@/lib/concierge/pinecone'
import {
  BRAND_IDENTITY,
  CLINIC_POLICIES,
  DELIVERY_POLICY,
  FAQS,
  PRODUCTS as PRODUCT_KNOWLEDGE,
  RECOMMENDATION_LOGIC,
  RETURNS_POLICY,
  TREATMENTS as TREATMENT_KNOWLEDGE,
  VOICE_RULES,
} from '@/lib/knowledge'

export interface KnowledgeChunk {
  id: string
  title: string
  content: string
  tags: string[]
}

export interface RetrievedKnowledgeChunk extends KnowledgeChunk {
  score: number
  retrieval: 'pinecone' | 'vector' | 'lexical'
}

interface EmbeddedKnowledgeChunk extends KnowledgeChunk {
  embedding: number[]
}

const STATIC_CHUNKS: KnowledgeChunk[] = [
  {
    id: 'brand.identity',
    title: 'Brand Identity',
    content: BRAND_IDENTITY,
    tags: ['brand', 'locations', 'positioning'],
  },
  {
    id: 'voice.rules',
    title: 'Voice Rules',
    content: VOICE_RULES,
    tags: ['voice', 'tone'],
  },
  {
    id: 'treatments.catalog',
    title: 'Treatment Catalog',
    content: TREATMENT_KNOWLEDGE,
    tags: ['treatments', 'services', 'prices'],
  },
  {
    id: 'products.catalog',
    title: 'Product Catalog',
    content: PRODUCT_KNOWLEDGE,
    tags: ['products', 'skincare', 'prices'],
  },
  {
    id: 'recommendations.rules',
    title: 'Expert Recommendation Rules',
    content: RECOMMENDATION_LOGIC,
    tags: ['recommendations', 'rules', 'concerns', 'contraindications'],
  },
  {
    id: 'delivery.policy',
    title: 'Delivery Policy',
    content: DELIVERY_POLICY,
    tags: ['delivery', 'shipping', 'dispatch', 'tracking'],
  },
  {
    id: 'returns.policy',
    title: 'Returns Policy',
    content: RETURNS_POLICY,
    tags: ['returns', 'refunds', 'exchange', 'faulty'],
  },
  {
    id: 'clinic.policy',
    title: 'Clinic Appointment Policies',
    content: CLINIC_POLICIES,
    tags: ['booking', 'appointments', 'cancellation', 'pregnancy', 'patch test'],
  },
  {
    id: 'faqs',
    title: 'General FAQs',
    content: FAQS,
    tags: ['faqs', 'contact', 'parking', 'payment plans', 'vouchers'],
  },
  ...PRODUCTS.map((product) => ({
    id: `product.${product.slug}`,
    title: product.name,
    content: [
      `${product.name} — ${product.price}`,
      `Concern: ${product.concern}`,
      `Description: ${product.description}`,
      `Product page: /skincare/${product.slug}`,
    ].join('\n'),
    tags: ['product', product.concern.toLowerCase(), product.slug.replace(/-/g, ' ')],
  })),
  ...TREATMENTS.map((treatment) => ({
    id: `treatment.${treatment.slug}`,
    title: treatment.name,
    content: [
      `${treatment.name} — ${treatment.price}`,
      `Category: ${treatment.category}`,
      `Description: ${treatment.description}`,
      `Expectation: ${treatment.expectation}`,
      `Ideal for: ${treatment.idealFor.join(', ')}`,
      `Treatment page: /treatments/${treatment.slug}`,
    ].join('\n'),
    tags: ['treatment', treatment.category.toLowerCase(), treatment.slug.replace(/-/g, ' ')],
  })),
]

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'can',
  'for',
  'from',
  'have',
  'help',
  'how',
  'i',
  'in',
  'is',
  'it',
  'me',
  'my',
  'of',
  'on',
  'or',
  'the',
  'to',
  'what',
  'with',
])

let embeddedIndexPromise: Promise<EmbeddedKnowledgeChunk[]> | null = null
let pineconeSeedPromise: Promise<void> | null = null

function tokenize(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9£+]+/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
}

function scoreChunk(queryTokens: string[], chunk: KnowledgeChunk) {
  const haystack = `${chunk.title} ${chunk.tags.join(' ')} ${chunk.content}`.toLowerCase()
  const title = chunk.title.toLowerCase()
  const tags = chunk.tags.join(' ').toLowerCase()

  return queryTokens.reduce((score, token) => {
    if (title.includes(token)) score += 5
    if (tags.includes(token)) score += 4
    if (haystack.includes(token)) score += 1
    return score
  }, 0)
}

function chunkToEmbeddingInput(chunk: KnowledgeChunk) {
  return [
    chunk.title,
    `Tags: ${chunk.tags.join(', ')}`,
    chunk.content,
  ].join('\n')
}

async function getEmbeddedIndex() {
  if (!hasEmbeddingCredentials()) {
    throw new Error('OPENAI_API_KEY is not set')
  }

  if (!embeddedIndexPromise) {
    embeddedIndexPromise = createEmbeddings(STATIC_CHUNKS.map(chunkToEmbeddingInput))
      .then((embeddings) => STATIC_CHUNKS.map((chunk, index) => ({
        ...chunk,
        embedding: embeddings[index],
      })))
      .catch((error) => {
        embeddedIndexPromise = null
        throw error
      })
  }

  return embeddedIndexPromise
}

async function ensurePineconeKnowledgeIndex() {
  if (!hasPineconeCredentials() || process.env.PINECONE_AUTO_SEED !== 'true') {
    return
  }

  if (!pineconeSeedPromise) {
    pineconeSeedPromise = createEmbeddings(STATIC_CHUNKS.map(chunkToEmbeddingInput))
      .then((embeddings) => upsertKnowledgeChunksToPinecone(STATIC_CHUNKS, embeddings))
      .catch((error) => {
        pineconeSeedPromise = null
        throw error
      })
  }

  return pineconeSeedPromise
}

export function retrieveBusinessKnowledgeLexical(query: string, limit = 5): RetrievedKnowledgeChunk[] {
  const queryTokens = tokenize(query)

  if (!queryTokens.length) {
    return STATIC_CHUNKS.slice(0, limit).map((chunk) => ({ ...chunk, score: 0, retrieval: 'lexical' }))
  }

  return STATIC_CHUNKS
    .map((chunk) => ({ ...chunk, score: scoreChunk(queryTokens, chunk), retrieval: 'lexical' as const }))
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export async function retrieveBusinessKnowledge(query: string, limit = 5): Promise<RetrievedKnowledgeChunk[]> {
  if (!hasEmbeddingCredentials()) {
    return retrieveBusinessKnowledgeLexical(query, limit)
  }

  let queryEmbedding: number[]

  try {
    const embeddings = await createEmbeddings([query])
    queryEmbedding = embeddings[0]
  } catch (error) {
    console.error('[concierge/rag] Query embedding failed, using lexical fallback:', error)
    return retrieveBusinessKnowledgeLexical(query, limit)
  }

  if (hasPineconeCredentials()) {
    try {
      await ensurePineconeKnowledgeIndex()
      const pineconeResults = await queryPineconeKnowledge(queryEmbedding, limit)

      if (pineconeResults.length) {
        return pineconeResults
      }
    } catch (error) {
      console.error('[concierge/rag] Pinecone retrieval failed, using local vector fallback:', error)
    }
  }

  try {
    const index = await getEmbeddedIndex()

    return index
      .map((chunk) => ({
        ...chunk,
        score: dotProduct(queryEmbedding, chunk.embedding),
        retrieval: 'vector' as const,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  } catch (error) {
    console.error('[concierge/rag] Vector retrieval failed, using lexical fallback:', error)
    return retrieveBusinessKnowledgeLexical(query, limit)
  }
}

export function formatRetrievedKnowledge(chunks: RetrievedKnowledgeChunk[]) {
  return chunks
    .map((chunk) => [
      `SOURCE: ${chunk.title} (${chunk.id})`,
      chunk.content,
    ].join('\n'))
    .join('\n\n---\n\n')
}
