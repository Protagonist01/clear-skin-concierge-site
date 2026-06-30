import { PRODUCTS } from '@/data/products'
import { TREATMENTS } from '@/data/treatments'
import type { Product } from '@/data/products'
import type { Treatment } from '@/data/treatments'
import type {
  ConciergeAction,
  ConciergeAppState,
  ConciergeChatMessage,
  ConciergeDecision,
  ConciergeSuggestion,
} from '@/lib/concierge/types'
import {
  findConcernRule,
  findConcernRules,
  findMentionedProducts,
  findMentionedTreatments,
  findProductsByNames,
  findTreatmentsByNames,
  getCalendlyUrl,
  reviewSafety,
  type ExpertRecommendation,
} from '@/lib/concierge/expert-rules'

const DEFAULT_SUGGESTIONS: ConciergeSuggestion[] = [
  { label: 'Find a routine', type: 'education', prompt: 'Help me find the right skincare routine.' },
  { label: 'Book consultation', type: 'booking', prompt: 'Help me book a consultation.' },
  { label: 'Browse treatments', type: 'navigation', prompt: 'Show me the treatments.' },
]

function normalize(value: string) {
  return value.toLowerCase().trim()
}

function productCard(product: Product) {
  return {
    name: product.name,
    slug: product.slug,
    price: product.price,
    concern: product.concern,
    description: product.description,
    image: product.image,
  }
}

function treatmentCard(treatment: Treatment) {
  return {
    name: treatment.name,
    slug: treatment.slug,
    price: treatment.price,
    category: treatment.category,
    description: treatment.description,
    image: treatment.image,
  }
}

function navAction(label: string, href: string): ConciergeAction {
  return {
    type: 'navigate',
    label,
    requiresConfirmation: false,
    payload: { href },
  }
}

function normalizePathname(value?: string) {
  const path = (value || '/').split(/[?#]/)[0] || '/'
  if (path === '/') return path
  return path.replace(/\/+$/, '') || '/'
}

function isCurrentPage(href: string | undefined, appState?: ConciergeAppState) {
  if (!href) return false
  return normalizePathname(href) === normalizePathname(appState?.currentPath)
}

function pageLabelForHref(href: string | undefined, appState?: ConciergeAppState) {
  if (isCurrentPage(href, appState) && appState?.currentPageLabel) return appState.currentPageLabel
  if (!href || href === '/') return 'home'
  if (href.startsWith('/cart')) return 'cart'
  if (href.startsWith('/checkout')) return 'checkout'
  if (href.startsWith('/skincare')) return 'skincare'
  if (href.startsWith('/treatments')) return 'treatments'
  if (href.startsWith('/about')) return 'about'
  if (href.startsWith('/account')) return 'account'
  return href.replace(/^\/+/, '').replace(/[-/]+/g, ' ') || 'that page'
}

function showProductsAction(products: Product[]): ConciergeAction {
  return {
    type: 'show_products',
    label: 'Show skincare',
    requiresConfirmation: false,
    payload: { products: products.map(productCard) },
  }
}

function showTreatmentsAction(treatments: Treatment[]): ConciergeAction {
  return {
    type: 'show_treatments',
    label: 'Show treatments',
    requiresConfirmation: false,
    payload: { treatments: treatments.map(treatmentCard) },
  }
}

function addToCartAction(products: Product[]): ConciergeAction {
  return {
    type: 'add_to_cart',
    label: products.length === 1 ? `Add ${products[0].name}` : 'Add selected products',
    requiresConfirmation: true,
    payload: {
      productNames: products.map((product) => product.name),
      productSlugs: products.map((product) => product.slug),
      products: products.map(productCard),
    },
  }
}

function removeFromCartAction(products: Product[]): ConciergeAction {
  return {
    type: 'remove_from_cart',
    label: products.length === 1 ? `Remove ${products[0].name}` : 'Remove selected products',
    requiresConfirmation: true,
    payload: {
      productNames: products.map((product) => product.name),
      productSlugs: products.map((product) => product.slug),
      products: products.map(productCard),
    },
  }
}

function bookingAction(treatment?: Treatment, locationId?: string): ConciergeAction {
  return {
    type: 'start_booking',
    label: treatment ? `Book ${treatment.name}` : 'Start booking',
    requiresConfirmation: true,
    payload: {
      treatmentSlug: treatment?.slug,
      locationId,
      calendlyUrl: getCalendlyUrl({ treatmentSlug: treatment?.slug, locationId }),
    },
  }
}

function quizAction(mode: 'product' | 'treatment' = 'product'): ConciergeAction {
  return {
    type: 'open_quiz',
    label: mode === 'treatment' ? 'Start treatment quiz' : 'Start skin quiz',
    requiresConfirmation: false,
    payload: { quizMode: mode },
  }
}

function findLocationId(text: string) {
  if (text.includes('lagos')) return 'lagos'
  if (text.includes('dubai')) return 'dubai'
  if (text.includes('london')) return 'london'
  return undefined
}

function buildConcernSuggestions(ruleConcern: string): ConciergeSuggestion[] {
  return [
    {
      label: 'Show recommended products',
      type: 'navigation',
      prompt: `Show me the recommended products for ${ruleConcern}.`,
    },
    {
      label: 'Book Skin Analysis',
      type: 'booking',
      prompt: 'Help me book a Skin Analysis.',
    },
    {
      label: 'Compare options',
      type: 'question',
      prompt: `Compare the product and treatment options for ${ruleConcern}.`,
    },
  ]
}

function contextWindow(messages: ConciergeChatMessage[] = []) {
  return messages
    .slice(0, -1)
    .slice(-6)
    .map((message) => message.content)
    .join(' ')
}

function latestContextProducts(messages: ConciergeChatMessage[] = []) {
  const context = contextWindow(messages)
  return uniqueProducts(findMentionedProducts(context))
}

function latestContextTreatments(messages: ConciergeChatMessage[] = []) {
  const context = contextWindow(messages)
  return findMentionedTreatments(context).slice(-2)
}

function latestContextConcern(messages: ConciergeChatMessage[] = []) {
  const context = contextWindow(messages)
  return findConcernRule(context)
}

function latestContextConcernRules(messages: ConciergeChatMessage[] = []) {
  const context = contextWindow(messages)
  return findConcernRules(context)
}

function lastResponseConcern(appState?: ConciergeAppState) {
  const concern = appState?.lastResponse?.concern
  return concern ? findConcernRule(concern) : null
}

function lastResponseConcernRules(appState?: ConciergeAppState) {
  const concerns = appState?.lastResponse?.concerns?.length
    ? appState.lastResponse.concerns
    : appState?.lastResponse?.concern
      ? [appState.lastResponse.concern]
      : []

  return concerns.flatMap((concern) => findConcernRules(concern))
}

function uniqueConcernRules(rules: Array<ExpertRecommendation | null | undefined>): ExpertRecommendation[] {
  const seen = new Set<string>()
  return rules.flatMap((rule) => {
    if (!rule || seen.has(rule.concern)) return []
    seen.add(rule.concern)
    return [rule]
  })
}

function summarizeConcernNames(rules: ExpertRecommendation[]) {
  return rules.map((rule) => rule.concern).join(', ')
}

function productsForConcernRules(rules: ExpertRecommendation[]) {
  return uniqueProducts(rules.flatMap((rule) => findProductsByNames(rule.productNames))).slice(0, 4)
}

function treatmentsForConcernRules(rules: ExpertRecommendation[]) {
  return uniqueTreatments(rules.flatMap((rule) => findTreatmentsByNames(rule.treatmentNames))).slice(0, 4)
}

function hasPronounReference(text: string) {
  return /\b(it|that|this|these|those|they|them|one|first|the treatment|the product|the products|the routine)\b/.test(text)
}

function questionIntent(text: string) {
  return /\?/.test(text)
    || /^(what|why|how|when|where|who|which|do|does|did|can|could|should|would|is|are|am|will|tell me|explain|compare)\b/.test(text)
}

function recommendationIntent(text: string) {
  return /\b(recommend|suggest|best for|what should i use|should i use|which one|which should|start with|use first|help me choose|routine|option|options|product route|treatment route|for my skin|for pigmentation|for acne|for breakouts|for redness|for sensitivity|for dullness|for ageing|for fine lines|for volume)\b/.test(text)
}

function productLedIntent(text: string) {
  return /\b(product|products|skincare|routine|serum|cream|spf|cleanser|cleanse|use at home|homecare|buy|bag|cart|shop)\b/.test(text)
}

function treatmentLedIntent(text: string) {
  return /\b(treatment|treatments|facial|laser|injectable|clinic|in clinic|appointment|consultation|book|booking|procedure|downtime|results)\b/.test(text)
}

function pageNavigationIntent(text: string) {
  return /\b(open|go to|take me|navigate|show me|view|browse)\b/.test(text)
    || /\b(i mean|mean|my)\b.*\b(cart|bag|basket|checkout)\b/.test(text)
}

function quizLedIntent(text: string) {
  return /\b(skin quiz|quiz|assessment|not sure|unsure|where do i start|skin type|diagnose|diagnosis|i don't know|i do not know|mixed concerns|multiple concerns)\b/.test(text)
}

function bookingActionIntent(text: string) {
  const directBooking = /^(book|schedule|reserve|request|set up)\b/.test(text)
    || /\b(actually|instead)\b.*\b(book|schedule|reserve|request|appointment|consultation|slot)\b/.test(text)
    || /\b(help me|can you|could you|please|i want to|i need to|i'd like to|i would like to|let's)\b.*\b(book|schedule|reserve|request|appointment|consultation|slot)\b/.test(text)
    || /\b(can i|could i)\b.*\b(book|schedule|reserve|request)\b/.test(text)
    || /\b(start|begin)\b.*\b(booking|appointment|consultation)\b/.test(text)

  if (!directBooking) return false

  const informationalQuestion = questionIntent(text)
    && !/^(book|schedule|reserve|request|set up)\b/.test(text)
    && !/\b(help me|can you|could you|please|i want to|i need to|i'd like to|i would like to)\b.*\b(book|schedule|reserve|request)\b/.test(text)
    && !/\b(can i|could i)\b.*\b(book|schedule|reserve|request)\b/.test(text)

  return !informationalQuestion
}

function bookingInfoQuestionIntent(text: string) {
  return questionIntent(text)
    && /\b(book|booking|appointment|appointments|schedule|consultation|slot|availability)\b/.test(text)
    && !bookingActionIntent(text)
}

function cartQuestionIntent(text: string) {
  const mutationIntent = /\b(add|put|include|remove|delete|take out|drop)\b/.test(text)
  if (mutationIntent) return false

  return /\b(what'?s|what is|what do i have|which items?|items?)\b.*\b(cart|bag|basket)\b/.test(text)
    || /\b(cart|bag|basket)\b.*\b(contain|contains|inside|empty|items?|have)\b/.test(text)
    || /\b(do i have|is there|is .* in)\b.*\b(cart|bag|basket)\b/.test(text)
    || /\b(are|is)\b.*\b(in|inside|on)\b.*\b(cart|bag|basket)\b/.test(text)
    || /\b(these|those|they|them|it|that)\b.*\b(cart|bag|basket)\b.*\b(already|currently|now)?\b/.test(text)
    || /\b(already|currently)\b.*\b(in|inside|on)?\b.*\b(cart|bag|basket)\b/.test(text)
}

function followUpRationaleIntent(text: string) {
  return /\b(chose|choose|chosen|picked|why these|why those|why them|why did you|reason|rationale)\b/.test(text)
    || /\b(which one|which should|start with|use first|first and why)\b/.test(text)
    || /^explain\b/.test(text)
}

function sequencingIntent(text: string) {
  return /\b(which one|which should|start with|use first|first and why|order|sequence)\b/.test(text)
}

function declineIntent(text: string) {
  if (/\bi don't know\b|\bi do not know\b/.test(text)) return false

  return /^(no|nope)\b/.test(text)
    || /\b(no thanks|not now|cancel|stop|never mind|nevermind|leave it|leave them|don't|dont|do not)\b/.test(text)
}

function buildBookingInfoAnswer(treatment?: Treatment) {
  const bookingDestination = getCalendlyUrl().startsWith('https://')
    ? 'Calendly'
    : 'the booking flow'

  return treatment
    ? `${treatment.name} booking is handled through ${bookingDestination}. I will ask for confirmation before opening the handoff.`
    : `Booking is handled through ${bookingDestination}. When you are ready, I will ask for confirmation before opening the handoff.`
}

function buildConcernQuestionAnswer(ruleConcern: string) {
  return `For ${ruleConcern}, the first step is to understand whether you want homecare guidance, clinic treatment, or a skin assessment. I can compare those routes once the question itself is clear.`
}

function buildDeclineReply(appState?: ConciergeAppState) {
  const pendingActionType = appState?.pendingAction?.type
  const lastActionType = appState?.lastResponse?.actionType
  const actionType = pendingActionType || lastActionType

  if (actionType === 'add_to_cart') {
    return 'Okay, I will not add anything to your bag.'
  }

  if (actionType === 'remove_from_cart') {
    return 'Okay, I will not remove anything from your bag.'
  }

  if (actionType === 'start_booking') {
    return 'Okay, I will not start booking right now.'
  }

  if (actionType === 'open_quiz') {
    return 'Okay, we do not need to start the quiz right now.'
  }

  if (actionType === 'navigate') {
    return 'Okay, I will not open that page.'
  }

  return 'Okay, no change made.'
}

function joinProductNames(products: Product[]) {
  return products.map((product) => product.name).join(' and ')
}

function joinTreatmentNames(treatments: Treatment[]) {
  return treatments.map((treatment) => treatment.name).join(' and ')
}

function pluralVerb(items: unknown[]) {
  return items.length === 1 ? 'is' : 'are'
}

function uniqueProducts(products: Product[]) {
  return products.filter((product, index, all) => all.findIndex((item) => item.slug === product.slug) === index)
}

function narrowProductsByGenericReference(text: string, products: Product[]) {
  if (!products.length) return products
  if (/\b(those|these|they|them|all|recommended products|the products)\b/.test(text)) return products

  const narrowed = products.filter((product) => {
    const haystack = `${product.name} ${product.slug} ${product.concern} ${product.description}`.toLowerCase()
    return (
      (/\bspf|sunscreen|shield\b/.test(text) && /\bspf|sunscreen|shield|protection\b/.test(haystack))
      || (/\bserum\b/.test(text) && haystack.includes('serum'))
      || (/\bcream\b/.test(text) && haystack.includes('cream'))
      || (/\bcleanser|cleanse|balm\b/.test(text) && /\bcleanse|cleanser|balm\b/.test(haystack))
    )
  })

  return narrowed.length ? narrowed : products
}

function uniqueTreatments(treatments: Treatment[]) {
  return treatments.filter((treatment, index, all) => all.findIndex((item) => item.slug === treatment.slug) === index)
}

function stateResponseProducts(appState?: ConciergeAppState) {
  const names = appState?.lastResponse?.productNames || []
  const slugs = appState?.lastResponse?.productSlugs || []
  return uniqueProducts([...names, ...slugs].flatMap((value) => {
    const product = PRODUCTS.find((item) => item.name === value || item.slug === value)
    return product ? [product] : []
  }))
}

function stateResponseTreatments(appState?: ConciergeAppState) {
  const names = appState?.lastResponse?.treatmentNames || []
  const slugs = appState?.lastResponse?.treatmentSlugs || []
  const bookingSlug = appState?.booking?.treatmentSlug
  return uniqueTreatments([...names, ...slugs, bookingSlug || ''].flatMap((value) => {
    const treatment = TREATMENTS.find((item) => item.name === value || item.slug === value)
    return treatment ? [treatment] : []
  }))
}

function appCartItems(appState?: ConciergeAppState) {
  return appState?.cart?.items || []
}

function findCartProducts(appState?: ConciergeAppState) {
  return appCartItems(appState).flatMap((item) => {
    const product = PRODUCTS.find((entry) => entry.slug === item.slug || normalize(entry.name) === normalize(item.name))
    return product ? [product] : []
  })
}

function productIsInCart(product: Product, appState?: ConciergeAppState) {
  return appCartItems(appState).some((item) => item.slug === product.slug || normalize(item.name) === normalize(product.name))
}

function findMentionedCartProducts(input: string, appState?: ConciergeAppState) {
  const text = normalize(input)
  return findCartProducts(appState).filter((product) => (
    text.includes(normalize(product.name))
    || text.includes(product.slug.replace(/-/g, ' '))
  ))
}

function buildCartStateAnswer(appState?: ConciergeAppState, mentionedProducts: Product[] = []) {
  const items = appCartItems(appState)
  if (!items.length) return 'Your bag is empty.'

  if (mentionedProducts.length) {
    return mentionedProducts
      .map((product) => {
        const item = items.find((entry) => entry.slug === product.slug || normalize(entry.name) === normalize(product.name))
        return item
          ? `Yes, ${item.quantity} x ${item.name} is in your bag.`
          : `${product.name} is not in your bag.`
      })
      .join(' ')
  }

  const itemText = items.map((item) => `${item.quantity} x ${item.name}`).join(', ')
  const count = appState?.cart?.count ?? items.reduce((total, item) => total + item.quantity, 0)
  return `Your bag has ${count} item${count === 1 ? '' : 's'}: ${itemText}.`
}

function buildFollowUpRationaleAnswer({
  products,
  treatments,
  concernRule,
  appState,
}: {
  products: Product[]
  treatments: Treatment[]
  concernRule: ReturnType<typeof findConcernRule>
  appState?: ConciergeAppState
}) {
  const lastActionType = appState?.lastResponse?.actionType

  if (products.length && concernRule) {
    const approvedProducts = findProductsByNames(concernRule.productNames)
    const approvedNames = new Set(concernRule.productNames)
    const offRuleProducts = products.filter((product) => !approvedNames.has(product.name))

    if (offRuleProducts.length) {
      return `For ${concernRule.concern}, I should be using ${joinProductNames(approvedProducts)}. ${concernRule.rationale}`
    }

    return `${joinProductNames(products)} ${pluralVerb(products)} the right homecare start for ${concernRule.concern}. ${concernRule.rationale}`
  }

  if (treatments.length && concernRule) {
    return `${joinTreatmentNames(treatments)} ${pluralVerb(treatments)} the clinic route for ${concernRule.concern}. ${concernRule.rationale}`
  }

  const approvedProducts = concernRule ? findProductsByNames(concernRule.productNames) : []
  if (!products.length && !treatments.length && concernRule && approvedProducts.length) {
    return `${joinProductNames(approvedProducts)} ${pluralVerb(approvedProducts)} the homecare start for ${concernRule.concern}. ${concernRule.rationale}`
  }

  if (products.length) {
    return `${joinProductNames(products)} ${pluralVerb(products)} relevant because ${products.map((product) => product.description.toLowerCase()).join('; ')}.`
  }

  if (treatments.length) {
    return `${joinTreatmentNames(treatments)} ${pluralVerb(treatments)} relevant because ${treatments.map((treatment) => treatment.expectation).join(' ')}`
  }

  if (lastActionType === 'open_quiz') {
    return 'I suggested the quiz because the next step was unclear. It narrows the concern before choosing products or treatments.'
  }

  if (lastActionType === 'start_booking' || appState?.booking?.active) {
    return 'I moved into booking because the request was appointment-led. The chat booking flow collects treatment, clinic, slot, and contact details before sending the request.'
  }

  if (lastActionType === 'navigate') {
    return 'I suggested that page because it matched what you asked to view.'
  }

  return 'I was using the latest concern and action in the chat. Tell me which part you want me to explain and I will keep it precise.'
}

function buildProductSequenceAnswer(
  products: Product[],
  concernRules: ExpertRecommendation[],
) {
  const productNames = new Set(products.map((product) => product.name))
  const sequence = [
    'Purifying Cleanse Balm',
    'Restore Serum',
    'Brightening Complex',
    'Renewal Night Cream',
    'Eye Revival',
    'Daily Shield SPF50',
  ].flatMap((name) => products.find((product) => product.name === name) || [])
  const orderedProducts = sequence.length ? sequence : products
  const concernSummary = concernRules.length ? summarizeConcernNames(concernRules) : 'your skin context'

  if (productNames.has('Purifying Cleanse Balm')) {
    return `Start with Purifying Cleanse Balm because cleansing comes before actives and matters for ${concernSummary}. Then layer the treatment products in a simple order: ${orderedProducts.slice(1).map((product) => product.name).join(', ')}. Keep Daily Shield SPF50 as the final morning step.`
  }

  return `Start with ${orderedProducts[0]?.name || products[0]?.name} because it is the most direct first step for ${concernSummary}. Then layer ${orderedProducts.slice(1).map((product) => product.name).join(', ') || 'the remaining products'} around it based on morning or evening use.`
}

function withDefaults(decision: Omit<ConciergeDecision, 'suggestions'> & { suggestions?: ConciergeSuggestion[] }): ConciergeDecision {
  return {
    ...decision,
    suggestions: decision.suggestions?.length ? decision.suggestions : DEFAULT_SUGGESTIONS,
  }
}

function findPageIntent(text: string) {
  if (text.includes('cart') || text.includes('bag')) {
    return navAction('Open cart', '/cart')
  }

  if (text.includes('checkout')) {
    return {
      ...navAction('Open checkout', '/checkout'),
      requiresConfirmation: true,
    }
  }

  if (bookingActionIntent(text)) {
    return bookingAction()
  }

  if (text.includes('treatment') || text.includes('service')) {
    return navAction('Open treatments', '/treatments')
  }

  if (text.includes('product') || text.includes('skincare') || text.includes('shop')) {
    return navAction('Open skincare', '/skincare')
  }

  if (text.includes('about') || text.includes('location')) {
    return navAction('Open about', '/about')
  }

  return null
}

function buildProductAnswer(product: Product) {
  return `${product.name} is the Clear Skin ${product.concern.toLowerCase()} option at ${product.price}. It is best used for ${product.description.toLowerCase()}.`
}

function buildTreatmentAnswer(treatment: Treatment) {
  return `${treatment.name} is a ${treatment.category.toLowerCase()} treatment at ${treatment.price}. It suits ${treatment.idealFor.slice(0, 3).join(', ').toLowerCase()}. ${treatment.expectation}`
}

export function createConciergeDecision(
  input: string,
  messages: ConciergeChatMessage[] = [],
  appState?: ConciergeAppState,
): ConciergeDecision {
  const text = normalize(input)
  const refersToContext = hasPronounReference(text)
  const safety = reviewSafety(input)
  const directProducts = findMentionedProducts(input)
  const directTreatments = findMentionedTreatments(input)
  const directConcernRules = findConcernRules(input)
  const directConcernRule = directConcernRules[0] ?? null
  const isNavigationIntent = pageNavigationIntent(text)
  const isAddIntent = /\b(add|put|include)\b/.test(text) && /\b(cart|bag|basket)\b/.test(text)
  const isRemoveIntent = /\b(remove|delete|take out|drop)\b/.test(text) && /\b(cart|bag|basket)\b/.test(text)
  const isQuestionIntent = questionIntent(text)
  const isRecommendationIntent = recommendationIntent(text)
  const isBookingIntent = bookingActionIntent(text)
  const isBookingInfoQuestion = bookingInfoQuestionIntent(text)
  const isCartQuestion = cartQuestionIntent(text)
  const isRoutineIntent = /\b(routine|recommend|suggest|best for|what should i use|help me choose|not sure)\b/.test(text)
  const wantsProducts = productLedIntent(text)
  const wantsTreatments = treatmentLedIntent(text)
  const wantsQuiz = quizLedIntent(text)
  const canReuseContextEntities = !directProducts.length && !directTreatments.length && !directConcernRule
  const contextProducts = canReuseContextEntities && (refersToContext || isAddIntent || isRemoveIntent || isNavigationIntent || isCartQuestion || followUpRationaleIntent(text))
    ? latestContextProducts(messages)
    : []
  const contextTreatments = canReuseContextEntities && (refersToContext || isBookingIntent || isBookingInfoQuestion || isNavigationIntent || followUpRationaleIntent(text))
    ? latestContextTreatments(messages)
    : []
  const mentionedProducts = directProducts.length ? directProducts : contextProducts
  const mentionedTreatments = directTreatments.length ? directTreatments : contextTreatments
  const mentionedCartProducts = findMentionedCartProducts(input, appState)
  const contextConcernRules = !directConcernRules.length && (refersToContext || isRoutineIntent || isRecommendationIntent || wantsProducts || wantsTreatments || isCartQuestion || followUpRationaleIntent(text))
    ? uniqueConcernRules([
        ...latestContextConcernRules(messages),
        ...lastResponseConcernRules(appState),
        latestContextConcern(messages),
        lastResponseConcern(appState),
      ])
    : []
  const concernRules = directConcernRules.length ? directConcernRules : contextConcernRules
  const concernRule = concernRules[0] ?? null
  const locationId = findLocationId(text)
  const pregnancyMentioned = safety.notes.some((note) => note.includes('Pregnancy'))
  const pregnancyBlockedTreatments = mentionedTreatments.filter((treatment) => (
    ['Laser Renewal', 'Volume Treatment', 'Expression Reset', 'BioRevive'].includes(treatment.name)
  ))
  const pregnancyBlockedProducts = mentionedProducts.filter((product) => (
    ['Renewal Night Cream'].includes(product.name)
  ))

  if (safety.blocked) {
    return withDefaults({
      mode: 'clarification_needed',
      reply: `${safety.replyPrefix}Because you mentioned a possible reaction or acute skin issue, I would not recommend adding products or booking a treatment from chat. Please speak with a Clear Skin practitioner so they can review the skin properly.`,
      safetyNotes: safety.notes,
      suggestions: [
        { label: 'Book Skin Analysis', type: 'booking', prompt: 'Help me book a Skin Analysis.' },
        { label: 'Contact clinic', type: 'education', prompt: 'How can I contact the clinic?' },
      ],
    })
  }

  if (pregnancyMentioned && (pregnancyBlockedTreatments.length || pregnancyBlockedProducts.length)) {
    const saferTreatments = findTreatmentsByNames(['Skin Analysis', 'Light Therapy', 'HydraRevive', 'Clinical Facial'])
    return withDefaults({
      mode: 'clarification_needed',
      reply: `${safety.replyPrefix}${pregnancyBlockedTreatments.length
        ? `${pregnancyBlockedTreatments.map((treatment) => treatment.name).join(' and ')} is not recommended during pregnancy.`
        : `${pregnancyBlockedProducts.map((product) => product.name).join(' and ')} is not appropriate during pregnancy because it is retinol-led.`} The safer route is to speak with a practitioner and choose an adapted option such as Skin Analysis, Light Therapy, HydraRevive, or Clinical Facial.`,
      action: showTreatmentsAction(saferTreatments),
      safetyNotes: safety.notes,
      suggestions: [
        { label: 'Book Skin Analysis', type: 'booking', prompt: 'Help me book a Skin Analysis.' },
        { label: 'Pregnancy-safe options', type: 'question', prompt: 'Show pregnancy-safe skincare and treatment options.' },
        { label: 'Contact clinic', type: 'education', prompt: 'How can I contact the clinic?' },
      ],
    })
  }

  if (declineIntent(text)) {
    return withDefaults({
      mode: 'advisory_chat',
      reply: buildDeclineReply(appState),
      safetyNotes: safety.notes,
      suggestions: concernRule
        ? buildConcernSuggestions(concernRule.concern)
        : DEFAULT_SUGGESTIONS,
    })
  }

  if (wantsQuiz && !directProducts.length && !directTreatments.length) {
    const quizMode = wantsTreatments && !wantsProducts ? 'treatment' : 'product'
    return withDefaults({
      mode: 'guided_workflow',
      reply: `${safety.replyPrefix}The clearest start is the skin quiz. It will narrow the concern before I suggest products or clinic treatments.`,
      action: quizAction(quizMode),
      safetyNotes: safety.notes,
      suggestions: [
        { label: 'Book Skin Analysis', type: 'booking', prompt: 'Help me book a Skin Analysis.' },
        { label: 'Compare routes', type: 'question', prompt: 'Should I start with products or a treatment?' },
      ],
    })
  }

  if (followUpRationaleIntent(text)) {
    const rationaleProducts = uniqueProducts([
      ...stateResponseProducts(appState),
      ...mentionedProducts,
    ])
    const rationaleTreatments = uniqueTreatments([
      ...stateResponseTreatments(appState),
      ...mentionedTreatments,
    ])

    return withDefaults({
      mode: 'advisory_chat',
      reply: `${safety.replyPrefix}${sequencingIntent(text) && rationaleProducts.length
        ? buildProductSequenceAnswer(rationaleProducts, concernRules)
        : buildFollowUpRationaleAnswer({
            products: rationaleProducts,
            treatments: rationaleTreatments,
            concernRule,
            appState,
          })}`,
      action: rationaleProducts.length ? showProductsAction(rationaleProducts) : rationaleTreatments.length ? showTreatmentsAction(rationaleTreatments) : undefined,
      safetyNotes: safety.notes,
      suggestions: concernRule
        ? buildConcernSuggestions(concernRule.concern)
        : [
            { label: 'Show products', type: 'navigation', prompt: 'Show me the skincare products.' },
            { label: 'Start quiz', type: 'education', prompt: 'Open the skin quiz.' },
          ],
    })
  }

  if (isCartQuestion) {
    const cartProducts = uniqueProducts([
      ...(directProducts.length ? directProducts : []),
      ...mentionedCartProducts,
      ...(directProducts.length || mentionedCartProducts.length ? [] : stateResponseProducts(appState)),
      ...(directProducts.length || mentionedCartProducts.length ? [] : mentionedProducts),
    ])
    return withDefaults({
      mode: 'advisory_chat',
      reply: `${safety.replyPrefix}${buildCartStateAnswer(appState, cartProducts)}`,
      safetyNotes: safety.notes,
      suggestions: [
        { label: 'Open cart', type: 'navigation', prompt: 'Open my cart.' },
        { label: 'Add product', type: 'cart', prompt: 'Help me add a product to my bag.' },
      ],
    })
  }

  if (isBookingInfoQuestion) {
    return withDefaults({
      mode: 'advisory_chat',
      reply: `${safety.replyPrefix}${buildBookingInfoAnswer(mentionedTreatments[0])}`,
      safetyNotes: safety.notes,
      suggestions: [
        { label: 'Start booking', type: 'booking', prompt: mentionedTreatments[0] ? `Book ${mentionedTreatments[0].name}.` : 'Help me book a consultation.' },
        { label: 'Compare treatments', type: 'question', prompt: 'Help me compare treatments before booking.' },
      ],
    })
  }

  if (isAddIntent) {
    const products = narrowProductsByGenericReference(text, mentionedProducts.length
      ? mentionedProducts
      : concernRules.length
        ? productsForConcernRules(concernRules)
        : [])

    if (!products.length) {
      return withDefaults({
        mode: 'clarification_needed',
        reply: 'I can add items to your bag, but I need the exact product first. Which product would you like me to add?',
        safetyNotes: safety.notes,
        suggestions: PRODUCTS.slice(0, 3).map((product) => ({
          label: product.name,
          type: 'cart',
          prompt: `Add ${product.name} to my bag.`,
        })),
      })
    }

    return withDefaults({
      mode: 'direct_action',
      reply: `${safety.replyPrefix}${joinProductNames(products)} ${pluralVerb(products)} ready for your bag.`,
      action: addToCartAction(products),
      safetyNotes: safety.notes,
      suggestions: [
        { label: 'View cart', type: 'navigation', prompt: 'Open my cart.' },
        { label: 'Routine instructions', type: 'education', prompt: `How should I use ${products.map((product) => product.name).join(' and ')}?` },
      ],
    })
  }

  if (isRemoveIntent) {
    const removableProducts = mentionedProducts.length
      ? mentionedProducts
      : mentionedCartProducts.length
        ? mentionedCartProducts
        : findCartProducts(appState).length === 1 && hasPronounReference(text)
          ? findCartProducts(appState)
          : []

    if (!removableProducts.length) {
      return withDefaults({
        mode: 'clarification_needed',
        reply: 'I can remove an item from your bag, but I need the product name first. Which item should I remove?',
        safetyNotes: safety.notes,
      })
    }

    const cartIsKnown = Boolean(appState?.cart)
    const productsInCart = cartIsKnown
      ? removableProducts.filter((product) => productIsInCart(product, appState))
      : removableProducts

    if (!productsInCart.length) {
      return withDefaults({
        mode: 'advisory_chat',
        reply: `${removableProducts.map((product) => product.name).join(' and ')} is not in your bag.`,
        safetyNotes: safety.notes,
        suggestions: [
          { label: 'Open cart', type: 'navigation', prompt: 'Open my cart.' },
          { label: 'Add product', type: 'cart', prompt: `Add ${removableProducts[0].name} to my bag.` },
        ],
      })
    }

    return withDefaults({
      mode: 'direct_action',
      reply: `${joinProductNames(productsInCart)} ${pluralVerb(productsInCart)} ready to remove.`,
      action: removeFromCartAction(productsInCart),
      safetyNotes: safety.notes,
    })
  }

  if (isBookingIntent) {
    const treatment = mentionedTreatments[0]
    const bookingDestination = getCalendlyUrl().startsWith('https://') ? 'Calendly' : 'the booking flow'
    return withDefaults({
      mode: 'guided_workflow',
      reply: `${safety.replyPrefix}${treatment ? `${treatment.name}` : 'A consultation'}${locationId ? ` in ${locationId[0].toUpperCase()}${locationId.slice(1)}` : ''} can be booked through ${bookingDestination}.`,
      action: bookingAction(treatment, locationId),
      safetyNotes: safety.notes,
      suggestions: [
        { label: 'Compare treatments', type: 'question', prompt: 'Help me compare treatments before booking.' },
        { label: 'Start with Skin Analysis', type: 'booking', prompt: 'Help me book a Skin Analysis.' },
      ],
    })
  }

  if (isNavigationIntent) {
    const action = findPageIntent(text)
    if (action) {
      if (action.type === 'navigate' && isCurrentPage(action.payload.href, appState)) {
        return withDefaults({
          mode: 'advisory_chat',
          reply: `You are already on the ${pageLabelForHref(action.payload.href, appState)} page.`,
          safetyNotes: safety.notes,
        })
      }

      return withDefaults({
        mode: 'direct_action',
        reply: action.requiresConfirmation ? 'I can open that after you confirm.' : 'Opening that now.',
        action,
        safetyNotes: safety.notes,
      })
    }
  }

  if (isNavigationIntent && wantsTreatments && concernRules.length) {
    const treatments = treatmentsForConcernRules(concernRules)
    const concernSummary = summarizeConcernNames(concernRules)
    return withDefaults({
      mode: 'guided_workflow',
      reply: `${safety.replyPrefix}For ${concernSummary}, the clinic options start with ${joinTreatmentNames(treatments)}. I can show these before you decide whether to book.`,
      action: showTreatmentsAction(treatments),
      safetyNotes: safety.notes,
      suggestions: [
        { label: 'Compare treatments', type: 'question', prompt: `Compare treatment options for ${concernSummary}.` },
        { label: 'Book Skin Analysis', type: 'booking', prompt: 'Help me book a Skin Analysis.' },
      ],
    })
  }

  if (isNavigationIntent) {
    if (mentionedProducts.length) {
      const product = mentionedProducts[0]
      const href = `/skincare/${product.slug}`
      if (isCurrentPage(href, appState)) {
        return withDefaults({
          mode: 'advisory_chat',
          reply: `You are already on ${product.name}.`,
          safetyNotes: safety.notes,
        })
      }

      return withDefaults({
        mode: 'direct_action',
        reply: `I am opening ${product.name}.`,
        action: navAction(`Open ${product.name}`, href),
        safetyNotes: safety.notes,
      })
    }

    if (mentionedTreatments.length) {
      const treatment = mentionedTreatments[0]
      const href = `/treatments/${treatment.slug}`
      if (isCurrentPage(href, appState)) {
        return withDefaults({
          mode: 'advisory_chat',
          reply: `You are already on ${treatment.name}.`,
          safetyNotes: safety.notes,
        })
      }

      return withDefaults({
        mode: 'direct_action',
        reply: `I am opening ${treatment.name}.`,
        action: navAction(`Open ${treatment.name}`, href),
        safetyNotes: safety.notes,
      })
    }

  }

  if (mentionedProducts.length === 1 && !isRoutineIntent) {
    const product = mentionedProducts[0]
    return withDefaults({
      mode: 'advisory_chat',
      reply: `${safety.replyPrefix}${buildProductAnswer(product)}`,
      action: showProductsAction([product]),
      safetyNotes: safety.notes,
      suggestions: [
        { label: `View ${product.name}`, type: 'navigation', prompt: `Open ${product.name}.` },
        { label: `Add ${product.name}`, type: 'cart', prompt: `Add ${product.name} to my bag.` },
      ],
    })
  }

  if (mentionedTreatments.length === 1 && !isRoutineIntent) {
    const treatment = mentionedTreatments[0]
    return withDefaults({
      mode: 'advisory_chat',
      reply: `${safety.replyPrefix}${buildTreatmentAnswer(treatment)}`,
      action: showTreatmentsAction([treatment]),
      safetyNotes: safety.notes,
      suggestions: [
        { label: `View ${treatment.name}`, type: 'navigation', prompt: `Open ${treatment.name}.` },
        { label: `Book ${treatment.name}`, type: 'booking', prompt: `Book ${treatment.name}.` },
      ],
    })
  }

  if (concernRules.length) {
    if (isQuestionIntent && !isRecommendationIntent && !wantsProducts && !wantsTreatments) {
      return withDefaults({
        mode: 'advisory_chat',
        reply: `${safety.replyPrefix}${buildConcernQuestionAnswer(concernRule.concern)}`,
        safetyNotes: safety.notes,
        suggestions: [
          { label: 'Compare routes', type: 'question', prompt: `Compare product and treatment routes for ${concernRule.concern}.` },
          { label: 'Start quiz', type: 'education', prompt: 'Open the skin quiz.' },
        ],
      })
    }

    const products = productsForConcernRules(concernRules)
    const treatments = treatmentsForConcernRules(concernRules)
    const concernSummary = summarizeConcernNames(concernRules)
    const wantsBothRoutes = wantsProducts && wantsTreatments
    const treatmentFirst = wantsTreatments && !wantsProducts
    const action = wantsBothRoutes
      ? showProductsAction(products)
      : treatmentFirst
        ? showTreatmentsAction(treatments)
        : showProductsAction(products)
    const routeText = wantsBothRoutes
      ? `For ${concernSummary}, I would treat this as a combined plan: homecare starts with ${products.map((product) => product.name).join(', ')}. The clinic route starts with ${treatments.map((treatment) => treatment.name).join(' or ')}.`
      : treatmentFirst
      ? `For ${concernSummary}, the clinic route starts with ${treatments.map((treatment) => treatment.name).join(' or ')}.`
      : `For ${concernSummary}, I would treat this as a combined homecare plan: ${products.map((product) => product.name).join(', ')}.`
    const followUp = concernRules.length > 1
      ? 'Would you like me to turn that into a morning and evening routine?'
      : concernRule.followUpQuestion
    const reply = `${safety.replyPrefix}${routeText} ${followUp}`

    return withDefaults({
      mode: 'guided_workflow',
      reply,
      action,
      safetyNotes: safety.notes,
      suggestions: [
        ...buildConcernSuggestions(concernSummary),
        ...(treatments[0] ? [{ label: `View ${treatments[0].name}`, type: 'navigation' as const, prompt: `Open ${treatments[0].name}.` }] : []),
      ],
    })
  }

  if (text.includes('delivery') || text.includes('shipping')) {
    return withDefaults({
      mode: 'advisory_chat',
      reply: 'Standard UK delivery takes 3-5 working days and is free over £150. Express UK delivery is next working day for orders placed before 1pm. International delivery is available to the EU, UAE, USA, Canada, and Nigeria from £18.',
      suggestions: [
        { label: 'Open skincare', type: 'navigation', prompt: 'Open the skincare page.' },
        { label: 'View cart', type: 'navigation', prompt: 'Open my cart.' },
      ],
    })
  }

  if (text.includes('return') || text.includes('refund')) {
    return withDefaults({
      mode: 'advisory_chat',
      reply: 'Unopened products can be returned within 30 days of delivery. Opened products cannot be returned for hygiene reasons unless they are faulty or caused an adverse reaction, in which case the team can arrange a refund or exchange.',
      suggestions: [
        { label: 'Contact clinic', type: 'education', prompt: 'How can I contact the clinic?' },
        { label: 'Product advice', type: 'question', prompt: 'Help me choose a product before I buy.' },
      ],
    })
  }

  if (text.includes('contact') || text.includes('phone') || text.includes('email')) {
    return withDefaults({
      mode: 'advisory_chat',
      reply: 'You can reach Clear Skin at hello@clearskin.com. The clinic numbers are London +44 20 7946 0123, Dubai +971 4 123 4567, and Lagos +234 1 234 5678.',
      suggestions: [
        { label: 'Book consultation', type: 'booking', prompt: 'Help me book a consultation.' },
        { label: 'Open about', type: 'navigation', prompt: 'Open the about page.' },
      ],
    })
  }

  return withDefaults({
    mode: 'clarification_needed',
    reply: 'I can help with product guidance, treatment planning, the skin quiz, cart changes, or booking in chat. What would you like to do first?',
  })
}
