import { NextRequest, NextResponse } from 'next/server'
import {
  ACCOUNT_SESSION_COOKIE_KEY,
  ACCOUNT_SESSION_MAX_AGE,
} from '@/lib/account-store'
import { syncBookingToClinicSchedule } from '@/lib/clinic-scheduler'
import { createScheduledBookingRequest, updateScheduledBookingState } from '@/lib/schedule-store'
import {
  BOOKING_HISTORY_COOKIE_KEY,
  ORDER_HISTORY_COOKIE_KEY,
} from '@/lib/customer-records'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isNonEmptyString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
}

export async function GET(req: NextRequest) {
  const hasHistory = Boolean(req.cookies.get(ACCOUNT_SESSION_COOKIE_KEY)?.value)
  return NextResponse.json({ hasHistory })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const treatmentSlug = typeof body?.treatmentSlug === 'string' ? body.treatmentSlug : ''
  const locationId = typeof body?.locationId === 'string' ? body.locationId : ''
  const appointmentDate = typeof body?.appointmentDate === 'string' ? body.appointmentDate : ''
  const appointmentTime = typeof body?.appointmentTime === 'string' ? body.appointmentTime : ''
  const details = body?.details && typeof body.details === 'object' ? body.details as Record<string, unknown> : {}

  if (!treatmentSlug || !locationId || !appointmentDate || !appointmentTime) {
    return NextResponse.json(
      { success: false, error: 'Please complete the treatment, location, and appointment time.' },
      { status: 400 },
    )
  }

  if (!isNonEmptyString(details.name) || !isNonEmptyString(details.email) || !isNonEmptyString(details.phone)) {
    return NextResponse.json(
      { success: false, error: 'Please complete your contact details before requesting the appointment.' },
      { status: 400 },
    )
  }

  const guestName = String(details.name).trim()
  const guestEmail = String(details.email).trim()
  const guestPhone = String(details.phone).trim()

  if (!EMAIL_RE.test(guestEmail)) {
    return NextResponse.json(
      { success: false, error: 'Please enter a valid email address.' },
      { status: 400 },
    )
  }

  try {
    const { booking: createdBooking, sessionToken } = createScheduledBookingRequest({
      treatmentSlug,
      locationId,
      appointmentDate,
      appointmentTime,
      guestName,
      email: guestEmail,
      phone: guestPhone,
      concern: typeof details.concern === 'string' && details.concern.trim() ? details.concern.trim() : undefined,
      notes: typeof details.notes === 'string' && details.notes.trim() ? details.notes.trim() : undefined,
    })

    let booking = createdBooking
    let syncMessage = 'Booking saved in My Account.'

    try {
      const sync = await syncBookingToClinicSchedule(createdBooking)
      syncMessage = sync.message

      if (
        sync.bookingStatus !== createdBooking.status
        || sync.scheduleStatus !== createdBooking.scheduleStatus
      ) {
        booking = updateScheduledBookingState({
          bookingId: createdBooking.id,
          status: sync.bookingStatus,
          scheduleStatus: sync.scheduleStatus,
        }) || createdBooking
      }
    } catch (syncError) {
      syncMessage = syncError instanceof Error
        ? `${syncError.message} The request is still saved in My Account.`
        : 'The clinic sync could not be completed, but the request is still saved in My Account.'
    }

    const response = NextResponse.json({
      success: true,
      booking,
      syncMessage,
    })

    response.cookies.set(ACCOUNT_SESSION_COOKIE_KEY, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: ACCOUNT_SESSION_MAX_AGE,
    })
    response.cookies.delete(BOOKING_HISTORY_COOKIE_KEY)
    response.cookies.delete(ORDER_HISTORY_COOKIE_KEY)

    return response
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unable to request the appointment.' },
      { status: 400 },
    )
  }
}
