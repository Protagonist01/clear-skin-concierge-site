import Link from 'next/link';
import { notFound } from 'next/navigation';
import DetailTabs from '@/components/ui/DetailTabs';
import TreatmentCard from '@/components/ui/TreatmentCard';
import TreatmentHeroMotion from '@/components/ui/TreatmentHeroMotion';
import ReviewEngine from '@/components/modules/ReviewEngine';
import UpsellEngine from '@/components/modules/UpsellEngine';
import {
  Reveal,
  StaggerGroup,
  StaggerItem,
} from '@/components/ui/ExperienceMotion';
import { TREATMENTS } from '@/data/treatments';

export function generateStaticParams() {
  return TREATMENTS.map((treatment) => ({ slug: treatment.slug }));
}

const CATEGORY_ORDER = [
  'Diagnostics',
  'Facials',
  'Injectables',
  'Laser',
  'Skin Boosters',
  'Recovery',
];

function getRelated(currentSlug: string, currentCategory: string) {
  const categoryIndex = CATEGORY_ORDER.indexOf(currentCategory);
  const adjacentCategories = [
    CATEGORY_ORDER[categoryIndex - 1],
    CATEGORY_ORDER[categoryIndex + 1],
  ].filter(Boolean);

  const prioritized = TREATMENTS.filter(
    (treatment) =>
      treatment.slug !== currentSlug &&
      (treatment.category === currentCategory ||
        adjacentCategories.includes(treatment.category)),
  );

  if (prioritized.length >= 3) {
    return prioritized.slice(0, 3);
  }

  const remaining = TREATMENTS.filter(
    (treatment) =>
      treatment.slug !== currentSlug &&
      !prioritized.some((item) => item.slug === treatment.slug),
  );

  return [...prioritized, ...remaining].slice(0, 3);
}

export default function TreatmentPage({ params }: { params: { slug: string } }) {
  const treatment = TREATMENTS.find((item) => item.slug === params.slug);

  if (!treatment) {
    notFound();
  }

  const relatedTreatments = getRelated(treatment.slug, treatment.category);

  return (
    <main className="pb-16">
      <TreatmentHeroMotion
        name={treatment.name}
        category={treatment.category}
        price={treatment.price}
        description={treatment.description}
        slug={treatment.slug}
        image={treatment.image}
      />

      <section id="treatment-overview" className="section-shell bg-[color:var(--page)]">
        <div className="section-wrap px-4">
          <StaggerGroup className="hidden gap-6 md:grid md:grid-cols-3" stagger={0.08}>
            <StaggerItem>
              <div className="quiet-panel p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--accent-strong)]">
                  What it is
                </p>
                <p className="mt-4 text-[15px] leading-7 text-[color:var(--ink-soft)]">
                  {treatment.description}
                </p>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="quiet-panel p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--accent-strong)]">
                  What to expect
                </p>
                <ol className="mt-4 space-y-4">
                  {treatment.steps.map((step, index) => (
                    <li key={step} className="flex gap-4">
                      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--accent-strong)]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <p className="text-[15px] leading-7 text-[color:var(--ink-soft)]">
                        {step}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            </StaggerItem>

            <StaggerItem>
              <div className="quiet-panel p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--accent-strong)]">
                  Ideal for
                </p>
                <ul className="mt-4 space-y-3">
                  {treatment.idealFor.map((concern) => (
                    <li key={concern} className="flex gap-3 text-[15px] leading-7 text-[color:var(--ink-soft)]">
                      <span className="text-[color:var(--accent-strong)]">-</span>
                      <span>{concern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </StaggerItem>
          </StaggerGroup>

          <DetailTabs
            description={treatment.description}
            steps={treatment.steps}
            idealFor={treatment.idealFor}
          />
        </div>
      </section>

      <section id="treatment-reviews">
        <ReviewEngine mode="full" treatmentName={treatment.name} />
      </section>

      <section id="treatment-homecare" className="section-shell bg-[color:rgba(255,250,244,0.58)]">
        <div className="section-wrap px-4">
          <UpsellEngine
            mode="homecare"
            treatmentName={treatment.name}
            concern={treatment.idealFor[0]}
          />
        </div>
      </section>

      <section id="treatment-related" className="section-shell bg-[color:var(--page)]">
        <div className="section-wrap px-4">
          <Reveal>
            <h2 className="font-display text-[clamp(2.2rem,4vw,3.8rem)] leading-[0.94] tracking-[-0.06em] text-[color:var(--ink)]">
              Clients who booked this also explored
            </h2>
          </Reveal>
          <div className="mt-8 hidden gap-6 md:grid md:grid-cols-3">
            {relatedTreatments.map((related) => (
              <TreatmentCard key={related.slug} {...related} />
            ))}
          </div>
          <div className="h-scroll mt-8 md:hidden">
            {relatedTreatments.map((related) => (
              <div key={related.slug} className="w-[300px]">
                <TreatmentCard {...related} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="section-wrap px-4 pb-8">
        <Link
          href="/treatments"
          className="text-[15px] text-[color:var(--ink-soft)] transition-colors hover:text-[color:var(--ink)]"
        >
          &lt;- All treatments
        </Link>
      </div>
    </main>
  );
}
