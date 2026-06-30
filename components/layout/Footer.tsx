'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Instagram, Linkedin, Music2 } from 'lucide-react';
import EmailCapture from '@/components/modules/EmailCapture';
import Button from '@/components/ui/Button';
import {
  ParallaxMedia,
  Reveal,
  StaggerGroup,
  StaggerItem,
} from '@/components/ui/ExperienceMotion';
import { PRODUCTS } from '@/data/products';
import { TREATMENTS } from '@/data/treatments';

const SOCIAL_LINKS = [
  { label: 'Instagram', href: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '', icon: Instagram },
  { label: 'TikTok', href: process.env.NEXT_PUBLIC_TIKTOK_URL || '', icon: Music2 },
  { label: 'LinkedIn', href: process.env.NEXT_PUBLIC_LINKEDIN_URL || '', icon: Linkedin },
].filter((item) => item.href);

export default function Footer() {
  return (
    <footer className="border-t border-[color:var(--line)] bg-transparent">
      <section className="section-shell pt-0">
        <div className="section-wrap px-4">
          <div className="soft-panel grid gap-8 rounded-[2.2rem] p-6 md:grid-cols-[0.9fr_1.1fr] md:p-10 lg:p-14">
            <Reveal className="flex max-w-[420px] flex-col justify-center">
              <span className="eyebrow mb-6">Consultation</span>
              <h2 className="font-display text-[clamp(2.9rem,5vw,4.9rem)] leading-[0.92] tracking-[-0.08em] text-[color:var(--ink)]">
                Start with a plan that feels measured from day one.
              </h2>
              <p className="mt-6 max-w-[360px] text-[16px] leading-7 text-[color:var(--ink-soft)]">
                Meet with an expert provider, review your skin goals, and leave
                with a treatment direction that is calm, clear, and clinically
                grounded.
              </p>
              <Button href="/book" className="mt-8 w-fit">
                Book a Consultation
              </Button>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="editorial-frame min-h-[300px] bg-[color:var(--surface)] sm:min-h-[380px]">
                <ParallaxMedia className="h-full" mediaClassName="h-full" speed={32}>
                  <div className="relative h-full min-h-[300px] sm:min-h-[380px]">
                    <Image
                      src="/images/about-clinic.png"
                      alt="Clear Skin consultation"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(24,19,18,0)_30%,rgba(24,19,18,0.28)_100%)]" />
                  </div>
                </ParallaxMedia>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="bg-[color:var(--footer)] text-[color:var(--chalk)]">
        <div className="section-wrap px-4 pb-6 pt-16">
          <StaggerGroup
            className="grid gap-12 lg:grid-cols-[1.2fr_1fr_1fr_0.8fr_0.8fr]"
            stagger={0.08}
          >
            <StaggerItem className="space-y-6">
              <div className="max-w-[320px]">
                <p className="text-[14px] leading-6 text-[color:var(--footer-muted)]">
                  Sign up to receive expert skincare tips and updates about our
                  locations and services.
                </p>
              </div>
              <div className="max-w-[340px]">
                <EmailCapture source="footer" compact />
              </div>
              {SOCIAL_LINKS.length > 0 && (
                <div className="flex items-center gap-4">
                  {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                    <a
                      key={label}
                      href={href}
                      aria-label={label}
                      target="_blank"
                      rel="noreferrer"
                      className="glass-pill inline-flex h-11 w-11 items-center justify-center border-[color:rgba(255,250,244,0.14)] bg-[color:rgba(255,250,244,0.04)] text-[color:var(--chalk)] transition-transform duration-300 hover:-translate-y-0.5"
                    >
                      <Icon size={16} strokeWidth={1.8} />
                    </a>
                  ))}
                </div>
              )}
            </StaggerItem>

            <StaggerItem>
              <h3 className="mb-5 text-[15px] font-medium">Locations</h3>
              <div className="space-y-3 text-[15px] leading-6 text-[color:var(--footer-muted)]">
                <p>London</p>
                <p>Dubai</p>
                <p>Lagos</p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <h3 className="mb-5 text-[15px] font-medium">Treatments</h3>
              <div className="space-y-3 text-[15px] leading-6 text-[color:var(--footer-muted)]">
                {TREATMENTS.slice(0, 5).map((treatment) => (
                  <Link
                    key={treatment.slug}
                    href={`/treatments/${treatment.slug}`}
                    className="block transition-colors hover:text-[color:var(--chalk)]"
                  >
                    {treatment.name}
                  </Link>
                ))}
              </div>
            </StaggerItem>

            <StaggerItem>
              <h3 className="mb-5 text-[15px] font-medium">Skincare</h3>
              <div className="space-y-3 text-[15px] leading-6 text-[color:var(--footer-muted)]">
                {PRODUCTS.slice(0, 4).map((product) => (
                  <Link
                    key={product.slug}
                    href={`/skincare/${product.slug}`}
                    className="block transition-colors hover:text-[color:var(--chalk)]"
                  >
                    {product.name}
                  </Link>
                ))}
              </div>
            </StaggerItem>

            <StaggerItem>
              <h3 className="mb-5 text-[15px] font-medium">Account</h3>
              <div className="space-y-3 text-[15px] leading-6 text-[color:var(--footer-muted)]">
                <Link href="/account" className="block transition-colors hover:text-[color:var(--chalk)]">
                  My Account
                </Link>
                <Link href="/book" className="block transition-colors hover:text-[color:var(--chalk)]">
                  Book Now
                </Link>
                <Link href="/treatments" className="block transition-colors hover:text-[color:var(--chalk)]">
                  Treatments
                </Link>
                <Link href="/skincare" className="block transition-colors hover:text-[color:var(--chalk)]">
                  Shop
                </Link>
              </div>
            </StaggerItem>
          </StaggerGroup>
          <Reveal delay={0.08}>
            <div className="mt-14 border-t border-[color:rgba(255,250,244,0.12)] pt-10">
              <p className="max-w-[420px] font-mono text-[11px] uppercase tracking-[0.2em] text-[color:var(--footer-muted)]">
                Clinician-led skincare across consultation, treatment, and homecare.
              </p>
              <div className="footer-wordmark mt-4 text-[color:rgba(255,250,244,0.96)]">
                CLEAR
                <br />
                SKIN
              </div>
            </div>
          </Reveal>

          <div className="mt-6 flex flex-col gap-3 border-t border-[color:rgba(255,250,244,0.12)] pt-5 text-[13px] text-[color:var(--footer-muted)] md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-5">
              <Link href="/privacy">Privacy Policy</Link>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/accessibility">Accessibility</Link>
            </div>
            <span>&copy; 2026 Clear Skin. All Rights Reserved.</span>
          </div>
        </div>
      </section>
    </footer>
  );
}
