import { NextRequest, NextResponse } from 'next/server'
import { UPSELL_KNOWLEDGE, VOICE_RULES } from '@/lib/knowledge'
import { openRouterChat } from '@/lib/openrouter'

export async function POST(req: NextRequest) {
  const { product1, product2, treatmentName, mode } = await req.json()

  const context = mode === 'homecare'
    ? `a client who has just completed a ${treatmentName} treatment at Clear Skin`
    : `a client managing a ${treatmentName} skin concern`

  const systemPrompt = `You are a clinical copywriter for Clear Skin Clinic & Skincare.

${VOICE_RULES}

${UPSELL_KNOWLEDGE}`

  const userPrompt = `In 2 sentences maximum, explain why ${product1} and
${product2} are the recommended pairing for ${context}.
Clinical rationale only. Reference the specific mechanism of each product.
Be specific to this combination — not generic.`

  try {
    const explanation = await openRouterChat({
      max_tokens: 120,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    })

    return NextResponse.json({ explanation })
  } catch (error) {
    console.error('[upsell/route] OpenRouter error:', error)
    return NextResponse.json({ error: 'api_error' }, { status: 500 })
  }
}
