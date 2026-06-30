import Image from 'next/image';
import Button from '@/components/ui/Button';
import {
  ParallaxMedia,
  Reveal,
  StaggerGroup,
  StaggerItem,
} from '@/components/ui/ExperienceMotion';

const PILLARS = [
  {
    title: 'Clinician-led',
    body: 'Every protocol is designed by practitioners. Clinical decisions are never passed down to non-medical staff.',
  },
  {
    title: 'Results measured',
    body: 'We track outcomes across every client, every visit, and every product. Baseline measurements and follow-up matter.',
  },
  {
    title: 'Formulated precisely',
    body: 'No trend ingredients. No inflated claims. Our skincare is assessed to a clinical standard, not a price point.',
  },
];

const TEAM = [
  {
    name: 'Dr. Amara Osei',
    role: 'Lead Aesthetic Physician',
    city: 'London',
    image: '/images/team-amara-osei.png',
  },
  {
    name: 'Dr. Leila Farhood',
    role: 'Dermatologist & Clinical Director',
    city: 'Dubai',
    image: '/images/team-leila-farhood.png',
  },
  {
    name: 'Chisom Eze',
    role: 'Senior Aesthetic Practitioner',
    city: 'Lagos',
    image: '/images/team-chisom-eze.png',
  },
];

const LOCATIONS = [
  {
    city: 'London',
    address: ['12 Mount Street', 'Mayfair, W1K 2PB'],
    hours: 'Mon-Sat: 09:00-19:00',
  },
  {
    city: 'Dubai',
    address: ['Gate Village 8, Level 2', 'DIFC, Dubai'],
    hours: 'Mon-Sun: 10:00-20:00',
  },
  {
    city: 'Lagos',
    address: ['4A Akin Olugbade Street', 'Victoria Island'],
    hours: 'Tue-Sat: 09:00-18:00',
  },
];

export default function AboutPage() {
  return (
    <main className="pb-24">
      <section id="about-hero" className="section-shell">
        <div className="section-wrap px-4">
          <div className="soft-panel grid gap-8 rounded-[2.2rem] p-6 lg:grid-cols-[0.9fr_1.1fr] lg:p-12">
            <Reveal className="flex max-w-[500px] flex-col justify-center">
              <span className="eyebrow mb-6">About us</span>
              <h1 className="font-display text-[clamp(3.2rem,6vw,5.8rem)] leading-[0.92] tracking-[-0.08em] text-[color:var(--ink)]">
                Built on clinical precision.
              </h1>
              <p className="mt-6 text-[16px] leading-8 text-[color:var(--ink-soft)]">
                Clear Skin opened in Mayfair in 2019. The pitch was simple:
                you should not have to choose between a sterile clinical room
                and a decorative spa. We wanted both.
              </p>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="editorial-frame min-h-[340px] bg-[color:var(--surface)]">
                <ParallaxMedia className="h-full" mediaClassName="h-full" speed={30}>
                  <div className="relative h-full min-h-[340px]">
                    <Image
                      src="/images/about-clinic.png"
                      alt="Clear Skin clinic"
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

      <section id="about-story" className="section-shell bg-[color:var(--page)]">
        <div className="section-wrap px-4">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <Reveal>
              <div>
                <span className="eyebrow">Our story</span>
                <h2 className="mt-6 font-display text-[clamp(2.8rem,5vw,4.6rem)] leading-[0.92] tracking-[-0.08em] text-[color:var(--ink)]">
                  London, 2019. One clear idea.
                </h2>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="space-y-5 text-[16px] leading-8 text-[color:var(--ink-soft)]">
                <p>
                  The approach is results-first. Every protocol is designed by
                  practitioners. We track outcomes across every client and every
                  visit. If something is not working, we say so.
                </p>
                <p>
                  Dubai followed in 2021. Lagos in 2023. Same standard across
                  all three, not a diluted version for each market.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section id="about-pillars" className="section-shell bg-[color:rgba(255,250,244,0.56)]">
        <div className="section-wrap px-4">
          <Reveal>
            <span className="eyebrow">How we work</span>
          </Reveal>
          <StaggerGroup className="mt-8 grid gap-6 md:grid-cols-3" stagger={0.08}>
            {PILLARS.map((pillar, index) => (
              <StaggerItem key={pillar.title}>
                <div className="quiet-panel h-full p-6">
                  <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--accent-strong)]">
                    0{index + 1}
                  </span>
                  <h3 className="mt-5 font-display text-[32px] leading-[1] tracking-[-0.05em] text-[color:var(--ink)]">
                    {pillar.title}
                  </h3>
                  <p className="mt-4 text-[15px] leading-7 text-[color:var(--ink-soft)]">
                    {pillar.body}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      <section id="about-team" className="section-shell bg-[color:var(--page)]">
        <div className="section-wrap px-4">
          <Reveal>
            <span className="eyebrow">Our practitioners</span>
          </Reveal>
          <StaggerGroup className="mt-8 grid gap-6 md:grid-cols-3" stagger={0.08}>
            {TEAM.map((member) => (
              <StaggerItem key={member.name}>
                <div className="card-hover overflow-hidden rounded-[1.85rem] border border-[color:var(--line)] bg-[color:var(--card-strong)]">
                  <div className="relative aspect-[1/1.05] bg-[color:var(--surface)]">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover transition-transform duration-700 hover:scale-[1.04]"
                    />
                  </div>
                  <div className="relative z-[1] p-6">
                    <h3 className="font-display text-[30px] leading-[1.02] tracking-[-0.05em] text-[color:var(--ink)]">
                      {member.name}
                    </h3>
                    <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--accent-strong)]">
                      {member.role}
                    </p>
                    <p className="mt-2 text-[14px] text-[color:var(--muted)]">
                      {member.city}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      <section id="about-locations" className="section-shell">
        <div className="section-wrap px-4">
          <div className="rounded-[2.2rem] bg-[color:var(--footer)] p-6 text-[color:var(--chalk)] sm:p-8 lg:p-12">
            <Reveal>
              <span className="eyebrow text-[color:var(--footer-muted)] before:bg-[color:rgba(255,250,244,0.2)]">
                Our locations
              </span>
            </Reveal>
            <StaggerGroup className="mt-8 grid gap-6 md:grid-cols-3" stagger={0.08}>
              {LOCATIONS.map((location) => (
                <StaggerItem key={location.city}>
                  <div className="rounded-[1.6rem] border border-[color:rgba(255,250,244,0.12)] bg-[color:rgba(255,250,244,0.04)] p-6">
                    <h3 className="font-display text-[36px] leading-none tracking-[-0.06em]">
                      {location.city}
                    </h3>
                    <div className="mt-4 space-y-1 text-[15px] leading-7 text-[color:var(--footer-muted)]">
                      {location.address.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                      <p className="pt-2">{location.hours}</p>
                    </div>
                    <Button href="/book" variant="dark" className="mt-6">
                      Book here
                    </Button>
                  </div>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </div>
      </section>
    </main>
  );
}
