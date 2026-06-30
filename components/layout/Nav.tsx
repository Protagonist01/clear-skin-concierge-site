'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from 'framer-motion';
import { Menu, ShoppingBag, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { BAG_UPDATED_EVENT, BAG_UPDATED_STORAGE_KEY, getBagCount, hydrateBag } from '@/lib/bag';

const NAV_LINKS = [
  { label: 'Locations', href: '/about' },
  { label: 'Treatments', href: '/treatments' },
  { label: 'Skincare', href: '/skincare' },
];

export default function Nav() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [bagCount, setBagCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 18);
  });

  useEffect(() => {
    const syncBagCount = () => setBagCount(getBagCount());
    const hydrateBagCount = () => {
      void hydrateBag().then(syncBagCount).catch(() => setBagCount(0));
    };
    const syncStorageBagCount = (event: StorageEvent) => {
      if (event.key === BAG_UPDATED_STORAGE_KEY) {
        hydrateBagCount();
      }
    };

    hydrateBagCount();
    window.addEventListener(BAG_UPDATED_EVENT, syncBagCount as EventListener);
    window.addEventListener('storage', syncStorageBagCount);

    return () => {
      window.removeEventListener(BAG_UPDATED_EVENT, syncBagCount as EventListener);
      window.removeEventListener('storage', syncStorageBagCount);
    };
  }, []);

  useEffect(() => {
    if (!drawerOpen) {
      document.body.style.overflow = '';
      return;
    }

    const closeOnOutside = (event: MouseEvent) => {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node)
      ) {
        setDrawerOpen(false);
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('mousedown', closeOnOutside);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('mousedown', closeOnOutside);
    };
  }, [drawerOpen]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <motion.header
        initial={{ y: -12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50"
      >
        <div
          className={`border-b backdrop-blur-xl transition-all duration-300 ${
            isScrolled
              ? 'border-[color:rgba(95,72,54,0.14)] bg-[color:rgba(255,250,244,0.88)] shadow-[0_16px_40px_rgba(21,19,18,0.08)]'
              : 'border-[color:rgba(95,72,54,0.08)] bg-[color:rgba(255,250,244,0.72)]'
          }`}
        >
          <div className="section-wrap flex items-center justify-between gap-6 px-4 py-3">
            <Link href="/" className="group">
              <div className="flex flex-col">
                <span className="font-display text-[38px] leading-none tracking-[-0.08em] text-[color:var(--ink)] transition-transform duration-300 group-hover:translate-x-0.5">
                  CLEAR SKIN
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted)]">
                  Aesthetic clinic and precision skincare
                </span>
              </div>
            </Link>

            <nav className="hidden items-center gap-8 lg:flex">
              {NAV_LINKS.map(({ label, href }) => {
                const active = isActive(href);

                return (
                  <Link
                    key={href}
                    href={href}
                    data-active={active}
                    className={`nav-link text-[15px] font-medium transition-colors ${
                      active
                        ? 'text-[color:var(--ink)]'
                        : 'text-[color:var(--muted)] hover:text-[color:var(--ink)]'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="hidden items-center gap-4 lg:flex">
              <Link
                href="/account"
                className="nav-link text-[15px] text-[color:var(--muted)] transition-colors hover:text-[color:var(--ink)]"
              >
                My Account
              </Link>

              <Link
                href="/cart"
                className="glass-pill relative h-11 w-11 text-[color:var(--ink)] transition-transform duration-300 hover:-translate-y-0.5"
                aria-label="View cart"
              >
                <span className="inline-flex h-full w-full items-center justify-center">
                  <ShoppingBag size={16} strokeWidth={1.8} />
                </span>
                {bagCount > 0 && (
                  <span className="absolute -right-1 -top-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[color:var(--ink)] px-1 text-[10px] font-medium text-[color:var(--chalk)]">
                    {bagCount}
                  </span>
                )}
              </Link>

              <Button href="/book" className="min-h-[44px] px-5 py-2.5">
                Book Now
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="glass-pill inline-flex h-11 w-11 items-center justify-center text-[color:var(--ink)] lg:hidden"
              aria-label="Open menu"
            >
              <Menu size={18} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-[color:rgba(16,13,12,0.36)] backdrop-blur-sm"
            />
            <motion.div
              ref={drawerRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.34, ease: [0.32, 0.72, 0, 1] }}
              className="fixed right-0 top-0 z-[60] flex h-full w-[88%] max-w-[380px] flex-col border-l border-[color:var(--line)] bg-[linear-gradient(180deg,rgba(255,250,244,0.96)_0%,rgba(245,235,223,0.98)_100%)]"
            >
              <div className="flex items-center justify-between border-b border-[color:var(--line)] px-6 py-5">
                <div>
                  <span className="font-display text-[28px] tracking-[-0.06em] text-[color:var(--ink)]">
                    Menu
                  </span>
                  <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                    Explore the clinic
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="glass-pill inline-flex h-10 w-10 items-center justify-center"
                >
                  <X size={18} strokeWidth={1.8} />
                </button>
              </div>

              <nav className="flex flex-1 flex-col px-6 py-8">
                {NAV_LINKS.map(({ label, href }, index) => (
                  <motion.div
                    key={href}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.06 + index * 0.08 }}
                  >
                    <Link
                      href={href}
                      className="flex items-center justify-between border-b border-[color:var(--line)] py-5"
                    >
                      <span className="font-display text-[32px] tracking-[-0.06em] text-[color:var(--ink)]">
                        {label}
                      </span>
                      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                        0{index + 1}
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className="space-y-4 px-6 pb-8">
                <Link
                  href="/cart"
                  className="soft-panel block rounded-[1.2rem] px-5 py-4 text-center text-[15px] text-[color:var(--ink)]"
                >
                  Cart{bagCount > 0 ? ` (${bagCount})` : ''}
                </Link>
                <Link
                  href="/account"
                  className="soft-panel block rounded-[1.2rem] px-5 py-4 text-center text-[15px] text-[color:var(--ink)]"
                >
                  My Account
                </Link>
                <Button href="/book" fullWidth>
                  Book Now
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
