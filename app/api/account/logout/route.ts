import { NextRequest, NextResponse } from 'next/server'
import { ACCOUNT_SESSION_COOKIE_KEY, clearSessionByToken } from '@/lib/account-store'

export async function POST(req: NextRequest) {
  const token = req.cookies.get(ACCOUNT_SESSION_COOKIE_KEY)?.value
  if (token) {
    clearSessionByToken(token)
  }

  const response = NextResponse.json({ success: true })
  response.cookies.delete(ACCOUNT_SESSION_COOKIE_KEY)
  return response
}
