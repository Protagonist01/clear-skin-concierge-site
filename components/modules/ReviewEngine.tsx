'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════════════════
   Module 04 — Social Proof Strategy Demo
   Stack: Pure React — no API

   This module is a strategy demonstration — not a live review system.
   The 24 reviews are representative samples written in Clear Skin's
   client voice. The impact toggle demonstrates proven industry conversion
   uplift figures. In production this connects to a review platform via
   webhook; the AI layer personalises each outreach message based on the
   specific treatment received.
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── Types ────────────────────────────────────────────────────────────────────

interface Review {
  id: string;
  treatmentOrProduct: string;
  name: string;
  age: string;
  location: string;
  rating: number;
  date: string;
  body: string;
  verified: boolean;
}

interface ReviewEngineProps {
  mode: 'full' | 'compact';
  treatmentName?: string;
  productName?: string;
}

// ─── 24 Representative Reviews ────────────────────────────────────────────────
// Written in Clear Skin's client voice — articulate, results-focused, measured.
// Each references the specific treatment/product by exact Clear Skin name.
// Ratings: mostly 5-star, some 4-star — no lower.

const TREATMENT_REVIEWS: Review[] = [
  // ── Skin Analysis (3 reviews) ──────────────────────────────────────────────
  {
    id: 'sa-1',
    treatmentOrProduct: 'Skin Analysis',
    name: 'Amara O.',
    age: '34',
    location: 'London',
    rating: 5,
    date: 'January 2026',
    body: "I came to Clear Skin after years of trying over-the-counter options for pigmentation. The Skin Analysis was the most considered approach I've experienced — the pre-treatment consultation alone was worth the visit. The written treatment plan gave me a clear sequence to follow rather than a vague list of suggestions.",
    verified: true,
  },
  {
    id: 'sa-2',
    treatmentOrProduct: 'Skin Analysis',
    name: 'James K.',
    age: '42',
    location: 'Dubai',
    rating: 5,
    date: 'December 2025',
    body: "The digital facial mapping during my Skin Analysis was genuinely illuminating. My clinician identified concerns I hadn't noticed — dehydration beneath the surface, subtle textural changes on the jawline. The bespoke treatment plan I left with was specific and prioritised.",
    verified: true,
  },
  {
    id: 'sa-3',
    treatmentOrProduct: 'Skin Analysis',
    name: 'Chidinma E.',
    age: '29',
    location: 'Lagos',
    rating: 4,
    date: 'January 2026',
    body: "Thorough and professional. The Skin Analysis revealed pore congestion I'd been attributing to genetics. The product recommendations were precise — not a long list, just two specific Clear Skin products with a clear rationale for each.",
    verified: true,
  },

  // ── Clinical Facial (3 reviews) ────────────────────────────────────────────
  {
    id: 'cf-1',
    treatmentOrProduct: 'Clinical Facial',
    name: 'Nadia R.',
    age: '31',
    location: 'London',
    rating: 5,
    date: 'January 2026',
    body: "The Clinical Facial extraction was thorough but never aggressive — I've had facials elsewhere that left my skin raw for days. The enzymatic exfoliation followed by targeted serum application left my face feeling genuinely clean and calm. My clinician adapted the protocol to my sensitivity.",
    verified: true,
  },
  {
    id: 'cf-2',
    treatmentOrProduct: 'Clinical Facial',
    name: 'Marcus L.',
    age: '45',
    location: 'Dubai',
    rating: 5,
    date: 'December 2025',
    body: "I was sceptical about the clinical approach to facials, but the Clinical Facial results spoke for themselves. The high-frequency treatment cleared congestion I'd been managing for over a year. My clinician adjusted the active mask mid-session based on how my skin was responding.",
    verified: true,
  },
  {
    id: 'cf-3',
    treatmentOrProduct: 'Clinical Facial',
    name: 'Olivia M.',
    age: '33',
    location: 'via Clear Skin Online',
    rating: 4,
    date: 'November 2025',
    body: "The Clinical Facial duration is well-spent. The massage techniques during serum application were both relaxing and purposeful — not just pleasant, clinically relevant. My skin looked noticeably brighter the following morning, and colleagues commented unprompted.",
    verified: true,
  },

  // ── Volume Treatment (3 reviews) ──────────────────────────────────────────
  {
    id: 'vt-1',
    treatmentOrProduct: 'Volume Treatment',
    name: 'Catherine W.',
    age: '41',
    location: 'London',
    rating: 5,
    date: 'January 2026',
    body: "The Volume Treatment consultation convinced me before the procedure began. My clinician walked through my facial anatomy and explained why certain areas would benefit more than others. The result is balanced and proportional — nothing looks exaggerated or overdone.",
    verified: true,
  },
  {
    id: 'vt-2',
    treatmentOrProduct: 'Volume Treatment',
    name: 'Daniel A.',
    age: '38',
    location: 'Dubai',
    rating: 5,
    date: 'December 2025',
    body: "As a male client, I appreciated the Volume Treatment approach that wasn't overly feminised. My clinician maintained my facial structure while restoring volume I'd lost over the last five years. The complimentary two-week review confirmed everything had settled precisely as planned.",
    verified: true,
  },
  {
    id: 'vt-3',
    treatmentOrProduct: 'Volume Treatment',
    name: 'Fatima K.',
    age: '35',
    location: 'Lagos',
    rating: 4,
    date: 'November 2025',
    body: "The Volume Treatment lip volumisation was exactly what I asked for — defined but not exaggerated. The hyaluronic acid approach meant adjustments were possible at the two-week review if anything felt off. Some bruising occurred but resolved within four days as described.",
    verified: true,
  },

  // ── Expression Reset (3 reviews) ──────────────────────────────────────────
  {
    id: 'er-1',
    treatmentOrProduct: 'Expression Reset',
    name: 'Robert H.',
    age: '50',
    location: 'London',
    rating: 5,
    date: 'January 2026',
    body: "The Expression Reset was faster than I expected — under twenty minutes from start to finish. My clinician mapped each injection point precisely before beginning. Two weeks later, the forehead lines have softened without compromising my natural expression.",
    verified: true,
  },
  {
    id: 'er-2',
    treatmentOrProduct: 'Expression Reset',
    name: 'Priya S.',
    age: '36',
    location: 'London',
    rating: 5,
    date: 'December 2025',
    body: "I had the Expression Reset for crow's feet specifically. The two-week review appointment was reassuring — my clinician checked the symmetry and made a minor clinical adjustment free of charge. The result looks natural and well-considered.",
    verified: true,
  },
  {
    id: 'er-3',
    treatmentOrProduct: 'Expression Reset',
    name: 'Ahmed F.',
    age: '39',
    location: 'Dubai',
    rating: 4,
    date: 'October 2025',
    body: "The honest assessment of what the Expression Reset could achieve was refreshing. My clinician explained the limitations clearly and set expectations before we started. The results at ten days were exactly as described — softened expression lines, no frozen appearance.",
    verified: true,
  },

  // ── Laser Renewal (3 reviews) ─────────────────────────────────────────────
  {
    id: 'lr-1',
    treatmentOrProduct: 'Laser Renewal',
    name: 'Jennifer P.',
    age: '44',
    location: 'London',
    rating: 5,
    date: 'January 2026',
    body: "The Laser Renewal pre-treatment protocol was rigorous — two weeks of preparation with specific products. The session itself was managed in sections, with my comfort checked constantly. After the third session, friends have asked what I've changed without being able to identify it.",
    verified: true,
  },
  {
    id: 'lr-2',
    treatmentOrProduct: 'Laser Renewal',
    name: 'Sophia L.',
    age: '37',
    location: 'Lagos',
    rating: 5,
    date: 'December 2025',
    body: "The Laser Renewal sun avoidance protocol was non-negotiable, and my clinician explained precisely why. The downtime of five days was manageable with the Daily Shield SPF50 provided as part of aftercare. My pigmentation has reduced by a visible margin across three sessions.",
    verified: true,
  },
  {
    id: 'lr-3',
    treatmentOrProduct: 'Laser Renewal',
    name: 'Michael B.',
    age: '48',
    location: 'London',
    rating: 4,
    date: 'October 2025',
    body: "Fine lines around my eyes were the primary concern. My Laser Renewal specialist explained the realistic outcomes before we began — no over-promising. The fractional approach meant recovery was faster than the full-surface alternative, and the results from day seven onward were measurable.",
    verified: true,
  },

  // ── HydraRevive (3 reviews) ───────────────────────────────────────────────
  {
    id: 'hr-1',
    treatmentOrProduct: 'HydraRevive',
    name: 'Emma R.',
    age: '32',
    location: 'London',
    rating: 5,
    date: 'January 2026',
    body: "The HydraRevive vortex extraction was genuinely gentle — I have sensitive skin and usually dread extractions. The simultaneous hydration step meant no tightness afterward. My skin looked noticeably cleaner and more even within twenty-four hours of leaving the clinic.",
    verified: true,
  },
  {
    id: 'hr-2',
    treatmentOrProduct: 'HydraRevive',
    name: 'Khadija M.',
    age: '28',
    location: 'Dubai',
    rating: 5,
    date: 'December 2025',
    body: "The HydraRevive is now my pre-event routine at Clear Skin. The LED light therapy at the end calms any residual sensitivity. No downtime means I can have it the afternoon before and look noticeably more even-toned by the evening — exactly as my clinician described.",
    verified: true,
  },
  {
    id: 'hr-3',
    treatmentOrProduct: 'HydraRevive',
    name: 'Thomas J.',
    age: '35',
    location: 'via Clear Skin Online',
    rating: 4,
    date: 'November 2025',
    body: "Straightforward, effective, no fuss. I was in and out within the expected time for my HydraRevive. The extraction was surprisingly thorough and the serum infusion left my skin feeling hydrated for the rest of the week. Booking my second session.",
    verified: true,
  },

  // ── BioRevive (3 reviews) ──────────────────────────────────────────────────
  {
    id: 'br-1',
    treatmentOrProduct: 'BioRevive',
    name: 'Anita D.',
    age: '46',
    location: 'London',
    rating: 5,
    date: 'January 2026',
    body: "The BioRevive bio-remodelling approach interested me over traditional fillers. The five-point injection technique was quick — under ten minutes. After the second session four weeks later, the improvement in skin laxity around my jawline was clearly visible and felt natural.",
    verified: true,
  },
  {
    id: 'br-2',
    treatmentOrProduct: 'BioRevive',
    name: 'Yusuf S.',
    age: '43',
    location: 'Dubai',
    rating: 5,
    date: 'December 2025',
    body: "Skin laxity around my jawline was my concern, and my clinician recommended BioRevive over fillers. The second session made a visible difference that the first alone hadn't fully achieved. My clinician explained from the start that the protocol requires two treatments, four weeks apart.",
    verified: true,
  },
  {
    id: 'br-3',
    treatmentOrProduct: 'BioRevive',
    name: 'Claire T.',
    age: '51',
    location: 'London',
    rating: 4,
    date: 'October 2025',
    body: "The BioRevive treatment was relatively quick and the results subtle but meaningful. The temporary bumpiness at the injection sites resolved within a week as described. My skin looks healthier and more resilient rather than artificially changed — which is exactly what I wanted.",
    verified: true,
  },

  // ── Light Therapy (3 reviews) ──────────────────────────────────────────────
  {
    id: 'lt-1',
    treatmentOrProduct: 'Light Therapy',
    name: 'Sarah T.',
    age: '38',
    location: 'London',
    rating: 5,
    date: 'January 2026',
    body: "I use Light Therapy as a recovery protocol after my Laser Renewal sessions at Clear Skin. The red and near-infrared wavelengths noticeably accelerated my healing — redness resolved two days faster than sessions without it. My clinician recommended a course of six.",
    verified: true,
  },
  {
    id: 'lt-2',
    treatmentOrProduct: 'Light Therapy',
    name: 'Grace N.',
    age: '39',
    location: 'Lagos',
    rating: 5,
    date: 'December 2025',
    body: "Completely pain-free and surprisingly effective. I booked Light Therapy initially for post-treatment recovery, but after four sessions the persistent redness around my nose has reduced significantly. The thirty-minute sessions fit well into a lunch break.",
    verified: true,
  },
  {
    id: 'lt-3',
    treatmentOrProduct: 'Light Therapy',
    name: 'Lisa C.',
    age: '40',
    location: 'London',
    rating: 4,
    date: 'November 2025',
    body: "The Light Therapy session itself is thirty minutes of sitting still under a panel — straightforward with no discomfort. The cumulative improvement across six sessions was the real benefit. My skin feels calmer and my sensitivity flare-ups are measurably less frequent.",
    verified: true,
  },
];

// ── Product Reviews ──────────────────────────────────────────────────────────
const PRODUCT_REVIEWS: Review[] = [
  // ── Restore Serum ──
  {
    id: 'rs-1',
    treatmentOrProduct: 'Restore Serum',
    name: 'Rebecca K.',
    age: '35',
    location: 'London',
    rating: 5,
    date: 'January 2026',
    body: "The Restore Serum rebuilt my moisture barrier after years of over-exfoliation with harsh acids. The ceramide complex is clinical-grade — my skin stopped feeling tight within the first week. On my second bottle and the consistency of results has held.",
    verified: true,
  },
  {
    id: 'rs-2',
    treatmentOrProduct: 'Restore Serum',
    name: 'David L.',
    age: '41',
    location: 'Dubai',
    rating: 5,
    date: 'December 2025',
    body: "Post-Laser Renewal, my clinician at Clear Skin recommended the Restore Serum specifically. The healing time was noticeably faster than my previous course where I used a generic ceramide product. The texture is lightweight despite the rich formulation.",
    verified: true,
  },
  // ── Brightening Complex ──
  {
    id: 'bc-1',
    treatmentOrProduct: 'Brightening Complex',
    name: 'Mariam A.',
    age: '30',
    location: 'Lagos',
    rating: 5,
    date: 'January 2026',
    body: "The 20% concentration in the Brightening Complex is effective without irritation. The stabilised formula means it doesn't oxidise before I finish the bottle — a problem I've had with every other Vitamin C. Six weeks of consistent morning use has made a measurable difference.",
    verified: true,
  },
  {
    id: 'bc-2',
    treatmentOrProduct: 'Brightening Complex',
    name: 'Sophie M.',
    age: '33',
    location: 'London',
    rating: 4,
    date: 'November 2025',
    body: "The Brightening Complex dropper dispenses exactly the right amount for full-face application. Initial tingling is normal and subsided after the first week as my clinician at Clear Skin described. My overall skin tone is more even after six weeks of consistent use.",
    verified: true,
  },
  // ── Renewal Night Cream ──
  {
    id: 'rnc-1',
    treatmentOrProduct: 'Renewal Night Cream',
    name: 'Hannah B.',
    age: '38',
    location: 'London',
    rating: 5,
    date: 'January 2026',
    body: "The Renewal Night Cream encapsulation technology means no irritation — even starting at three nights per week as recommended by my Clear Skin clinician. Fine lines around my eyes have softened measurably after eight weeks of consistent use.",
    verified: true,
  },
  {
    id: 'rnc-2',
    treatmentOrProduct: 'Renewal Night Cream',
    name: 'Paul W.',
    age: '47',
    location: 'Dubai',
    rating: 5,
    date: 'December 2025',
    body: "The Renewal Night Cream is the first retinol that hasn't caused peeling or redness for me. My skin texture has improved significantly over two months. The niacinamide in the formula seems to support the retinol tolerance in a way other products haven't managed.",
    verified: true,
  },
  // ── Eye Revival ──
  {
    id: 'evr-1',
    treatmentOrProduct: 'Eye Revival',
    name: 'Anna F.',
    age: '36',
    location: 'London',
    rating: 5,
    date: 'January 2026',
    body: "The argireline peptide in the Eye Revival formula works — after eight weeks, the fine lines around my eyes are less pronounced. The formula absorbs quickly and sits well under makeup without causing creasing throughout the day.",
    verified: true,
  },
  {
    id: 'evr-2',
    treatmentOrProduct: 'Eye Revival',
    name: 'Jonathan R.',
    age: '44',
    location: 'via Clear Skin Online',
    rating: 4,
    date: 'November 2025',
    body: "Dark circles have lightened with the Eye Revival — not disappeared, but noticeably improved after consistent use. The caffeine extract seems to reduce morning puffiness. Will repurchase when this tube runs out; my clinician confirmed the timeline for results.",
    verified: true,
  },
  // ── Daily Shield SPF50 ──
  {
    id: 'ds-1',
    treatmentOrProduct: 'Daily Shield SPF50',
    name: 'Lena M.',
    age: '27',
    location: 'London',
    rating: 5,
    date: 'January 2026',
    body: "The Daily Shield SPF50 genuinely disappears on application — no white cast, no greasy residue. It's the first mineral sunscreen I've found that feels like wearing nothing. Essential after my Brightening Complex routine each morning.",
    verified: true,
  },
  {
    id: 'ds-2',
    treatmentOrProduct: 'Daily Shield SPF50',
    name: 'Samuel O.',
    age: '34',
    location: 'Lagos',
    rating: 5,
    date: 'December 2025',
    body: "Post-Laser Renewal, the Daily Shield SPF50 was the only sunscreen my Clear Skin clinician approved for the first four weeks. On deeper skin tones, the mineral filters blend without any visible cast. The fluid consistency makes daily application effortless.",
    verified: true,
  },
  // ── Purifying Cleanse Balm ──
  {
    id: 'pcb-1',
    treatmentOrProduct: 'Purifying Cleanse Balm',
    name: 'Ingrid T.',
    age: '42',
    location: 'via Clear Skin Online',
    rating: 5,
    date: 'January 2026',
    body: "The Purifying Cleanse Balm melts through even waterproof makeup without tugging. The papaya enzyme provides a gentle exfoliation that my sensitive skin tolerates well. My pores look cleaner after two weeks of daily use than they have in months.",
    verified: true,
  },
  {
    id: 'pcb-2',
    treatmentOrProduct: 'Purifying Cleanse Balm',
    name: 'Kevin D.',
    age: '37',
    location: 'London',
    rating: 4,
    date: 'November 2025',
    body: "The Purifying Cleanse Balm has a surprisingly rich texture for a cleanser. The moringa oil leaves my skin feeling nourished rather than stripped. One jar has lasted nearly three months with twice-daily use, which makes the price point very reasonable.",
    verified: true,
  },
];

const ALL_REVIEWS = [...TREATMENT_REVIEWS, ...PRODUCT_REVIEWS];

function getReviewsForItem(name: string): Review[] {
  return ALL_REVIEWS.filter((r) => r.treatmentOrProduct === name);
}

// ─── Shared Sub-components ────────────────────────────────────────────────────

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const fontSize = size === 'md' ? '16px' : '14px';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{ color: star <= rating ? 'var(--amber)' : 'var(--border)', fontSize }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function VerifiedBadge() {
  return (
    <span
      className="inline-flex items-center gap-1"
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '9px',
        fontWeight: 500,
        color: 'var(--mint)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.06em',
      }}
    >
      <svg width="10" height="10" viewBox="0 0 12 12" fill="var(--mint)">
        <path d="M6 0C2.7 0 0 2.7 0 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6zm3.3 4.5L5.1 8.7 2.7 6.3l.6-.6L5.1 7.5l3.6-3.6.6.6z" />
      </svg>
      VERIFIED
    </span>
  );
}

// ─── Review Card ──────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: Review }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--white)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '20px',
      }}
    >
      {/* Name + verified badge */}
      <div className="flex items-center gap-2 mb-2">
        <span
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--espresso)',
          }}
        >
          {review.name}
        </span>
        {review.verified && <VerifiedBadge />}
      </div>

      {/* Star row + date */}
      <div className="flex items-center gap-3 mb-3">
        <StarRating rating={review.rating} />
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '10px',
            color: 'var(--muted)',
          }}
        >
          {review.date}
        </span>
      </div>

      {/* Body */}
      <p
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '13px',
          color: 'var(--text)',
          lineHeight: '1.7',
          marginBottom: '12px',
        }}
      >
        {review.body}
      </p>

      {/* Location tag */}
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '9px',
          color: 'var(--muted)',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.06em',
        }}
      >
        {review.location}
      </span>
    </div>
  );
}

// ─── Mini Review Card (compact mode) ──────────────────────────────────────────

function MiniReviewCard({ review }: { review: Review }) {
  const sentences = review.body.split(/(?<=[.!?])\s+/);
  const shortBody = sentences.slice(0, 2).join(' ');

  return (
    <div
      className="shrink-0"
      style={{
        minWidth: '260px',
        maxWidth: '300px',
        border: '1px solid var(--border)',
        backgroundColor: 'var(--white)',
        borderRadius: '8px',
        padding: '20px',
      }}
    >
      {/* Name */}
      <p
        className="mb-2"
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--espresso)',
        }}
      >
        {review.name}
      </p>

      {/* Stars */}
      <div className="mb-3">
        <StarRating rating={review.rating} />
      </div>

      {/* 2-sentence body */}
      <p
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '13px',
          color: 'var(--text)',
          lineHeight: '1.7',
        }}
      >
        {shortBody}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FULL MODE — Single Treatment Page (replaces 03C placeholder)
// ═══════════════════════════════════════════════════════════════════════════════

function FullModeReviewBlock({
  treatmentName,
  submittedReviews,
}: {
  treatmentName: string;
  submittedReviews: Review[];
}) {
  const [activeTab, setActiveTab] = useState<'reviews' | 'impact'>('reviews');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const matchingReviews = getReviewsForItem(treatmentName);
  const fallbackReviews = TREATMENT_REVIEWS;
  const seededReviews = matchingReviews.length > 0 ? matchingReviews : fallbackReviews;
  const allReviews = [...submittedReviews, ...seededReviews];
  const totalReviews = allReviews.length;
  const displayReviews = showAllReviews ? allReviews : allReviews.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* ── Star Summary Row ───────────────────────────────────────────── */}
      <div className="flex flex-col items-center md:flex-row md:items-baseline gap-4 mb-6">
        <span
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: '36px',
            fontWeight: 300,
            color: 'var(--espresso)',
            lineHeight: 1,
          }}
        >
          4.9
        </span>
        <div className="flex flex-col items-center md:items-start gap-1">
          <StarRating rating={5} size="md" />
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '13px',
              color: 'var(--muted-mid)',
            }}
          >
            from {totalReviews} client reviews
          </span>
        </div>
      </div>

      {/* ── Impact Toggle ────────────────────────────────────────────── */}
      <div
        className="w-full md:w-auto inline-flex rounded-md overflow-hidden"
        style={{
          backgroundColor: 'var(--mist)',
          border: '1px solid var(--border)',
          height: '44px',
        }}
      >
        <button
          onClick={() => setActiveTab('reviews')}
          className="flex-1 md:flex-none px-6 flex items-center justify-center transition-all duration-200"
          style={{
            backgroundColor: activeTab === 'reviews' ? 'var(--forest)' : 'transparent',
            color: activeTab === 'reviews' ? 'var(--white)' : 'var(--text)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '13px',
            fontWeight: 500,
            minWidth: '44px',
            minHeight: '44px',
          }}
        >
          Reviews
        </button>
        <button
          onClick={() => setActiveTab('impact')}
          className="flex-1 md:flex-none px-6 flex items-center justify-center transition-all duration-200"
          style={{
            backgroundColor: activeTab === 'impact' ? 'var(--forest)' : 'transparent',
            color: activeTab === 'impact' ? 'var(--white)' : 'var(--text)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '13px',
            fontWeight: 500,
            minWidth: '44px',
            minHeight: '44px',
          }}
        >
          Impact
        </button>
      </div>

      {/* ── Animated Content ───────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'reviews' ? (
          <motion.div
            key="reviews"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {/* Review cards: 1-column mobile, 3-column md+ */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {displayReviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="impact"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="space-y-8"
          >
            {/* ── Heading ── */}
            <h3
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: '24px',
                fontWeight: 300,
                color: 'var(--espresso)',
              }}
            >
              What verified reviews do for conversion
            </h3>

            {/* ── Side-by-side mock treatment cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LEFT — without reviews */}
              <div className="flex flex-col">
                <p
                  className="mb-3 uppercase tracking-[0.16em]"
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '9px',
                    fontWeight: 500,
                    color: 'var(--muted)',
                  }}
                >
                  Without reviews
                </p>
                <div
                  className="flex-1 p-6"
                  style={{
                    backgroundColor: 'var(--white)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                >
                  {/* Mock treatment card */}
                  <span
                    className="inline-block px-2 py-0.5 rounded mb-4"
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '9px',
                      fontWeight: 500,
                      color: 'var(--mint)',
                      backgroundColor: 'rgba(61, 184, 136, 0.12)',
                      border: '1px solid rgba(61, 184, 136, 0.3)',
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.1em',
                    }}
                  >
                    Treatment
                  </span>
                  <p
                    className="mb-2"
                    style={{
                      fontFamily: "'Fraunces', serif",
                      fontSize: '20px',
                      fontWeight: 300,
                      color: 'var(--espresso)',
                    }}
                  >
                    {treatmentName || 'Clinical Facial'}
                  </p>
                  <p
                    className="mb-6"
                    style={{
                      fontFamily: "'Fraunces', serif",
                      fontSize: '18px',
                      fontWeight: 300,
                      color: 'var(--fern)',
                    }}
                  >
                    £280
                  </p>
                  {/* Placeholder text lines */}
                  <div className="space-y-2 mb-6">
                    <div className="h-3 w-full rounded" style={{ backgroundColor: 'var(--mist)' }} />
                    <div className="h-3 w-4/5 rounded" style={{ backgroundColor: 'var(--mist)' }} />
                  </div>
                  {/* No reviews section */}
                  <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <p
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: '12px',
                        color: 'var(--muted)',
                      }}
                    >
                      No reviews yet
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT — with reviews + conversion stat overlay */}
              <div className="flex flex-col relative">
                <p
                  className="mb-3 uppercase tracking-[0.16em]"
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: '9px',
                    fontWeight: 500,
                    color: 'var(--mint)',
                  }}
                >
                  With {totalReviews} reviews
                </p>
                <div
                  className="flex-1 p-6 relative"
                  style={{
                    backgroundColor: 'var(--white)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                  }}
                >
                  {/* Mock treatment card */}
                  <span
                    className="inline-block px-2 py-0.5 rounded mb-4"
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '9px',
                      fontWeight: 500,
                      color: 'var(--mint)',
                      backgroundColor: 'rgba(61, 184, 136, 0.12)',
                      border: '1px solid rgba(61, 184, 136, 0.3)',
                      textTransform: 'uppercase' as const,
                      letterSpacing: '0.1em',
                    }}
                  >
                    Treatment
                  </span>
                  <p
                    className="mb-2"
                    style={{
                      fontFamily: "'Fraunces', serif",
                      fontSize: '20px',
                      fontWeight: 300,
                      color: 'var(--espresso)',
                    }}
                  >
                    {treatmentName || 'Clinical Facial'}
                  </p>
                  <p
                    className="mb-6"
                    style={{
                      fontFamily: "'Fraunces', serif",
                      fontSize: '18px',
                      fontWeight: 300,
                      color: 'var(--fern)',
                    }}
                  >
                    £280
                  </p>
                  {/* Placeholder text lines */}
                  <div className="space-y-2 mb-6">
                    <div className="h-3 w-full rounded" style={{ backgroundColor: 'var(--mist)' }} />
                    <div className="h-3 w-4/5 rounded" style={{ backgroundColor: 'var(--mist)' }} />
                  </div>
                  {/* Reviews visible */}
                  <div className="pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <StarRating rating={5} />
                        <span
                          style={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif",
                            fontSize: '12px',
                            color: 'var(--muted-mid)',
                          }}
                        >
                          4.9 · {totalReviews} reviews
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── Conversion stat overlay ── */}
                  <div
                    className="absolute bottom-4 right-4 px-4 py-3 rounded-lg text-right"
                    style={{
                      backgroundColor: 'rgba(253, 255, 254, 0.92)',
                      boxShadow: '0 0 20px rgba(61, 184, 136, 0.20)',
                      border: '1px solid rgba(61, 184, 136, 0.2)',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "'Fraunces', serif",
                        fontSize: 'clamp(24px, 4vw, 32px)',
                        fontWeight: 300,
                        color: 'var(--mint)',
                        lineHeight: 1.1,
                      }}
                    >
                      +52%
                    </p>
                    <p
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: '11px',
                        color: 'var(--muted-mid)',
                      }}
                    >
                      conversion rate
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Source citation ── */}
            <p
              className="text-center"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '9px',
                color: 'var(--muted)',
              }}
            >
              Industry benchmark — McKinsey, 2023
            </p>

            {/* ── Explanation ── */}
            <p
              className="text-center max-w-2xl mx-auto"
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '13px',
                color: 'var(--muted-mid)',
                lineHeight: '1.7',
              }}
            >
              Verified reviews are the single highest-impact trust signal on a treatment
              page. Clients who see 10+ reviews convert at over 52% higher than those
              who see none.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── "See all reviews" link ─────────────────────────────────────── */}
      <button
        onClick={() => {
          if (activeTab !== 'reviews') {
            setActiveTab('reviews');
            return;
          }
          setShowAllReviews((current) => !current);
        }}
        className="mt-4 transition-colors duration-200 hover:underline"
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '13px',
          color: 'var(--fern)',
          minHeight: '44px',
          minWidth: '44px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {activeTab !== 'reviews'
          ? 'Back to reviews'
          : showAllReviews
            ? 'Show fewer reviews'
            : `See all ${totalReviews} reviews →`}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// REVIEW COLLECTION SIMULATOR
// ═══════════════════════════════════════════════════════════════════════════════

function ReviewRequestSimulator() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-16 pt-8" style={{ borderTop: '1px solid var(--border)' }}>
      {/* ── Toggle heading ── */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
        style={{ minHeight: '44px' }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '10px',
            fontWeight: 500,
            color: 'var(--muted)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
          }}
        >
          How Clear Skin asks for follow-up reviews
        </span>
        <span
          style={{
            color: 'var(--muted)',
            fontSize: '14px',
            transition: 'transform 0.2s ease',
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          ▾
        </span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="pt-6 space-y-6">
              {/* ── Intro text ── */}
              <p
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '13px',
                  color: 'var(--muted-mid)',
                  lineHeight: '1.7',
                }}
              >
                After a completed treatment, the clinic can send a short follow-up
                message asking for feedback:
              </p>

              {/* ── Mock SMS/email frame ── */}
              <div
                className="mx-auto rounded-lg overflow-hidden"
                style={{
                  maxWidth: '85vw',
                  width: '100%',
                  maxInlineSize: '420px',
                  backgroundColor: 'var(--white)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                }}
              >
                {/* Header */}
                <div
                  className="px-4 py-3 flex items-center gap-3"
                  style={{
                    backgroundColor: 'var(--mist)',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--forest)' }}
                  >
                    <span
                      style={{
                        fontFamily: "'Fraunces', serif",
                        fontSize: '14px',
                        fontWeight: 300,
                        color: 'var(--white)',
                      }}
                    >
                      CS
                    </span>
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--espresso)',
                      }}
                    >
                      Clear Skin Clinic
                    </p>
                  </div>
                </div>

                {/* Message body */}
                <div className="p-5">
                  <p
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: '13px',
                      color: 'var(--text)',
                      lineHeight: '1.7',
                    }}
                  >
                    Hi [Name], thank you for visiting us for your [Treatment]. We&apos;d
                    love to hear how your skin is responding. Leaving a verified review
                    takes 2 minutes and helps other clients make informed decisions.{' '}
                    <span
                      style={{ color: 'var(--fern)', fontWeight: 500, cursor: 'pointer' }}
                    >
                      Leave a review →
                    </span>
                  </p>
                </div>
              </div>

              {/* ── Production architecture note ── */}
              <p
                className="text-center max-w-lg mx-auto"
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '10px',
                  color: 'var(--muted)',
                  fontStyle: 'italic',
                  lineHeight: '1.7',
                }}
              >
                This follow-up can be sent by the clinic team after treatment and
                linked back to the client record. The same message can be delivered
                by SMS, email, or both depending on the clinic workflow.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPACT MODE — Single Product Page (replaces 05B placeholder)
// ═══════════════════════════════════════════════════════════════════════════════

function CompactModeReviewBlock({
  productName,
  submittedReviews,
}: {
  productName: string;
  submittedReviews: Review[];
}) {
  const matchingReviews = getReviewsForItem(productName);
  const seededReviews = matchingReviews.length > 0 ? matchingReviews : PRODUCT_REVIEWS;
  const allReviews = [...submittedReviews, ...seededReviews];
  const totalReviews = allReviews.length;
  const displayReviews = allReviews.slice(0, 3);

  return (
    <div>
      {/* ── Single row: star average + "from N reviews" ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <StarRating rating={5} size="md" />
          <span
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: '24px',
              fontWeight: 300,
              color: 'var(--espresso)',
              lineHeight: 1,
            }}
          >
            4.9
          </span>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '13px',
              color: 'var(--muted-mid)',
            }}
          >
            from {totalReviews} reviews
          </span>
        </div>
      </div>

      {/* ── 3 mini cards in horizontal scroll ── */}
      <div
        className="flex gap-4 pb-4 -mx-6 px-6 sm:mx-0 sm:px-0 hide-scrollbar"
        style={{
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          maskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)',
        }}
      >
        <style>{`.hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
        {displayReviews.map((review) => (
          <MiniReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}

function ReviewSubmissionCard({
  itemName,
  onCreated,
}: {
  itemName: string;
  onCreated: (review: Review) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemName,
          name,
          location,
          rating,
          body,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to submit the review.');
      }

      onCreated(payload.review as Review);
      setName('');
      setLocation('');
      setRating(5);
      setBody('');
      setSuccess('Thank you. Your review has been added to this page.');
      setIsOpen(false);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to submit the review.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="mt-8 rounded-[1.4rem] border p-5"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--white)',
      }}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p
            style={{
              fontFamily: "'Fraunces', serif",
              fontSize: '28px',
              fontWeight: 300,
              color: 'var(--espresso)',
            }}
          >
            Leave a review
          </p>
          <p
            className="mt-2"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '13px',
              color: 'var(--muted-mid)',
              lineHeight: '1.7',
            }}
          >
            Share how {itemName} felt, what changed, and what other clients should know.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 text-[13px] transition-colors"
          style={{
            border: '1px solid var(--border)',
            color: 'var(--fern)',
          }}
        >
          {isOpen ? 'Close form' : 'Write a review'}
        </button>
      </div>

      {success && (
        <p
          className="mt-4"
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '13px',
            color: 'var(--mint)',
          }}
        >
          {success}
        </p>
      )}

      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            className="field-input"
            required
          />
          <input
            type="text"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Location"
            className="field-input"
            required
          />

          <label className="md:col-span-2">
            <span className="mb-2 block text-[12px] text-[color:var(--muted-mid)]">Rating</span>
            <select
              value={rating}
              onChange={(event) => setRating(Number(event.target.value))}
              className="field-input"
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value} star{value === 1 ? '' : 's'}
                </option>
              ))}
            </select>
          </label>

          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="Tell other clients what stood out for you."
            className="field-textarea md:col-span-2"
            required
          />

          {error && (
            <p className="md:col-span-2 text-[13px]" style={{ color: '#9f3d32' }}>
              {error}
            </p>
          )}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="button-shell button-primary inline-flex min-h-[48px] items-center justify-center rounded-xl px-6 py-3 text-[15px] font-medium"
            >
              {submitting ? 'Submitting...' : 'Submit review'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ReviewEngine({
  mode,
  treatmentName,
  productName,
}: ReviewEngineProps) {
  const itemName = mode === 'compact' ? (productName || '') : (treatmentName || '');
  const [submittedReviews, setSubmittedReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!itemName) {
      setSubmittedReviews([]);
      return;
    }

    let active = true;

    async function loadReviews() {
      try {
        const response = await fetch(`/api/reviews?itemName=${encodeURIComponent(itemName)}`);
        const payload = await response.json();

        if (active) {
          setSubmittedReviews(Array.isArray(payload?.reviews) ? payload.reviews as Review[] : []);
        }
      } catch {
        if (active) {
          setSubmittedReviews([]);
        }
      }
    }

    void loadReviews();

    return () => {
      active = false;
    };
  }, [itemName]);

  /* ── Compact mode (product pages) ── */
  if (mode === 'compact') {
    return (
      <section
        className="border-y"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--mist)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-12 py-16">
          <CompactModeReviewBlock
            productName={productName || ''}
            submittedReviews={submittedReviews}
          />
          {itemName && (
            <ReviewSubmissionCard
              itemName={itemName}
              onCreated={(review) => setSubmittedReviews((current) => [review, ...current])}
            />
          )}
        </div>
      </section>
    );
  }

  /* ── Full mode (treatment pages) ── */
  return (
    <section className="py-16" style={{ backgroundColor: 'var(--frost)' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Section label */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="h-[3px]"
            style={{ width: '18px', backgroundColor: 'var(--mint)' }}
          />
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: '10px',
              fontWeight: 500,
              color: 'var(--muted)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase' as const,
            }}
          >
            Client Reviews
          </span>
        </div>

        <FullModeReviewBlock
          treatmentName={treatmentName || ''}
          submittedReviews={submittedReviews}
        />
        <ReviewRequestSimulator />
        {itemName && (
          <ReviewSubmissionCard
            itemName={itemName}
            onCreated={(review) => setSubmittedReviews((current) => [review, ...current])}
          />
        )}
      </div>
    </section>
  );
}
