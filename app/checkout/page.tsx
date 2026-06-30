'use client';

import { useEffect, useMemo, useState } from 'react';
import { LockKeyhole, PackageCheck, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import {
  Reveal,
  StaggerGroup,
  StaggerItem,
} from '@/components/ui/ExperienceMotion';
import { BAG_UPDATED_EVENT, clearBag, hydrateBag, readBag } from '@/lib/bag';
import { formatCurrency, parsePriceToNumber, type BagItem } from '@/lib/cart';
import type { OrderRecord } from '@/lib/account-store';

interface CheckoutFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  notes: string;
  paymentProfile: PaymentProfileId;
}

type PaymentProfileId = 'visa-4242' | 'mastercard-4444' | 'amex-0005';

const PAYMENT_PROFILES: Array<{
  id: PaymentProfileId;
  label: string;
  description: string;
}> = [
  {
    id: 'visa-4242',
    label: 'Visa ending 4242',
    description: 'Standard card authorization for skincare purchases.',
  },
  {
    id: 'mastercard-4444',
    label: 'Mastercard ending 4444',
    description: 'Alternative card profile for a realistic second test path.',
  },
  {
    id: 'amex-0005',
    label: 'Amex ending 0005',
    description: 'Premium card profile with the same mock capture flow.',
  },
];

const EMPTY_FORM: CheckoutFormState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  notes: '',
  paymentProfile: 'visa-4242',
};

export default function CheckoutPage() {
  const [items, setItems] = useState<BagItem[]>([]);
  const [form, setForm] = useState<CheckoutFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submittedOrder, setSubmittedOrder] = useState<OrderRecord | null>(null);

  useEffect(() => {
    const sync = async () => {
      setLoading(true);
      try {
        const hydrated = await hydrateBag();
        setItems(hydrated);
      } finally {
        setLoading(false);
      }
    };

    const handleBagUpdated = () => setItems([...readBag()]);

    void sync();
    window.addEventListener(BAG_UPDATED_EVENT, handleBagUpdated as EventListener);
    return () => {
      window.removeEventListener(BAG_UPDATED_EVENT, handleBagUpdated as EventListener);
    };
  }, []);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) => total + parsePriceToNumber(item.price) * item.quantity,
        0,
      ),
    [items],
  );

  const itemCount = useMemo(
    () => items.reduce((count, item) => count + item.quantity, 0),
    [items],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Checkout failed');
      }

      setSubmittedOrder(payload.order);
      setItems([]);
      await clearBag();
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="pb-24">
      <section id="checkout-flow" className="section-shell">
        <div className="section-wrap px-4">
          <div className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr]">
            <div>
              <Reveal>
                <span className="eyebrow">Checkout</span>
              </Reveal>
              <Reveal delay={0.08}>
                <h1 className="mt-6 font-display text-[clamp(3.2rem,6vw,5.4rem)] leading-[0.92] tracking-[-0.08em] text-[color:var(--ink)]">
                  Confirm your order details.
                </h1>
              </Reveal>
              <Reveal delay={0.14}>
                <p className="mt-5 max-w-[580px] text-[16px] leading-8 text-[color:var(--ink-soft)]">
                  Complete the delivery details below and we&apos;ll run a realistic mock authorization, store the order in My Account, and clear the live cart when it finishes successfully.
                </p>
              </Reveal>
            </div>

            <Reveal delay={0.12}>
              <div className="soft-panel rounded-[2rem] p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  Order summary
                </p>
                <p className="mt-4 font-display text-[44px] leading-none tracking-[-0.06em] text-[color:var(--ink)]">
                  {loading ? '...' : formatCurrency(subtotal)}
                </p>
                <p className="mt-3 text-[15px] leading-7 text-[color:var(--ink-soft)]">
                  {itemCount} items in your current order.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="quiet-panel rounded-[1.4rem] p-4">
                    <LockKeyhole size={18} strokeWidth={1.8} className="text-[color:var(--accent-deep)]" />
                    <p className="mt-3 font-display text-[22px] leading-none tracking-[-0.04em] text-[color:var(--ink)]">
                      Secure capture
                    </p>
                    <p className="mt-2 text-[13px] leading-6 text-[color:var(--ink-soft)]">
                      The form submits into the live in-app checkout endpoint with a realistic payment profile.
                    </p>
                  </div>

                  <div className="quiet-panel rounded-[1.4rem] p-4">
                    <PackageCheck size={18} strokeWidth={1.8} className="text-[color:var(--accent-deep)]" />
                    <p className="mt-3 font-display text-[22px] leading-none tracking-[-0.04em] text-[color:var(--ink)]">
                      Cart sync
                    </p>
                    <p className="mt-2 text-[13px] leading-6 text-[color:var(--ink-soft)]">
                      The order is stored in My Account with payment and item details.
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {submittedOrder ? (
            <div id="checkout-success" className="soft-panel mt-12 rounded-[2.2rem] p-8 text-center">
              <span className="eyebrow justify-center">Order confirmed</span>
              <h2 className="mt-6 font-display text-[clamp(3rem,5vw,4.6rem)] leading-[0.9] tracking-[-0.08em] text-[color:var(--ink)]">
                {submittedOrder.orderNumber}
              </h2>
              <p className="mx-auto mt-5 max-w-[520px] text-[15px] leading-7 text-[color:var(--ink-soft)]">
                Your order has been captured, saved to My Account, and the cart has been cleared. You can return to the account area any time to review the latest skincare order details.
              </p>
              <div className="mx-auto mt-6 max-w-[580px] rounded-[1.5rem] border border-[color:var(--line)] bg-[color:rgba(255,250,244,0.6)] p-5 text-left">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Mock payment
                </p>
                <p className="mt-3 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                  {submittedOrder.paymentMethod} / {submittedOrder.paymentStatus} / ref {submittedOrder.paymentReference}
                </p>
              </div>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button href="/account">Open My Account</Button>
                <Button href="/skincare#skincare-grid" variant="ghost">
                  Back to Skincare
                </Button>
              </div>
            </div>
          ) : items.length === 0 && !loading ? (
            <div id="checkout-empty" className="soft-panel mt-12 rounded-[2rem] p-8">
              <p className="font-display text-[34px] leading-[0.96] tracking-[-0.05em] text-[color:var(--ink)]">
                Your cart is empty.
              </p>
              <p className="mt-4 text-[15px] leading-7 text-[color:var(--ink-soft)]">
                Add products to the bag before moving into checkout.
              </p>
              <Button href="/skincare#skincare-grid" className="mt-6">
                Browse Skincare
              </Button>
            </div>
          ) : (
            <div className="mt-12 grid gap-8 lg:grid-cols-[1.04fr_0.96fr]">
              <form id="checkout-form" className="soft-panel rounded-[2rem] p-6 lg:p-8" onSubmit={handleSubmit}>
                <div>
                  <p className="font-display text-[32px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">
                    Delivery details
                  </p>
                  <p className="mt-3 max-w-[520px] text-[14px] leading-7 text-[color:var(--ink-soft)]">
                    Use the address you&apos;d like the skincare order delivered to.
                  </p>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      First name
                    </label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(event) => setForm((prev) => ({ ...prev, firstName: event.target.value }))}
                      className="field-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      Last name
                    </label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(event) => setForm((prev) => ({ ...prev, lastName: event.target.value }))}
                      className="field-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                      className="field-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                      className="field-input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      Address line 1
                    </label>
                    <input
                      type="text"
                      value={form.addressLine1}
                      onChange={(event) => setForm((prev) => ({ ...prev, addressLine1: event.target.value }))}
                      className="field-input"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      Address line 2
                    </label>
                    <input
                      type="text"
                      value={form.addressLine2}
                      onChange={(event) => setForm((prev) => ({ ...prev, addressLine2: event.target.value }))}
                      className="field-input"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      City
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
                      className="field-input"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      Delivery notes
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                      className="field-textarea"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <p className="mb-2 block font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                      Payment method
                    </p>
                    <div className="grid gap-3">
                      {PAYMENT_PROFILES.map((profile) => (
                        <label
                          key={profile.id}
                          className={`quiet-panel flex cursor-pointer items-start gap-4 rounded-[1.25rem] p-4 ${
                            form.paymentProfile === profile.id ? 'ring-1 ring-[color:var(--accent-strong)]' : ''
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentProfile"
                            value={profile.id}
                            checked={form.paymentProfile === profile.id}
                            onChange={(event) => setForm((prev) => ({ ...prev, paymentProfile: event.target.value as PaymentProfileId }))}
                            className="mt-1"
                          />
                          <div>
                            <p className="text-[15px] font-medium text-[color:var(--ink)]">{profile.label}</p>
                            <p className="mt-1 text-[13px] leading-6 text-[color:var(--ink-soft)]">
                              {profile.description}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <p className="mt-3 text-[13px] leading-6 text-[color:var(--ink-soft)]">
                      This is a realistic mock payment step for now, so no live card is charged.
                    </p>
                  </div>
                </div>

                {error && (
                  <p className="mt-4 text-[14px] text-[color:#9f3d32]">
                    {error}
                  </p>
                )}

                <div className="mt-8">
                  <Button type="submit" className={submitting ? 'pointer-events-none opacity-70' : ''}>
                    {submitting ? 'Processing Order...' : 'Place Order'}
                  </Button>
                </div>
              </form>

              <div id="checkout-items" className="soft-panel rounded-[2rem] p-6 lg:p-8">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-[color:var(--accent-deep)]">
                    <Sparkles size={18} strokeWidth={1.8} />
                  </span>
                  <div>
                    <p className="font-display text-[32px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">
                      Items in this order
                    </p>
                    <p className="mt-3 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                      A quick review before you place the order.
                    </p>
                  </div>
                </div>

                <StaggerGroup className="mt-6 space-y-4" stagger={0.06}>
                  {items.map((item) => (
                    <StaggerItem key={item.slug}>
                      <div className="quiet-panel rounded-[1.45rem] p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-display text-[26px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">
                              {item.name}
                            </p>
                            <p className="mt-2 text-[14px] text-[color:var(--ink-soft)]">
                              Qty {item.quantity} / {item.price} each
                            </p>
                          </div>
                          <p className="text-[15px] font-medium text-[color:var(--ink)]">
                            {formatCurrency(parsePriceToNumber(item.price) * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerGroup>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

