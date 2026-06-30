import { PRODUCTS } from '../data/products'

export const CART_COOKIE_KEY = 'clear-skin-cart'

export interface CartCookieItem {
  slug: string
  quantity: number
}

export interface BagItem {
  slug: string
  name: string
  concern: string
  price: string
  description: string
  image?: string
  quantity: number
}

export interface CartPayload {
  items: BagItem[]
  count: number
  subtotal: number
}

export function parsePriceToNumber(price: string) {
  const normalized = price.replace(/[^0-9.]/g, '')
  return Number.parseFloat(normalized || '0')
}

export function formatCurrency(amount: number) {
  return `£${amount.toFixed(0)}`
}

export function getProductBySlug(slug: string) {
  return PRODUCTS.find((product) => product.slug === slug)
}

export function getProductByName(name: string) {
  return PRODUCTS.find((product) => product.name === name)
}

export function readCartCookieValue(value: string | undefined) {
  if (!value) return [] as CartCookieItem[]

  try {
    const parsed = JSON.parse(value)
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter(
        (item): item is CartCookieItem =>
          Boolean(item) &&
          typeof item === 'object' &&
          typeof item.slug === 'string' &&
          Number.isFinite(item.quantity) &&
          item.quantity > 0
      )
      .map((item) => ({ slug: item.slug, quantity: Math.max(1, Math.floor(item.quantity)) }))
  } catch {
    return []
  }
}

export function readCartFromCookies(cookies: { get: (name: string) => { value: string } | undefined }) {
  return readCartCookieValue(cookies.get(CART_COOKIE_KEY)?.value)
}

export function serializeCartCookie(items: CartCookieItem[]) {
  return JSON.stringify(items)
}

export function buildBagItems(entries: CartCookieItem[]) {
  return entries.flatMap((entry) => {
    const product = getProductBySlug(entry.slug)
    if (!product) return []

    return [{
      slug: product.slug,
      name: product.name,
      concern: product.concern,
      price: product.price,
      description: product.description,
      image: product.image,
      quantity: entry.quantity,
    }]
  })
}

export function getCartPayload(entries: CartCookieItem[]): CartPayload {
  const items = buildBagItems(entries)
  const count = items.reduce((total, item) => total + item.quantity, 0)
  const subtotal = items.reduce((total, item) => total + parsePriceToNumber(item.price) * item.quantity, 0)

  return { items, count, subtotal }
}
