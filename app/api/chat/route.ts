import { NextRequest, NextResponse } from 'next/server'
import { createConciergeDecision } from '@/lib/concierge/router'
import type { ConciergeActionType, ConciergeDecision, ConciergeRequestBody } from '@/lib/concierge/types'
import {
  composeConciergeDecisionFromPlan,
  createModelConciergeDecision,
  sanitizeConciergeReply,
} from '@/lib/concierge/model-agent'
import {
  checkConciergeCostGate,
  recordConciergeCostEvent,
  resolveConciergeIdentity,
} from '@/lib/concierge/cost-control'
import {
  getSemanticCachedDecision,
  writeSemanticCachedDecision,
} from '@/lib/concierge/semantic-cache'

function getLastUserMessage(body: ConciergeRequestBody) {
  return [...(body.messages || [])].reverse().find((message) => message.role === 'user')?.content || ''
}

function jsonWithIdentity(payload: Record<string, unknown>, identity: ReturnType<typeof resolveConciergeIdentity>, init?: ResponseInit) {
  const response = NextResponse.json(payload, init)

  if (identity.cookie) {
    response.cookies.set(identity.cookie.name, identity.cookie.value, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: identity.cookie.maxAge,
    })
  }

  return response
}

function cleanDecision(decision: ConciergeDecision): ConciergeDecision {
  return {
    ...decision,
    reply: sanitizeConciergeReply(decision.reply),
  }
}

function isStateSensitiveRequest(input: string, body: ConciergeRequestBody) {
  const text = input.toLowerCase()
  const hasAppState = Boolean(body.appState?.currentPath || body.appState?.cart)

  if (!hasAppState) return false

  const isDeclineOrCancel = /^(no|nope)\b/.test(text)
    || /\b(no thanks|not now|cancel|stop|never mind|nevermind|leave it|leave them|don't|dont|do not)\b/.test(text)
  const asksAboutCart = /\b(what'?s|what is|what do i have|which items?|items?)\b.*\b(cart|bag|basket)\b/.test(text)
    || /\b(cart|bag|basket)\b.*\b(contain|contains|inside|empty|items?|have)\b/.test(text)
    || /\b(do i have|is there|is .* in)\b.*\b(cart|bag|basket)\b/.test(text)
    || /\b(are|is)\b.*\b(in|inside|on)\b.*\b(cart|bag|basket)\b/.test(text)
    || /\b(these|those|they|them|it|that)\b.*\b(cart|bag|basket)\b.*\b(already|currently|now)?\b/.test(text)
    || /\b(already|currently)\b.*\b(in|inside|on)?\b.*\b(cart|bag|basket)\b/.test(text)
  const asksToNavigate = /\b(open|go to|take me|navigate|show me|view|browse)\b/.test(text)
  const asksForRationale = /\b(explain|chose|choose|chosen|picked|why these|why those|why them|why did you|reason|rationale)\b/.test(text)
  const usesContextReference = /\b(it|that|this|these|those|they|them|the treatment|the product|the products|the routine)\b/.test(text)

  return isDeclineOrCancel || asksAboutCart || asksToNavigate || asksForRationale || usesContextReference
}

function shouldUseDeterministicSafety(decision: ConciergeDecision) {
  return Boolean(decision.safetyNotes?.length)
}

function hasDeterministicKnowledgeAnswer(input: string) {
  const text = input.toLowerCase()

  return /\b(delivery|deliver|shipping|ship|return|refund|contact|phone|email|patch test|payment plan|installment|instalment|booking|appointment|appointments|consultation|availability)\b/.test(text)
}

function asksForAdvisoryComposition(input: string) {
  const text = input.toLowerCase()

  return /\b(routine|recommend|suggest|advise|advice|which|what should|should i|compare|explain|why|best for|good for)\b/.test(text)
}

function isExplicitBrowseRequest(input: string) {
  return /\b(show|browse|view|list|open|go to|take me|navigate)\b/.test(input.toLowerCase())
}

function shouldFastPathAction(actionType: ConciergeActionType, input: string) {
  if (actionType === 'add_to_cart' || actionType === 'remove_from_cart' || actionType === 'navigate' || actionType === 'open_quiz') {
    return true
  }

  if (actionType === 'start_booking') {
    return !asksForAdvisoryComposition(input)
  }

  if (actionType === 'show_products' || actionType === 'show_treatments') {
    return isExplicitBrowseRequest(input) && !asksForAdvisoryComposition(input)
  }

  return false
}

function shouldUseDeterministicFastPath(decision: ConciergeDecision, input: string, body: ConciergeRequestBody) {
  if (process.env.CONCIERGE_FORCE_MODEL_COMPOSER === 'true') return false

  return (decision.action ? shouldFastPathAction(decision.action.type, input) : false)
    || decision.mode === 'clarification_needed'
    || isStateSensitiveRequest(input, body)
    || hasDeterministicKnowledgeAnswer(input)
}

function shouldComposePlan(decision: ConciergeDecision, input: string, body: ConciergeRequestBody) {
  return Boolean(decision.action)
    || isStateSensitiveRequest(input, body)
    || decision.mode === 'guided_workflow'
    || decision.mode === 'advisory_chat'
}

export async function POST(req: NextRequest) {
  const startedAt = Date.now()
  const runtimeWithLatency = (runtime: Record<string, unknown>) => ({
    ...runtime,
    latencyMs: Date.now() - startedAt,
  })

  try {
    const rawBody = await req.json() as ConciergeRequestBody
    const body: ConciergeRequestBody = {
      ...rawBody,
      currentPath: rawBody.appState?.currentPath || rawBody.currentPath,
      appState: {
        ...(rawBody.appState || {}),
        currentPath: rawBody.appState?.currentPath || rawBody.currentPath,
      },
    }
    const input = getLastUserMessage(body)
    const identity = resolveConciergeIdentity(req.cookies)

    if (!input.trim()) {
      return jsonWithIdentity({
        mode: 'clarification_needed',
        reply: 'Tell me what your skin needs, or ask me to book, compare, or add something to your bag.',
        suggestions: [
          { label: 'Find a routine', type: 'education', prompt: 'Help me find the right skincare routine.' },
          { label: 'Book consultation', type: 'booking', prompt: 'Help me book a consultation.' },
        ],
      }, identity)
    }

    const gate = checkConciergeCostGate(identity.userKey)
    if (!gate.allowed) {
      const fallback = cleanDecision(createConciergeDecision(input, body.messages, body.appState))
      recordConciergeCostEvent({
        userKey: identity.userKey,
        eventType: 'cost_control_fallback',
        metadata: { reason: gate.reason },
      })

      return jsonWithIdentity({
        ...fallback,
        runtime: runtimeWithLatency({
          source: 'cost_control_deterministic_fallback',
          reason: gate.reason,
        }),
      }, identity)
    }

    recordConciergeCostEvent({
      userKey: identity.userKey,
      eventType: 'request',
    })

    const deterministicDecision = cleanDecision(createConciergeDecision(input, body.messages, body.appState))
    if (shouldUseDeterministicSafety(deterministicDecision)) {
      recordConciergeCostEvent({
        userKey: identity.userKey,
        eventType: 'deterministic_safety_fast_path',
        estimatedUsd: 0,
      })

      return jsonWithIdentity({
        ...deterministicDecision,
        runtime: runtimeWithLatency({ source: 'deterministic_safety_fast_path' }),
      }, identity)
    }

    if (shouldUseDeterministicFastPath(deterministicDecision, input, body)) {
      recordConciergeCostEvent({
        userKey: identity.userKey,
        eventType: 'deterministic_fast_path',
        estimatedUsd: 0,
        metadata: { mode: deterministicDecision.mode },
      })

      return jsonWithIdentity({
        ...deterministicDecision,
        runtime: runtimeWithLatency({
          source: 'deterministic_fast_path',
          reason: deterministicDecision.action ? 'deterministic_action' : 'deterministic_reply',
        }),
      }, identity)
    }

    const canUseSemanticCache = !deterministicDecision.action && !isStateSensitiveRequest(input, body)
    const cachedDecision = canUseSemanticCache ? await getSemanticCachedDecision(input) : null
    if (cachedDecision) {
      recordConciergeCostEvent({
        userKey: identity.userKey,
        eventType: 'semantic_cache_hit',
      })

      return jsonWithIdentity({
        ...cleanDecision(cachedDecision),
        runtime: runtimeWithLatency({ source: 'semantic_cache' }),
      }, identity)
    }

    if (process.env.OPENROUTER_API_KEY) {
      if (shouldComposePlan(deterministicDecision, input, body)) {
        try {
          const { decision: composedDecision, retrievalSources, usage } = await composeConciergeDecisionFromPlan(body, deterministicDecision)
          recordConciergeCostEvent({
            userKey: identity.userKey,
            eventType: 'model_plan_composer',
            usage,
            metadata: retrievalSources.length ? { retrievalSources } : undefined,
          })
          void writeSemanticCachedDecision(input, composedDecision)

          return jsonWithIdentity({
            ...cleanDecision(composedDecision),
            runtime: runtimeWithLatency({
              source: 'model_plan_composer',
              retrievalSources,
            }),
          }, identity)
        } catch (composerError) {
          console.error('[api/chat] Model plan composer failed, using deterministic plan:', composerError)
          recordConciergeCostEvent({
            userKey: identity.userKey,
            eventType: 'model_plan_composer_error_fallback',
          })

          return jsonWithIdentity({
            ...deterministicDecision,
            runtime: runtimeWithLatency({ source: 'deterministic_fallback_after_composer_error' }),
          }, identity)
        }
      }

      try {
        const { decision: modelDecision, retrievalSources, usage } = await createModelConciergeDecision(body)
        recordConciergeCostEvent({
          userKey: identity.userKey,
          eventType: 'model_completion',
          usage,
          metadata: retrievalSources.length ? { retrievalSources } : undefined,
        })
        void writeSemanticCachedDecision(input, modelDecision)

        return jsonWithIdentity({
          ...cleanDecision(modelDecision),
          runtime: runtimeWithLatency({
            source: 'model_tools_rag',
            retrievalSources,
          }),
        }, identity)
      } catch (modelError) {
        console.error('[api/chat] Model concierge failed, using deterministic fallback:', modelError)
        recordConciergeCostEvent({
          userKey: identity.userKey,
          eventType: 'model_error_fallback',
        })
      }
    }

    return jsonWithIdentity({
      ...deterministicDecision,
      runtime: runtimeWithLatency({
        source: process.env.OPENROUTER_API_KEY ? 'deterministic_fallback_after_model_error' : 'deterministic_fallback_no_model_key',
      }),
    }, identity)
  } catch (error) {
    console.error('[api/chat] Request failed:', error)
    return NextResponse.json(
      {
        mode: 'clarification_needed',
        reply: 'I could not process that request just now. Please rephrase it or ask the team to follow up directly.',
        suggestions: [
          { label: 'Book consultation', type: 'booking', prompt: 'Help me book a consultation.' },
          { label: 'Contact clinic', type: 'education', prompt: 'How can I contact the clinic?' },
        ],
      },
      { status: 500 },
    )
  }
}
