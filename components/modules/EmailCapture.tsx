'use client';

import Link from 'next/link';
import { useCallback, useRef, useState } from 'react';

export function registerEmailFlowDemoTrigger(handler: () => void) {
  void handler;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EmailCaptureProps {
  source: 'footer' | 'homepage' | 'quiz' | 'replenishment' | 'booking';
  compact?: boolean;
  quizResult?: { concern: string; primary: string; secondary: string };
}

export default function EmailCapture({
  source,
  compact = false,
  quizResult,
}: EmailCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setError(false);

      if (!EMAIL_RE.test(email.trim())) {
        setInvalid(true);
        inputRef.current?.focus();
        setTimeout(() => setInvalid(false), 800);
        return;
      }

      setLoading(true);

      try {
        const response = await fetch('/api/email-capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            source,
            quizResult: quizResult || undefined,
          }),
        });

        if (!response.ok) {
          throw new Error('Unable to subscribe');
        }

        setSubmitted(true);
      } catch (submitError) {
        console.error('[EmailCapture] Submission failed:', submitError);
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [email, quizResult, source],
  );

  const spinner = (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{ animation: 'ec-spin 0.8s linear infinite' }}
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="24"
        strokeDashoffset="7"
        strokeLinecap="round"
      />
    </svg>
  );

  const submittedAction = source === 'booking'
    ? { href: '/account', label: 'Open My Account' }
    : source === 'quiz'
      ? { href: '/skincare', label: 'View skincare' }
      : { href: '/treatments', label: 'Explore treatments' };

  if (submitted) {
    return (
      <>
        <style>{`
          @keyframes ec-pop {
            0% { opacity: 0; transform: scale(0.85); }
            100% { opacity: 1; transform: scale(1); }
          }
          .ec-pop { animation: ec-pop 220ms ease both; }
        `}</style>
        <div className="ec-pop">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-[color:var(--ink)]">
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                <path
                  d="M1 5L5.2 9L13 1"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="text-[14px] text-[color:var(--ink)]">
              You&apos;re on the list.
            </span>
          </div>
          <Link
            href={submittedAction.href}
            className="mt-3 text-[13px] text-[color:var(--muted)] transition-colors hover:text-[color:var(--ink)]"
          >
            {submittedAction.label} -&gt;
          </Link>
        </div>
      </>
    );
  }

  if (compact) {
    return (
      <>
        <style>{`
          @keyframes ec-shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-4px); }
            40% { transform: translateX(4px); }
            60% { transform: translateX(-3px); }
            80% { transform: translateX(3px); }
          }
          @keyframes ec-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .ec-shake { animation: ec-shake 0.4s ease both; }
        `}</style>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-3 sm:flex-row sm:items-stretch"
        >
          <input
            ref={inputRef}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Your email"
            className={`min-h-[48px] flex-1 rounded-xl border bg-[color:rgba(255,253,249,0.08)] px-4 text-[15px] text-[color:var(--chalk)] placeholder:text-[color:rgba(255,253,249,0.52)] focus:outline-none ${
              invalid ? 'ec-shake' : ''
            }`}
            style={{ borderColor: 'rgba(255,253,249,0.14)' }}
            disabled={loading}
          />
          <button
            type="submit"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[color:var(--chalk)] px-5 text-[15px] font-medium text-[color:var(--ink)] transition-colors hover:bg-[color:var(--accent-soft)]"
            disabled={loading}
          >
            {loading ? spinner : '->'}
          </button>
        </form>
        {error && (
          <p className="mt-3 text-[12px] text-[#ffb0b0]">
            Something went wrong. Please try again.
          </p>
        )}
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes ec-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-3px); }
          80% { transform: translateX(3px); }
        }
        @keyframes ec-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .ec-shake { animation: ec-shake 0.4s ease both; }
      `}</style>

      <div className="mx-auto flex w-full max-w-[520px] flex-col items-center gap-4 text-center">
        <h2 className="font-display text-[28px] tracking-[-0.05em] text-[color:var(--ink)]">
          Stay informed. Not overwhelmed.
        </h2>
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex w-full flex-col gap-3 md:flex-row"
        >
          <input
            ref={inputRef}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email address"
            className={`min-h-[50px] flex-1 rounded-xl border border-[color:var(--line)] bg-[color:var(--card)] px-4 text-[15px] text-[color:var(--ink)] placeholder:text-[color:var(--muted)] focus:outline-none ${
              invalid ? 'ec-shake' : ''
            }`}
            disabled={loading}
          />
          <button
            type="submit"
            className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-xl bg-[color:var(--ink)] px-6 text-[15px] font-medium text-[color:var(--chalk)] transition-colors hover:bg-[color:var(--accent-strong)]"
            disabled={loading}
          >
            {loading ? (
              <>
                {spinner}
                <span>Sending</span>
              </>
            ) : (
              'Subscribe'
            )}
          </button>
        </form>
        {error && (
          <p className="text-[12px] text-[#c44f4f]">
            Something went wrong. Please try again.
          </p>
        )}
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
          No spam. Unsubscribe at any time.
        </p>
        <p className="max-w-[420px] text-[13px] leading-6 text-[color:var(--muted)]">
          Monthly skin insights from our clinical team. No promotions, no
          noise.
        </p>
      </div>
    </>
  );
}
