import { NextRequest, NextResponse } from 'next/server'
import {
  getAuthenticatedCustomer,
  insertReviewRecord,
  listReviewsForItem,
} from '@/lib/account-store'

function isNonEmptyString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
}

export async function GET(req: NextRequest) {
  const itemName = req.nextUrl.searchParams.get('itemName')?.trim()
  const reviews = itemName ? listReviewsForItem(itemName) : []

  return NextResponse.json({
    reviews,
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const itemName = typeof body?.itemName === 'string' ? body.itemName.trim() : ''
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  const location = typeof body?.location === 'string' ? body.location.trim() : ''
  const reviewBody = typeof body?.body === 'string' ? body.body.trim() : ''
  const rawRating = Number(body?.rating)
  const rating = Number.isFinite(rawRating) ? Math.round(rawRating) : 0

  if (!isNonEmptyString(itemName) || !isNonEmptyString(name) || !isNonEmptyString(location) || !isNonEmptyString(reviewBody)) {
    return NextResponse.json(
      { success: false, error: 'Please complete every review field.' },
      { status: 400 },
    )
  }

  if (reviewBody.length < 24) {
    return NextResponse.json(
      { success: false, error: 'Please add a little more detail before submitting the review.' },
      { status: 400 },
    )
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json(
      { success: false, error: 'Please select a rating between 1 and 5.' },
      { status: 400 },
    )
  }

  const customer = getAuthenticatedCustomer(req.cookies)
  const review = insertReviewRecord({
    itemName,
    name,
    location,
    rating,
    body: reviewBody,
    customerId: customer?.id || null,
    verified: Boolean(customer),
  })

  return NextResponse.json({
    success: true,
    review,
  })
}
