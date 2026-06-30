'use client';

import { useState } from 'react';
import { BellRing, Check, ShoppingBag } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Reveal } from '@/components/ui/ExperienceMotion';
import { addProductsToBag } from '@/lib/bag';

interface ProductActionsProps {
  className?: string;
  productName: string;
}

export default function ProductActions({
  className,
  productName,
}: ProductActionsProps) {
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);
  const [addedToBag, setAddedToBag] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddToBag = () => {
    setAddedToBag(true);
    void addProductsToBag([productName]);
    window.setTimeout(() => setAddedToBag(false), 1800);
  };

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'replenishment-reminder',
          productName,
          reminderDays: 45,
        }),
      });

      if (!response.ok) {
        throw new Error('Reminder request failed');
      }

      setReminderSet(true);
      setShowEmailCapture(false);
      setEmail('');
    } catch {
      setError('We could not set your reminder just now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={className}>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <Button className="w-full sm:w-auto" onClick={handleAddToBag}>
          {addedToBag ? (
            <>
              <Check size={16} strokeWidth={1.8} />
              Added to Bag
            </>
          ) : (
            <>
              <ShoppingBag size={16} strokeWidth={1.8} />
              Add to Bag
            </>
          )}
        </Button>
        <Button href="/book" variant="ghost" className="w-full sm:w-auto">
          Book a Consultation
        </Button>
      </div>

      <Reveal>
        <div className="soft-panel rounded-[1.7rem] p-5">
          {reminderSet ? (
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-[color:var(--accent-deep)]">
                <Check size={18} strokeWidth={1.9} />
              </span>
              <div>
                <p className="font-display text-[24px] leading-none tracking-[-0.04em] text-[color:var(--ink)]">
                  Reminder set.
                </p>
                <p className="mt-2 text-[14px] text-[color:var(--ink-soft)]">
                  We&apos;ll get in touch in 45 days when it&apos;s time to replenish.
                </p>
              </div>
            </div>
          ) : showEmailCapture ? (
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
              <div>
                <p className="font-display text-[24px] leading-none tracking-[-0.04em] text-[color:var(--ink)]">
                  Set your replenishment reminder.
                </p>
                <p className="mt-2 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                  Enter your email and we&apos;ll let you know in roughly 45 days.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Enter your email"
                  required
                  className="field-input flex-1"
                />
                <Button
                  type="submit"
                  className={isSubmitting ? 'pointer-events-none opacity-70' : ''}
                >
                  {isSubmitting ? 'Setting Reminder...' : 'Set Reminder'}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-[26px] leading-[0.96] tracking-[-0.04em] text-[color:var(--ink)]">
                  This product lasts approximately 45 days.
                </p>
                <p className="mt-2 max-w-[480px] text-[14px] leading-7 text-[color:var(--ink-soft)]">
                  Set a reminder and we&apos;ll let you know when it&apos;s time
                  to replenish, so the routine stays consistent.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEmailCapture(true)}
                className="glass-pill inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-medium text-[color:var(--ink)] transition-transform duration-300 hover:-translate-y-0.5"
              >
                <BellRing size={16} strokeWidth={1.8} />
                Set Reminder
              </button>
            </div>
          )}
          {error && (
            <p className="mt-3 text-[13px] text-[color:#9f3d32]">
              {error}
            </p>
          )}
        </div>
      </Reveal>
    </div>
  );
}
