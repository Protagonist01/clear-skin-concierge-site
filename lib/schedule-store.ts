import 'server-only'

import { buildAvailableDates, buildTimeSlots, type AvailableDate, type TimeSlotOption, CLINIC_LOCATIONS, getLocationById } from '@/lib/booking'
import {
  upsertCustomer,
  createSessionForCustomer,
  getBookingById,
  insertBookingRecord,
  type BookingRecord,
  updateBookingScheduleState,
} from '@/lib/account-store'
import { buildBookingReference } from '@/lib/customer-records'
import { getDb } from '@/lib/db'
import { TREATMENTS } from '@/data/treatments'

function createId() {
  return crypto.randomUUID()
}

function todayDateString() {
  return new Date().toISOString().slice(0, 10)
}

function formatScheduleDate(value: string): AvailableDate {
  const date = new Date(`${value}T12:00:00`)
  return {
    date: value,
    day: date.toLocaleDateString('en-GB', { weekday: 'short' }),
    label: String(date.getDate()),
    month: date.toLocaleDateString('en-GB', { month: 'short' }),
    availableCount: 0,
  }
}

interface ScheduleSlotRow {
  id: string
  appointment_time: string
  status: string
}

export function ensureScheduleSeeded() {
  const db = getDb()
  const now = new Date().toISOString()
  const insertSlot = db.prepare(`
    INSERT OR IGNORE INTO schedule_slots (
      id, location_id, appointment_date, appointment_time, status, booking_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  for (const location of CLINIC_LOCATIONS) {
    const dates = buildAvailableDates(location.id, 45)

    for (const date of dates) {
      const slots = buildTimeSlots({
        locationId: location.id,
        treatmentSlug: 'schedule-seed',
        dateStr: date.date,
      })

      for (const slot of slots) {
        insertSlot.run(
          createId(),
          location.id,
          date.date,
          slot.time,
          slot.status === 'booked' ? 'booked' : 'available',
          null,
          now,
          now,
        )
      }
    }
  }
}

export function listScheduleAvailability(input: {
  locationId: string
  selectedDate?: string
}) {
  ensureScheduleSeeded()

  const db = getDb()
  const dateRows = db.prepare(`
    SELECT appointment_date, SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available_count
    FROM schedule_slots
    WHERE location_id = ?
      AND appointment_date >= ?
    GROUP BY appointment_date
    HAVING available_count > 0
    ORDER BY appointment_date ASC
    LIMIT 14
  `).all(input.locationId, todayDateString()) as Array<{ appointment_date: string, available_count: number }>

  const dates = dateRows.map((row) => ({
    ...formatScheduleDate(String(row.appointment_date)),
    availableCount: Number(row.available_count),
  }))

  const effectiveDate = input.selectedDate && dates.some((date) => date.date === input.selectedDate)
    ? input.selectedDate
    : dates[0]?.date

  const slotRows = effectiveDate
    ? db.prepare(`
      SELECT appointment_time, status
      FROM schedule_slots
      WHERE location_id = ?
        AND appointment_date = ?
      ORDER BY appointment_time ASC
    `).all(input.locationId, effectiveDate) as Array<{ appointment_time: string, status: string }>
    : []

  const availableCount = slotRows.filter((row) => row.status === 'available').length
  const slots: TimeSlotOption[] = slotRows.map((row) => ({
    time: String(row.appointment_time),
    status: row.status === 'available'
      ? availableCount === 1
        ? 'last_slot'
        : 'available'
      : 'booked',
  }))

  return {
    dates,
    slots,
    effectiveDate: effectiveDate || null,
  }
}

export function createScheduledBookingRequest(input: {
  treatmentSlug: string
  locationId: string
  appointmentDate: string
  appointmentTime: string
  guestName: string
  email: string
  phone: string
  concern?: string
  notes?: string
}) {
  ensureScheduleSeeded()

  const treatment = TREATMENTS.find((entry) => entry.slug === input.treatmentSlug)
  const location = getLocationById(input.locationId)
  if (!treatment || !location) {
    throw new Error('Please complete the treatment and location before requesting the appointment.')
  }

  const db = getDb()
  const transaction = db.transaction(() => {
    const slot = db.prepare(`
      SELECT *
      FROM schedule_slots
      WHERE location_id = ?
        AND appointment_date = ?
        AND appointment_time = ?
      LIMIT 1
    `).get(input.locationId, input.appointmentDate, input.appointmentTime) as ScheduleSlotRow | undefined

    if (!slot || slot.status !== 'available') {
      throw new Error('That slot is no longer available. Please choose another time.')
    }

    const customer = upsertCustomer({
      email: input.email,
      fullName: input.guestName,
      phone: input.phone,
    })

    const booking = insertBookingRecord({
      id: createId(),
      customerId: customer.id,
      reference: buildBookingReference(),
      status: 'requested',
      scheduleStatus: 'requested',
      treatmentSlug: treatment.slug,
      treatmentName: treatment.name,
      locationId: location.id,
      locationName: location.name,
      appointmentDate: input.appointmentDate,
      appointmentTime: input.appointmentTime,
      guestName: input.guestName,
      email: input.email,
      phone: input.phone,
      concern: input.concern,
      notes: input.notes,
    })

    db.prepare(`
      UPDATE schedule_slots
      SET status = 'requested', booking_id = ?, updated_at = ?
      WHERE id = ?
    `).run(booking.id, new Date().toISOString(), slot.id)

    const session = createSessionForCustomer(customer.id)

    return {
      booking,
      sessionToken: session.token,
    }
  })

  return transaction() as { booking: BookingRecord, sessionToken: string }
}

export function updateScheduledBookingState(input: {
  bookingId: string
  status: BookingRecord['status']
  scheduleStatus: BookingRecord['scheduleStatus']
}) {
  const db = getDb()
  const transaction = db.transaction(() => {
    const booking = getBookingById(input.bookingId)
    if (!booking) {
      throw new Error('Booking could not be found for the scheduling update.')
    }

    const slotStatus = input.scheduleStatus === 'confirmed' || input.scheduleStatus === 'completed'
      ? 'booked'
      : 'requested'

    updateBookingScheduleState({
      bookingId: input.bookingId,
      status: input.status,
      scheduleStatus: input.scheduleStatus,
    })

    db.prepare(`
      UPDATE schedule_slots
      SET status = ?, updated_at = ?
      WHERE booking_id = ?
    `).run(slotStatus, new Date().toISOString(), input.bookingId)

    return getBookingById(input.bookingId)
  })

  return transaction()
}
