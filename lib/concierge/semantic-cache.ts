import 'server-only'

import crypto from 'node:crypto'
import { createEmbeddings, hasEmbeddingCredentials } from '@/lib/concierge/embeddings'
import { hasPineconeCredentials, queryPineconeVectors, upsertPineconeVectors } from '@/lib/concierge/pinecone'
import type { ConciergeDecision } from '@/lib/concierge/types'

const DEFAULT_CACHE_NAMESPACE = 'clear-skin-concierge-cache'
const DEFAULT_CACHE_TTL_HOURS = 24
const DEFAULT_CACHE_THRESHOLD = 0.92

const UNSAFE_CACHE_PATTERNS = [
  /\b(add|remove|delete|update|change)\b.*\b(cart|bag|basket)\b/i,
  /\b(cart|bag|basket|checkout|buy|purchase|order|payment|pay)\b/i,
  /\b(book|booking|appointment|schedule|reschedule|cancel|slot|availability)\b/i,
  /\b(account|login|email|phone|address|password|code|profile|history)\b/i,
  /\b(open|navigate|show me|take me|go to)\b/i,
  /\b(recommend|suggest|routine|product route|treatment route|help me choose|should i use|what should i use)\b/i,
  /\b(concern|pigmentation|hyperpigmentation|acne|breakout|breakouts|sensitivity|sensitive|redness|dull|dullness|ageing|aging|fine lines|volume)\b/i,
  /\b(explain|why|reason|rationale|chose|choose|chosen|picked)\b/i,
  /\b(it|that|this|these|those|they|them|already|currently)\b/i,
  /\b(pregnant|pregnancy|breastfeeding|nursing)\b/i,
  /\b(laser|injectable|filler|botox|peel|contraindication|contraindicated|patch test)\b/i,
  /\b(allergy|allergic|reaction|infection|wound|eczema|psoriasis|rosacea|medication|prescription)\b/i,
  /\b(accutane|isotretinoin|retinoid|steroid|antibiotic|cancer|diabetes|diagnose|medical)\b/i,
]

interface CachedDecisionMetadata {
  decisionJson?: string
  query?: string
  createdAt?: string
  expiresAt?: string
}

function booleanEnv(name: string, fallback: boolean) {
  const value = process.env[name]
  if (!value) return fallback
  return value.toLowerCase() !== 'false'
}

function numberEnv(name: string, fallback: number) {
  const parsed = Number.parseFloat(process.env[name] || '')
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

function cacheNamespace() {
  return process.env.PINECONE_CACHE_NAMESPACE || DEFAULT_CACHE_NAMESPACE
}

function cacheTtlHours() {
  return numberEnv('CONCIERGE_SEMANTIC_CACHE_TTL_HOURS', DEFAULT_CACHE_TTL_HOURS)
}

function cacheThreshold() {
  return numberEnv('CONCIERGE_SEMANTIC_CACHE_THRESHOLD', DEFAULT_CACHE_THRESHOLD)
}

function isSemanticCacheEnabled() {
  return booleanEnv('CONCIERGE_SEMANTIC_CACHE_ENABLED', true)
    && hasEmbeddingCredentials()
    && hasPineconeCredentials()
}

export function normalizeCacheQuery(input: string) {
  return input
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function isSafeAdvisoryCacheQuery(input: string) {
  const normalized = normalizeCacheQuery(input)
  if (!normalized || normalized.length < 6) return false
  return !UNSAFE_CACHE_PATTERNS.some((pattern) => pattern.test(normalized))
}

export function isCacheableConciergeDecision(input: string, decision: ConciergeDecision) {
  return isSafeAdvisoryCacheQuery(input)
    && decision.mode === 'advisory_chat'
    && !decision.action
    && (!decision.safetyNotes || decision.safetyNotes.length === 0)
}

function cacheIdForQuery(normalizedQuery: string) {
  return `cache.${crypto.createHash('sha256').update(normalizedQuery).digest('hex')}`
}

function parseCachedDecision(metadata: CachedDecisionMetadata, score: number): ConciergeDecision | null {
  if (!metadata.decisionJson || !metadata.expiresAt) return null
  if (score < cacheThreshold()) return null
  if (new Date(metadata.expiresAt).getTime() <= Date.now()) return null

  try {
    const parsed = JSON.parse(metadata.decisionJson) as ConciergeDecision
    if (parsed.action || parsed.safetyNotes?.length || parsed.mode !== 'advisory_chat') {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

export async function getSemanticCachedDecision(input: string) {
  if (!isSemanticCacheEnabled() || !isSafeAdvisoryCacheQuery(input)) {
    return null
  }

  try {
    const normalizedQuery = normalizeCacheQuery(input)
    const [embedding] = await createEmbeddings([normalizedQuery])
    const payload = await queryPineconeVectors(embedding, 1, cacheNamespace())
    const match = payload.matches?.[0]

    if (!match?.metadata) return null
    return parseCachedDecision(match.metadata as CachedDecisionMetadata, match.score || 0)
  } catch (error) {
    console.error('[concierge/cache] Semantic cache lookup failed:', error)
    return null
  }
}

export async function writeSemanticCachedDecision(input: string, decision: ConciergeDecision) {
  if (!isSemanticCacheEnabled() || !isCacheableConciergeDecision(input, decision)) {
    return
  }

  try {
    const normalizedQuery = normalizeCacheQuery(input)
    const [embedding] = await createEmbeddings([normalizedQuery])
    const createdAt = new Date()
    const expiresAt = new Date(createdAt.getTime() + cacheTtlHours() * 60 * 60 * 1000)

    await upsertPineconeVectors([{
      id: cacheIdForQuery(normalizedQuery),
      values: embedding,
      metadata: {
        query: normalizedQuery,
        decisionJson: JSON.stringify(decision),
        createdAt: createdAt.toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
    }], cacheNamespace())
  } catch (error) {
    console.error('[concierge/cache] Semantic cache write failed:', error)
  }
}
