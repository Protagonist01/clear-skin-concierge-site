import { PRODUCTS } from '@/data/products'
import { TREATMENTS } from '@/data/treatments'
import type { ConciergeAction } from '@/lib/concierge/types'
import type { OpenRouterToolDefinition } from '@/lib/openrouter'
import {
  findConcernRule,
  findMentionedProducts,
  findMentionedTreatments,
  findProductsByNames,
  findTreatmentsByNames,
  getCalendlyUrl,
  reviewSafety,
} from '@/lib/concierge/expert-rules'
import { formatRetrievedKnowledge, retrieveBusinessKnowledge } from '@/lib/concierge/rag'

type ToolArgs = Record<string, unknown>

function productCard(product: (typeof PRODUCTS)[number]) {
  return {
    name: product.name,
    slug: product.slug,
    price: product.price,
    concern: product.concern,
    description: product.description,
    image: product.image,
  }
}

function treatmentCard(treatment: (typeof TREATMENTS)[number]) {
  return {
    name: treatment.name,
    slug: treatment.slug,
    price: treatment.price,
    category: treatment.category,
    description: treatment.description,
    image: treatment.image,
  }
}

function includesText(source: string, query: string) {
  return source.toLowerCase().includes(query.toLowerCase())
}

function stringArg(args: ToolArgs, key: string) {
  const value = args[key]
  return typeof value === 'string' ? value : ''
}

function stringArrayArg(args: ToolArgs, key: string) {
  const value = args[key]
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

export const CONCIERGE_TOOLS: OpenRouterToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'retrieve_business_knowledge',
      description: 'Retrieve relevant Clear Skin business knowledge, including policies, treatment details, product details, FAQ content, and expert-approved recommendation rules.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_products',
      description: 'Search the real Clear Skin product catalog. Use before showing or recommending products.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_treatments',
      description: 'Search the real Clear Skin treatment catalog. Use before showing, comparing, or booking treatments.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'validate_expert_recommendation',
      description: 'Validate a recommendation or user request against expert-approved rules and safety notes before recommending, booking, or adding products.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'propose_add_to_cart',
      description: 'Create a confirmation-required add-to-cart action for real products only.',
      parameters: {
        type: 'object',
        properties: {
          productNames: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['productNames'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'propose_remove_from_cart',
      description: 'Create a confirmation-required remove-from-cart action for real products only.',
      parameters: {
        type: 'object',
        properties: {
          productNames: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['productNames'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'propose_booking_handoff',
      description: 'Create a confirmation-required in-chat booking action for a real treatment or consultation.',
      parameters: {
        type: 'object',
        properties: {
          treatmentName: { type: 'string' },
          locationId: {
            type: 'string',
            enum: ['london', 'dubai', 'lagos', ''],
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'propose_navigation',
      description: 'Create a navigation action to a known website page, product page, treatment page, cart, checkout, or account.',
      parameters: {
        type: 'object',
        properties: {
          target: { type: 'string' },
        },
        required: ['target'],
      },
    },
  },
]

export async function executeConciergeTool(name: string, args: ToolArgs) {
  if (name === 'retrieve_business_knowledge') {
    const query = stringArg(args, 'query')
    const chunks = await retrieveBusinessKnowledge(query)
    return {
      chunks: chunks.map(({ id, title, score, retrieval }) => ({ id, title, score, retrieval })),
      context: formatRetrievedKnowledge(chunks),
    }
  }

  if (name === 'search_products') {
    const query = stringArg(args, 'query')
    const mentioned = findMentionedProducts(query)
    const rule = findConcernRule(query)
    const ruleProducts = rule ? findProductsByNames(rule.productNames) : []
    const textMatches = PRODUCTS.filter((product) => (
      includesText(`${product.name} ${product.concern} ${product.description}`, query)
    ))
    const products = [...mentioned, ...ruleProducts, ...textMatches]
      .filter((product, index, all) => all.findIndex((item) => item.slug === product.slug) === index)

    return {
      products: products.map(productCard),
    }
  }

  if (name === 'search_treatments') {
    const query = stringArg(args, 'query')
    const mentioned = findMentionedTreatments(query)
    const rule = findConcernRule(query)
    const ruleTreatments = rule ? findTreatmentsByNames(rule.treatmentNames) : []
    const textMatches = TREATMENTS.filter((treatment) => (
      includesText(`${treatment.name} ${treatment.category} ${treatment.description} ${treatment.idealFor.join(' ')}`, query)
    ))
    const treatments = [...mentioned, ...ruleTreatments, ...textMatches]
      .filter((treatment, index, all) => all.findIndex((item) => item.slug === treatment.slug) === index)

    return {
      treatments: treatments.map(treatmentCard),
    }
  }

  if (name === 'validate_expert_recommendation') {
    const query = stringArg(args, 'query')
    const safety = reviewSafety(query)
    const rule = findConcernRule(query)

    return {
      safety,
      concernRule: rule
        ? {
            concern: rule.concern,
            productNames: rule.productNames,
            treatmentNames: rule.treatmentNames,
            rationale: rule.rationale,
            followUpQuestion: rule.followUpQuestion,
          }
        : null,
    }
  }

  if (name === 'propose_add_to_cart') {
    const productNames = stringArrayArg(args, 'productNames')
    const products = productNames.flatMap((productName) => {
      const product = PRODUCTS.find((item) => item.name.toLowerCase() === productName.toLowerCase())
      return product ? [product] : []
    })

    return {
      action: products.length ? {
        type: 'add_to_cart',
        label: products.length === 1 ? `Add ${products[0].name}` : 'Add selected products',
        requiresConfirmation: true,
        payload: {
          productNames: products.map((product) => product.name),
          productSlugs: products.map((product) => product.slug),
          products: products.map(productCard),
        },
      } satisfies ConciergeAction : null,
      missingProducts: productNames.filter((productName) => !products.some((product) => product.name.toLowerCase() === productName.toLowerCase())),
    }
  }

  if (name === 'propose_remove_from_cart') {
    const productNames = stringArrayArg(args, 'productNames')
    const products = productNames.flatMap((productName) => {
      const product = PRODUCTS.find((item) => item.name.toLowerCase() === productName.toLowerCase())
      return product ? [product] : []
    })

    return {
      action: products.length ? {
        type: 'remove_from_cart',
        label: products.length === 1 ? `Remove ${products[0].name}` : 'Remove selected products',
        requiresConfirmation: true,
        payload: {
          productNames: products.map((product) => product.name),
          productSlugs: products.map((product) => product.slug),
          products: products.map(productCard),
        },
      } satisfies ConciergeAction : null,
      missingProducts: productNames.filter((productName) => !products.some((product) => product.name.toLowerCase() === productName.toLowerCase())),
    }
  }

  if (name === 'propose_booking_handoff') {
    const treatmentName = stringArg(args, 'treatmentName')
    const locationId = stringArg(args, 'locationId')
    const treatment = treatmentName
      ? TREATMENTS.find((item) => item.name.toLowerCase() === treatmentName.toLowerCase())
      : null

    return {
      action: {
        type: 'start_booking',
        label: treatment ? `Book ${treatment.name}` : 'Start booking',
        requiresConfirmation: true,
        payload: {
          treatmentSlug: treatment?.slug,
          locationId: locationId || undefined,
          calendlyUrl: getCalendlyUrl({
            treatmentSlug: treatment?.slug,
            locationId: locationId || undefined,
          }),
        },
      } satisfies ConciergeAction,
      treatment: treatment ? treatmentCard(treatment) : null,
    }
  }

  if (name === 'propose_navigation') {
    const target = stringArg(args, 'target').toLowerCase()
    const product = PRODUCTS.find((item) => (
      target.includes(item.name.toLowerCase()) || target.includes(item.slug)
    ))
    const treatment = TREATMENTS.find((item) => (
      target.includes(item.name.toLowerCase()) || target.includes(item.slug)
    ))

    let href = '/'
    if (product) href = `/skincare/${product.slug}`
    else if (treatment) href = `/treatments/${treatment.slug}`
    else if (target.includes('cart') || target.includes('bag')) href = '/cart'
    else if (target.includes('checkout')) href = '/checkout'
    else if (target.includes('book')) href = '/book'
    else if (target.includes('treatment') || target.includes('service')) href = '/treatments'
    else if (target.includes('skincare') || target.includes('product') || target.includes('shop')) href = '/skincare'
    else if (target.includes('about') || target.includes('location')) href = '/about'
    else if (target.includes('account')) href = '/account'

    return {
      action: {
        type: 'navigate',
        label: 'Open page',
        requiresConfirmation: href === '/checkout',
        payload: { href },
      } satisfies ConciergeAction,
    }
  }

  return { error: `Unknown tool: ${name}` }
}
