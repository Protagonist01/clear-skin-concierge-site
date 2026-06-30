import { PRODUCTS } from '@/data/products'
import { TREATMENTS } from '@/data/treatments'
import type { Product } from '@/data/products'
import type { Treatment } from '@/data/treatments'

export interface ExpertRecommendation {
  concern: string
  aliases?: string[]
  productNames: string[]
  treatmentNames: string[]
  rationale: string
  followUpQuestion: string
}

export interface SafetyReview {
  blocked: boolean
  notes: string[]
  replyPrefix: string
}

const CONCERN_RULES: ExpertRecommendation[] = [
  {
    concern: 'pigmentation',
    aliases: ['hyperpigmentation', 'pigmented', 'dark spot', 'dark spots', 'discoloration', 'discolouration', 'uneven tone', 'melasma', 'sun spot', 'sun spots', 'sunspot', 'sunspots'],
    productNames: ['Brightening Complex', 'Daily Shield SPF50'],
    treatmentNames: ['Laser Renewal', 'Clinical Facial'],
    rationale: 'Brightening Complex addresses existing uneven tone while Daily Shield SPF50 reduces the UV exposure that can deepen pigmentation. For clinic treatment, Laser Renewal is the strongest match, with Clinical Facial as the gentler brightening route.',
    followUpQuestion: 'Would you like to compare the product routine with the treatment route?',
  },
  {
    concern: 'acne',
    aliases: ['acne-prone', 'acne prone', 'blemish', 'blemishes', 'pimple', 'pimples', 'congested', 'congestion'],
    productNames: ['Purifying Cleanse Balm', 'Restore Serum'],
    treatmentNames: ['Clinical Facial', 'Skin Analysis'],
    rationale: 'The approved acne pathway avoids over-stripping the skin. Purifying Cleanse Balm supports controlled cleansing, while Restore Serum helps protect the barrier during a breakout cycle.',
    followUpQuestion: 'Would you like a simple acne-support routine or a treatment recommendation first?',
  },
  {
    concern: 'breakout',
    aliases: ['breakouts', 'spots', 'spotty'],
    productNames: ['Purifying Cleanse Balm', 'Restore Serum'],
    treatmentNames: ['Clinical Facial', 'Skin Analysis'],
    rationale: 'The approved acne pathway avoids over-stripping the skin. Purifying Cleanse Balm supports controlled cleansing, while Restore Serum helps protect the barrier during a breakout cycle.',
    followUpQuestion: 'Would you like a simple acne-support routine or a treatment recommendation first?',
  },
  {
    concern: 'oily skin',
    aliases: ['oily', 'oiliness', 'greasy', 'shiny', 'excess oil', 'large pores'],
    productNames: ['Purifying Cleanse Balm', 'Restore Serum', 'Daily Shield SPF50'],
    treatmentNames: ['Clinical Facial', 'HydraRevive', 'Skin Analysis'],
    rationale: 'Oily skin still needs barrier support. Purifying Cleanse Balm controls cleansing without stripping, Restore Serum supports balance, and Daily Shield SPF50 protects without adding heavy texture.',
    followUpQuestion: 'Would you like a simple oil-control routine or clinic options for congestion?',
  },
  {
    concern: 'dryness',
    aliases: ['dry', 'dry skin', 'flaky', 'flakiness', 'tight skin', 'tightness'],
    productNames: ['Restore Serum', 'Daily Shield SPF50'],
    treatmentNames: ['HydraRevive', 'Skin Analysis'],
    rationale: 'Dryness should be treated barrier-first. Restore Serum helps rebuild the protective layer, while Daily Shield SPF50 protects compromised skin from extra environmental stress.',
    followUpQuestion: 'Would you like a barrier-first routine or a hydration treatment route?',
  },
  {
    concern: 'dehydration',
    aliases: ['dehydrated', 'dehydration', 'lacking water', 'parched'],
    productNames: ['Restore Serum', 'Daily Shield SPF50'],
    treatmentNames: ['HydraRevive', 'Light Therapy', 'Skin Analysis'],
    rationale: 'Dehydrated skin needs water-binding support and a calmer barrier. Restore Serum is the homecare anchor, and HydraRevive is the direct clinic hydration route.',
    followUpQuestion: 'Would you like homecare hydration steps or in-clinic hydration options?',
  },
  {
    concern: 'sensitivity',
    aliases: ['sensitive', 'sensitised', 'sensitized', 'reactive'],
    productNames: ['Restore Serum', 'Daily Shield SPF50'],
    treatmentNames: ['Light Therapy', 'HydraRevive'],
    rationale: 'Sensitivity is treated as a barrier-first concern. Restore Serum supports the skin barrier, while Daily Shield SPF50 protects sensitised skin from avoidable UV stress.',
    followUpQuestion: 'Would you like pregnancy-safe and sensitivity-safe options only?',
  },
  {
    concern: 'redness',
    aliases: ['red', 'flushed'],
    productNames: ['Restore Serum', 'Daily Shield SPF50'],
    treatmentNames: ['Light Therapy', 'HydraRevive'],
    rationale: 'Redness is treated conservatively first. Restore Serum and Daily Shield SPF50 are the approved homecare pair, while Light Therapy is the gentlest clinic route.',
    followUpQuestion: 'Would you like me to show the gentlest treatment options?',
  },
  {
    concern: 'dullness',
    aliases: ['dull', 'lacklustre', 'lackluster', 'tired skin', 'flat skin', 'no glow'],
    productNames: ['Brightening Complex', 'Purifying Cleanse Balm'],
    treatmentNames: ['HydraRevive', 'Clinical Facial'],
    rationale: 'Dullness usually needs both a brightening active and gentle removal of surface build-up. The approved pair is Brightening Complex with Purifying Cleanse Balm.',
    followUpQuestion: 'Would you like the at-home routine or the in-clinic options?',
  },
  {
    concern: 'ageing',
    aliases: ['aging', 'ageing skin', 'aging skin', 'firmness', 'wrinkle', 'wrinkles'],
    productNames: ['Renewal Night Cream', 'Eye Revival'],
    treatmentNames: ['BioRevive', 'Expression Reset'],
    rationale: 'Renewal Night Cream supports overnight renewal, while Eye Revival addresses the delicate eye area where stronger retinoid formulas are not appropriate.',
    followUpQuestion: 'Would you like product-led support or a consultation for treatment options?',
  },
  {
    concern: 'fine lines',
    aliases: ['fine line', 'lines', "crow's feet", 'crows feet'],
    productNames: ['Renewal Night Cream', 'Eye Revival'],
    treatmentNames: ['BioRevive', 'Expression Reset'],
    rationale: 'Renewal Night Cream supports overnight renewal, while Eye Revival addresses the delicate eye area where stronger retinoid formulas are not appropriate.',
    followUpQuestion: 'Would you like product-led support or a consultation for treatment options?',
  },
  {
    concern: 'volume',
    aliases: ['volume loss', 'hollow', 'hollowness', 'gaunt'],
    productNames: ['Renewal Night Cream'],
    treatmentNames: ['Volume Treatment', 'BioRevive', 'Skin Analysis'],
    rationale: 'Product alone cannot correct structural volume loss. Renewal Night Cream can support skin quality, but the approved clinical route is consultation before injectable treatment.',
    followUpQuestion: 'Would you like to book Skin Analysis before considering injectables?',
  },
]

const PREGNANCY_TERMS = ['pregnant', 'pregnancy', 'breastfeeding', 'nursing']
const ESCALATION_TERMS = ['infection', 'infected', 'bleeding', 'burn', 'severe pain', 'swelling', 'rash', 'allergic', 'reaction']

function normalize(value: string) {
  return value.toLowerCase().trim()
}

export function findConcernRule(input: string) {
  return findConcernRules(input)[0] ?? null
}

export function findConcernRules(input: string) {
  const text = normalize(input)
  return CONCERN_RULES.filter((rule) => (
    text.includes(rule.concern)
    || rule.aliases?.some((alias) => text.includes(alias))
  ))
}

export function findProductsByNames(names: string[]) {
  return names.flatMap((name) => {
    const product = PRODUCTS.find((item) => item.name === name)
    return product ? [product] : []
  })
}

export function findTreatmentsByNames(names: string[]) {
  return names.flatMap((name) => {
    const treatment = TREATMENTS.find((item) => item.name === name)
    return treatment ? [treatment] : []
  })
}

export function findMentionedProducts(input: string): Product[] {
  const text = normalize(input)
  return PRODUCTS.filter((product) => text.includes(normalize(product.name)) || text.includes(product.slug.replace(/-/g, ' ')))
}

export function findMentionedTreatments(input: string): Treatment[] {
  const text = normalize(input)
  return TREATMENTS.filter((treatment) => text.includes(normalize(treatment.name)) || text.includes(treatment.slug.replace(/-/g, ' ')))
}

export function reviewSafety(input: string): SafetyReview {
  const text = normalize(input)
  const notes: string[] = []

  if (PREGNANCY_TERMS.some((term) => text.includes(term))) {
    notes.push('Pregnancy or breastfeeding mentioned. Avoid injectables, Laser Renewal, and retinoid-led routines unless a practitioner clears them.')
  }

  if (ESCALATION_TERMS.some((term) => text.includes(term))) {
    notes.push('Potential adverse reaction or acute skin issue mentioned. Recommend practitioner review before product or treatment guidance.')
  }

  return {
    blocked: notes.some((note) => note.includes('acute skin issue')),
    notes,
    replyPrefix: notes.length
      ? 'I want to keep this clinically careful. '
      : '',
  }
}

export function getCalendlyUrl(input: { treatmentSlug?: string; locationId?: string } = {}) {
  const baseUrl = process.env.CALENDLY_SCHEDULING_URL
    || process.env.NEXT_PUBLIC_CALENDLY_URL
    || '/book'

  if (baseUrl.startsWith('/')) {
    const params = new URLSearchParams()
    if (input.treatmentSlug) params.set('treatment', input.treatmentSlug)
    if (input.locationId) params.set('location', input.locationId)
    if (params.size) return `${baseUrl}?${params.toString()}`
    return baseUrl
  }

  return baseUrl
}
