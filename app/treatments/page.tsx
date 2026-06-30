'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CalendarCheck2, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import TreatmentCard from '@/components/ui/TreatmentCard';
import { openQuiz } from '@/components/modules/SkinQuiz';
import {
  ParallaxMedia,
  Reveal,
} from '@/components/ui/ExperienceMotion';
import { TREATMENTS } from '@/data/treatments';

const CATEGORIES = [
  'All',
  'Diagnostics',
  'Facials',
  'Injectables',
  'Laser',
  'Skin Boosters',
  'Recovery',
];

export default function TreatmentsPage() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredTreatments =
    activeCategory === 'All'
      ? TREATMENTS
      : TREATMENTS.filter((treatment) => treatment.category === activeCategory);

  return (
    <main className="pb-24">
      <section id="treatments-hero" className="section-shell">
        <div className="section-wrap px-4">
          <div className="soft-panel grid gap-8 rounded-[2.2rem] p-6 md:grid-cols-[0.9fr_1.1fr] md:p-10 lg:p-14">
            <Reveal className="flex max-w-[500px] flex-col justify-center">
              <span className="eyebrow mb-6">Clinical treatments</span>
              <h1 className="font-display text-[clamp(3.2rem,6vw,5.6rem)] leading-[0.92] tracking-[-0.08em] text-[color:var(--ink)]">
                Every treatment. Clinician-led.
              </h1>
              <p className="mt-6 text-[16px] leading-8 text-[color:var(--ink-soft)]">
                From first consultation to final result, every protocol is
                designed to feel clear, measured, and confident.
              </p>
              <div className="mt-8 inline-flex items-center gap-3 text-[15px] font-medium text-[color:var(--ink)]">
                Explore by category
                <ArrowRight size={16} strokeWidth={1.8} />
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="editorial-frame min-h-[320px] bg-[color:var(--card)]">
                <ParallaxMedia className="h-full" mediaClassName="h-full" speed={28}>
                  <div className="relative h-full min-h-[320px]">
                    <Image
                      src="/images/treatment-skin-analysis.png"
                      alt="Clear Skin treatment"
                      fill
                      className="object-cover"
                    />
                  </div>
                </ParallaxMedia>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="treatments-categories" className="pb-8">
        <div className="section-wrap px-4">
          <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-2">
            {CATEGORIES.map((category) => {
              const active = category === activeCategory;

              return (
                <motion.button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  data-active={active}
                  className="chip-button"
                  whileTap={{ scale: 0.98 }}
                >
                  {active && (
                    <motion.span
                      layoutId="treatment-category-active"
                      className="absolute inset-0 rounded-full bg-[color:rgba(199,155,115,0.16)]"
                      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    />
                  )}
                  <span className="relative z-[1]">{category}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>

      <section id="treatments-grid">
        <div className="section-wrap px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
            >
              {filteredTreatments.map((treatment, index) => (
                <motion.div
                  key={treatment.slug}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.5 }}
                >
                  <TreatmentCard {...treatment} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      <section id="treatments-guidance" className="section-shell">
        <div className="section-wrap px-4">
          <div className="soft-panel grid gap-6 rounded-[2.1rem] p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
            <Reveal>
              <div>
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-[color:var(--ink)]">
                  <Sparkles size={20} strokeWidth={1.8} />
                </div>
                <h2 className="mt-5 font-display text-[clamp(2.2rem,4vw,3.8rem)] leading-[0.94] tracking-[-0.06em] text-[color:var(--ink)]">
                  Not sure what fits?
                </h2>
                <p className="mt-3 max-w-[540px] text-[16px] leading-8 text-[color:var(--ink-soft)]">
                  Start with our skin assessment or speak directly with the
                  team. We will help you narrow the plan without guesswork.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={() => openQuiz()}>Start Skin Assessment</Button>
                <a
                  href="/book"
                  className="glass-pill inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-6 text-[15px] font-medium text-[color:var(--ink)] transition-transform duration-300 hover:-translate-y-0.5"
                >
                  <CalendarCheck2 size={17} strokeWidth={1.8} />
                  Book a consultation
                </a>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </main>
  );
}
