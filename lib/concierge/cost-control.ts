import 'server-only'

import crypto from 'node:crypto'
import { ACCOUNT_SESSION_COOKIE_KEY, getAuthenticatedCustomer } from '@/lib/account-store'
import { getDb } from '@/lib/db'
import type { ConciergeChatMessage } from '@/lib/concierge/types'

export const CONCIERGE_ID_COOKIE_KEY = 'clear-skin-concierge-id'
const DEFAULT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365
const DEFAULT_REPLY_MAX_TOKENS = 220
const DEFAULT_TOOL_TURN_MAX_TOKENS = 220
const DEFAULT_RATE_LIMIT_PER_MINUTE = 6
const DEFAULT_DAILY_REQUEST_LIMIT = 40
const DEFAULT_DAILY_SPEND_LIMIT_USD = 0.25
const DEFAULT_MESSAGE_CHAR_LIMIT = 1200
const DEFAULT_CONTEXT_TURNS = 6
const DEFAULT_PROMPT_TOKEN_USD_PER_1K = 0.001
const DEFAULT_COMPLETION_TOKEN_USD_PER_1K = 0.002

interface CookieReader {
  get: (name: string) => { value: string } | undefined
}

export interface ConciergeIdentity {
  userKey: string
  cookie?: {
    name: string
    value: string
    maxAge: number
  }
}

export interface ConciergeUsage {
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface CostGateResult {
  allowed: boolean
  reason?: 'rate_limit' | 'daily_request_limit' | 'daily_spend_limit'
}

interface CostEventInput {
  userKey: string
  eventType: string
  usage?: Partial<ConciergeUsage>
  estimatedUsd?: number
  metadata?: Record<string, unknown>
}

function numberEnv(name: string, fallback: number) {
  const parsed = Number.parseFloat(process.env[name] || '')
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

function integerEnv(name: string, fallback: number) {
  const parsed = Number.parseInt(process.env[name] || '', 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

function cookieSecret() {
  return process.env.CONCIERGE_COOKIE_SECRET
    || process.env.CLEAR_SKIN_ENCRYPTION_KEY
    || process.env.OPENROUTER_API_KEY
    || 'clear-skin-concierge-dev-secret'
}

function signVisitorId(visitorId: string) {
  return crypto.createHmac('sha256', cookieSecret()).update(visitorId).digest('base64url')
}

function createSignedVisitorCookie(visitorId = crypto.randomBytes(16).toString('hex')) {
  return `${visitorId}.${signVisitorId(visitorId)}`
}

function parseSignedVisitorCookie(value?: string) {
  if (!value) return null
  const [visitorId, signature] = value.split('.')
  if (!visitorId || !signature) return null

  const expected = signVisitorId(visitorId)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)

  if (signatureBuffer.length !== expectedBuffer.length) return null
  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer) ? visitorId : null
}

function createId() {
  return crypto.randomUUID()
}

function startOfToday(now = new Date()) {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
}

function oneMinuteAgo(now = new Date()) {
  return new Date(now.getTime() - 60_000).toISOString()
}

function estimateUsd(usage: Partial<ConciergeUsage>) {
  const promptRate = numberEnv('CONCIERGE_PROMPT_TOKEN_USD_PER_1K', DEFAULT_PROMPT_TOKEN_USD_PER_1K)
  const completionRate = numberEnv('CONCIERGE_COMPLETION_TOKEN_USD_PER_1K', DEFAULT_COMPLETION_TOKEN_USD_PER_1K)
  return ((usage.promptTokens || 0) / 1000 * promptRate)
    + ((usage.completionTokens || 0) / 1000 * completionRate)
}

export function getConciergeReplyMaxTokens() {
  return integerEnv('CONCIERGE_MAX_REPLY_TOKENS', DEFAULT_REPLY_MAX_TOKENS)
}

export function getConciergeToolTurnMaxTokens() {
  return integerEnv('CONCIERGE_TOOL_TURN_MAX_TOKENS', DEFAULT_TOOL_TURN_MAX_TOKENS)
}

export function estimateTokensFromText(input: string) {
  return Math.max(1, Math.ceil(input.length / 4))
}

export function estimateTokensFromMessages(messages: Array<{ content: string }>) {
  return messages.reduce((total, message) => total + estimateTokensFromText(message.content || ''), 0)
}

export function trimConciergeMessages(
  messages: ConciergeChatMessage[],
  options?: {
    turns?: number
    messageCharLimit?: number
  },
) {
  const turns = options?.turns ?? integerEnv('CONCIERGE_CONTEXT_TURNS', DEFAULT_CONTEXT_TURNS)
  const messageCharLimit = options?.messageCharLimit
    ?? integerEnv('CONCIERGE_MESSAGE_CHAR_LIMIT', DEFAULT_MESSAGE_CHAR_LIMIT)
  const maxMessages = Math.max(1, turns * 2)

  return messages.slice(-maxMessages).map((message) => ({
    ...message,
    content: message.content.length > messageCharLimit
      ? message.content.slice(-messageCharLimit)
      : message.content,
  }))
}

export function resolveConciergeIdentity(cookies: CookieReader): ConciergeIdentity {
  try {
    if (cookies.get(ACCOUNT_SESSION_COOKIE_KEY)?.value) {
      const customer = getAuthenticatedCustomer(cookies)
      if (customer) {
        return { userKey: `customer:${customer.id}` }
      }
    }
  } catch (error) {
    console.error('[concierge/cost] Account identity lookup failed, using visitor identity:', error)
  }

  const existingVisitorId = parseSignedVisitorCookie(cookies.get(CONCIERGE_ID_COOKIE_KEY)?.value)
  if (existingVisitorId) {
    return { userKey: `visitor:${existingVisitorId}` }
  }

  const cookieValue = createSignedVisitorCookie()
  const visitorId = parseSignedVisitorCookie(cookieValue)

  return {
    userKey: `visitor:${visitorId || crypto.randomBytes(16).toString('hex')}`,
    cookie: {
      name: CONCIERGE_ID_COOKIE_KEY,
      value: cookieValue,
      maxAge: DEFAULT_COOKIE_MAX_AGE,
    },
  }
}

export function checkConciergeCostGate(userKey: string): CostGateResult {
  const db = getDb()
  const minuteLimit = integerEnv('CONCIERGE_RATE_LIMIT_PER_MINUTE', DEFAULT_RATE_LIMIT_PER_MINUTE)
  const dailyRequestLimit = integerEnv('CONCIERGE_DAILY_REQUEST_LIMIT', DEFAULT_DAILY_REQUEST_LIMIT)
  const dailySpendLimit = numberEnv('CONCIERGE_DAILY_SPEND_LIMIT_USD', DEFAULT_DAILY_SPEND_LIMIT_USD)
  const now = new Date()

  const minuteRequests = db.prepare(`
    SELECT COUNT(*) AS count
    FROM concierge_cost_events
    WHERE user_key = ?
      AND event_type IN ('request', 'semantic_cache_hit', 'cost_control_fallback', 'model_error_fallback')
      AND created_at >= ?
  `).get(userKey, oneMinuteAgo(now)) as { count: number }

  if (minuteLimit > 0 && minuteRequests.count >= minuteLimit) {
    return { allowed: false, reason: 'rate_limit' }
  }

  const dailyRequests = db.prepare(`
    SELECT COUNT(*) AS count
    FROM concierge_cost_events
    WHERE user_key = ?
      AND event_type IN ('request', 'semantic_cache_hit', 'cost_control_fallback', 'model_error_fallback')
      AND created_at >= ?
  `).get(userKey, startOfToday(now)) as { count: number }

  if (dailyRequestLimit > 0 && dailyRequests.count >= dailyRequestLimit) {
    return { allowed: false, reason: 'daily_request_limit' }
  }

  const dailySpend = db.prepare(`
    SELECT COALESCE(SUM(estimated_usd), 0) AS total
    FROM concierge_cost_events
    WHERE user_key = ?
      AND created_at >= ?
  `).get(userKey, startOfToday(now)) as { total: number }

  if (dailySpendLimit > 0 && dailySpend.total >= dailySpendLimit) {
    return { allowed: false, reason: 'daily_spend_limit' }
  }

  return { allowed: true }
}

export function recordConciergeCostEvent({
  userKey,
  eventType,
  usage = {},
  estimatedUsd,
  metadata,
}: CostEventInput) {
  const promptTokens = Math.max(0, Math.round(usage.promptTokens || 0))
  const completionTokens = Math.max(0, Math.round(usage.completionTokens || 0))
  const totalTokens = Math.max(0, Math.round(usage.totalTokens || promptTokens + completionTokens))

  getDb().prepare(`
    INSERT INTO concierge_cost_events (
      id,
      user_key,
      event_type,
      created_at,
      prompt_tokens,
      completion_tokens,
      total_tokens,
      estimated_usd,
      metadata_json
    )
    VALUES (@id, @user_key, @event_type, @created_at, @prompt_tokens, @completion_tokens, @total_tokens, @estimated_usd, @metadata_json)
  `).run({
    id: createId(),
    user_key: userKey,
    event_type: eventType,
    created_at: new Date().toISOString(),
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    total_tokens: totalTokens,
    estimated_usd: estimatedUsd ?? estimateUsd({ promptTokens, completionTokens, totalTokens }),
    metadata_json: metadata ? JSON.stringify(metadata) : null,
  })
}
