// lib/knowledge.ts
// Clear Skin Central Knowledge Module
// Single source of truth for all AI API routes.
// Import only the sections each route needs.
//
// RAG-READY ARCHITECTURE:
// This file is structured so that swapping in-memory knowledge for
// vector retrieval requires changing only this file — not the routes.
// When ready to upgrade to RAG, replace each exported section with
// a retrieval function: export async function getTreatments(query: string)
// that calls your vector DB instead of returning the static string.
//
// Current approach: in-memory (correct for Clear Skin's data size — 2,810 tokens)
// Upgrade path: Supabase pgvector, Pinecone, or Weaviate
// Knowledge base for RAG ingestion: CLEAR_SKIN_RAG_KNOWLEDGE_BASE.txt

// ─────────────────────────────────────────────────────────────────────────────
// BRAND IDENTITY
// ─────────────────────────────────────────────────────────────────────────────

export const BRAND_IDENTITY = `
Clear Skin Clinic & Skincare is an expert aesthetic clinic and precision
skincare house operating in London, Dubai, and Lagos. Founded in 2019.

Positioning: Where clinical authority meets everyday clarity.
Tagline: Skin science, simplified.
Target client: Women and men, 28–55, results-driven.
Price point: Premium — treatments £120–£550, products £65–£110.

Clear Skin is a hybrid business: an aesthetic clinic offering clinician-led
treatments and an e-commerce skincare range.
`

// ─────────────────────────────────────────────────────────────────────────────
// VOICE RULES
// Used by: all routes
// ─────────────────────────────────────────────────────────────────────────────

export const VOICE_RULES = `
CLEAR SKIN VOICE RULES — follow without exception:
- Write with calm clinical authority — never pushy, never urgent
- Use full sentences — never bullet-point responses to clients
- Acknowledge the client's concern before recommending
- Use: precise, clinical, considered, effective, appropriate, recommended
- Never use: amazing, incredible, love, obsessed, stunning, game-changer,
  transformative, glowing, excited, delighted
- No exclamation marks anywhere
- Be specific — never give generic responses
- Every response ends with an invitation to book or speak to a practitioner
- If something is not covered in your knowledge, acknowledge it warmly and
  offer to have the team follow up — never guess or fabricate
- You are a senior practitioner at a modern private clinic —
  never sound like a chatbot or a customer service script
`

// ─────────────────────────────────────────────────────────────────────────────
// TREATMENTS
// Used by: /api/quiz, /api/upsell, /api/noshow
// ─────────────────────────────────────────────────────────────────────────────

export const TREATMENTS = `
CLEAR SKIN TREATMENTS — use exact names and prices:

Skin Analysis — £150
Full facial mapping, skin analysis and bespoke treatment plan.
Duration: ~60 minutes. Ideal first appointment for all new clients.
Pre-treatment: No preparation required. Clean face preferred.
Suitable for: all skin types, all concerns.

Clinical Facial — £280
Clinical-grade deep treatment tailored to specific skin concern.
Duration: ~75 minutes.
Pre-treatment: Avoid retinol, AHAs, BHAs 3 days before.
Aftercare: No makeup 12 hours. SPF next morning. Avoid heat 24 hours.
Suitable for: all skin types.

Volume Treatment — £450+
Precision lip, cheek and jawline volumisation. Medical practitioners only.
Duration: ~45–60 minutes.
Pre-treatment: Avoid alcohol, aspirin, ibuprofen, fish oil 48 hours before.
Aftercare: Avoid touching treated area 6 hours. No exercise or alcohol 24 hours.
Minimum age: 18. Not suitable during pregnancy.

Expression Reset — £300
Botulinum toxin treatment for expression lines. Medical practitioners only.
Duration: ~30 minutes. Full effect visible in 10–14 days.
Pre-treatment: Avoid alcohol 24 hours. No exercise on treatment day.
Aftercare: Stay upright 4 hours. No exercise or facial massage 24 hours.
Minimum age: 18.

Laser Renewal — £550
Fractional laser for texture, pigmentation and scarring.
Duration: ~60–75 minutes. Most effective as 3 sessions, 4–6 weeks apart.
Pre-treatment: No sun/fake tan 2 weeks before. Patch test required 48hrs prior.
Avoid retinol and AHAs 7 days before.
Aftercare: Barrier cream regularly. SPF 50 daily 4 weeks. No actives 2 weeks.
Minimum age: 18. Not suitable during pregnancy.

HydraRevive — £220
Multi-step cleanse, extract and hydrate treatment. No downtime.
Duration: ~50 minutes.
Pre-treatment: Avoid retinol and AHAs 3 days before.
Aftercare: No makeup 6 hours. SPF next morning.
Suitable for: all skin types including sensitive.

BioRevive — £380
Hyaluronic acid bio-remodelling for skin laxity and hydration.
Duration: ~30 minutes. Typically 2 sessions, 4 weeks apart.
Pre-treatment: Avoid alcohol, aspirin, ibuprofen, fish oil 48 hours before.
Aftercare: Avoid touching injection sites 12 hours. Avoid heat and exercise 24 hours.
Minimum age: 18. Not suitable during pregnancy.

Light Therapy — £120
Red and near-infrared light for healing and rejuvenation. No downtime.
Duration: ~30 minutes.
Pre-treatment: No specific preparation. Remove eye makeup if possible.
Aftercare: Apply moisturiser and SPF if going outdoors.
Suitable for: all skin types.
`

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS
// Used by: /api/quiz, /api/upsell
// ─────────────────────────────────────────────────────────────────────────────

export const PRODUCTS = `
CLEAR SKIN SKINCARE PRODUCTS — use exact names and prices:

Restore Serum — £95 — 30ml — approx. 2 months
Ceramide-rich serum rebuilding the skin's protective barrier layer.
Key ingredients: Ceramide NP, Ceramide AP, Niacinamide 4%, Panthenol.
Best for: sensitivity, redness, post-treatment skin, barrier-compromised skin.
How to use: Morning and evening on clean skin before moisturiser.
Vegan. Safe during pregnancy.

Brightening Complex — £85 — 20ml — approx. 6–8 weeks
20% stabilised Vitamin C for luminosity and even skin tone.
Key ingredients: L-Ascorbic Acid 20%, Ferulic Acid, Vitamin E.
Best for: pigmentation, dullness, uneven skin tone.
How to use: Morning only, before SPF. Do not combine with Renewal Night Cream in same application.
Storage: Cool, dark place. Vegan. Check with midwife if pregnant.

Renewal Night Cream — £110 — 50ml — approx. 2 months
Encapsulated retinol 0.3% for overnight cell renewal.
Key ingredients: Encapsulated Retinol 0.3%, Squalane, Peptide Complex.
Best for: ageing, fine lines, loss of firmness, uneven texture.
How to use: Night only. Start 2–3 evenings/week, build to nightly.
Vegan. Avoid during pregnancy.

Eye Revival — £75 — 15ml — approx. 3 months
Multi-peptide formula targeting dark circles and fine lines.
Key ingredients: Acetyl Hexapeptide-3, Palmitoyl Tripeptide-5, Caffeine, Marine Collagen.
Best for: eye area — dark circles, puffiness, fine lines.
How to use: Morning and evening with ball applicator, tapping motions.
Not vegan (sustainably sourced marine collagen). Safe during pregnancy.

Daily Shield SPF50 — £65 — 40ml — approx. 4–6 weeks
Featherlight mineral SPF, invisible finish. Fragrance-free, alcohol-free.
Key ingredients: Zinc Oxide 18%, Titanium Dioxide 7%, Niacinamide 3%.
Best for: daily protection, post-treatment skin, sensitive skin types.
How to use: Last step of morning routine. Reapply every 2 hours in direct sun.
Vegan. Safe during pregnancy.

Purifying Cleanse Balm — £70 — 100ml — approx. 2–3 months
Papaya enzyme balm that melts makeup and impurities.
Key ingredients: Papain (Papaya Enzyme), Shea Butter, Jojoba Oil, Vitamin E.
Best for: dullness, uneven tone, congested or acne-prone skin, all skin types.
How to use: Apply to dry skin, massage, add water to emulsify, rinse.
Suitable for sensitive skin. Vegan. Safe during pregnancy.
`

// ─────────────────────────────────────────────────────────────────────────────
// RECOMMENDATION LOGIC
// Used by: /api/quiz, /api/upsell
// ─────────────────────────────────────────────────────────────────────────────

export const RECOMMENDATION_LOGIC = `
PRODUCT PAIRING LOGIC — recommend these combinations by skin concern:

Ageing & Fine Lines:
  Primary: Renewal Night Cream (£110)
  Supporting: Eye Revival (£75)
  Rationale: Renewal Night Cream drives systemic cell renewal; Eye Revival targets
  the periorbital area where retinol concentration is too high to apply directly.

Pigmentation:
  Primary: Brightening Complex (£85)
  Supporting: Daily Shield SPF50 (£65)
  Rationale: Brightening Complex addresses existing pigmentation; Daily Shield SPF50
  prevents new pigmentation forming from UV exposure. These two are non-negotiable together.

Acne & Breakouts:
  Primary: Purifying Cleanse Balm (£70)
  Supporting: Restore Serum (£95)
  Rationale: Over-stripping acne-prone skin worsens the breakout cycle.
  These products calm and balance rather than strip.

Sensitivity & Redness:
  Primary: Restore Serum (£95)
  Supporting: Daily Shield SPF50 (£65)
  Rationale: Sensitive skin is almost always barrier-compromised. These
  address the cause rather than the symptom.

Dullness & Uneven Tone:
  Primary: Brightening Complex (£85)
  Supporting: Purifying Cleanse Balm (£70)
  Rationale: Dullness requires both a brightening active and regular gentle
  exfoliation to remove the layer of dead skin cells blocking light reflection.

Loss of Volume:
  Primary: Renewal Night Cream (£110)
  Supporting recommendation: BioRevive treatment (£380)
  Rationale: Product alone cannot address structural volume loss. Renewal Night Cream
  provides the best homecare support but the clinical recommendation is BioRevive.

TREATMENT RECOMMENDATION BY CONCERN AND BUDGET:

Ageing & Fine Lines:
  £500+: Laser Renewal (£550)
  £350–£500: BioRevive (£380)
  Under £350: Expression Reset (£300)

Pigmentation:
  Primary: Laser Renewal (£550)
  Alternative: Clinical Facial (£280) with brightening protocol

Acne & Breakouts:
  Primary: Clinical Facial (£280)
  If new client: Skin Analysis (£150) first

Sensitivity & Redness:
  Primary: Light Therapy (£120)
  Alternative: HydraRevive (£220) adapted for sensitive skin

Dullness & Uneven Tone:
  Primary: HydraRevive (£220)
  Alternative: Clinical Facial (£280)

Loss of Volume:
  Primary: Volume Treatment (£450+) for structural volumisation
  Alternative: BioRevive (£380) for general laxity and skin quality
  Always recommend Skin Analysis (£150) before any injectable
`

// ─────────────────────────────────────────────────────────────────────────────
// OPERATIONAL POLICIES
// Reserved for future practitioner-guidance flows.
// ─────────────────────────────────────────────────────────────────────────────

export const DELIVERY_POLICY = `
DELIVERY POLICY:
Standard UK: 3–5 working days. Free over £150. £5.95 below £150.
Express UK: Next working day (orders before 1pm). £9.95.
International: EU, UAE, USA, Canada, Nigeria. 7–14 working days. From £18.
All orders dispatched within 1 working day from London.
Packaging: temperature-controlled, plastic-free.
Tracking link sent by email after dispatch.
Lost orders: contact within 14 days — reissued at no charge.
Damaged orders: photograph and contact within 48 hours — replacement same day.
`

export const RETURNS_POLICY = `
RETURNS & EXCHANGES:
Return window: 30 days from delivery for unopened products.
Opened products: Cannot be returned for hygiene reasons, unless faulty or
caused an adverse reaction.
Adverse reaction: Stop use, contact us — full refund or exchange, no return needed.
Faulty product: Full refund or replacement within 1 working day, no return needed.
How to return: Email with order number — prepaid label within 1 working day.
Refund timeline: 5 working days after returned item received.
Exchanges: For different variant or product of equal or lesser value within 30 days.
Gift returns: Store credit within 30 days of original purchase.
`

export const CLINIC_POLICIES = `
CLINIC APPOINTMENT POLICIES:
Booking deposit: 50% required to secure all appointments. Deducted from final cost.

Cancellation:
  More than 48 hours notice: deposit fully refunded or transferred.
  Within 48 hours: deposit forfeited.
  Same-day or no-show: full deposit forfeited.

Late arrivals: If more than 15 minutes late we may need to shorten or reschedule.
Full treatment cost still applies.

Minimum age:
  Injectables (Volume Treatment, Expression Reset, BioRevive): 18 years.
  All other treatments: 16 years with parental consent if under 18.

Patch test: Required at least 48 hours before first Laser Renewal or Light Therapy.

Pregnancy: Injectables and Laser Renewal not recommended.
HydraRevive, Clinical Facial, Light Therapy can be adapted — inform clinic at booking.

Payment plans: 0% interest on treatment courses over £500. Ask team at booking.
Gift vouchers: From £50. Valid 12 months. Redeemable on treatments and products.
`

export const FAQS = `
GENERAL FAQS:

Parking:
  London: Metered street parking on Harley Street. NCP on Cavendish Square (5 min walk).
  Dubai: Complimentary valet at the clinic.
  Lagos: Private on-site car park.

Payment plans: 0% interest on courses over £500 via our finance partner.

Gift vouchers: From £50, valid 12 months, redeemable on treatments and products.

"Do I need a consultation first?"
  For Volume Treatment, Expression Reset, Laser Renewal, BioRevive — yes, strongly recommended.
  For all other treatments, a brief consultation is included at the start.

"How many sessions will I need?"
  Injectables: typically 1 session with 2-week review.
  Laser Renewal: most effective as 3 sessions, 4–6 weeks apart.
  BioRevive: 2 sessions, 4 weeks apart.
  Your practitioner will advise at the Skin Analysis.

Contact:
  Email: hello@clearskin.com
  London: +44 20 7946 0123
  Dubai: +971 4 123 4567
  Lagos: +234 1 234 5678
`

// ─────────────────────────────────────────────────────────────────────────────
// COMPOSED KNOWLEDGE BLOCKS
// Pre-assembled for each route — import these directly, not individual sections
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Includes everything — all topics a website visitor might ask about
 */
/**
 * Quiz reasoning knowledge (/api/quiz)
 * Treatments and products only — the model reasons across quiz answers
 * to select the most appropriate match
 */
export const QUIZ_KNOWLEDGE = {
  treatments: TREATMENTS,
  products: PRODUCTS,
  recommendations: RECOMMENDATION_LOGIC,
}

/**
 * Upsell rationale knowledge (/api/upsell)
 * Products and pairing logic — enough context for clinical explanation
 */
export const UPSELL_KNOWLEDGE = [
  PRODUCTS,
  RECOMMENDATION_LOGIC,
].join('\n\n---\n\n')

/**
 * No-show recovery knowledge (/api/noshow)
 * Treatments with pre/aftercare context — the recovery message gains
 * clinical depth by knowing what the client was preparing for
 */
export const NOSHOW_KNOWLEDGE = TREATMENTS

// ─────────────────────────────────────────────────────────────────────────────
// RAG UPGRADE PATH
// ─────────────────────────────────────────────────────────────────────────────
//
// When ready to upgrade to vector retrieval, replace the exported constants
// above with async retrieval functions. The API routes do not need to change —
// only this file.
//
// Example upgrade for future retrieval flows:
//
// import { createClient } from '@supabase/supabase-js'
// const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)
//
// export async function getKnowledge(query: string): Promise<string> {
//   const embedding = await openai.embeddings.create({
//     model: 'text-embedding-3-small',
//     input: query,
//   })
//   const { data } = await supabase.rpc('match_documents', {
//     query_embedding: embedding.data[0].embedding,
//     match_threshold: 0.78,
//     match_count: 5,
//   })
//   return data.map((d: any) => d.content).join('\n\n')
// }
//
// API routes can call the retrieval helper instead of importing static strings.
//
// Knowledge base for ingestion: CLEAR_SKIN_RAG_KNOWLEDGE_BASE.txt (25 pre-chunked docs)
// Recommended embedding model: text-embedding-3-small (OpenAI)
// Recommended DB: Supabase pgvector (free tier sufficient for demo + early prod)
