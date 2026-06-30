import 'server-only'

import type { BookingRecord } from '@/lib/account-store'

function isBookingState(value: unknown): value is BookingRecord['status'] {
  return value === 'requested' || value === 'confirmed' || value === 'completed'
}

export interface ClinicScheduleSyncResult {
  mode: 'local' | 'webhook'
  bookingStatus: BookingRecord['status']
  scheduleStatus: BookingRecord['scheduleStatus']
  externalReference?: string
  message: string
}

export async function syncBookingToClinicSchedule(
  booking: BookingRecord,
): Promise<ClinicScheduleSyncResult> {
  const webhookUrl = process.env.CLEAR_SKIN_SCHEDULING_WEBHOOK_URL?.trim()

  if (!webhookUrl) {
    return {
      mode: 'local',
      bookingStatus: 'requested',
      scheduleStatus: 'requested',
      message:
        'Booking saved in My Account. Add CLEAR_SKIN_SCHEDULING_WEBHOOK_URL to forward requests into your clinic scheduler automatically.',
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  const apiKey = process.env.CLEAR_SKIN_SCHEDULING_API_KEY?.trim()
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      source: 'clear-skin-site',
      submittedAt: new Date().toISOString(),
      booking,
    }),
    cache: 'no-store',
  })

  let payload: Record<string, unknown> | null = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok) {
    throw new Error(
      typeof payload?.error === 'string' && payload.error.trim()
        ? payload.error
        : 'The clinic scheduling backend did not accept the booking request.',
    )
  }

  const bookingStatus = isBookingState(payload?.status) ? payload.status : 'confirmed'
  const scheduleStatus = isBookingState(payload?.scheduleStatus)
    ? payload.scheduleStatus
    : bookingStatus

  return {
    mode: 'webhook',
    bookingStatus,
    scheduleStatus,
    externalReference:
      typeof payload?.externalReference === 'string' && payload.externalReference.trim()
        ? payload.externalReference
        : undefined,
    message:
      typeof payload?.message === 'string' && payload.message.trim()
        ? payload.message
        : 'Booking request forwarded to the clinic scheduling backend.',
  }
}
