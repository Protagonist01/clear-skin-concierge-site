import { NextRequest, NextResponse } from 'next/server'
import {
  ACCOUNT_SESSION_COOKIE_KEY,
  ACCOUNT_SESSION_MAX_AGE,
  createSessionForCustomer,
  verifyEmailLoginChallenge,
} from '@/lib/account-store'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const email = typeof body?.email === 'string' ? body.email : ''
  const code = typeof body?.code === 'string' ? body.code : ''

  const customer = verifyEmailLoginChallenge(email, code)
  if (!customer) {
    return NextResponse.json(
      { success: false, error: 'That code is invalid or has expired.' },
      { status: 400 },
    )
  }

  const session = createSessionForCustomer(customer.id)
  const response = NextResponse.json({ success: true })

  response.cookies.set(ACCOUNT_SESSION_COOKIE_KEY, session.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ACCOUNT_SESSION_MAX_AGE,
  })

  return response
}
