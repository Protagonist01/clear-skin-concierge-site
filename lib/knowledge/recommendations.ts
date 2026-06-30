import { PRODUCTS, type Product } from '../../data/products'
import { TREATMENTS, type Treatment } from '../../data/treatments'

export type RoutineDepth = 'starter' | 'complete'

interface RecommendationSet {
  keys: string[]
  starter: string[]
  complete: string[]
  treatment: string[]
}

const DEFAULT_SET: RecommendationSet = {
  keys: ['default'],
  starter: ['restore-serum', 'daily-shield-spf50'],
  complete: ['purifying-cleanse-balm', 'restore-serum', 'daily-shield-spf50'],
  treatment: ['skin-analysis', 'clinical-facial'],
}

const RECOMMENDATION_SETS: RecommendationSet[] = [
  {
    keys: ['pigmentation', 'hyperpigmentation', 'dark spots', 'sun spots'],
    starter: ['brightening-complex', 'daily-shield-spf50'],
    complete: ['purifying-cleanse-balm', 'brightening-complex', 'daily-shield-spf50'],
    treatment: ['laser-renewal', 'clinical-facial'],
  },
  {
    keys: ['acne', 'breakout', 'breakouts', 'blemish', 'congestion'],
    starter: ['purifying-cleanse-balm', 'restore-serum'],
    complete: ['purifying-cleanse-balm', 'restore-serum', 'daily-shield-spf50'],
    treatment: ['clinical-facial', 'skin-analysis'],
  },
  {
    keys: ['sensitivity', 'sensitive', 'redness', 'reactive', 'irritation', 'barrier'],
    starter: ['restore-serum', 'daily-shield-spf50'],
    complete: ['purifying-cleanse-balm', 'restore-serum', 'daily-shield-spf50'],
    treatment: ['light-therapy', 'hydrarevive'],
  },
  {
    keys: ['dullness', 'glow', 'radiance', 'uneven tone', 'dull'],
    starter: ['brightening-complex', 'purifying-cleanse-balm'],
    complete: ['purifying-cleanse-balm', 'brightening-complex', 'daily-shield-spf50'],
    treatment: ['hydrarevive', 'clinical-facial'],
  },
  {
    keys: ['ageing', 'aging', 'fine lines', 'wrinkles', 'firmness', 'lines'],
    starter: ['renewal-night-cream', 'eye-revival'],
    complete: ['purifying-cleanse-balm', 'renewal-night-cream', 'eye-revival'],
    treatment: ['laser-renewal', 'biorevive', 'expression-reset'],
  },
  {
    keys: ['hydration', 'dryness', 'dry skin', 'dehydrated', 'hydrate'],
    starter: ['restore-serum', 'daily-shield-spf50'],
    complete: ['purifying-cleanse-balm', 'restore-serum', 'daily-shield-spf50'],
    treatment: ['hydrarevive', 'clinical-facial'],
  },
  {
    keys: ['eye area', 'under eye', 'dark circles', 'eyes'],
    starter: ['eye-revival', 'restore-serum'],
    complete: ['purifying-cleanse-balm', 'eye-revival', 'restore-serum'],
    treatment: ['light-therapy', 'clinical-facial'],
  },
  {
    keys: ['volume', 'loss of volume', 'volume loss', 'hollow', 'sagging'],
    starter: ['renewal-night-cream'],
    complete: ['restore-serum', 'renewal-night-cream', 'daily-shield-spf50'],
    treatment: ['volume-treatment', 'biorevive'],
  },
]

function normalizeConcern(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s/-]/g, ' ').replace(/\s+/g, ' ').trim()
}

export function getRecommendationSet(concern: string) {
  const normalized = normalizeConcern(concern)
  return RECOMMENDATION_SETS.find((entry) => (
    entry.keys.some((key) => normalized.includes(key))
  )) ?? DEFAULT_SET
}

function productsFromSlugs(slugs: string[]) {
  return slugs
    .map((slug) => PRODUCTS.find((product) => product.slug === slug))
    .filter((product): product is Product => Boolean(product))
}

function treatmentsFromSlugs(slugs: string[]) {
  return slugs
    .map((slug) => TREATMENTS.find((treatment) => treatment.slug === slug))
    .filter((treatment): treatment is Treatment => Boolean(treatment))
}

export function buildRoutine(concern: string, depth: RoutineDepth = 'starter') {
  const recommendationSet = getRecommendationSet(concern)
  return productsFromSlugs(depth === 'complete' ? recommendationSet.complete : recommendationSet.starter)
}

export function getProductsForConcern(concern: string) {
  return buildRoutine(concern, 'starter')
}

export function getTreatmentsForConcern(concern: string, budget?: string) {
  const treatments = treatmentsFromSlugs(getRecommendationSet(concern).treatment)
  const normalizedBudget = budget?.trim()

  if (normalizeConcern(concern).includes('age') && treatments.length >= 3) {
    if (normalizedBudget?.includes('500+')) return [treatments[0], treatments[1]].filter(Boolean) as Treatment[]
    if (normalizedBudget?.includes('350')) return [treatments[1], treatments[0]].filter(Boolean) as Treatment[]
    return [treatments[2], treatments[1]].filter(Boolean) as Treatment[]
  }

  return treatments
}

export function getQuizProductFallback(concern: string) {
  const [primary, secondary] = getProductsForConcern(concern)
  return { primary, secondary: secondary ?? null }
}

export function getQuizTreatmentFallback(concern: string, budget?: string) {
  const [primary, secondary] = getTreatmentsForConcern(concern, budget)
  return { primary, secondary: secondary ?? primary }
}
