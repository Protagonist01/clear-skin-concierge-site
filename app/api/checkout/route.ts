import { NextRequest, NextResponse } from 'next/server'
import { CART_COOKIE_KEY, getCartPayload, parsePriceToNumber, readCartFromCookies } from '@/lib/cart'
import {
  ACCOUNT_SESSION_COOKIE_KEY,
  ACCOUNT_SESSION_MAX_AGE,
  createSessionForCustomer,
  insertOrderRecord,
  upsertCustomer,
} from '@/lib/account-store'
import {
  BOOKING_HISTORY_COOKIE_KEY,
  ORDER_HISTORY_COOKIE_KEY,
  buildOrderNumber,
} from '@/lib/customer-records'

function buildMockPaymentProfile(profile: string | undefined) {
  switch (profile) {
    case 'visa-4242':
      return {
        paymentMethod: 'Visa ending 4242',
        paymentReference: `pay_mock_vs_${crypto.randomUUID().slice(0, 8)}`,
      }
    case 'mastercard-4444':
      return {
        paymentMethod: 'Mastercard ending 4444',
        paymentReference: `pay_mock_mc_${crypto.randomUUID().slice(0, 8)}`,
      }
    case 'amex-0005':
      return {
        paymentMethod: 'Amex ending 0005',
        paymentReference: `pay_mock_ax_${crypto.randomUUID().slice(0, 8)}`,
      }
    default:
      return {
        paymentMethod: 'Visa ending 4242',
        paymentReference: `pay_mock_vs_${crypto.randomUUID().slice(0, 8)}`,
      }
  }
}

export async function POST(req: NextRequest) {
  const items = readCartFromCookies(req.cookies)
  const cart = getCartPayload(items)

  if (cart.items.length === 0) {
    return NextResponse.json({ error: 'Your cart is empty.' }, { status: 400 })
  }

  const body = await req.json()

  const requiredFields = ['firstName', 'lastName', 'email', 'addressLine1', 'city']
  const missingField = requiredFields.find((field) => !String(body?.[field] ?? '').trim())

  if (missingField) {
    return NextResponse.json({ error: 'Please complete all required checkout fields.' }, { status: 400 })
  }

  const orderNumber = buildOrderNumber()
  const customerName = `${String(body.firstName).trim()} ${String(body.lastName).trim()}`.trim()
  const email = String(body.email).trim().toLowerCase()
  const payment = buildMockPaymentProfile(typeof body?.paymentProfile === 'string' ? body.paymentProfile : undefined)
  const customer = upsertCustomer({
    email,
    fullName: customerName,
    phone: String(body.phone || '').trim(),
  })
  const order = insertOrderRecord({
    id: crypto.randomUUID(),
    customerId: customer.id,
    orderNumber,
    status: 'processing',
    paymentStatus: 'authorized',
    paymentReference: payment.paymentReference,
    paymentMethod: payment.paymentMethod,
    customerName,
    email,
    city: String(body.city).trim(),
    addressLine1: String(body.addressLine1 || '').trim(),
    addressLine2: String(body.addressLine2 || '').trim(),
    phone: String(body.phone || '').trim(),
    notes: String(body.notes || '').trim(),
    itemCount: cart.count,
    subtotal: cart.subtotal,
    items: cart.items.map((item) => ({
      slug: item.slug,
      name: item.name,
      quantity: item.quantity,
      lineTotal: parsePriceToNumber(item.price) * item.quantity,
    })),
  })
  const session = createSessionForCustomer(customer.id)

  const response = NextResponse.json({
    success: true,
    orderNumber,
    itemCount: cart.count,
    subtotal: cart.subtotal,
    order,
  })

  response.cookies.set(ACCOUNT_SESSION_COOKIE_KEY, session.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ACCOUNT_SESSION_MAX_AGE,
  })
  response.cookies.delete(ORDER_HISTORY_COOKIE_KEY)
  response.cookies.delete(BOOKING_HISTORY_COOKIE_KEY)
  response.cookies.delete(CART_COOKIE_KEY)
  return response
}
