import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createEmailLoginChallenge } from '@/lib/account-store'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

function getSiteUrl(req: NextRequest) {
  const configured = process.env.SITE_URL || process.env.OPENROUTER_SITE_URL
  if (configured) {
    return configured.replace(/\/$/, '')
  }

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  const protocol = req.headers.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https')
  return host ? `${protocol}://${host}` : 'http://localhost:3000'
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 })
  }

  const challenge = createEmailLoginChallenge({ email })
  const fromEmail = process.env.CLEAR_SKIN_FROM_EMAIL || 'Clear Skin <onboarding@resend.dev>'
  const siteUrl = getSiteUrl(req)

  try {
    await getResend().emails.send({
      from: fromEmail,
      to: email,
      subject: 'Your Clear Skin account access code',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#243B30;">
          <p style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#5A7A6C;">Clear Skin Account</p>
          <h1 style="font-family:Georgia,serif;font-size:30px;font-weight:400;color:#0D1F18;margin:16px 0;">Your access code</h1>
          <p style="font-size:15px;line-height:1.7;">Use the code below to open your account and view bookings, skincare orders, and review activity.</p>
          <div style="margin:28px 0;padding:20px 24px;border:1px solid #BDD0C7;border-radius:10px;background:#F4F8F6;">
            <p style="font-size:32px;letter-spacing:0.22em;color:#1B4A38;margin:0;">${challenge.code}</p>
          </div>
          <p style="font-size:13px;line-height:1.7;color:#5A7A6C;">This code expires in 15 minutes. If you did not request it, you can ignore this message.</p>
          <p style="font-size:13px;line-height:1.7;color:#5A7A6C;">Account access page: <a href="${siteUrl}/account" style="color:#1B4A38;">${siteUrl}/account</a></p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Account Access] Failed to send code:', error)
    return NextResponse.json(
      { success: false, error: 'We could not send the access code right now.' },
      { status: 500 },
    )
  }
}
