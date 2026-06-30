'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AccountAccessPanel() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSendCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch('/api/account/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to send access code.')
      }

      setStep('code')
      setMessage('We sent a 6-digit access code to your email.')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to send access code.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVerifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/account/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to verify access code.')
      }

      router.refresh()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to verify access code.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="soft-panel rounded-[2rem] p-6 lg:p-8">
      <span className="eyebrow">Secure Access</span>
      <h1 className="mt-6 font-display text-[clamp(3rem,6vw,5rem)] leading-[0.92] tracking-[-0.08em] text-[color:var(--ink)]">
        Open your account with an email code.
      </h1>
      <p className="mt-5 max-w-[620px] text-[16px] leading-8 text-[color:var(--ink-soft)]">
        Enter the same email you used for booking or checkout. We&apos;ll send a
        short-lived access code so you can view your bookings and orders from any
        browser.
      </p>

      {step === 'email' ? (
        <form className="mt-8 max-w-[480px]" onSubmit={handleSendCode}>
          <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="field-input"
            required
          />
          <button
            type="submit"
            disabled={submitting}
            className="button-shell button-primary mt-6 inline-flex min-h-[48px] items-center justify-center rounded-xl px-6 py-3 text-[15px] font-medium"
          >
            {submitting ? 'Sending code...' : 'Send access code'}
          </button>
        </form>
      ) : (
        <form className="mt-8 max-w-[480px]" onSubmit={handleVerifyCode}>
          <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
            Access code
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            className="field-input"
            required
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="button-shell button-primary inline-flex min-h-[48px] items-center justify-center rounded-xl px-6 py-3 text-[15px] font-medium"
            >
              {submitting ? 'Verifying...' : 'Verify and open account'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('email')
                setCode('')
                setMessage('')
                setError('')
              }}
              className="button-shell button-ghost inline-flex min-h-[48px] items-center justify-center rounded-xl px-6 py-3 text-[15px] font-medium"
            >
              Change email
            </button>
          </div>
        </form>
      )}

      {message && (
        <p className="mt-4 text-[14px] text-[color:var(--accent-deep)]">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-4 text-[14px] text-[color:#9f3d32]">
          {error}
        </p>
      )}
    </div>
  )
}
