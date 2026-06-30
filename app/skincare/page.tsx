'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Droplets, Shield, Sparkles } from 'lucide-react';
import ProductCard from '@/components/ui/ProductCard';
import {
  ParallaxMedia,
  Reveal,
} from '@/components/ui/ExperienceMotion';
import { openQuiz } from '@/components/modules/SkinQuiz';
import { PRODUCTS } from '@/data/products';

const CONCERNS = [
  'All',
  'Hydration',
  'Brightening',
  'Anti-Ageing',
  'Eye Area',
  'Protection',
  'Cleansing',
];

const BENEFITS = [
  { label: 'Clean', icon: Sparkles },
  { label: 'Barrier-first', icon: Shield },
  { label: 'Hydration-led', icon: Droplets },
];

export default function SkincarePage() {
  const [activeConcern, setActiveConcern] = useState('All');

  const filteredProducts =
    activeConcern === 'All'
      ? PRODUCTS
      : PRODUCTS.filter((product) => product.concern === activeConcern);

  return (
    <main className="pb-24">
      <section id="skincare-hero" className="section-shell">
        <div className="section-wrap px-4">
          <div className="soft-panel rounded-[2.2rem] px-6 py-12 text-center sm:px-10 lg:px-14 lg:py-16">
            <Reveal>
              <span className="eyebrow justify-center">The Clear Skin Range</span>
            </Reveal>
            <Reveal delay={0.06}>
              <h1 className="mx-auto mt-6 max-w-[900px] font-display text-[clamp(3.2rem,6vw,5.6rem)] leading-[0.92] tracking-[-0.08em] text-[color:var(--ink)]">
                Daily essentials to restore and protect.
              </h1>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="mx-auto mt-5 max-w-[620px] text-[16px] leading-8 text-[color:var(--ink-soft)]">
                Science-backed formulas to restore, protect, and visibly
                improve skin.
              </p>
            </Reveal>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
              {BENEFITS.map(({ label, icon: Icon }, index) => (
                <Reveal key={label} delay={0.18 + index * 0.05}>
                  <div className="glass-pill gap-3 px-4 py-3 text-[14px] text-[color:var(--ink-soft)]">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--card-strong)] text-[color:var(--ink)]">
                      <Icon size={18} strokeWidth={1.8} />
                    </span>
                    <span>{label}</span>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="routine-finder" className="pb-8">
        <div className="section-wrap px-4">
          <div className="soft-panel grid gap-8 rounded-[2.2rem] p-6 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
            <Reveal>
              <div className="editorial-frame min-h-[300px] bg-[color:var(--surface)]">
                <ParallaxMedia className="h-full" mediaClassName="h-full" speed={26}>
                  <div className="relative h-full min-h-[300px]">
                    <Image
                      src="/images/product-restore-serum.png"
                      alt="Clear Skin product"
                      fill
                      className="object-cover"
                    />
                  </div>
                </ParallaxMedia>
              </div>
            </Reveal>

            <Reveal delay={0.08} className="flex flex-col justify-center">
              <span className="eyebrow">Routine Finder</span>
              <h2 className="mt-6 font-display text-[clamp(2.4rem,4vw,4rem)] leading-[0.94] tracking-[-0.07em] text-[color:var(--ink)]">
                Not sure which products are right for your skin?
              </h2>
              <p className="mt-4 max-w-[480px] text-[16px] leading-8 text-[color:var(--ink-soft)]">
                Use the skin quiz to match your concern to a tighter routine
                without guessing from a long shelf.
              </p>
              <button
                type="button"
                onClick={() => openQuiz('product')}
                className="button-shell button-primary mt-8 inline-flex min-h-[48px] w-fit items-center justify-center rounded-xl px-6 text-[15px] font-medium"
              >
                Discover Your Routine
              </button>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="skincare-filters" className="pb-6">
        <div className="section-wrap px-4">
          <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-2">
            {CONCERNS.map((concern) => {
              const active = concern === activeConcern;

              return (
                <motion.button
                  key={concern}
                  type="button"
                  onClick={() => setActiveConcern(concern)}
                  data-active={active}
                  className="chip-button"
                  whileTap={{ scale: 0.98 }}
                >
                  {active && (
                    <motion.span
                      layoutId="skincare-concern-active"
                      className="absolute inset-0 rounded-full bg-[color:rgba(199,155,115,0.16)]"
                      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    />
                  )}
                  <span className="relative z-[1]">{concern}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      <section id="skincare-grid">
        <div className="section-wrap px-4">
          <motion.div layout className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.slug}
                  layout
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 18 }}
                  transition={{ delay: index * 0.04, duration: 0.28 }}
                >
                  <ProductCard {...product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
