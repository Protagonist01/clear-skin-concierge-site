'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  MapPin,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import ProductCard from '@/components/ui/ProductCard';
import EmailCapture from '@/components/modules/EmailCapture';
import { openQuiz } from '@/components/modules/SkinQuiz';
import {
  ParallaxMedia,
  Reveal,
  SplitHeadline,
  StaggerGroup,
  StaggerItem,
} from '@/components/ui/ExperienceMotion';
import { PRODUCTS } from '@/data/products';
import { TREATMENTS } from '@/data/treatments';

const TRUST_POINTS = [
  {
    title: 'Clinician-led appointments',
    body: 'Every visit is led by a practitioner, not a therapist.',
    icon: Stethoscope,
  },
  {
    title: 'Measured skin outcomes',
    body: 'Progress is assessed against baseline and follow-up data.',
    icon: ShieldCheck,
  },
  {
    title: 'No commission, no upsell',
    body: 'Advice is shaped by what your skin needs, not basket size.',
    icon: BadgeCheck,
  },
];

const FEATURED_OFFERINGS = TREATMENTS.slice(0, 3);
const FEATURED_PRODUCTS = PRODUCTS.slice(0, 3);
const ASSESSMENT_STEPS = [
  'What brings you in?',
  'Your skin type?',
  'Had professional treatments before?',
  'What result matters most?',
];
const LOCATIONS = [
  {
    city: 'London',
    address: '12 Mount Street, Mayfair, W1K 2PB',
    hours: 'Mon-Sat, 09:00-19:00',
  },
  {
    city: 'Dubai',
    address: 'Gate Village 8, DIFC',
    hours: 'Mon-Sun, 10:00-20:00',
  },
  {
    city: 'Lagos',
    address: '4A Akin Olugbade Street, Victoria Island',
    hours: 'Tue-Sat, 09:00-18:00',
  },
];

export default function HomePage() {
  const heroRef = useRef<HTMLElement | null>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const heroMediaScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const heroContentY = useTransform(scrollYProgress, [0, 1], [0, 110]);
  const heroOverlayOpacity = useTransform(scrollYProgress, [0, 0.9], [0.24, 0.58]);

  return (
    <>
      <section
        ref={heroRef}
        id="home-hero"
        className="relative overflow-hidden border-b border-[color:var(--line)] bg-[color:var(--page-strong)]"
      >
        <motion.div style={{ scale: heroMediaScale }} className="absolute inset-0">
          <video
            src="/videos/hero-loop.mp4"
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          />
        </motion.div>
        <motion.div
          style={{ opacity: heroOverlayOpacity }}
          className="absolute inset-0 bg-[linear-gradient(108deg,rgba(19,16,15,0.84)_0%,rgba(19,16,15,0.38)_46%,rgba(19,16,15,0.14)_100%)]"
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,rgba(19,16,15,0)_0%,rgba(19,16,15,0.4)_100%)]" />

        <div className="section-wrap relative flex min-h-[calc(100vh-6.75rem)] items-end px-4 pb-12 pt-16 lg:pb-16 lg:pt-24">
          <motion.div style={{ y: heroContentY }} className="max-w-[760px] pb-6 lg:pb-12">
            <motion.span
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="glass-pill px-4 py-2 font-mono text-[11px] uppercase tracking-[0.2em] text-[color:rgba(255,250,244,0.84)]"
            >
              London / Dubai / Lagos
            </motion.span>

            <SplitHeadline
              lines={['Better skin,', 'better results.']}
              className="mt-8 font-display text-[clamp(4rem,9vw,7.5rem)] leading-[0.86] tracking-[-0.08em] text-[color:var(--chalk)]"
            />

            <Reveal
              delay={0.34}
              className="mt-6 max-w-[500px] text-[17px] leading-8 text-[color:rgba(255,250,244,0.82)]"
            >
              <p>
                We opened in London in 2019 with a straightforward position:
                skin results should be measured, not described. Every
                appointment is led by a clinician, not a therapist.
              </p>
            </Reveal>

            <Reveal delay={0.46}>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Button href="/book">Book a Consultation</Button>
                <button
                  type="button"
                  onClick={() => openQuiz()}
                  className="glass-pill inline-flex min-h-[48px] items-center justify-center rounded-xl px-6 py-3 text-[15px] font-medium text-[color:var(--chalk)] transition-transform duration-300 hover:-translate-y-0.5"
                >
                  Find your skin profile
                </button>
              </div>
            </Reveal>

            <Reveal delay={0.62}>
              <div className="mt-10 inline-flex items-center gap-4 text-[12px] uppercase tracking-[0.18em] text-[color:rgba(255,250,244,0.68)]">
                <span className="h-px w-14 bg-[color:rgba(255,250,244,0.26)]" />
                Scroll to explore the clinic
              </div>
            </Reveal>
          </motion.div>
        </div>
      </section>

      <section id="home-trust" className="section-shell bg-[color:rgba(255,250,244,0.58)]">
        <div className="section-wrap px-4">
          <Reveal className="max-w-[760px]">
            <span className="eyebrow">Clinical confidence</span>
            <h2 className="mt-6 font-display text-[clamp(3rem,6vw,5.2rem)] leading-[0.92] tracking-[-0.08em] text-[color:var(--ink)]">
              Trust the experts, then enjoy the calm that follows.
            </h2>
            <p className="mt-5 max-w-[520px] text-[16px] leading-8 text-[color:var(--ink-soft)]">
              We refine the experience until it feels effortless, but the work
              behind it stays rigorous from the first consultation to the final
              follow-up.
            </p>
          </Reveal>

          <StaggerGroup className="mt-12 grid gap-4 md:grid-cols-3" stagger={0.08}>
            {TRUST_POINTS.map(({ title, body, icon: Icon }) => (
              <StaggerItem key={title}>
                <div className="quiet-panel h-full p-6">
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-[color:var(--ink)]">
                    <Icon size={20} strokeWidth={1.8} />
                  </div>
                  <h3 className="text-[22px] font-semibold text-[color:var(--ink)]">
                    {title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-7 text-[color:var(--ink-soft)]">
                    {body}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      <section id="home-offerings" className="section-shell bg-[color:var(--page)]">
        <div className="section-wrap px-4">
          <div className="grid items-center gap-10 lg:grid-cols-[1.04fr_0.96fr]">
            <Reveal>
              <div className="editorial-frame bg-[color:var(--surface)]">
                <ParallaxMedia className="h-full" mediaClassName="h-full" speed={34}>
                  <div className="relative aspect-[0.94/1] min-h-[440px]">
                    <Image
                      src="/images/hero-main.png"
                      alt="Clear Skin clinic hero"
                      fill
                      className="object-cover"
                    />
                  </div>
                </ParallaxMedia>
              </div>
            </Reveal>

            <div>
              <Reveal>
                <span className="eyebrow">Our offerings</span>
              </Reveal>
              <Reveal delay={0.08}>
                <h2 className="mt-6 font-display text-[clamp(3rem,5vw,5rem)] leading-[0.92] tracking-[-0.08em] text-[color:var(--ink)]">
                  A layout built around clarity, not noise.
                </h2>
              </Reveal>
              <Reveal delay={0.14}>
                <p className="mt-6 max-w-[500px] text-[16px] leading-8 text-[color:var(--ink-soft)]">
                  We keep the journey precise from first consultation to
                  treatment planning and homecare, so each decision feels easier
                  to make.
                </p>
              </Reveal>

              <StaggerGroup className="mt-8 space-y-4" stagger={0.08}>
                {FEATURED_OFFERINGS.map((treatment, index) => (
                  <StaggerItem key={treatment.slug}>
                    <Link
                      href={`/treatments/${treatment.slug}`}
                      className="soft-panel group flex items-center justify-between gap-5 rounded-[1.6rem] px-5 py-5"
                    >
                      <div className="flex items-start gap-4">
                        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--accent-strong)]">
                          0{index + 1}
                        </span>
                        <div>
                          <p className="font-display text-[30px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">
                            {treatment.name}
                          </p>
                          <p className="mt-2 text-[14px] leading-6 text-[color:var(--muted)]">
                            {treatment.description}
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-[color:rgba(255,250,244,0.78)] transition-transform duration-300 group-hover:translate-x-1">
                        <ArrowRight size={18} strokeWidth={1.8} />
                      </span>
                    </Link>
                  </StaggerItem>
                ))}
              </StaggerGroup>

              <Reveal delay={0.28}>
                <Link
                  href="/treatments"
                  className="mt-8 inline-flex items-center gap-3 text-[15px] font-medium text-[color:var(--ink)]"
                >
                  View all treatments
                  <ArrowRight size={16} strokeWidth={1.8} />
                </Link>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section id="home-skincare" className="section-shell bg-[color:rgba(255,250,244,0.62)]">
        <div className="section-wrap px-4">
          <Reveal className="text-center">
            <span className="eyebrow justify-center">Skincare</span>
            <h2 className="mt-6 font-display text-[clamp(2.9rem,5vw,4.8rem)] leading-[0.92] tracking-[-0.08em] text-[color:var(--ink)]">
              Daily essentials to restore, protect, and simplify the routine.
            </h2>
            <p className="mx-auto mt-5 max-w-[580px] text-[16px] leading-8 text-[color:var(--ink-soft)]">
              Science-backed formulas that work with the treatment plan instead
              of competing with it.
            </p>
          </Reveal>

          <StaggerGroup className="mt-12 grid gap-6 lg:grid-cols-3" stagger={0.08}>
            {FEATURED_PRODUCTS.map((product) => (
              <StaggerItem key={product.slug}>
                <ProductCard {...product} />
              </StaggerItem>
            ))}
          </StaggerGroup>

          <Reveal delay={0.24} className="mt-10 text-center">
            <Link
              href="/skincare"
              className="inline-flex items-center gap-3 text-[15px] font-medium text-[color:var(--ink)]"
            >
              Explore the full range
              <ArrowRight size={16} strokeWidth={1.8} />
            </Link>
          </Reveal>
        </div>
      </section>

      <section id="home-assessment" className="section-shell bg-[color:var(--page)]">
        <div className="section-wrap px-4">
          <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
            <Reveal>
              <div className="soft-panel p-6 sm:p-8 lg:p-10">
                <span className="eyebrow">Know your skin</span>
                <h2 className="mt-6 font-display text-[clamp(2.8rem,5vw,4.6rem)] leading-[0.92] tracking-[-0.08em] text-[color:var(--ink)]">
                  What does your skin need?
                </h2>
                <p className="mt-5 max-w-[430px] text-[16px] leading-8 text-[color:var(--ink-soft)]">
                  Seven questions. We match your concerns to treatments and
                  products based on what a clinician would actually recommend.
                </p>
                <Button className="mt-8" onClick={() => openQuiz()}>
                  Start the assessment
                </Button>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="quiet-panel overflow-hidden">
                <div className="grid gap-0 md:grid-cols-2">
                  <div className="relative min-h-[280px] bg-[color:var(--surface)]">
                    <Image
                      src="/images/about-clinic.png"
                      alt="Clear Skin consultation room"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(24,19,18,0)_50%,rgba(24,19,18,0.2)_100%)]" />
                  </div>
                  <StaggerGroup className="p-6 sm:p-8" stagger={0.08}>
                    {ASSESSMENT_STEPS.map((step, index) => (
                      <StaggerItem key={step}>
                        <div className="flex gap-4 border-b border-[color:var(--line)] py-4 last:border-b-0">
                          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--accent-strong)]">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="text-[15px] text-[color:var(--ink)]">
                            {step}
                          </span>
                        </div>
                      </StaggerItem>
                    ))}
                  </StaggerGroup>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="home-locations" className="section-shell bg-[color:rgba(255,250,244,0.62)]">
        <div className="section-wrap px-4">
          <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
            <div>
              <Reveal>
                <span className="eyebrow">Visit us</span>
              </Reveal>
              <Reveal delay={0.08}>
                <h2 className="mt-6 font-display text-[clamp(3rem,5vw,4.8rem)] leading-[0.92] tracking-[-0.08em] text-[color:var(--ink)]">
                  Find the studio that fits your life and your rhythm.
                </h2>
              </Reveal>
              <Reveal delay={0.14}>
                <p className="mt-5 max-w-[420px] text-[16px] leading-8 text-[color:var(--ink-soft)]">
                  Three cities, one standard. Clinical consistency across every
                  consultation, treatment room, and follow-up.
                </p>
              </Reveal>
            </div>

            <StaggerGroup className="soft-panel p-3 sm:p-4" stagger={0.08}>
              <div className="overflow-hidden rounded-[1.6rem] bg-[color:var(--card-strong)]">
                {LOCATIONS.map((location, index) => (
                  <StaggerItem key={location.city}>
                    <div className="grid gap-4 border-b border-[color:var(--line)] px-5 py-5 last:border-b-0 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-[color:var(--ink)]">
                            <MapPin size={16} strokeWidth={1.8} />
                          </span>
                          <h3 className="font-display text-[32px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">
                            {location.city}
                          </h3>
                        </div>
                        <p className="mt-3 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                          {location.address}
                          <br />
                          {location.hours}
                        </p>
                      </div>
                      <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                        0{index + 1}
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </div>
            </StaggerGroup>
          </div>
        </div>
      </section>

      <section id="home-email" className="section-shell">
        <div className="section-wrap px-4">
          <div className="soft-panel p-6 text-center sm:p-8 lg:p-12">
            <Reveal>
              <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-[color:var(--ink)]">
                <Sparkles size={22} strokeWidth={1.8} />
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="mx-auto mt-6 max-w-[620px]">
                <EmailCapture source="homepage" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}

