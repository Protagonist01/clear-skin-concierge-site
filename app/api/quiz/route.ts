import { NextRequest, NextResponse } from 'next/server'
import { QUIZ_KNOWLEDGE, VOICE_RULES } from '@/lib/knowledge'
import { openRouterChat } from '@/lib/openrouter'

export async function POST(req: NextRequest) {
  const { answers, mode } = await req.json()

  const relevantKnowledge = mode === 'treatment'
    ? `${QUIZ_KNOWLEDGE.treatments}\n\n${QUIZ_KNOWLEDGE.recommendations}`
    : `${QUIZ_KNOWLEDGE.products}\n\n${QUIZ_KNOWLEDGE.recommendations}`

  const systemPrompt = `You are a clinical skin assessment AI for Clear Skin Clinic & Skincare — an expert aesthetic clinic in London, Dubai, and Lagos.

Your role: analyse a client's quiz answers and recommend the most clinically appropriate ${mode === 'treatment' ? 'treatment' : 'product pairing'}.

${VOICE_RULES}

${relevantKnowledge}

RESPONSE FORMAT — return valid JSON only, no markdown, no preamble:
{
  "primary": "[exact treatment or product name from the knowledge above]",
  "secondary": "[exact second recommendation name]",
  "rationale": "[2 sentences maximum — clinical reasoning specific to THIS client's exact combination of answers. References their specific concern, skin type, and routine.]",
  "summary": "[1 sentence personalised opener]"
}`

  const userPrompt = `Client quiz answers:
- Primary concern: ${answers.concern}
- Skin type: ${answers.skinType}
- Age range: ${answers.age}
- Skin feel by midday: ${answers.midday}
- Current routine: ${answers.routine}
- Primary outcome goal: ${answers.outcome}
${answers.budget ? `- Treatment budget: ${answers.budget}` : ''}
Mode: ${mode}

Reason across ALL answers together. Do not base recommendation on one answer alone.`

  try {
    const content = await openRouterChat({
      max_tokens: 400,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    })
    const result = JSON.parse(content)

    return NextResponse.json(result)
  } catch (err) {
    console.error('[quiz/route] OpenRouter error:', err)
    return NextResponse.json({ error: 'api_error' }, { status: 500 })
  }
}
