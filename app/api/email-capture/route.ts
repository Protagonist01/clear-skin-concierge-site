import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

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
  const { email, source, quizResult, productName, reminderDays } = await req.json()

  // Validate email
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ success: false, error: 'Invalid email' }, { status: 400 })
  }

  const hasQuizResult = quizResult?.concern && quizResult?.primary
  const isReminderCapture = source === 'replenishment-reminder' || source === 'upsell-replenishment'
  const siteUrl = getSiteUrl(req)
  const supportEmail = process.env.CLEAR_SKIN_SUPPORT_EMAIL || 'support@clearskin.com'
  const fromEmail = process.env.CLEAR_SKIN_FROM_EMAIL || 'Clear Skin <onboarding@resend.dev>'
  const ctaHref = isReminderCapture
    ? `${siteUrl}/skincare`
    : hasQuizResult
      ? `${siteUrl}/skincare`
      : source === 'booking'
        ? `${siteUrl}/account`
        : `${siteUrl}/treatments`
  const unsubscribeHref = `mailto:${supportEmail}?subject=${encodeURIComponent('Unsubscribe request')}&body=${encodeURIComponent(`Please unsubscribe ${email} from Clear Skin updates.`)}`

  const subject = isReminderCapture
    ? `Your ${productName || 'Clear Skin'} replenishment reminder is set.`
    : hasQuizResult
    ? `Your Clear Skin profile is ready.`
    : `Welcome to Clear Skin.`

  const previewText = isReminderCapture
    ? `We'll remind you when it's time to replenish.`
    : hasQuizResult
    ? `Your personalised recommendation for ${quizResult.concern}.`
    : `Skin science, simplified.`

  const bodyHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#F4F8F6;font-family:'Plus Jakarta Sans',Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">${previewText}</div>
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">

    <!-- Wordmark -->
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-family:'Fraunces',Georgia,serif;
        font-size:26px;font-weight:200;letter-spacing:0.14em;
        color:#0D1F18;">CLEAR<span style="color:#2D7A5E;">.</span>SKIN</span>
      <div style="width:40px;height:1px;background:#3DB888;
        margin:8px auto 0;"></div>
    </div>

    <!-- Body -->
    <div style="background:#FDFFFE;border:1px solid #BDD0C7;
      border-radius:8px;padding:32px;">

      ${isReminderCapture ? `
      <p style="font-family:'Fraunces',Georgia,serif;
        font-size:22px;font-weight:300;color:#0D1F18;
        line-height:1.4;margin:0 0 16px;">
        Your replenishment reminder is confirmed.
      </p>
      <p style="font-size:14px;color:#243B30;line-height:1.7;margin:0 0 16px;">
        We've set a reminder for <strong>${productName || 'your selected product'}</strong>.
        We'll get in touch in approximately <strong>${reminderDays || 45} days</strong>
        so you can replenish before your routine runs out.
      </p>
      <p style="font-size:13px;color:#5A7A6C;line-height:1.6;margin:0 0 24px;">
        If you'd like to review your regimen before then, our clinical team is here
        to help refine the right routine for your skin.
      </p>
      ` : hasQuizResult ? `
      <p style="font-family:'Fraunces',Georgia,serif;
        font-size:22px;font-weight:300;color:#0D1F18;
        line-height:1.4;margin:0 0 16px;">
        Your skin profile is ready.
      </p>
      <p style="font-size:14px;color:#243B30;line-height:1.7;margin:0 0 16px;">
        Based on your assessment, we've identified <strong>${quizResult.concern}</strong>
        as your primary concern. Your recommended starting point is the
        <strong>${quizResult.primary}</strong>${quizResult.secondary ?
        `, paired with the <strong>${quizResult.secondary}</strong>` : ''}.
      </p>
      <p style="font-size:13px;color:#5A7A6C;line-height:1.6;margin:0 0 24px;">
        Our clinical approach is to address the root concern precisely
        before broadening the protocol. When you're ready to speak with
        a practitioner, we're here.
      </p>
      ` : `
      <p style="font-family:'Fraunces',Georgia,serif;
        font-size:22px;font-weight:300;color:#0D1F18;
        line-height:1.4;margin:0 0 16px;">
        Welcome to Clear Skin.
      </p>
      <p style="font-size:14px;color:#243B30;line-height:1.7;margin:0 0 16px;">
        Every skin concern has a clinical answer. We're here to help
        you find yours &mdash; through our treatment menu, our skincare range,
        or a conversation with one of our practitioners.
      </p>
      <p style="font-size:13px;color:#5A7A6C;line-height:1.6;margin:0 0 24px;">
        We'll be in touch with considered insights from our clinical team.
        No promotions. No noise.
      </p>
      `}

      <!-- CTA -->
      <div style="text-align:center;">
        <a href="${ctaHref}"
          style="display:inline-block;background:#1B4A38;color:#FDFFFE;
          font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:13px;
          font-weight:600;letter-spacing:0.07em;text-decoration:none;
          padding:12px 28px;border-radius:4px;">
          ${isReminderCapture ? 'Explore the skincare range &rarr;' : hasQuizResult ? 'View your skin profile &rarr;' : source === 'booking' ? 'Open My Account &rarr;' : 'Explore Clear Skin &rarr;'}
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;">
      <p style="font-size:11px;color:#8AAAA0;line-height:1.6;">
        Clear Skin Clinic &amp; Skincare &middot; London &middot; Dubai &middot; Lagos<br>
        <a href="${unsubscribeHref}" style="color:#8AAAA0;">Unsubscribe or change preferences</a>
      </p>
    </div>
  </div>
</body>
</html>`

  try {
    await getResend().emails.send({
      from: fromEmail,
      to: email,
      subject,
      html: bodyHtml,
    })

    console.log(`[Clear Skin Email Capture] ${email} | Source: ${source}${hasQuizResult ? ` | Concern: ${quizResult.concern}` : ''}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Clear Skin Email Capture] Resend error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    )
  }
}
