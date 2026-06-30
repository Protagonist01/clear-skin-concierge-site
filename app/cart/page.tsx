'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import {
  Reveal,
  StaggerGroup,
} from '@/components/ui/ExperienceMotion';
import {
  BAG_UPDATED_STORAGE_KEY,
  BAG_UPDATED_EVENT,
  clearBag,
  hydrateBag,
  readBag,
  removeBagItem,
  updateBagItemQuantity,
} from '@/lib/bag';
import { formatCurrency, parsePriceToNumber, type BagItem } from '@/lib/cart';

function CartItemRow({
  item,
  onQuantityChange,
  onRemove,
}: {
  item: BagItem;
  onQuantityChange: (slug: string, quantity: number) => void;
  onRemove: (slug: string) => void;
}) {
  const lineTotal = formatCurrency(parsePriceToNumber(item.price) * item.quantity);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      className="soft-panel grid gap-5 rounded-[1.9rem] p-5 md:grid-cols-[128px_1fr_auto] md:items-center"
    >
      <div className="editorial-frame relative aspect-square overflow-hidden bg-[color:var(--surface)]">
        {item.image && (
          <Image src={item.image} alt={item.name} fill className="object-cover" />
        )}
      </div>

      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--accent-strong)]">
          {item.concern}
        </p>
        <h2 className="mt-3 font-display text-[32px] leading-[0.96] tracking-[-0.05em] text-[color:var(--ink)]">
          {item.name}
        </h2>
        <p className="mt-3 max-w-[440px] text-[15px] leading-7 text-[color:var(--ink-soft)]">
          {item.description}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="glass-pill rounded-full px-2 py-1">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onQuantityChange(item.slug, Math.max(1, item.quantity - 1))}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--ink)] transition-colors hover:bg-[color:rgba(199,155,115,0.12)]"
                aria-label={`Decrease quantity for ${item.name}`}
              >
                <Minus size={15} strokeWidth={1.8} />
              </button>
              <span className="min-w-[30px] text-center text-[14px] font-medium text-[color:var(--ink)]">
                {item.quantity}
              </span>
              <button
                type="button"
                onClick={() => onQuantityChange(item.slug, item.quantity + 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--ink)] transition-colors hover:bg-[color:rgba(199,155,115,0.12)]"
                aria-label={`Increase quantity for ${item.name}`}
              >
                <Plus size={15} strokeWidth={1.8} />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onRemove(item.slug)}
            className="inline-flex items-center gap-2 text-[14px] text-[color:var(--muted)] transition-colors hover:text-[color:var(--ink)]"
          >
            <Trash2 size={14} strokeWidth={1.8} />
            Remove
          </button>
        </div>
      </div>

      <div className="text-left md:text-right">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
          Line total
        </p>
        <p className="mt-3 font-display text-[34px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">
          {lineTotal}
        </p>
        <p className="mt-2 text-[14px] text-[color:var(--muted)]">{item.price} each</p>
      </div>
    </motion.div>
  );
}

export default function CartPage() {
  const [items, setItems] = useState<BagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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
    const handleStorage = (event: StorageEvent) => {
      if (event.key === BAG_UPDATED_STORAGE_KEY) {
        void hydrateBag().then(setItems).catch(() => setItems([]));
      }
    };

    void sync();
    window.addEventListener(BAG_UPDATED_EVENT, handleBagUpdated as EventListener);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(BAG_UPDATED_EVENT, handleBagUpdated as EventListener);
      window.removeEventListener('storage', handleStorage);
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

  const handleQuantityChange = async (slug: string, quantity: number) => {
    setUpdating(true);
    try {
      const nextItems = await updateBagItemQuantity(slug, quantity);
      setItems(nextItems);
    } finally {
      setUpdating(false);
    }
  };

  const handleRemove = async (slug: string) => {
    setUpdating(true);
    try {
      const nextItems = await removeBagItem(slug);
      setItems(nextItems);
    } finally {
      setUpdating(false);
    }
  };

  const handleClear = async () => {
    setUpdating(true);
    try {
      const nextItems = await clearBag();
      setItems(nextItems);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <main className="pb-24">
      <section id="cart-overview" className="section-shell">
        <div className="section-wrap px-4">
          <div className="grid gap-8 lg:grid-cols-[1.04fr_0.96fr]">
            <div>
              <Reveal>
                <span className="eyebrow">Your cart</span>
              </Reveal>
              <Reveal delay={0.08}>
                <h1 className="mt-6 font-display text-[clamp(3.2rem,6vw,5.4rem)] leading-[0.92] tracking-[-0.08em] text-[color:var(--ink)]">
                  Review your routine before checkout.
                </h1>
              </Reveal>
              <Reveal delay={0.14}>
                <p className="mt-5 max-w-[580px] text-[16px] leading-8 text-[color:var(--ink-soft)]">
                  Everything you&apos;ve selected lives here. Adjust quantities, remove
                  items, or move into checkout when the regimen feels right.
                </p>
              </Reveal>
            </div>

            <Reveal delay={0.12}>
              <div className="soft-panel flex flex-col gap-6 rounded-[2rem] p-6">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    Cart summary
                  </p>
                  <p className="mt-4 font-display text-[44px] leading-none tracking-[-0.06em] text-[color:var(--ink)]">
                    {loading ? '...' : formatCurrency(subtotal)}
                  </p>
                  <p className="mt-3 text-[15px] leading-7 text-[color:var(--ink-soft)]">
                    {items.length === 0
                      ? 'Your cart is currently empty.'
                      : `${itemCount} items selected across your routine.`}
                  </p>
                </div>

                <div className="quiet-panel rounded-[1.5rem] p-4">
                  <div className="flex gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-[color:var(--accent-deep)]">
                      <ShieldCheck size={17} strokeWidth={1.9} />
                    </span>
                    <div>
                      <p className="font-display text-[24px] leading-none tracking-[-0.04em] text-[color:var(--ink)]">
                        Clinically selected.
                      </p>
                      <p className="mt-2 text-[13px] leading-6 text-[color:var(--ink-soft)]">
                        Orders captured here use the same live product and pricing
                        source shown across the storefront, then move straight into
                        the in-app checkout and account history.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button href="/checkout" className={items.length === 0 ? 'pointer-events-none opacity-50' : ''}>
                    Proceed to Checkout
                  </Button>
                  <Button href="/skincare#skincare-grid" variant="ghost">
                    Continue Shopping
                  </Button>
                </div>
              </div>
            </Reveal>
          </div>

          <div id="cart-items" className="mt-12">
            {loading ? (
              <div className="quiet-panel rounded-[1.8rem] p-8 text-[15px] text-[color:var(--ink-soft)]">
                Loading your cart...
              </div>
            ) : items.length === 0 ? (
              <div className="soft-panel flex flex-col items-start gap-5 rounded-[2rem] p-8">
                <div>
                  <p className="font-display text-[36px] leading-[0.96] tracking-[-0.05em] text-[color:var(--ink)]">
                    No products in your cart yet.
                  </p>
                  <p className="mt-3 max-w-[520px] text-[15px] leading-7 text-[color:var(--ink-soft)]">
                    Explore the skincare range or use the routine finder to build a more focused shelf.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button href="/skincare#skincare-grid">Browse Skincare</Button>
                  <Button href="/skincare#routine-finder" variant="ghost">
                    Find My Routine
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <StaggerGroup className="space-y-5" stagger={0.06}>
                  <AnimatePresence>
                    {items.map((item) => (
                      <CartItemRow
                        key={item.slug}
                        item={item}
                        onQuantityChange={handleQuantityChange}
                        onRemove={handleRemove}
                      />
                    ))}
                  </AnimatePresence>
                </StaggerGroup>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={updating}
                    className="text-[14px] text-[color:var(--muted)] transition-colors hover:text-[color:var(--ink)] disabled:opacity-50"
                  >
                    Clear cart
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="mt-10">
            <Link
              href="/skincare#skincare-grid"
              className="text-[15px] text-[color:var(--ink-soft)] transition-colors hover:text-[color:var(--ink)]"
            >
              &lt;- Back to skincare
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
