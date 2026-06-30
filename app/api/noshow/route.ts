import { NextRequest, NextResponse } from 'next/server'
import { NOSHOW_KNOWLEDGE, VOICE_RULES } from '@/lib/knowledge'
import { openRouterChat } from '@/lib/openrouter'

export async function POST(req: NextRequest) {
  const { clientName, treatmentName, location } = await req.json()

  const systemPrompt = `You are writing on behalf of Clear Skin Clinic & Skincare
— an expert aesthetic clinic in London, Dubai, and Lagos.

${VOICE_RULES}

TREATMENT REFERENCE:
${NOSHOW_KNOWLEDGE}

Use your knowledge of the ${treatmentName} treatment — what it involves,
what the client was preparing for — to make the message feel informed and specific.`

  const userPrompt = `Write a no-show recovery message to ${clientName} who
missed their ${treatmentName} appointment today at our ${location} clinic.

- 3 short paragraphs maximum
- Acknowledge the missed appointment warmly, without accusation
- Reference what they were coming in for and why it matters
- Invite them to rebook — simple, non-pushy
- Use their name (${clientName}) at least once
- Sign off from 'The Clear Skin Team'`

  try {
    const message = await openRouterChat({
      max_tokens: 300,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error('[noshow/route] OpenRouter error:', error)
    return NextResponse.json({ error: 'api_error' }, { status: 500 })
  }
}
