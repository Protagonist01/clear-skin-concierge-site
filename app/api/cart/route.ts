import { NextRequest, NextResponse } from 'next/server'
import {
  CART_COOKIE_KEY,
  getCartPayload,
  getProductByName,
  readCartFromCookies,
  serializeCartCookie,
  type CartCookieItem,
} from '@/lib/cart'

function buildCartResponse(items: CartCookieItem[]) {
  return NextResponse.json(getCartPayload(items))
}

function persistCart(response: NextResponse, items: CartCookieItem[]) {
  if (items.length === 0) {
    response.cookies.delete(CART_COOKIE_KEY)
    return response
  }

  response.cookies.set(CART_COOKIE_KEY, serializeCartCookie(items), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  })

  return response
}

export async function GET(req: NextRequest) {
  const items = readCartFromCookies(req.cookies)
  return buildCartResponse(items)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const requestedProducts = Array.isArray(body?.products) ? body.products : []

  const items = [...readCartFromCookies(req.cookies)]

  for (const productName of requestedProducts) {
    if (typeof productName !== 'string') continue
    const product = getProductByName(productName)
    if (!product) continue

    const existing = items.find((item) => item.slug === product.slug)
    if (existing) {
      existing.quantity += 1
      continue
    }

    items.push({ slug: product.slug, quantity: 1 })
  }

  return persistCart(buildCartResponse(items), items)
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const slug = typeof body?.slug === 'string' ? body.slug : ''
  const quantity = Number.isFinite(body?.quantity) ? Math.floor(body.quantity) : NaN

  if (!slug || !Number.isFinite(quantity)) {
    return NextResponse.json({ error: 'Invalid cart update' }, { status: 400 })
  }

  const items = [...readCartFromCookies(req.cookies)]
  const nextItems = items
    .map((item) => item.slug === slug ? { ...item, quantity } : item)
    .filter((item) => item.quantity > 0)

  return persistCart(buildCartResponse(nextItems), nextItems)
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const slug = typeof body?.slug === 'string' ? body.slug : null

  if (!slug) {
    const response = buildCartResponse([])
    response.cookies.delete(CART_COOKIE_KEY)
    return response
  }

  const items = readCartFromCookies(req.cookies).filter((item) => item.slug !== slug)
  return persistCart(buildCartResponse(items), items)
}
