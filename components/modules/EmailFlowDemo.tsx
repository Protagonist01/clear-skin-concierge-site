'use client';

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { registerEmailFlowDemoTrigger } from './EmailCapture';

// ─── Inline style constants ─────────────────────────────────────────────────
const pStyle: React.CSSProperties = {
  fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
  fontSize: 14,
  lineHeight: 1.75,
  color: '#243B30',
  marginBottom: 16,
};

const productBlockStyle: React.CSSProperties = {
  backgroundColor: '#F4F8F6',
  border: '1px solid #BDD0C7',
  borderRadius: 6,
  padding: '16px 18px',
  marginBottom: 16,
};

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: '0.14em',
  color: '#3DB888',
  textTransform: 'uppercase' as const,
  display: 'block',
};

const nameStyle: React.CSSProperties = {
  fontFamily: "'Fraunces', Georgia, serif",
  fontSize: 17,
  fontWeight: 300,
  color: '#0D1F18',
  display: 'block',
};

const descStyle: React.CSSProperties = {
  fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
  fontSize: 13,
  lineHeight: 1.7,
  color: '#5A7A6C',
  display: 'block',
};

// ─── Email template component ────────────────────────────────────────────────
interface EmailTemplateProps {
  subject: string;
  body: React.ReactNode;
  ctaText: string;
}

function EmailTemplate({ subject, body, ctaText }: EmailTemplateProps) {
  return (
    <div
      style={{
        backgroundColor: '#FDFFFE',
        fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
        maxWidth: 540,
        margin: '0 auto',
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid #BDD0C7',
        boxShadow: '0 2px 16px rgba(13,31,24,0.06)',
      }}
    >
      {/* Email client chrome bar */}
      <div
        style={{
          backgroundColor: '#D4E3DC',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          borderBottom: '1px solid #BDD0C7',
        }}
      >
        {['#e05c5c', '#e0a05c', '#7adb7a'].map((c, i) => (
          <div
            key={i}
            style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c }}
          />
        ))}
        <div
          style={{
            marginLeft: 10,
            flex: 1,
            height: 20,
            borderRadius: 3,
            backgroundColor: '#BDD0C7',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 10,
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#5A7A6C' }}>
            mail.clearskin.com
          </span>
        </div>
      </div>

      {/* Email header / meta */}
      <div
        style={{
          backgroundColor: '#D4E3DC',
          padding: '20px 32px 16px',
          borderBottom: '1px solid #BDD0C7',
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 20,
            fontWeight: 200,
            letterSpacing: '0.14em',
            color: '#0D1F18',
            marginBottom: 14,
          }}
        >
          CLEAR<span style={{ color: '#2D7A5E' }}>.</span>SKIN
        </div>

        {/* From line */}
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: '#8AAAA0',
            marginBottom: 4,
          }}
        >
          FROM: &nbsp;<span style={{ color: '#5A7A6C' }}>Clear Skin Clinic &amp; Skincare &lt;hello@clearskin.com&gt;</span>
        </div>
        {/* Subject line */}
        <div
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 14,
            fontWeight: 300,
            color: '#0D1F18',
            lineHeight: 1.35,
          }}
        >
          {subject}
        </div>
      </div>

      {/* Email body */}
      <div style={{ padding: '28px 32px' }}>
        {body}

        {/* CTA button */}
        <div style={{ marginTop: 24 }}>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            style={{
              display: 'inline-block',
              backgroundColor: '#1B4A38',
              color: '#FDFFFE',
              fontFamily: "'Plus Jakarta Sans', Arial, sans-serif",
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.07em',
              padding: '12px 28px',
              borderRadius: 4,
              textDecoration: 'none',
            }}
          >
            {ctaText}
          </a>
        </div>
      </div>

      {/* Email footer */}
      <div
        style={{
          backgroundColor: '#F4F8F6',
          borderTop: '1px solid #BDD0C7',
          padding: '16px 32px',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            color: '#8AAAA0',
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          Clear Skin Clinic &amp; Skincare · London · Dubai · Lagos
          <br />
          You are receiving this because you opted in via the Clear Skin skin assessment.
          <br />
          <a href="#" onClick={(e) => e.preventDefault()} style={{ color: '#3DB888', textDecoration: 'none' }}>
            Unsubscribe
          </a>
          {' · '}
          <a href="#" onClick={(e) => e.preventDefault()} style={{ color: '#3DB888', textDecoration: 'none' }}>
            View in browser
          </a>
        </p>
      </div>
    </div>
  );
}

// ─── Email data ──────────────────────────────────────────────────────────────
interface EmailNode {
  index: number;
  label: string;
  timing: string;
  subject: string;
  preview: React.ReactNode;
}

const EMAIL_NODES: EmailNode[] = [
  {
    index: 0,
    label: 'Welcome Email',
    timing: 'Immediately after sign-up',
    subject: 'Your Clear Skin profile is ready.',
    preview: (
      <EmailTemplate
        subject="Your Clear Skin profile is ready."
        body={
          <>
            <p style={{ ...pStyle, fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 300, color: '#0D1F18', lineHeight: 1.4 }}>
              Welcome to Clear Skin.
            </p>
            <p style={pStyle}>
              Thank you for completing the Clear Skin assessment. Based on your responses, we
              have identified your primary concern and mapped it to the clinical treatments and
              homecare products most appropriate for your skin.
            </p>
            <p style={pStyle}>
              At Clear Skin, every recommendation begins with the same principle: address the
              root concern precisely before broadening the protocol. Your skin profile is not a
              generic result. It is built on what you told us about your skin type, your routine,
              your budget, and the outcome that matters most to you.
            </p>
            <p style={pStyle}>
              Your recommended starting point is the <strong style={{ color: '#2D7A5E' }}>Laser Renewal</strong> treatment, a fractional
              laser procedure that addresses texture, pigmentation and scarring in a single,
              clinician-led session. We have also prepared a homecare pairing to support your
              skin between appointments.
            </p>
            <p style={pStyle}>
              Your profile is ready to view whenever you are. There is no obligation to
              act — this is simply where we would begin, if you choose to.
            </p>
          </>
        }
        ctaText="View your skin profile →"
      />
    ),
  },
  {
    index: 1,
    label: 'Skin Education',
    timing: 'Day 3',
    subject: 'Understanding your skin: what the clinical evidence shows.',
    preview: (
      <EmailTemplate
        subject="Understanding your skin: what the clinical evidence shows."
        body={
          <>
            <p style={{ ...pStyle, fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 300, color: '#0D1F18', lineHeight: 1.4 }}>
              What the clinical evidence shows.
            </p>
            <p style={pStyle}>
              Skin concerns rarely have a single cause. Ageing, for example, is a convergence of
              several biological processes that begin in your mid-twenties: a gradual reduction
              in collagen synthesis, a slowing of cell turnover, and a decrease in the skin&apos;s
              capacity to retain moisture. These processes are influenced by genetics, cumulative
              sun exposure, and the consistency of your homecare routine. The visible result is
              a progressive loss of firmness, the deepening of expression lines, and changes in
              texture that most clients notice first in their mid-thirties.
            </p>
            <p style={pStyle}>
              The clinical response to these changes has advanced considerably. Fractional laser
              technologies, such as those used in our <strong style={{ color: '#2D7A5E' }}>Laser Renewal</strong> treatment, work by
              creating controlled micro-injuries in the dermis — triggering the skin&apos;s natural
              wound-healing response and stimulating collagen remodelling from within. For clients
              where volume loss or skin laxity is the primary concern, our <strong style={{ color: '#2D7A5E' }}>BioRevive</strong> treatment
              delivers hyaluronic acid in a bio-remodelling formulation designed to restructure
              the skin&apos;s hydration architecture rather than simply add volume.
            </p>
          </>
        }
        ctaText="Explore our treatments →"
      />
    ),
  },
  {
    index: 2,
    label: 'Treatment Introduction',
    timing: 'Day 7',
    subject: 'What to expect from your first Clear Skin treatment.',
    preview: (
      <EmailTemplate
        subject="What to expect from your first Clear Skin treatment."
        body={
          <>
            <p style={{ ...pStyle, fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 300, color: '#0D1F18', lineHeight: 1.4 }}>
              Your first appointment.
            </p>
            <p style={pStyle}>
              We wanted to walk you through exactly what a first appointment at Clear Skin
              involves — so that when you are ready to book, you arrive knowing precisely what
              to expect.
            </p>
            <p style={pStyle}>
              Every Clear Skin treatment begins with a brief consultation. Your practitioner
              will review your skin in person, assess the concern you described in your profile,
              and confirm that the recommended protocol is the right starting point. This is
              not a formality — it is a clinical step that ensures the treatment is precisely
              calibrated to your skin on the day, taking into account factors that a digital
              assessment cannot capture.
            </p>
            <p style={pStyle}>
              The treatment itself is performed in a private room by a senior practitioner.
              Duration varies depending on the protocol — typically between 30 and 60 minutes.
              Our team will explain each step as it happens, check comfort throughout, and
              provide clear aftercare instructions before you leave. Any expected recovery
              time — whether that is a few hours or a few days — will be discussed beforehand
              so there are no surprises.
            </p>
            <p style={pStyle}>
              The outcome develops over the following weeks as your skin responds. We schedule
              a follow-up review to assess progress and refine the plan if needed. There is
              no pressure to commit to a course — we start with one session and let the
              results guide the conversation.
            </p>
          </>
        }
        ctaText="Book your consultation →"
      />
    ),
  },
  {
    index: 3,
    label: 'Homecare Pairing',
    timing: 'Day 14',
    subject: 'Between treatments: the Clear Skin home routine.',
    preview: (
      <EmailTemplate
        subject="Between treatments: the Clear Skin home routine."
        body={
          <>
            <p style={{ ...pStyle, fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 300, color: '#0D1F18', lineHeight: 1.4 }}>
              The Clear Skin home routine.
            </p>
            <p style={pStyle}>
              Clinical treatments deliver results at the cellular level. What happens between
              appointments determines how well those results hold. For ageing and fine lines,
              the Clear Skin home routine centres on two products that work in sequence — one to
              drive renewal overnight, one to support the eye area where ageing is first apparent.
            </p>

            <div style={productBlockStyle}>
              <p style={{ ...labelStyle, marginBottom: 4 }}>PRIMARY</p>
              <p style={{ ...nameStyle, marginBottom: 4 }}>
                Renewal Night Cream — <span style={{ color: '#2D7A5E' }}>£110</span>
              </p>
              <p style={descStyle}>
                Encapsulated retinol is the most clinically validated ingredient for cell
                turnover and collagen support. Our formulation uses time-release encapsulation
                to avoid the irritation associated with traditional retinol — releasing the
                active gradually through the night when skin renewal is naturally at its peak.
                Begin two to three nights per week; build to nightly use over three to four
                weeks as your skin acclimatises.
              </p>
            </div>

            <div style={productBlockStyle}>
              <p style={{ ...labelStyle, marginBottom: 4 }}>SUPPORTING</p>
              <p style={{ ...nameStyle, marginBottom: 4 }}>
                Eye Revival — <span style={{ color: '#2D7A5E' }}>£75</span>
              </p>
              <p style={descStyle}>
                The eye area has the thinnest skin on the face and is the first site where
                fine lines, dark circles and textural changes become visible. The Eye Revival
                delivers a multi-peptide formula clinically shown to reduce the appearance
                of peri-orbital lines and improve microcirculation — addressing both the
                structural and circulatory causes of under-eye concerns. Apply morning and
                evening, before moisturiser.
              </p>
            </div>

            <p style={pStyle}>
              Used together, these two products support your skin between Laser Renewal
              sessions and help maintain results long-term.
            </p>
          </>
        }
        ctaText="Shop the routine →"
      />
    ),
  },
  {
    index: 4,
    label: 'Booking Nudge',
    timing: 'Day 21 (if no booking made)',
    subject: "Your consultation — whenever you're ready.",
    preview: (
      <EmailTemplate
        subject="Your consultation — whenever you're ready."
        body={
          <>
            <p style={{ ...pStyle, fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 300, color: '#0D1F18', lineHeight: 1.4 }}>
              Whenever you are ready.
            </p>
            <p style={pStyle}>
              We wanted to let you know that the Clear Skin team is available whenever you
              are ready to take the next step. There is no pressure and no deadline — we
              simply want to make sure that when you do choose to book, everything is in
              place for a considered, unhurried experience.
            </p>
            <p style={pStyle}>
              Based on your skin profile, your recommended starting point remains a{' '}
              <strong style={{ color: '#2D7A5E' }}>Skin Analysis</strong> — a full facial mapping session
              with one of our senior practitioners who will assess your skin in person, review
              your home routine, and structure a precise treatment plan tailored to your
              specific concern. It is the most useful first step for any client who wants to
              understand their skin before committing to a treatment protocol.
            </p>
            <p style={pStyle}>
              Our consultations are available Monday to Saturday across our London, Dubai, and
              Lagos clinics. We keep our schedules intentionally uncrowded so that every client
              has adequate time with their practitioner.
            </p>
            <p style={pStyle}>
              If you have questions before booking — about the treatment, the consultation
              process, or anything else — please feel free to reply to this email directly.
              The team reads and responds to every message.
            </p>
          </>
        }
        ctaText="Request a consultation →"
      />
    ),
  },
  {
    index: 5,
    label: 'Re-engagement',
    timing: 'Day 60 (if no purchase/booking)',
    subject: "We've been thinking about your skin.",
    preview: (
      <EmailTemplate
        subject="We've been thinking about your skin."
        body={
          <>
            <p style={{ ...pStyle, fontFamily: "'Fraunces', Georgia, serif", fontSize: 22, fontWeight: 300, color: '#0D1F18', lineHeight: 1.4 }}>
              Your skin is still here. So are we.
            </p>
            <p style={pStyle}>
              It has been a little while since you completed your Clear Skin assessment, and
              we have been thinking about what you shared with us. We are not writing to push
              anything — only to say that your concern is still here, your profile is still
              saved, and the team is still available whenever you are ready.
            </p>
            <p style={pStyle}>
              In the past two months, we have been working with several clients on a refined
              approach to combining <strong style={{ color: '#2D7A5E' }}>BioRevive</strong> with our{' '}
              <strong style={{ color: '#2D7A5E' }}>Renewal Night Cream</strong> home protocol
              — starting with the bio-remodelling treatment to restore the skin&apos;s hydration
              architecture, then supporting the results with encapsulated retinol over the
              following twelve weeks. The outcomes have been notably consistent, particularly
              for clients whose primary concern is early-stage laxity and fine lines.
            </p>
            <p style={pStyle}>
              We thought of you because it aligns closely with what you described. If it seems
              relevant, we are happy to walk you through what this approach would look like for
              your skin specifically — with no obligation to proceed.
            </p>
          </>
        }
        ctaText="Return to Clear Skin →"
      />
    ),
  },
];

// ─── Main component ──────────────────────────────────────────────────────────
let _setOpen: ((v: boolean) => void) | null = null;

export function openEmailFlowDemoOverlay() {
  if (_setOpen) _setOpen(true);
}

export default function EmailFlowDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(0);

  // Register global open trigger
  useEffect(() => {
    _setOpen = setIsOpen;
    registerEmailFlowDemoTrigger(() => setIsOpen(true));
    return () => {
      _setOpen = null;
    };
  }, []);

  const handleNodeClick = (idx: number) => {
    setPrevIndex(activeIndex);
    setActiveIndex(idx);
  };

  const activeNode = EMAIL_NODES[activeIndex];
  const direction = activeIndex >= prevIndex ? 1 : -1;

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        /* ── EFD overlay ─────────────────────────────────────────────────── */
        .efd-overlay {
          position: fixed;
          inset: 0;
          z-index: 9997;
          background-color: rgba(244,248,246,0.97);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        /* ── Header bar ──────────────────────────────────────────────────── */
        .efd-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 32px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        @media (max-width: 767px) {
          .efd-header { padding: 14px 16px; }
        }

        /* ── Body: two-panel ─────────────────────────────────────────────── */
        .efd-body {
          display: flex;
          flex-direction: row;
          flex: 1;
          min-height: 0;
        }
        @media (max-width: 767px) {
          .efd-body { flex-direction: column; }
        }

        /* ── Left: desktop timeline ──────────────────────────────────────── */
        .efd-timeline {
          width: 40%;
          border-right: 1px solid var(--border);
          padding: 28px 32px;
          display: flex;
          flex-direction: column;
          gap: 0;
          flex-shrink: 0;
        }
        @media (max-width: 767px) {
          .efd-timeline { display: none; }
        }

        /* ── Mobile: pill tabs ───────────────────────────────────────────── */
        .efd-pills-bar {
          display: none;
          overflow-x: auto;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding: 12px 16px;
          gap: 8px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .efd-pills-bar::-webkit-scrollbar { display: none; }
        @media (max-width: 767px) {
          .efd-pills-bar { display: flex; }
        }
        .efd-pill-tab {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 20px;
          border: 1px solid var(--border);
          background: transparent;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.18s ease, border-color 0.18s ease;
          flex-shrink: 0;
        }
        .efd-pill-tab--active {
          background-color: var(--forest);
          border-color: var(--forest);
        }
        .efd-pill-label {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12px;
          color: var(--muted-mid);
          transition: color 0.18s ease;
        }
        .efd-pill-tab--active .efd-pill-label { color: var(--white); }
        .efd-pill-badge {
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 600;
          color: var(--muted);
          background-color: var(--sage-light);
          border-radius: 10px;
          padding: 1px 5px;
          transition: background 0.18s ease, color 0.18s ease;
        }
        .efd-pill-tab--active .efd-pill-badge {
          background-color: rgba(255,255,255,0.2);
          color: rgba(253,255,254,0.9);
        }

        /* ── Right: preview panel ────────────────────────────────────────── */
        .efd-preview {
          flex: 1;
          overflow-y: auto;
          padding: 24px 32px;
          background-color: var(--frost);
        }
        @media (max-width: 767px) {
          .efd-preview { padding: 16px 0; background-color: var(--frost); }
        }

        /* Email frame mobile: top+bottom border only */
        @media (max-width: 767px) {
          .efd-preview > div > div { border-left: none !important; border-right: none !important; border-radius: 0 !important; }
        }

        /* ── Stat bar ────────────────────────────────────────────────────── */
        .efd-stats {
          display: flex;
          gap: 20px;
          padding: 14px 32px;
          border-top: 1px solid var(--border);
          flex-shrink: 0;
          flex-wrap: wrap;
          justify-content: center;
        }
        @media (max-width: 767px) {
          .efd-stats {
            flex-direction: column;
            gap: 8px;
            align-items: center;
            text-align: center;
            padding: 14px 16px;
          }
        }

        /* ── Timeline node ───────────────────────────────────────────────── */
        .efd-node {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 0;
          cursor: pointer;
          position: relative;
        }
        .efd-node-dot-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
          width: 14px;
        }
        .efd-node-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid var(--border);
          background-color: var(--frost);
          transition: border-color 0.2s ease, background-color 0.2s ease;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .efd-node--active .efd-node-dot {
          border-color: var(--mint);
          background-color: var(--mint);
        }
        .efd-node-line {
          width: 1px;
          flex: 1;
          background-color: var(--border);
          min-height: 28px;
        }
        .efd-node-text {
          flex: 1;
          padding-bottom: 24px;
          border-left: 2px solid transparent;
          padding-left: 0;
          transition: border-color 0.2s ease;
        }
        .efd-node--active .efd-node-text {
          border-left-color: var(--mint);
          padding-left: 10px;
        }
        .efd-node-label {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13px;
          color: var(--muted-mid);
          line-height: 1.35;
          transition: color 0.2s ease;
          display: block;
        }
        .efd-node--active .efd-node-label { color: var(--espresso); font-weight: 500; }
        .efd-node:hover .efd-node-label { color: var(--text); }
        .efd-node-timing {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--muted);
          display: block;
          margin-top: 3px;
          letter-spacing: 0.04em;
        }
        .efd-node--active .efd-node-timing { color: var(--mint); }

        /* ── Close button ────────────────────────────────────────────────── */
        .efd-close {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 22px;
          color: var(--muted);
          line-height: 1;
          padding: 4px;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s ease;
        }
        .efd-close:hover { color: var(--espresso); }
      `}</style>

      <motion.div
        className="efd-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="efd-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fontWeight: 600,
                color: 'var(--mint)',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                background: 'rgba(61,184,136,0.12)',
                border: '1px solid rgba(61,184,136,0.3)',
                borderRadius: 3,
                padding: '2px 8px',
              }}
            >
              MODULE 03
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 18,
                fontWeight: 300,
                color: 'var(--espresso)',
                letterSpacing: '0.02em',
              }}
            >
              Email Nurture System
            </span>
          </div>
          <button className="efd-close" onClick={() => setIsOpen(false)} aria-label="Close email flow demo">
            ×
          </button>
        </div>

        {/* ── Mobile pill tabs ────────────────────────────────────────────── */}
        <div className="efd-pills-bar">
          {EMAIL_NODES.map((node) => (
            <button
              key={node.index}
              className={`efd-pill-tab${activeIndex === node.index ? ' efd-pill-tab--active' : ''}`}
              onClick={() => handleNodeClick(node.index)}
            >
              <span className="efd-pill-badge">{node.index + 1}</span>
              <span className="efd-pill-label">{node.label}</span>
            </button>
          ))}
        </div>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <div className="efd-body">

          {/* Left: vertical timeline (desktop) */}
          <div className="efd-timeline">
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                fontWeight: 600,
                color: 'var(--muted)',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                marginBottom: 24,
              }}
            >
              Email Sequence
            </div>

            {EMAIL_NODES.map((node, i) => (
              <div
                key={node.index}
                className={`efd-node${activeIndex === node.index ? ' efd-node--active' : ''}`}
                onClick={() => handleNodeClick(node.index)}
              >
                <div className="efd-node-dot-col">
                  <div className="efd-node-dot" />
                  {i < EMAIL_NODES.length - 1 && <div className="efd-node-line" />}
                </div>
                <div className="efd-node-text">
                  <span className="efd-node-label">{node.label}</span>
                  <span className="efd-node-timing">{node.timing}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right: email preview */}
          <div className="efd-preview">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={activeIndex}
                custom={direction}
                variants={{
                  enter: () => ({ opacity: 0 }),
                  center: { opacity: 1 },
                  exit: () => ({ opacity: 0 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              >
                {/* Subject header above the email card */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 16,
                    flexWrap: 'wrap',
                    padding: '0 16px',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 9,
                      fontWeight: 600,
                      color: 'var(--mint)',
                      letterSpacing: '0.14em',
                      textTransform: 'uppercase',
                      background: 'rgba(61,184,136,0.1)',
                      border: '1px solid rgba(61,184,136,0.25)',
                      borderRadius: 3,
                      padding: '2px 7px',
                    }}
                  >
                    {activeNode.label}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      color: 'var(--muted)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {activeNode.timing}
                  </span>
                </div>

                {/* Rendered email */}
                {activeNode.preview}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Stat bar ────────────────────────────────────────────────────── */}
        <div className="efd-stats">
          {[
            { label: 'Average open rate', value: '41%' },
            { label: 'Average click rate', value: '8.3%' },
            { label: 'Re-engagement recovery', value: '22% of lapsed clients' },
          ].map((stat) => (
            <div key={stat.label} style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--espresso)',
                }}
              >
                {stat.value}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--muted)',
                  letterSpacing: '0.02em',
                }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
}
