import Image from 'next/image';
import { notFound } from 'next/navigation';
import ProductActions from '@/components/ui/ProductActions';
import Tag from '@/components/ui/Tag';
import ReviewEngine from '@/components/modules/ReviewEngine';
import UpsellEngine from '@/components/modules/UpsellEngine';
import {
  ParallaxMedia,
  Reveal,
  StaggerGroup,
  StaggerItem,
} from '@/components/ui/ExperienceMotion';
import { PRODUCTS } from '@/data/products';

const PRODUCT_INGREDIENTS: Record<string, string[]> = {
  'restore-serum': ['Ceramide NP', 'Ceramide AP', 'Niacinamide 4%', 'Panthenol'],
  'brightening-complex': ['L-Ascorbic Acid 20%', 'Ferulic Acid', 'Vitamin E'],
  'renewal-night-cream': ['Encapsulated Retinol 0.3%', 'Squalane', 'Peptide Complex'],
  'eye-revival': ['Acetyl Hexapeptide-3', 'Palmitoyl Tripeptide-5', 'Caffeine', 'Marine Collagen'],
  'daily-shield-spf50': ['Zinc Oxide 18%', 'Titanium Dioxide 7%', 'Niacinamide 3%'],
  'purifying-cleanse-balm': ['Papain (Papaya Enzyme)', 'Shea Butter', 'Jojoba Oil', 'Vitamin E'],
};

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ slug: product.slug }));
}

export default function SingleProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = PRODUCTS.find((item) => item.slug === params.slug);

  if (!product) {
    notFound();
  }

  const ingredients = PRODUCT_INGREDIENTS[product.slug] || [];

  return (
    <main className="pb-24">
      <section id="product-overview" className="section-shell">
        <div className="section-wrap px-4">
          <div className="soft-panel grid gap-8 rounded-[2.2rem] p-6 lg:grid-cols-[1fr_0.92fr] lg:p-10">
            <Reveal>
              <div className="editorial-frame min-h-[360px] bg-[color:var(--surface)]">
                <ParallaxMedia className="h-full" mediaClassName="h-full" speed={28}>
                  <div className="relative h-full min-h-[360px]">
                    <Image
                      src={product.image || `/images/product-${product.slug}.png`}
                      alt={product.name}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </ParallaxMedia>
              </div>
            </Reveal>

            <Reveal delay={0.08} className="flex flex-col justify-center">
              <Tag>{product.concern}</Tag>
              <h1 className="mt-6 font-display text-[clamp(3.1rem,5.5vw,5.2rem)] leading-[0.92] tracking-[-0.08em] text-[color:var(--ink)]">
                {product.name}
              </h1>
              <p className="mt-4 font-mono text-[13px] uppercase tracking-[0.18em] text-[color:var(--accent-strong)]">
                {product.price}
              </p>
              <p className="mt-6 text-[16px] leading-8 text-[color:var(--ink-soft)]">
                {product.description}. Formulated with clinical precision for
                maximum efficacy and optimal skin compatibility.
              </p>

              <div className="quiet-panel mt-8 rounded-[1.6rem] p-5">
                <h2 className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--accent-strong)]">
                  Key Clinical Actives
                </h2>
                <StaggerGroup className="mt-4 space-y-3" stagger={0.06}>
                  {ingredients.map((ingredient) => (
                    <StaggerItem key={ingredient}>
                      <div className="flex gap-3 text-[15px] leading-7 text-[color:var(--ink-soft)]">
                        <span className="text-[color:var(--accent-strong)]">-</span>
                        <span>{ingredient}</span>
                      </div>
                    </StaggerItem>
                  ))}
                </StaggerGroup>
              </div>

              <div className="mt-8">
                <ProductActions productName={product.name} />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="product-reviews">
        <ReviewEngine mode="compact" productName={product.name} />
      </section>

      <section id="product-routine" className="section-shell bg-[color:var(--page)]">
        <div className="section-wrap px-4">
          <UpsellEngine
            mode="routine"
            productName={product.name}
            concern={product.concern}
          />
        </div>
      </section>

      <section id="product-replenishment" className="section-wrap px-4 pb-16">
        <UpsellEngine mode="replenishment" productName={product.name} />
      </section>
    </main>
  );
}
