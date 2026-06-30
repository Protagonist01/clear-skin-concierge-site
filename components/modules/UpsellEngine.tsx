'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { PRODUCTS, Product } from '@/data/products'
import { addProductsToBag } from '@/lib/bag'

// ─── CSS Keyframes & Custom Styles ──────────────────────────────────────────
const UPSELL_STYLES = `
@keyframes upsell-pulse {
  0%, 100% { opacity: 0.25; transform: scale(0.85); }
  50% { opacity: 1; transform: scale(1); }
}
@keyframes upsell-fade-in {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes upsell-glow-pulse {
  0%, 100% { box-shadow: 0 0 24px color-mix(in srgb, var(--forest) 15%, transparent); }
  50%      { box-shadow: 0 0 32px color-mix(in srgb, var(--forest) 25%, transparent); }
}

/* ── Custom range slider ── */
.upsell-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  background: var(--mist);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}
.upsell-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--forest);
  border: 2px solid var(--white);
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  cursor: pointer;
  transition: transform 0.15s ease;
}
.upsell-slider::-webkit-slider-thumb:hover {
  transform: scale(1.12);
}
.upsell-slider::-moz-range-thumb {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--forest);
  border: 2px solid var(--white);
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
  cursor: pointer;
}
.upsell-slider::-moz-range-track {
  height: 6px;
  background: var(--mist);
  border-radius: 3px;
}

/* ── Explanation panel animation ── */
.upsell-explain-panel {
  animation: upsell-fade-in 0.35s ease both;
}
`

// ─── Props ──────────────────────────────────────────────────────────────────

interface UpsellEngineProps {
  mode: 'homecare' | 'routine' | 'replenishment' | 'calculator'
  treatmentName?: string
  concern?: string
  productName?: string
}

// ─── Product Pairing Logic (CLEAR_SKIN_BRAND.md Section 05) ─────────────────

const CONCERN_PAIRS: Record<string, { primary: string; supporting: string }> = {
  'Ageing & Fine Lines':      { primary: 'Renewal Night Cream',   supporting: 'Eye Revival' },
  'Pigmentation':             { primary: 'Brightening Complex',   supporting: 'Daily Shield SPF50' },
  'Acne & Breakouts':         { primary: 'Purifying Cleanse Balm', supporting: 'Restore Serum' },
  'Sensitivity & Redness':    { primary: 'Restore Serum',          supporting: 'Daily Shield SPF50' },
  'Dullness & Uneven Tone':   { primary: 'Brightening Complex',   supporting: 'Purifying Cleanse Balm' },
  'Loss of Volume':           { primary: 'Renewal Night Cream',   supporting: 'Eye Revival' },
}

// Map treatments → primary concern for homecare pairing
const TREATMENT_CONCERN_MAP: Record<string, string> = {
  'Skin Analysis':      'Ageing & Fine Lines',
  'Clinical Facial':    'Acne & Breakouts',
  'Volume Treatment':   'Loss of Volume',
  'Expression Reset':   'Ageing & Fine Lines',
  'Laser Renewal':      'Pigmentation',
  'HydraRevive':        'Dullness & Uneven Tone',
  'BioRevive':          'Loss of Volume',
  'Light Therapy':      'Sensitivity & Redness',
}

function getProductByName(name: string): Product | undefined {
  return PRODUCTS.find(p => p.name === name)
}

function getProductsForConcern(concern: string): Product[] {
  const pair = CONCERN_PAIRS[concern]
  if (!pair) return []
  return [getProductByName(pair.primary), getProductByName(pair.supporting)].filter(Boolean) as Product[]
}

function getConcernFromTreatment(treatmentName: string): string | null {
  return TREATMENT_CONCERN_MAP[treatmentName] || null
}

// Map product concern labels (from products.ts) to recommendation keys
function mapProductConcernToRecommendation(concern: string): string {
  const map: Record<string, string> = {
    'Anti-Ageing':  'Ageing & Fine Lines',
    'Hydration':    'Sensitivity & Redness',
    'Brightening':  'Pigmentation',
    'Eye Area':     'Ageing & Fine Lines',
    'Protection':   'Sensitivity & Redness',
    'Cleansing':    'Dullness & Uneven Tone',
  }
  return map[concern] || concern
}

// ─── Internal ProductCard (renders within UpsellEngine) ─────────────────────

function InlineProductCard({ product }: { product: Product }) {
  return (
    <div
      style={{
        backgroundColor: 'var(--white)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'border-color 0.2s ease, transform 0.2s ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'color-mix(in srgb, var(--mint) 40%, transparent)'
        el.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.borderColor = 'var(--border)'
        el.style.transform = 'translateY(0)'
      }}
    >
      {product.image && (
        <div
          style={{
            width: '100%',
            aspectRatio: '1',
            marginBottom: '16px',
            position: 'relative',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: 'var(--mist)',
          }}
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      )}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '3px 9px',
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '10px',
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--mint)',
            backgroundColor: 'color-mix(in srgb, var(--mint) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--mint) 30%, transparent)',
            borderRadius: '3px',
            marginBottom: '12px',
          }}
        >
          {product.concern}
        </span>
        <h4
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: '18px',
            fontWeight: 300,
            color: 'var(--espresso)',
            margin: '0 0 4px',
          }}
        >
          {product.name}
        </h4>
        <p
          style={{
            fontFamily: "'Fraunces', serif",
            fontSize: '16px',
            fontWeight: 300,
            color: 'var(--fern)',
            margin: '0 0 8px',
          }}
        >
          {product.price}
        </p>
        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '12px',
            color: 'var(--muted-mid)',
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {product.description}
        </p>
      </div>
    </div>
  )
}

// ─── Typing Indicator ───────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--mint)' }}>
      <span style={{ display: 'flex', gap: '4px' }}>
        {[0, 0.2, 0.4].map((delay) => (
          <span
            key={delay}
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--mint)',
              animation: `upsell-pulse 1.4s ease-in-out infinite ${delay}s`,
            }}
          />
        ))}
      </span>
      <span
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '13px',
          color: 'var(--muted-mid)',
        }}
      >
        Generating rationale…
      </span>
    </div>
  )
}

// ─── "Why these products?" trigger + expansion panel ────────────────────────

function WhyTheseProducts({
  product1,
  product2,
  treatmentName,
  mode,
}: {
  product1: string
  product2: string
  treatmentName: string
  mode: 'homecare' | 'routine'
}) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [explanation, setExplanation] = useState('')

  const handleExpand = useCallback(async () => {
    if (expanded || loading) return
    setExpanded(true)
    setLoading(true)

    try {
      const res = await fetch('/api/upsell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product1, product2, treatmentName, mode }),
      })
      const data = await res.json()
      setExplanation(data.explanation || 'Unable to generate an explanation at this time.')
    } catch {
      setExplanation('Unable to generate an explanation at this time.')
    } finally {
      setLoading(false)
    }
  }, [expanded, loading, product1, product2, treatmentName, mode])

  return (
    <div>
      <button
        onClick={handleExpand}
        disabled={loading}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          cursor: loading ? 'wait' : 'pointer',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '13px',
          color: 'var(--fern)',
          padding: '10px 0',
          minHeight: '44px',
          transition: 'opacity 0.15s ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.7' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1' }}
      >
        <span>Why these products?</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transition: 'transform 0.2s ease',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div
          className="upsell-explain-panel"
          style={{
            backgroundColor: 'var(--mist)',
            borderLeft: '2px solid var(--mint)',
            padding: '16px',
            marginTop: '8px',
            borderRadius: '0 6px 6px 0',
          }}
        >
          {loading ? (
            <TypingDots />
          ) : (
            <p
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '13px',
                fontStyle: 'italic',
                color: 'var(--text)',
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {explanation}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Ghost Button ───────────────────────────────────────────────────────────

function GhostButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: '1px solid var(--border)',
        borderRadius: '4px',
        padding: '12px 28px',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: '13px',
        fontWeight: 600,
        letterSpacing: '0.07em',
        color: 'var(--muted-mid)',
        cursor: 'pointer',
        transition: 'border-color 0.2s ease, color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.borderColor = 'var(--forest)'
        el.style.color = 'var(--forest)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.borderColor = 'var(--border)'
        el.style.color = 'var(--muted-mid)'
      }}
    >
      {children}
    </button>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODE: HOMECARE (treatment pages — 03D)
// ═══════════════════════════════════════════════════════════════════════════════

function HomecareMode({ treatmentName, concern }: { treatmentName: string; concern?: string }) {
  const derivedConcern = concern || getConcernFromTreatment(treatmentName)
  const products = derivedConcern ? getProductsForConcern(derivedConcern) : []

  if (products.length === 0) return null

  return (
    <section>
      <h3
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: '28px',
          fontWeight: 300,
          color: 'var(--espresso)',
          margin: '0 0 4px',
        }}
      >
        Complete your treatment at home
      </h3>
      <p
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '13px',
          color: 'var(--muted-mid)',
          margin: '0 0 24px',
        }}
      >
        Recommended by our clinical team for {treatmentName} clients.
      </p>

      {/* Product cards: 2-col desktop, 1-col mobile */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
          marginBottom: '20px',
        }}
        className="upsell-card-grid"
      >
        {products.map((product) => (
          <InlineProductCard key={product.slug} product={product} />
        ))}
      </div>

      <div style={{ marginBottom: '8px' }}>
        <GhostButton onClick={() => void addProductsToBag(products.map((product) => product.name))}>
          Add homecare routine to bag
        </GhostButton>
      </div>

      <WhyTheseProducts
        product1={products[0]?.name || ''}
        product2={products[1]?.name || ''}
        treatmentName={treatmentName}
        mode="homecare"
      />

      {/* Mobile responsive grid override */}
      <style>{`
        @media (max-width: 767px) {
          .upsell-card-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODE: ROUTINE (product pages — 05C)
// ═══════════════════════════════════════════════════════════════════════════════

function RoutineMode({ productName, concern }: { productName: string; concern?: string }) {
  const recommendedConcern = concern
    ? mapProductConcernToRecommendation(concern)
    : 'Ageing & Fine Lines'

  const allPaired = getProductsForConcern(recommendedConcern)
  // Filter out the current product so we only show others
  const products = allPaired.filter(p => p.name !== productName).slice(0, 2)

  // If we filtered everything, try to backfill
  if (products.length === 0) {
    const fallback = allPaired.slice(0, 2)
    if (fallback.length === 0) return null
    products.push(...fallback)
  }

  return (
    <section>
      <h3
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: '24px',
          fontWeight: 300,
          color: 'var(--espresso)',
          margin: '0 0 20px',
        }}
      >
        Clients with this concern also use
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '16px',
          marginBottom: '20px',
        }}
        className="upsell-card-grid"
      >
        {products.map((product) => (
          <InlineProductCard key={product.slug} product={product} />
        ))}
      </div>

      <div style={{ marginBottom: '8px' }}>
        <GhostButton onClick={() => void addProductsToBag([productName, ...products.map((product) => product.name)])}>
          Add routine to bag
        </GhostButton>
      </div>

      <WhyTheseProducts
        product1={productName}
        product2={products[0]?.name || ''}
        treatmentName={recommendedConcern}
        mode="routine"
      />

      <style>{`
        @media (max-width: 767px) {
          .upsell-card-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODE: REPLENISHMENT (product pages — 05D)
// ═══════════════════════════════════════════════════════════════════════════════

function ReplenishmentMode({ productName }: { productName?: string }) {
  const [showCapture, setShowCapture] = useState(false)
  const [success, setSuccess] = useState(false)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/email-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: 'upsell-replenishment',
          productName,
          reminderDays: 45,
        }),
      })

      if (!response.ok) {
        throw new Error('Reminder request failed')
      }

      setSuccess(true)
      setShowCapture(false)
      setEmail('')
    } catch {
      setError('We could not set your reminder just now. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section
      style={{
        backgroundColor: 'var(--mist)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '16px',
        marginTop: '24px',
      }}
    >
      <p
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: '14px',
          fontStyle: 'italic',
          fontWeight: 300,
          color: 'var(--fern)',
          margin: '0 0 8px',
        }}
      >
        This product lasts approximately 45 days.
      </p>
      <p
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '13px',
          color: 'var(--muted-mid)',
          margin: '0 0 16px',
        }}
      >
        Set a reminder and we&apos;ll let you know when it&apos;s time to replenish.
      </p>

      {success ? (
        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '13px',
            color: 'var(--mint)',
            margin: 0,
          }}
        >
          Reminder set. We&apos;ll be in touch in 45 days.
        </p>
      ) : showCapture ? (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '16px',
              backgroundColor: 'var(--sage-light)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              color: 'var(--text)',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={submitting}
            style={{
              background: 'none',
              border: '1px solid var(--forest)',
              borderRadius: '4px',
              padding: '10px 20px',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--forest)',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease, color 0.15s ease',
              width: '100%',
              opacity: submitting ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.backgroundColor = 'var(--forest)'
              el.style.color = 'var(--white)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.backgroundColor = 'transparent'
              el.style.color = 'var(--forest)'
            }}
          >
            {submitting ? 'Setting Reminder...' : 'Set Reminder'}
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowCapture(true)}
          style={{
            background: 'none',
            border: '1px solid var(--forest)',
            borderRadius: '4px',
            padding: '12px 28px',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.07em',
            color: 'var(--forest)',
            cursor: 'pointer',
            transition: 'background-color 0.15s ease, color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget
            el.style.backgroundColor = 'var(--forest)'
            el.style.color = 'var(--white)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget
            el.style.backgroundColor = 'transparent'
            el.style.color = 'var(--forest)'
          }}
        >
          Set Reminder
        </button>
      )}
      {error && (
        <p
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: '13px',
            color: '#9f3d32',
            margin: '12px 0 0',
          }}
        >
          {error}
        </p>
      )}
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODE: CALCULATOR (AOV revenue calculator — key demo moment)
// ═══════════════════════════════════════════════════════════════════════════════

function CalculatorMode() {
  const [treatments, setTreatments] = useState(120)
  const [avgValue, setAvgValue] = useState(280)
  const [productSales, setProductSales] = useState(3500)

  // Live calculations — no debounce
  const currentRevenue = (treatments * avgValue) + productSales
  const upsellGain = productSales * 0.15
  const noshowRecovery = treatments * 0.20 * avgValue
  const replenishmentRecovery = productSales * 0.12
  const totalProjected = currentRevenue + upsellGain + noshowRecovery + replenishmentRecovery
  const totalUplift = upsellGain + noshowRecovery + replenishmentRecovery

  const fmt = (n: number) => '£' + Math.round(n).toLocaleString()

  return (
    <section style={{ padding: '40px 0' }}>
      {/* Heading */}
      <h3
        style={{
          fontFamily: "'Fraunces', serif",
          fontSize: '32px',
          fontWeight: 300,
          color: 'var(--espresso)',
          textAlign: 'center',
          margin: '0 0 4px',
        }}
        className="upsell-calc-heading"
      >
        The Clear Skin Revenue Model
      </h3>
      <p
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontSize: '14px',
          color: 'var(--muted-mid)',
          textAlign: 'center',
          margin: '0 0 40px',
        }}
      >
        Enter your numbers. See what a 15% upsell rate recovers.
      </p>

      {/* Calculator grid: sliders left, results right */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px',
        }}
        className="upsell-calc-grid"
      >
        {/* Sliders panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Slider 1: Monthly treatments */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '13px',
                  color: 'var(--muted-mid)',
                }}
              >
                Monthly treatments
              </span>
              <span
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: '16px',
                  fontWeight: 300,
                  color: 'var(--forest)',
                }}
              >
                {treatments}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="500"
              value={treatments}
              onChange={(e) => setTreatments(Number(e.target.value))}
              className="upsell-slider"
            />
          </div>

          {/* Slider 2: Avg treatment value */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '13px',
                  color: 'var(--muted-mid)',
                }}
              >
                Average treatment value £
              </span>
              <span
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: '16px',
                  fontWeight: 300,
                  color: 'var(--forest)',
                }}
              >
                £{avgValue}
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="550"
              value={avgValue}
              onChange={(e) => setAvgValue(Number(e.target.value))}
              className="upsell-slider"
            />
          </div>

          {/* Slider 3: Monthly online product sales */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: '13px',
                  color: 'var(--muted-mid)',
                }}
              >
                Monthly online product sales £
              </span>
              <span
                style={{
                  fontFamily: "'Fraunces', serif",
                  fontSize: '16px',
                  fontWeight: 300,
                  color: 'var(--forest)',
                }}
              >
                £{productSales.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20000"
              value={productSales}
              onChange={(e) => setProductSales(Number(e.target.value))}
              className="upsell-slider"
            />
          </div>
        </div>

        {/* Results panel */}
        <div
          style={{
            backgroundColor: 'var(--white)',
            borderRadius: '12px',
            padding: '28px',
            border: '1px solid var(--border)',
          }}
        >
          {/* Current baseline */}
          <div style={{ marginBottom: '20px' }}>
            <p
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '11px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--muted)',
                margin: '0 0 4px',
              }}
            >
              Current Revenue
            </p>
            <p
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: '24px',
                fontWeight: 300,
                color: 'var(--muted)',
                opacity: 0.7,
                margin: 0,
              }}
            >
              {fmt(currentRevenue)}/mo
            </p>
          </div>

          {/* Projected with ARIA */}
          <div
            style={{
              marginBottom: '20px',
              paddingBottom: '20px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <p
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: '11px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--muted)',
                margin: '0 0 4px',
              }}
            >
              Projected with ARIA
            </p>
            <p
              className="upsell-projected-value"
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: '32px',
                fontWeight: 300,
                color: 'var(--forest)',
                margin: '0 0 4px',
                boxShadow: '0 0 24px color-mix(in srgb, var(--forest) 15%, transparent)',
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '6px',
                backgroundColor: 'color-mix(in srgb, var(--forest) 5%, transparent)',
                animation: 'upsell-glow-pulse 3s ease-in-out infinite',
              }}
            >
              {fmt(totalProjected)}/mo
            </p>
            <p
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: '20px',
                fontStyle: 'italic',
                fontWeight: 300,
                color: 'var(--fern)',
                margin: '8px 0 0',
              }}
            >
              +{fmt(totalUplift)}/mo
            </p>
          </div>

          {/* Breakdown lines */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <p
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '10px',
                color: 'var(--muted)',
                margin: 0,
              }}
            >
              + Upsell gain (15%): {fmt(upsellGain)}
            </p>
            <p
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '10px',
                color: 'var(--muted)',
                margin: 0,
              }}
            >
              + No-show recovery (20%): {fmt(noshowRecovery)}
            </p>
            <p
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '10px',
                color: 'var(--muted)',
                margin: 0,
              }}
            >
              + Replenishment recovery (12%): {fmt(replenishmentRecovery)}
            </p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '10px',
          color: 'var(--muted)',
          textAlign: 'center',
          marginTop: '28px',
        }}
      >
        Based on industry benchmarks. Actual results vary by brand.
      </p>

      {/* Mobile responsive overrides */}
      <style>{`
        @media (max-width: 767px) {
          .upsell-calc-grid {
            grid-template-columns: 1fr !important;
          }
          .upsell-calc-heading {
            font-size: 26px !important;
          }
          .upsell-projected-value {
            font-size: 28px !important;
          }
        }
      `}</style>
    </section>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════════════════════

export default function UpsellEngine({ mode, treatmentName, concern, productName }: UpsellEngineProps) {
  return (
    <>
      <style>{UPSELL_STYLES}</style>
      {mode === 'calculator' && <CalculatorMode />}
      {mode === 'homecare' && treatmentName && (
        <HomecareMode treatmentName={treatmentName} concern={concern} />
      )}
      {mode === 'routine' && productName && (
        <RoutineMode productName={productName} concern={concern} />
      )}
      {mode === 'replenishment' && <ReplenishmentMode productName={productName} />}
    </>
  )
}
