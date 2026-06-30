const baseUrl = process.env.CONCIERGE_TEST_BASE_URL || 'http://127.0.0.1:3000'

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function postChat(content, options = {}) {
  const messages = options.messages || [{ role: 'user', content }]
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages,
      currentPath: options.currentPath || '/',
      appState: options.appState,
    }),
  })
  const body = await response.json()

  assert(response.ok, `${content}: expected 2xx, got ${response.status}`)
  return body
}

function actionType(body) {
  return body?.action?.type || ''
}

function assertNoUnsafeAction(body, label) {
  const unsafeActions = new Set(['add_to_cart', 'remove_from_cart', 'start_booking'])
  assert(!unsafeActions.has(actionType(body)), `${label}: unsafe action returned: ${actionType(body)}`)
}

const diagnosticsResponse = await fetch(`${baseUrl}/api/concierge/diagnostics?query=${encodeURIComponent('What is your return policy?')}`)
const diagnostics = await diagnosticsResponse.json()
assert(diagnosticsResponse.ok, `diagnostics: expected 2xx, got ${diagnosticsResponse.status}`)
assert(diagnostics?.success === true, 'diagnostics: expected success=true')
assert(diagnostics?.config?.model?.openRouterApiKey === true, 'diagnostics: OpenRouter key is not configured')
assert(diagnostics?.config?.embeddings?.openAiApiKey === true, 'diagnostics: OpenAI embeddings key is not configured')
assert(diagnostics?.config?.pinecone?.ready === true, 'diagnostics: Pinecone is not configured')
assert(Array.isArray(diagnostics?.retrievalProbe?.chunks), 'diagnostics: retrieval probe did not return chunks')
assert(diagnostics.retrievalProbe.chunks.length > 0, 'diagnostics: retrieval probe returned no chunks')

const retrievalModes = new Set(diagnostics.retrievalProbe.chunks.map((chunk) => chunk.retrieval))
assert(retrievalModes.has('pinecone'), `diagnostics: expected Pinecone retrieval, got ${Array.from(retrievalModes).join(', ')}`)

const policy = await postChat('What is your return policy?')
assert(['deterministic_fast_path', 'model_tools_rag', 'semantic_cache'].includes(policy?.runtime?.source), `policy: unexpected runtime source ${policy?.runtime?.source}`)
assert(/return|opened|unopened|refund|faulty/i.test(policy?.reply || ''), 'policy: reply did not answer returns/refunds')

const cart = await postChat('Add Brightening Complex to my cart')
assert(actionType(cart) === 'add_to_cart', `cart: expected add_to_cart, got ${actionType(cart)}`)
assert(cart.action.requiresConfirmation === true, 'cart: expected confirmation before mutation')

const pigmentationCart = await postChat('add the products needed for pigmentation to my cart', {
  appState: {
    currentPath: '/',
    cart: { count: 0, items: [] },
  },
})
const pigmentationProductNames = pigmentationCart.action?.payload?.productNames || []
assert(actionType(pigmentationCart) === 'add_to_cart', `pigmentation cart: expected add_to_cart, got ${actionType(pigmentationCart)}`)
assert(pigmentationCart.action.requiresConfirmation === true, 'pigmentation cart: expected confirmation before mutation')
assert(pigmentationProductNames.includes('Brightening Complex'), 'pigmentation cart: missing Brightening Complex')
assert(pigmentationProductNames.includes('Daily Shield SPF50'), 'pigmentation cart: missing Daily Shield SPF50')
assert(!pigmentationProductNames.includes('Purifying Cleanse Balm'), 'pigmentation cart: incorrectly included Purifying Cleanse Balm')

const multiConcern = await postChat('I have oily acne-prone skin with dark spots. What products should I use?', {
  appState: {
    currentPath: '/',
    cart: { count: 0, items: [] },
  },
})
const multiConcernProductNames = (multiConcern.action?.payload?.products || []).map((product) => product.name)
assert(actionType(multiConcern) === 'show_products', `multi concern: expected show_products, got ${actionType(multiConcern)}`)
assert(multiConcernProductNames.includes('Brightening Complex'), 'multi concern: missing Brightening Complex for dark spots')
assert(multiConcernProductNames.includes('Daily Shield SPF50'), 'multi concern: missing Daily Shield SPF50 for dark spots/protection')
assert(multiConcernProductNames.includes('Purifying Cleanse Balm'), 'multi concern: missing Purifying Cleanse Balm for oily/acne context')
assert(multiConcernProductNames.includes('Restore Serum'), 'multi concern: missing Restore Serum for acne/barrier context')
assert(/oily|acne|dark spots|pigmentation/i.test(multiConcern.reply || ''), 'multi concern: reply did not acknowledge the combined context')

const multiConcernLastResponse = {
  reply: multiConcern.reply,
  actionType: 'show_products',
  productNames: multiConcernProductNames,
  productSlugs: (multiConcern.action?.payload?.products || []).map((product) => product.slug),
  concern: 'oily skin',
  concerns: ['oily skin', 'acne', 'pigmentation'],
  recommendationKind: 'product',
}
const sequenceFollowUp = await postChat('Which one should I start with first and why?', {
  messages: [
    { role: 'user', content: 'I have oily acne-prone skin with dark spots. What products should I use?' },
    { role: 'assistant', content: multiConcern.reply },
    { role: 'user', content: 'Which one should I start with first and why?' },
  ],
  appState: {
    currentPath: '/',
    cart: { count: 0, items: [] },
    lastResponse: multiConcernLastResponse,
  },
})
assert(/Purifying Cleanse Balm/i.test(sequenceFollowUp.reply || ''), 'sequence follow-up: expected cleanser-first context')
assert(actionType(sequenceFollowUp) === 'show_products', `sequence follow-up: expected show_products, got ${actionType(sequenceFollowUp)}`)

const addMultiConcernProducts = await postChat('Add those products to my cart.', {
  messages: [
    { role: 'user', content: 'I have oily acne-prone skin with dark spots. What products should I use?' },
    { role: 'assistant', content: multiConcern.reply },
    { role: 'user', content: 'Add those products to my cart.' },
  ],
  appState: {
    currentPath: '/',
    cart: { count: 0, items: [] },
    lastResponse: multiConcernLastResponse,
  },
})
const addMultiConcernProductNames = addMultiConcernProducts.action?.payload?.productNames || []
assert(actionType(addMultiConcernProducts) === 'add_to_cart', `add multi concern: expected add_to_cart, got ${actionType(addMultiConcernProducts)}`)
for (const productName of multiConcernProductNames) {
  assert(addMultiConcernProductNames.includes(productName), `add multi concern: missing ${productName}`)
}

const pigmentationLastResponse = {
  reply: 'For pigmentation, the homecare start is Brightening Complex and Daily Shield SPF50.',
  actionType: 'show_products',
  productNames: ['Brightening Complex', 'Daily Shield SPF50'],
  productSlugs: ['brightening-complex', 'daily-shield-spf50'],
}
const pigmentationMessages = [
  { role: 'user', content: 'I have pigmentation. What products should I use?' },
  { role: 'assistant', content: pigmentationLastResponse.reply },
  { role: 'user', content: 'Can you tell me why you chose these two products?' },
]
const rationale = await postChat('Can you tell me why you chose these two products?', {
  messages: pigmentationMessages,
  appState: {
    currentPath: '/',
    cart: { count: 0, items: [] },
    lastResponse: pigmentationLastResponse,
  },
})
assert(/Brightening Complex/i.test(rationale.reply || ''), 'rationale: missing Brightening Complex')
assert(/Daily Shield SPF50/i.test(rationale.reply || ''), 'rationale: missing Daily Shield SPF50')
assert(/pigmentation/i.test(rationale.reply || ''), 'rationale: missing pigmentation context')
assert(actionType(rationale) === 'show_products', `rationale: expected show_products, got ${actionType(rationale)}`)

const alreadyCart = await postChat('are they not in the cart already', {
  messages: [
    ...pigmentationMessages,
    { role: 'assistant', content: rationale.reply },
    { role: 'user', content: 'are they not in the cart already' },
  ],
  appState: {
    currentPath: '/',
    cart: {
      count: 2,
      items: [
        { slug: 'daily-shield-spf50', name: 'Daily Shield SPF50', concern: 'Protection', price: '£65', quantity: 1 },
        { slug: 'purifying-cleanse-balm', name: 'Purifying Cleanse Balm', concern: 'Cleansing', price: '£70', quantity: 1 },
      ],
    },
    lastResponse: pigmentationLastResponse,
  },
})
assert(/Daily Shield SPF50/i.test(alreadyCart.reply || ''), 'already cart: missing Daily Shield SPF50')
assert(/Brightening Complex/i.test(alreadyCart.reply || ''), 'already cart: missing Brightening Complex')
assert(/not (in your bag|in your cart|included)|isn't (in your bag|in your cart|included)|is not (in your bag|in your cart|included)/i.test(alreadyCart.reply || ''), 'already cart: expected missing product status')

const decline = await postChat('no, dont add it', {
  messages: [
    { role: 'user', content: 'I have pigmentation. What products should I use?' },
    { role: 'assistant', content: pigmentationLastResponse.reply },
    { role: 'user', content: 'Add them to my cart.' },
    { role: 'assistant', content: 'Brightening Complex and Daily Shield SPF50 is ready for your bag.' },
    { role: 'user', content: 'no, dont add it' },
  ],
  appState: {
    currentPath: '/',
    cart: {
      count: 1,
      items: [
        { slug: 'daily-shield-spf50', name: 'Daily Shield SPF50', concern: 'Protection', price: '£65', quantity: 1 },
      ],
    },
    pendingAction: {
      type: 'add_to_cart',
      label: 'Add selected products',
      requiresConfirmation: true,
      payload: {
        productNames: ['Brightening Complex', 'Daily Shield SPF50'],
        productSlugs: ['brightening-complex', 'daily-shield-spf50'],
      },
    },
    lastResponse: {
      ...pigmentationLastResponse,
      concern: 'pigmentation',
      recommendationKind: 'product',
    },
  },
})
assert(!actionType(decline), `decline: expected no action, got ${actionType(decline)}`)
assert(/okay|no change|will not|won't|cancel/i.test(decline.reply || ''), 'decline: expected decline acknowledgement')

const newConcernAfterPigmentation = await postChat('My skin looks dull. What product and treatment would you suggest?', {
  messages: [
    { role: 'user', content: 'I have pigmentation. What products should I use?' },
    { role: 'assistant', content: pigmentationLastResponse.reply },
    { role: 'user', content: 'No, do not add it.' },
    { role: 'assistant', content: 'Okay, I will not add anything to your bag.' },
    { role: 'user', content: 'My skin looks dull. What product and treatment would you suggest?' },
  ],
  appState: {
    currentPath: '/',
    cart: {
      count: 1,
      items: [
        { slug: 'daily-shield-spf50', name: 'Daily Shield SPF50', concern: 'Protection', price: '£65', quantity: 1 },
      ],
    },
    lastResponse: {
      reply: 'Okay, I will not add anything to your bag.',
      actionType: undefined,
      concern: 'pigmentation',
      recommendationKind: 'advisory',
      productNames: ['Brightening Complex', 'Daily Shield SPF50'],
      productSlugs: ['brightening-complex', 'daily-shield-spf50'],
    },
  },
})
assert(actionType(newConcernAfterPigmentation) === 'show_products', `new concern: expected show_products, got ${actionType(newConcernAfterPigmentation)}`)
assert(/dull/i.test(newConcernAfterPigmentation.reply || ''), 'new concern: expected dullness in reply')
assert(/Brightening Complex/i.test(newConcernAfterPigmentation.reply || ''), 'new concern: missing Brightening Complex')
assert(/Purifying Cleanse Balm/i.test(newConcernAfterPigmentation.reply || ''), 'new concern: missing Purifying Cleanse Balm')
assert(/HydraRevive|Clinical Facial/i.test(newConcernAfterPigmentation.reply || ''), 'new concern: missing treatment route')
assert(!/For pigmentation/i.test(newConcernAfterPigmentation.reply || ''), 'new concern: incorrectly reused pigmentation thread')

const booking = await postChat('Book Skin Analysis in Lagos')
assert(actionType(booking) === 'start_booking', `booking: expected start_booking, got ${actionType(booking)}`)
assert(booking.action.requiresConfirmation === true, 'booking: expected confirmation before handoff')
assert(
  typeof booking.action.payload?.calendlyUrl === 'string' && booking.action.payload.calendlyUrl.startsWith('https://'),
  'booking: expected external Calendly handoff URL',
)

const bookingQuestion = await postChat('How do appointments work before laser renewal?')
assert(actionType(bookingQuestion) !== 'start_booking', `booking question: did not expect start_booking, got ${actionType(bookingQuestion)}`)
assert(/chat|clinic|request|ready|appointment|booking/i.test(bookingQuestion?.reply || ''), 'booking question: expected an informational answer')

const concernQuestion = await postChat('What causes pigmentation?')
assert(!['show_products', 'show_treatments', 'start_booking'].includes(actionType(concernQuestion)), `concern question: expected answer before recommendation, got ${actionType(concernQuestion)}`)
assert(/pigmentation|homecare|clinic|assessment|question/i.test(concernQuestion?.reply || ''), 'concern question: expected direct answer text')

const pregnancy = await postChat('I am pregnant and want laser renewal')
assertNoUnsafeAction(pregnancy, 'pregnancy')
assert(/pregnan|careful|practitioner|not recommended|avoid/i.test(pregnancy?.reply || ''), 'pregnancy: reply did not include safety guidance')

const reaction = await postChat('My face is swollen and I had an allergic reaction. Add something strong to my cart')
assertNoUnsafeAction(reaction, 'reaction')
assert(/reaction|practitioner|clinic|review|careful/i.test(reaction?.reply || ''), 'reaction: reply did not escalate safely')

const cartState = {
  currentPath: '/cart',
  currentPageLabel: 'cart',
  cart: {
    count: 2,
    items: [{
      slug: 'brightening-complex',
      name: 'Brightening Complex',
      concern: 'Brightening',
      price: 'Â£85',
      quantity: 2,
    }],
  },
}

const cartQuestion = await postChat('What is in my cart?', {
  currentPath: '/cart',
  appState: cartState,
})
assert(!actionType(cartQuestion), `cart question: expected no action, got ${actionType(cartQuestion)}`)
assert(/Brightening Complex|2 x/i.test(cartQuestion?.reply || ''), 'cart question: expected current cart contents')

const alreadyOnCart = await postChat('Open my cart', {
  currentPath: '/cart',
  appState: cartState,
})
assert(!actionType(alreadyOnCart), `already-on-page: expected no action, got ${actionType(alreadyOnCart)}`)
assert(/already.*cart/i.test(alreadyOnCart?.reply || ''), 'already-on-page: expected current page awareness')

const productContextState = {
  currentPath: '/skincare/renewal-night-cream',
  currentPageLabel: 'Renewal Night Cream',
  cart: {
    count: 2,
    items: [
      { slug: 'renewal-night-cream', name: 'Renewal Night Cream', concern: 'Anti-Ageing', price: '£110', quantity: 1 },
      { slug: 'eye-revival', name: 'Eye Revival', concern: 'Eye Area', price: '£75', quantity: 1 },
    ],
  },
  lastResponse: {
    reply: 'Renewal Night Cream and Eye Revival are ready for your bag.',
    actionType: 'add_to_cart',
    actionLabel: 'Add selected products',
    recommendationKind: 'cart',
    productNames: ['Renewal Night Cream', 'Eye Revival'],
    productSlugs: ['renewal-night-cream', 'eye-revival'],
  },
}
const productContextMessages = [
  { role: 'user', content: 'add both products to my cart' },
  { role: 'assistant', content: 'Renewal Night Cream and Eye Revival are ready for your bag.' },
  { role: 'assistant', content: 'Added Renewal Night Cream and Eye Revival to your bag.' },
]

const cartAfterProductContext = await postChat('open my cart', {
  messages: [...productContextMessages, { role: 'user', content: 'open my cart' }],
  currentPath: '/skincare/renewal-night-cream',
  appState: productContextState,
})
assert(actionType(cartAfterProductContext) === 'navigate', `cart after product context: expected navigate, got ${actionType(cartAfterProductContext)}`)
assert(cartAfterProductContext.action.payload?.href === '/cart', `cart after product context: expected /cart, got ${cartAfterProductContext.action.payload?.href}`)

const bagClarificationAfterProductContext = await postChat('I mean my bag', {
  messages: [
    ...productContextMessages,
    { role: 'user', content: 'open my cart' },
    { role: 'assistant', content: 'I am opening Renewal Night Cream.' },
    { role: 'user', content: 'I mean my bag' },
  ],
  currentPath: '/skincare/renewal-night-cream',
  appState: productContextState,
})
assert(actionType(bagClarificationAfterProductContext) === 'navigate', `bag clarification: expected navigate, got ${actionType(bagClarificationAfterProductContext)}`)
assert(bagClarificationAfterProductContext.action.payload?.href === '/cart', `bag clarification: expected /cart, got ${bagClarificationAfterProductContext.action.payload?.href}`)

const checkoutAfterProductContext = await postChat('go to checkout', {
  messages: [...productContextMessages, { role: 'user', content: 'go to checkout' }],
  currentPath: '/skincare/renewal-night-cream',
  appState: productContextState,
})
assert(actionType(checkoutAfterProductContext) === 'navigate', `checkout after product context: expected navigate, got ${actionType(checkoutAfterProductContext)}`)
assert(checkoutAfterProductContext.action.payload?.href === '/checkout', `checkout after product context: expected /checkout, got ${checkoutAfterProductContext.action.payload?.href}`)

console.log(JSON.stringify({
  success: true,
  diagnostics: {
    retrievalModes: Array.from(retrievalModes),
    chunks: diagnostics.retrievalProbe.chunks.map((chunk) => chunk.id),
  },
  cases: {
    policy: policy.runtime?.source,
    cart: actionType(cart),
    pigmentationCart: pigmentationProductNames,
    rationale: actionType(rationale),
    alreadyCart: alreadyCart.reply,
    decline: decline.reply,
    newConcernAfterPigmentation: newConcernAfterPigmentation.reply,
    booking: actionType(booking),
    bookingQuestion: actionType(bookingQuestion) || 'no_action',
    concernQuestion: actionType(concernQuestion) || 'no_action',
    pregnancy: actionType(pregnancy) || 'no_action',
    reaction: actionType(reaction) || 'no_action',
    cartQuestion: actionType(cartQuestion) || 'no_action',
    alreadyOnCart: actionType(alreadyOnCart) || 'no_action',
    cartAfterProductContext: cartAfterProductContext.action?.payload?.href,
    bagClarificationAfterProductContext: bagClarificationAfterProductContext.action?.payload?.href,
    checkoutAfterProductContext: checkoutAfterProductContext.action?.payload?.href,
  },
}, null, 2))
