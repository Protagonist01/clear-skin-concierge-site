'use client';

import Image from 'next/image';
import Button from '@/components/ui/Button';
import Tag from './Tag';
import {
  ParallaxMedia,
  Reveal,
  SplitHeadline,
} from './ExperienceMotion';

interface TreatmentHeroMotionProps {
  name: string;
  category: string;
  price: string;
  description: string;
  slug: string;
  image?: string;
}

export default function TreatmentHeroMotion({
  name,
  category,
  price,
  description,
  image,
}: TreatmentHeroMotionProps) {
  return (
    <section className="section-shell">
      <div className="section-wrap px-4">
        <div className="soft-panel grid gap-8 rounded-[2.2rem] p-6 lg:grid-cols-[0.88fr_1.12fr] lg:p-10">
          <Reveal className="flex max-w-[500px] flex-col justify-center">
            <Tag>{category}</Tag>

            <SplitHeadline
              lines={[name]}
              as="h1"
              className="mt-6 font-display text-[clamp(3.2rem,6vw,5.4rem)] leading-[0.92] tracking-[-0.08em] text-[color:var(--ink)]"
            />

            <p className="mt-4 font-mono text-[13px] uppercase tracking-[0.18em] text-[color:var(--accent-strong)]">
              {price}
            </p>

            <p className="mt-6 text-[16px] leading-8 text-[color:var(--ink-soft)]">
              {description}
            </p>

            <div className="mt-8">
              <Button href="/book">Book This Treatment</Button>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="editorial-frame min-h-[340px] bg-[color:var(--surface)]">
              <ParallaxMedia className="h-full" mediaClassName="h-full" speed={28}>
                {image ? (
                  <div className="relative h-full min-h-[340px]">
                    <Image src={image} alt={name} fill className="object-cover" priority />
                  </div>
                ) : (
                  <div className="h-full min-h-[340px] bg-[linear-gradient(135deg,#eee4d9_0%,#fbf8f4_100%)]" />
                )}
              </ParallaxMedia>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
