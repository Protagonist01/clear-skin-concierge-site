import { PRODUCTS } from '@/data/products'
import { TREATMENTS } from '@/data/treatments'
import type {
  ConciergeAction,
  ConciergeDecision,
  ConciergeRequestBody,
  ConciergeRetrievalSource,
  ConciergeSuggestion,
} from '@/lib/concierge/types'
import { createConciergeDecision } from '@/lib/concierge/router'
import {
  estimateTokensFromMessages,
  estimateTokensFromText,
  getConciergeReplyMaxTokens,
  getConciergeToolTurnMaxTokens,
  trimConciergeMessages,
  type ConciergeUsage,
} from '@/lib/concierge/cost-control'
import { CONCIERGE_TOOLS, executeConciergeTool } from '@/lib/concierge/tools'
import { BRAND_IDENTITY, VOICE_RULES } from '@/lib/knowledge'
import { formatRetrievedKnowledge, retrieveBusinessKnowledge } from '@/lib/concierge/rag'
import {
  openRouterChatCompletion,
  type OpenRouterMessage,
  type OpenRouterToolCall,
} from '@/lib/openrouter'

const MAX_TOOL_TURNS = 2

const VALID_MODES = new Set(['direct_action', 'advisory_chat', 'guided_workflow', 'clarification_needed'])
const VALID_ACTIONS = new Set([
  'navigate',
  'show_products',
  'show_treatments',
  'add_to_cart',
  'remove_from_cart',
  'start_booking',
  'open_quiz',
])

function lastUserMessage(body: ConciergeRequestBody) {
  return [...(body.messages || [])].reverse().find((message) => message.role === 'user')?.content || ''
}

function parseJsonObject(input: string) {
  try {
    return JSON.parse(input)
  } catch {
    const match = input.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON object found')
    return JSON.parse(match[0])
  }
}

function parseToolArguments(toolCall: OpenRouterToolCall) {
  try {
    return JSON.parse(toolCall.function.arguments || '{}')
  } catch {
    return {}
  }
}

function addUsage(
  current: ConciergeUsage,
  next: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  } | undefined,
  fallback: ConciergeUsage,
) {
  const promptTokens = next?.prompt_tokens ?? fallback.promptTokens
  const completionTokens = next?.completion_tokens ?? fallback.completionTokens
  const totalTokens = next?.total_tokens ?? promptTokens + completionTokens

  return {
    promptTokens: current.promptTokens + promptTokens,
    completionTokens: current.completionTokens + completionTokens,
    totalTokens: current.totalTokens + totalTokens,
  }
}

function productPayload(products: unknown) {
  if (!Array.isArray(products)) return undefined
  return products.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    const slug = typeof record.slug === 'string' ? record.slug : ''
    const name = typeof record.name === 'string' ? record.name : ''
    const product = PRODUCTS.find((entry) => entry.slug === slug || entry.name === name)
    if (!product) return []
    return [{
      name: product.name,
      slug: product.slug,
      price: product.price,
      concern: product.concern,
      description: product.description,
      image: product.image,
    }]
  })
}

function treatmentPayload(treatments: unknown) {
  if (!Array.isArray(treatments)) return undefined
  return treatments.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    const slug = typeof record.slug === 'string' ? record.slug : ''
    const name = typeof record.name === 'string' ? record.name : ''
    const treatment = TREATMENTS.find((entry) => entry.slug === slug || entry.name === name)
    if (!treatment) return []
    return [{
      name: treatment.name,
      slug: treatment.slug,
      price: treatment.price,
      category: treatment.category,
      description: treatment.description,
      image: treatment.image,
    }]
  })
}

function sanitizeAction(action: unknown): ConciergeAction | undefined {
  if (!action || typeof action !== 'object') return undefined

  const record = action as Record<string, unknown>
  const type = typeof record.type === 'string' ? record.type : ''
  if (!VALID_ACTIONS.has(type)) return undefined

  const payload = record.payload && typeof record.payload === 'object'
    ? record.payload as Record<string, unknown>
    : {}

  if (type === 'navigate') {
    const href = typeof payload.href === 'string' ? payload.href : ''
    if (!href.startsWith('/')) return undefined

    return {
      type: 'navigate',
      label: typeof record.label === 'string' ? record.label : 'Open page',
      requiresConfirmation: href === '/checkout',
      payload: { href },
    }
  }

  if (type === 'show_products') {
    const products = productPayload(payload.products)
    if (!products?.length) return undefined

    return {
      type: 'show_products',
      label: typeof record.label === 'string' ? record.label : 'Show skincare',
      requiresConfirmation: false,
      payload: { products },
    }
  }

  if (type === 'show_treatments') {
    const treatments = treatmentPayload(payload.treatments)
    if (!treatments?.length) return undefined

    return {
      type: 'show_treatments',
      label: typeof record.label === 'string' ? record.label : 'Show treatments',
      requiresConfirmation: false,
      payload: { treatments },
    }
  }

  if (type === 'add_to_cart' || type === 'remove_from_cart') {
    const products = productPayload(payload.products)
    if (!products?.length) return undefined

    return {
      type,
      label: typeof record.label === 'string' ? record.label : type === 'add_to_cart' ? 'Add products' : 'Remove products',
      requiresConfirmation: true,
      payload: {
        products,
        productNames: products.map((product) => product.name),
        productSlugs: products.map((product) => product.slug),
      },
    }
  }

  if (type === 'start_booking') {
    const calendlyUrl = typeof payload.calendlyUrl === 'string' ? payload.calendlyUrl : undefined
    const safeCalendlyUrl = calendlyUrl && (calendlyUrl.startsWith('/') || calendlyUrl.startsWith('https://'))
      ? calendlyUrl
      : undefined

    return {
      type: 'start_booking',
      label: typeof record.label === 'string' ? record.label : 'Open booking',
      requiresConfirmation: true,
      payload: {
        treatmentSlug: typeof payload.treatmentSlug === 'string' ? payload.treatmentSlug : undefined,
        locationId: typeof payload.locationId === 'string' ? payload.locationId : undefined,
        calendlyUrl: safeCalendlyUrl,
      },
    }
  }

  if (type === 'open_quiz') {
    return {
      type: 'open_quiz',
      label: typeof record.label === 'string' ? record.label : 'Open quiz',
      requiresConfirmation: false,
      payload: {
        quizMode: payload.quizMode === 'treatment' ? 'treatment' : 'product',
      },
    }
  }

  return undefined
}

function sanitizeSuggestions(suggestions: unknown): ConciergeSuggestion[] {
  if (!Array.isArray(suggestions)) return []

  return suggestions.flatMap((item) => {
    if (!item || typeof item !== 'object') return []
    const record = item as Record<string, unknown>
    const label = typeof record.label === 'string' ? record.label : ''
    const prompt = typeof record.prompt === 'string' ? record.prompt : ''
    const type = typeof record.type === 'string' ? record.type : 'question'

    if (!label || !prompt) return []

    return [{
      label,
      prompt,
      type: ['question', 'navigation', 'cart', 'booking', 'education'].includes(type)
        ? type as ConciergeSuggestion['type']
        : 'question',
    }]
  }).slice(0, 4)
}

export function sanitizeConciergeReply(input: string) {
  const cleaned = input
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  const sentences = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((sentence) => sentence.trim()) || []
  const compact = sentences.length > 3 ? sentences.slice(0, 3).join(' ') : cleaned

  if (compact.length <= 420) return compact

  const clipped = compact.slice(0, 420)
  const lastSentenceEnd = Math.max(clipped.lastIndexOf('.'), clipped.lastIndexOf('!'), clipped.lastIndexOf('?'))
  return lastSentenceEnd > 160 ? clipped.slice(0, lastSentenceEnd + 1).trim() : `${clipped.trim()}...`
}

function sanitizeDecision(value: unknown, fallback: ConciergeDecision): ConciergeDecision {
  if (!value || typeof value !== 'object') return fallback

  const record = value as Record<string, unknown>
  const mode = typeof record.mode === 'string' && VALID_MODES.has(record.mode)
    ? record.mode as ConciergeDecision['mode']
    : fallback.mode
  const reply = sanitizeConciergeReply(
    typeof record.reply === 'string' && record.reply.trim()
      ? record.reply
      : fallback.reply,
  )
  const action = sanitizeAction(record.action) ?? fallback.action
  const suggestions = sanitizeSuggestions(record.suggestions)
  const safetyNotes = Array.isArray(record.safetyNotes)
    ? record.safetyNotes.filter((item): item is string => typeof item === 'string')
    : fallback.safetyNotes

  return {
    mode,
    reply,
    action,
    suggestions: suggestions.length ? suggestions : fallback.suggestions,
    safetyNotes,
  }
}

function mentionedProductNames(input: string) {
  const normalized = input.toLowerCase()
  return PRODUCTS
    .filter((product) => normalized.includes(product.name.toLowerCase()))
    .map((product) => product.name)
}

function mentionedTreatmentNames(input: string) {
  const normalized = input.toLowerCase()
  return TREATMENTS
    .filter((treatment) => normalized.includes(treatment.name.toLowerCase()))
    .map((treatment) => treatment.name)
}

function planAllowedEntityNames(plan: ConciergeDecision) {
  return new Set([
    ...mentionedProductNames(plan.reply),
    ...mentionedTreatmentNames(plan.reply),
    ...(plan.action?.payload.products?.map((product) => product.name) || []),
    ...(plan.action?.payload.treatments?.map((treatment) => treatment.name) || []),
    ...(plan.action?.payload.productNames || []),
    ...(plan.action?.payload.treatmentSlug
      ? TREATMENTS
          .filter((treatment) => treatment.slug === plan.action?.payload.treatmentSlug)
          .map((treatment) => treatment.name)
      : []),
  ])
}

function replyIntroducesUnapprovedEntities(reply: string, plan: ConciergeDecision) {
  const allowedNames = planAllowedEntityNames(plan)
  const mentionedNames = [
    ...mentionedProductNames(reply),
    ...mentionedTreatmentNames(reply),
  ]

  return mentionedNames.some((name) => !allowedNames.has(name))
}

function replyClaimsCompletedPendingAction(reply: string, plan: ConciergeDecision) {
  if (!plan.action?.requiresConfirmation) return false

  const normalized = reply.toLowerCase()
  if (plan.action.type === 'add_to_cart') {
    return /\b(added|has been added|is in your (cart|bag)|i('ve| have) added)\b/.test(normalized)
  }

  if (plan.action.type === 'remove_from_cart') {
    return /\b(removed|has been removed|i('ve| have) removed)\b/.test(normalized)
  }

  if (plan.action.type === 'start_booking') {
    return /\b(booked|confirmed|scheduled|reserved)\b/.test(normalized)
  }

  if (plan.action.type === 'navigate') {
    return /\b(opened|i have opened|i opened)\b/.test(normalized)
  }

  return false
}

function preservePlanConstraints(composed: ConciergeDecision, plan: ConciergeDecision): ConciergeDecision {
  const reply = replyIntroducesUnapprovedEntities(composed.reply, plan)
    || replyClaimsCompletedPendingAction(composed.reply, plan)
    ? plan.reply
    : composed.reply

  return {
    ...plan,
    reply,
    suggestions: composed.suggestions.length ? composed.suggestions : plan.suggestions,
  }
}

function buildSystemPrompt(currentPath?: string) {
  return `You are Claire, the Clear Skin concierge: calm, clinically precise, lightly warm, and never chatty.

${BRAND_IDENTITY}

${VOICE_RULES}

Current website path: ${currentPath || '/'}

Architecture rules:
- Use retrieve_business_knowledge before factual answers about policies, products, treatments, booking, safety, or recommendations.
- Use search_products before showing or recommending products.
- Use search_treatments before showing, comparing, or booking treatments.
- Use validate_expert_recommendation before any recommendation, cart proposal, or treatment/booking suggestion.
- Use propose_add_to_cart and propose_remove_from_cart for cart mutations. Cart mutations must always require confirmation.
- Use propose_booking_handoff for booking. The website opens the configured booking handoff after confirmation, usually Calendly.
- Use propose_navigation for navigation. Checkout navigation requires confirmation.
- Use conversation history to resolve "it", "that", "this", "those", and similar references before asking a clarification.
- Use current app state for cart contents and current-page awareness. If the client asks to open the page they are already on, say that they are already there and do not navigate.
- If the user asks a question, answer the question first. Only add a recommendation or action when the user explicitly asks to choose, compare, buy, add/remove from cart, or book.
- Booking and appointment information questions should not create a booking action. Create a booking action only when the user clearly asks to book, schedule, reserve, or request a slot.
- Never invent products, treatments, prices, policies, availability, or contraindications.
- If the tools do not support a request, ask a concise clarification or suggest speaking with a practitioner.
- Keep final replies concise and natural: 1-3 short sentences. Use paragraph text only.
- Do not use markdown, bold text, numbered lists, bullets, headings, or emoji.
- Do not repeat what the UI already asks the client to confirm. State the result, then let the action carry the confirmation.

Recommendation routing:
- Recommend products when the client asks for homecare, routine, daily use, product shopping, or adding to bag.
- Recommend treatments when the client asks for clinic procedures, booking, downtime, injectables, laser, facials, or stronger in-clinic results.
- Start the skin quiz when the client is unsure, asks for skin type/diagnosis, has mixed concerns, or does not know whether products or treatments fit.
- For safety, pregnancy, reactions, infection, severe swelling, or acute symptoms, be conservative and steer to practitioner review.

Final response contract:
Return only valid JSON matching this TypeScript shape:
{
  "mode": "direct_action" | "advisory_chat" | "guided_workflow" | "clarification_needed",
  "reply": string,
  "action"?: ConciergeAction,
  "suggestions": Array<{ "label": string, "type": "question" | "navigation" | "cart" | "booking" | "education", "prompt": string }>,
  "safetyNotes"?: string[]
}

Use any action object returned by a proposal tool exactly, except you may omit it when asking a clarification.`
}

export interface ModelConciergeResult {
  decision: ConciergeDecision
  usage: ConciergeUsage
  retrievalSources: ConciergeRetrievalSource[]
}

function collectRetrievalSources(value: unknown): ConciergeRetrievalSource[] {
  if (!value || typeof value !== 'object') return []
  const chunks = (value as { chunks?: unknown }).chunks
  if (!Array.isArray(chunks)) return []

  return chunks.flatMap((chunk) => {
    if (!chunk || typeof chunk !== 'object') return []
    const record = chunk as Record<string, unknown>
    const id = typeof record.id === 'string' ? record.id : ''
    const title = typeof record.title === 'string' ? record.title : ''
    const score = typeof record.score === 'number' ? record.score : 0
    const retrieval = record.retrieval

    if (
      !id
      || !title
      || (retrieval !== 'pinecone' && retrieval !== 'vector' && retrieval !== 'lexical')
    ) {
      return []
    }

    return [{ id, title, score, retrieval }]
  })
}

function mergeRetrievalSources(
  current: ConciergeRetrievalSource[],
  next: ConciergeRetrievalSource[],
) {
  const byId = new Map(current.map((source) => [source.id, source]))
  for (const source of next) {
    byId.set(source.id, source)
  }
  return Array.from(byId.values()).slice(0, 8)
}

function buildConversationContext(messages: ConciergeRequestBody['messages']) {
  const contextText = messages
    .slice(0, -1)
    .slice(-8)
    .map((message) => message.content)
    .join(' ')
  const normalized = contextText.toLowerCase()
  if (!normalized.trim()) return ''

  const products = PRODUCTS
    .filter((product) => normalized.includes(product.name.toLowerCase()))
    .map((product) => product.name)
  const treatments = TREATMENTS
    .filter((treatment) => normalized.includes(treatment.name.toLowerCase()))
    .map((treatment) => treatment.name)
  const location = ['London', 'Dubai', 'Lagos'].find((name) => normalized.includes(name.toLowerCase()))

  const parts = [
    products.length ? `recent products: ${products.slice(-3).join(', ')}` : '',
    treatments.length ? `recent treatments: ${treatments.slice(-3).join(', ')}` : '',
    location ? `recent location: ${location}` : '',
  ].filter(Boolean)

  return parts.length ? `Conversation context for resolving follow-ups: ${parts.join('; ')}.` : ''
}

function buildAppStateContext(appState: ConciergeRequestBody['appState']) {
  if (!appState) return ''

  const path = appState.currentPath || '/'
  const page = appState.currentPageLabel || path
  const items = appState.cart?.items || []
  const count = appState.cart?.count ?? items.reduce((total, item) => total + item.quantity, 0)
  const cart = items.length
    ? `cart: ${count} item${count === 1 ? '' : 's'} (${items.map((item) => `${item.quantity} x ${item.name}`).join(', ')})`
    : 'cart: empty'

  return `Current app state: page ${page} (${path}); ${cart}.`
}

function buildPlanComposerPrompt(currentPath?: string) {
  return `You are Claire, the Clear Skin concierge. Your job is to rewrite a locked concierge plan into a natural, context-aware answer.

${BRAND_IDENTITY}

${VOICE_RULES}

Current website path: ${currentPath || '/'}

The deterministic plan is authoritative:
- Preserve the plan's mode, action, safety notes, products, treatments, prices, cart facts, and booking facts.
- Do not add, remove, swap, or invent products, treatments, policies, contraindications, or actions.
- If the plan declines or cancels an action, acknowledge that plainly and do not continue recommending unless the user asked for another option.
- If the user has shifted concerns, acknowledge the new concern briefly instead of dragging the previous topic forward.
- If the user asks why, explain the plan's approved choices in relation to the actual question and current cart/context.
- If an action exists, the UI will render it. Your reply should explain the reasoning/result, not repeat button mechanics.
- Keep the answer conversational, specific, and concise: 1-3 short sentences.
- Do not use markdown, headings, bullets, numbered lists, emoji, or salesy language.

Return only valid JSON:
{
  "reply": string,
  "suggestions"?: Array<{ "label": string, "type": "question" | "navigation" | "cart" | "booking" | "education", "prompt": string }>
}`
}

export async function composeConciergeDecisionFromPlan(
  body: ConciergeRequestBody,
  plan: ConciergeDecision,
): Promise<ModelConciergeResult> {
  let usage: ConciergeUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
  let retrievalSources: ConciergeRetrievalSource[] = []

  if (!process.env.OPENROUTER_API_KEY) {
    return { decision: plan, usage, retrievalSources }
  }

  const input = lastUserMessage(body)
  const chunks = await retrieveBusinessKnowledge(`${input}\n${plan.reply}`, 4)
  retrievalSources = collectRetrievalSources({ chunks })

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: buildPlanComposerPrompt(body.currentPath) },
    { role: 'system', content: buildAppStateContext(body.appState) || 'Current app state: not provided.' },
    { role: 'system', content: buildConversationContext(body.messages) || 'Conversation context: none.' },
    { role: 'system', content: `Retrieved business knowledge:\n${formatRetrievedKnowledge(chunks)}` },
    {
      role: 'user',
      content: JSON.stringify({
        userMessage: input,
        deterministicPlan: plan,
        recentMessages: trimConciergeMessages(body.messages, { turns: 4 }),
      }),
    },
  ]

  const completion = await openRouterChatCompletion({
    messages,
    response_format: { type: 'json_object' },
    max_tokens: getConciergeReplyMaxTokens(),
  })
  usage = addUsage(usage, completion.usage, {
    promptTokens: estimateTokensFromMessages(messages),
    completionTokens: estimateTokensFromText(completion.content),
    totalTokens: 0,
  })

  const parsed = parseJsonObject(completion.content) as Record<string, unknown>
  const composed: ConciergeDecision = {
    ...plan,
    reply: sanitizeConciergeReply(
      typeof parsed.reply === 'string' && parsed.reply.trim()
        ? parsed.reply
        : plan.reply,
    ),
    suggestions: sanitizeSuggestions(parsed.suggestions).length
      ? sanitizeSuggestions(parsed.suggestions)
      : plan.suggestions,
  }

  return {
    decision: preservePlanConstraints(composed, plan),
    usage,
    retrievalSources,
  }
}

export async function createModelConciergeDecision(body: ConciergeRequestBody): Promise<ModelConciergeResult> {
  const input = lastUserMessage(body)
  const fallback = createConciergeDecision(input, body.messages, body.appState)
  let usage: ConciergeUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 }
  let retrievalSources: ConciergeRetrievalSource[] = []

  if (!process.env.OPENROUTER_API_KEY) {
    return { decision: fallback, usage, retrievalSources }
  }

  const conversationContext = buildConversationContext(body.messages)
  const appStateContext = buildAppStateContext(body.appState)
  const messages: OpenRouterMessage[] = [
    { role: 'system', content: buildSystemPrompt(body.currentPath) },
    ...(appStateContext ? [{ role: 'system' as const, content: appStateContext }] : []),
    ...(conversationContext ? [{ role: 'system' as const, content: conversationContext }] : []),
    ...trimConciergeMessages(body.messages).map((message) => ({
      role: message.role,
      content: message.content,
    } satisfies OpenRouterMessage)),
  ]

  for (let turn = 0; turn < MAX_TOOL_TURNS; turn += 1) {
    const completion = await openRouterChatCompletion({
      messages,
      tools: CONCIERGE_TOOLS,
      tool_choice: 'auto',
      max_tokens: getConciergeToolTurnMaxTokens(),
    })
    const toolCalls = completion.tool_calls || []
    usage = addUsage(usage, completion.usage, {
      promptTokens: estimateTokensFromMessages(messages),
      completionTokens: estimateTokensFromText(completion.content || JSON.stringify(toolCalls)),
      totalTokens: 0,
    })

    messages.push({
      role: 'assistant',
      content: completion.content || '',
      ...(toolCalls.length ? { tool_calls: toolCalls } : {}),
    })

    if (!toolCalls.length) break

    for (const toolCall of toolCalls) {
      const args = parseToolArguments(toolCall)
      const result = await executeConciergeTool(toolCall.function.name, args)
      if (toolCall.function.name === 'retrieve_business_knowledge') {
        retrievalSources = mergeRetrievalSources(retrievalSources, collectRetrievalSources(result))
      }

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      })
    }
  }

  messages.push({
    role: 'user',
    content: 'Return the final ConciergeDecision JSON now. Use the retrieved knowledge and tool results. Do not call more tools.',
  })

  const finalCompletion = await openRouterChatCompletion({
    messages,
    response_format: { type: 'json_object' },
    max_tokens: getConciergeReplyMaxTokens(),
  })
  usage = addUsage(usage, finalCompletion.usage, {
    promptTokens: estimateTokensFromMessages(messages),
    completionTokens: estimateTokensFromText(finalCompletion.content),
    totalTokens: 0,
  })

  const parsed = parseJsonObject(finalCompletion.content)
  return {
    decision: sanitizeDecision(parsed, fallback),
    usage,
    retrievalSources,
  }
}
