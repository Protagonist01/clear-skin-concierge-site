'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CalendarClock, CheckCircle2, MapPin, Sparkles } from 'lucide-react'
import BookingEngine from '@/components/modules/BookingEngine'
import EmailCapture from '@/components/modules/EmailCapture'
import Button from '@/components/ui/Button'
import { TREATMENTS } from '@/data/treatments'
import {
  CLINIC_LOCATIONS,
  type AvailableDate,
  type LocationId,
  type TimeSlotOption,
} from '@/lib/booking'
import type { BookingRecord } from '@/lib/account-store'

interface BookingDetails {
  name: string
  email: string
  phone: string
  concern: string
  notes: string
}

const EMPTY_DETAILS: BookingDetails = {
  name: '',
  email: '',
  phone: '',
  concern: '',
  notes: '',
}

function formatTimeLabel(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit' }).format(date)
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${value}T12:00:00`))
}

function BookPageContent() {
  const searchParams = useSearchParams()
  const [selectedTreatmentSlug, setSelectedTreatmentSlug] = useState('')
  const [selectedLocationId, setSelectedLocationId] = useState<LocationId | ''>('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [details, setDetails] = useState(EMPTY_DETAILS)
  const [currentStep, setCurrentStep] = useState(1)
  const [requesting, setRequesting] = useState(false)
  const [requestError, setRequestError] = useState('')
  const [bookingConfirmation, setBookingConfirmation] = useState<BookingRecord | null>(null)
  const [bookingSyncMessage, setBookingSyncMessage] = useState('')
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlotOption[]>([])
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState('')

  useEffect(() => {
    const requestedTreatment = searchParams.get('treatment')
    const requestedLocation = searchParams.get('location')
    const requestedStep = Number.parseInt(searchParams.get('step') || '1', 10)

    if (requestedTreatment && TREATMENTS.some((item) => item.slug === requestedTreatment)) {
      setSelectedTreatmentSlug(requestedTreatment)
    }

    if (requestedLocation && CLINIC_LOCATIONS.some((item) => item.id === requestedLocation)) {
      setSelectedLocationId(requestedLocation as LocationId)
    }

    if (Number.isFinite(requestedStep)) {
      setCurrentStep(Math.min(Math.max(requestedStep, 1), 4))
    }
  }, [searchParams])

  const selectedTreatment = useMemo(
    () => TREATMENTS.find((item) => item.slug === selectedTreatmentSlug) ?? null,
    [selectedTreatmentSlug],
  )

  const selectedLocation = useMemo(
    () => CLINIC_LOCATIONS.find((item) => item.id === selectedLocationId) ?? null,
    [selectedLocationId],
  )

  useEffect(() => {
    if (!selectedLocationId) {
      setAvailableDates([])
      setAvailableSlots([])
      setAvailabilityLoading(false)
      setAvailabilityError('')
      return
    }

    const controller = new AbortController()
    let active = true

    async function loadAvailability() {
      setAvailabilityLoading(true)
      setAvailabilityError('')

      const params = new URLSearchParams({ locationId: selectedLocationId })
      if (selectedDate) {
        params.set('date', selectedDate)
      }

      try {
        const response = await fetch(`/api/schedule/availability?${params.toString()}`, {
          signal: controller.signal,
        })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload?.error || 'Unable to load the latest appointment availability.')
        }

        if (!active) return

        const nextDates = Array.isArray(payload?.dates) ? payload.dates as AvailableDate[] : []
        const nextSlots = Array.isArray(payload?.slots) ? payload.slots as TimeSlotOption[] : []

        setAvailableDates(nextDates)
        setAvailableSlots(nextSlots)

        if (typeof payload?.effectiveDate === 'string' && payload.effectiveDate !== selectedDate) {
          setSelectedDate(payload.effectiveDate)
        }

        if (!payload?.effectiveDate && selectedDate) {
          setSelectedDate('')
        }
      } catch (error) {
        if (!active || controller.signal.aborted) return

        setAvailableDates([])
        setAvailableSlots([])
        setAvailabilityError(
          error instanceof Error
            ? error.message
            : 'Unable to load the latest appointment availability.',
        )
      } finally {
        if (active) {
          setAvailabilityLoading(false)
        }
      }
    }

    void loadAvailability()

    return () => {
      active = false
      controller.abort()
    }
  }, [selectedDate, selectedLocationId])

  useEffect(() => {
    if (availableDates.length && !availableDates.some((item) => item.date === selectedDate)) {
      setSelectedDate(availableDates[0].date)
    }
  }, [availableDates, selectedDate])

  useEffect(() => {
    const firstOpenSlot = availableSlots.find((slot) => slot.status !== 'booked')?.time || ''
    if (!availableSlots.some((slot) => slot.time === selectedTime && slot.status !== 'booked')) {
      setSelectedTime(firstOpenSlot)
    }
  }, [availableSlots, selectedTime])

  async function submitBookingRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRequesting(true)
    setRequestError('')

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          treatmentSlug: selectedTreatmentSlug,
          locationId: selectedLocationId,
          appointmentDate: selectedDate,
          appointmentTime: selectedTime,
          details,
        }),
      })

      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || 'Unable to request the appointment.')

      setBookingConfirmation(payload.booking as BookingRecord)
      setBookingSyncMessage(typeof payload?.syncMessage === 'string' ? payload.syncMessage : '')
      setCurrentStep(5)
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : 'Unable to request the appointment.')
    } finally {
      setRequesting(false)
    }
  }

  const summary = [
    ['Treatment', selectedTreatment?.name || 'Select a treatment'],
    ['Clinic', selectedLocation?.name || 'Choose a location'],
    [
      'Preferred slot',
      selectedDate && selectedTime
        ? `${formatDateLabel(selectedDate)} at ${formatTimeLabel(selectedTime)}`
        : 'Choose a day and time',
    ],
  ]

  return (
    <main className="pb-24">
      <section className="section-shell">
        <div className="section-wrap px-4">
          <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
            <section className="soft-panel rounded-[2rem] p-6 lg:p-8">
              <span className="eyebrow">Booking</span>
              <h1 className="mt-6 font-display text-[clamp(3rem,6vw,5.2rem)] leading-[0.92] tracking-[-0.08em] text-[color:var(--ink)]">
                Request a consultation that actually stays in the system.
              </h1>
              <p className="mt-5 max-w-[620px] text-[16px] leading-8 text-[color:var(--ink-soft)]">
                Pick the treatment, clinic, and preferred slot. When you submit,
                the request is saved to My Account so the clinic can confirm it
                and follow up from a persistent in-app record.
              </p>

              {currentStep !== 5 && (
                <div className="mt-8 flex flex-wrap gap-3">
                  {['Treatment', 'Location', 'Schedule', 'Details'].map((label, index) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setCurrentStep(index + 1)}
                      className={`glass-pill min-h-[44px] rounded-xl px-4 text-[13px] ${
                        currentStep === index + 1 ? 'text-[color:var(--ink)]' : 'text-[color:var(--muted)]'
                      }`}
                    >
                      {index + 1}. {label}
                    </button>
                  ))}
                </div>
              )}

              {currentStep === 1 && (
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {TREATMENTS.map((treatment) => (
                    <button
                      key={treatment.slug}
                      type="button"
                      onClick={() => {
                        setSelectedTreatmentSlug(treatment.slug)
                        setCurrentStep(2)
                      }}
                      className={`quiet-panel rounded-[1.5rem] p-5 text-left ${
                        selectedTreatmentSlug === treatment.slug ? 'ring-1 ring-[color:var(--accent-strong)]' : ''
                      }`}
                    >
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">{treatment.category}</p>
                      <p className="mt-3 font-display text-[28px] leading-[0.96] tracking-[-0.04em] text-[color:var(--ink)]">{treatment.name}</p>
                      <p className="mt-2 text-[14px] leading-7 text-[color:var(--ink-soft)]">{treatment.description}</p>
                      <p className="mt-4 text-[14px] font-medium text-[color:var(--accent-deep)]">{treatment.price}</p>
                    </button>
                  ))}
                </div>
              )}

              {currentStep === 2 && (
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {CLINIC_LOCATIONS.map((location) => (
                    <button
                      key={location.id}
                      type="button"
                      onClick={() => {
                        setSelectedLocationId(location.id)
                        setCurrentStep(3)
                      }}
                      className={`quiet-panel rounded-[1.5rem] p-5 text-left ${
                        selectedLocationId === location.id ? 'ring-1 ring-[color:var(--accent-strong)]' : ''
                      }`}
                    >
                      <p className="font-display text-[30px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">{location.name}</p>
                      <p className="mt-3 text-[14px] leading-7 text-[color:var(--ink-soft)]">{location.address}</p>
                      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">{location.hours}</p>
                    </button>
                  ))}
                </div>
              )}

              {currentStep === 3 && (
                <div className="mt-8 space-y-8">
                  {availabilityError && (
                    <p className="text-[14px] text-[color:#9f3d32]">{availabilityError}</p>
                  )}

                  {availabilityLoading && (
                    <p className="text-[14px] text-[color:var(--ink-soft)]">
                      Refreshing the latest clinic availability...
                    </p>
                  )}

                  {!availabilityLoading && availableDates.length === 0 && !availabilityError && (
                    <div className="quiet-panel rounded-[1.4rem] p-5">
                      <p className="font-display text-[28px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">
                        No open slots yet.
                      </p>
                      <p className="mt-3 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                        Choose another clinic or come back shortly while the schedule refreshes.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {availableDates.map((date) => (
                      <button
                        key={date.date}
                        type="button"
                        onClick={() => setSelectedDate(date.date)}
                        className={`quiet-panel rounded-[1.25rem] p-4 text-left ${selectedDate === date.date ? 'ring-1 ring-[color:var(--accent-strong)]' : ''}`}
                      >
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">{date.day}</p>
                        <p className="mt-2 font-display text-[28px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">{date.label}</p>
                        <p className="mt-2 text-[13px] text-[color:var(--ink-soft)]">{date.month}</p>
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={slot.status === 'booked'}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`quiet-panel rounded-[1.25rem] p-4 text-left ${
                          selectedTime === slot.time ? 'ring-1 ring-[color:var(--accent-strong)]' : ''
                        } ${slot.status === 'booked' ? 'cursor-not-allowed opacity-50' : ''}`}
                      >
                        <p className="font-display text-[28px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">{formatTimeLabel(slot.time)}</p>
                        <p className="mt-2 text-[13px] text-[color:var(--ink-soft)]">
                          {slot.status === 'booked' ? 'Booked' : slot.status === 'last_slot' ? 'Last open slot' : 'Available to request'}
                        </p>
                      </button>
                    ))}
                  </div>

                  <Button href="/account" variant="ghost">Review account</Button>
                  <button
                    type="button"
                    disabled={!selectedDate || !selectedTime || availabilityLoading}
                    onClick={() => setCurrentStep(4)}
                    className="button-shell button-primary ml-3 inline-flex min-h-[48px] items-center justify-center rounded-xl px-6 py-3 text-[15px] font-medium disabled:pointer-events-none disabled:opacity-50"
                  >
                    Continue
                  </button>
                </div>
              )}

              {currentStep === 4 && (
                <form className="mt-8" onSubmit={submitBookingRequest}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input type="text" value={details.name} onChange={(event) => setDetails((current) => ({ ...current, name: event.target.value }))} className="field-input" placeholder="Full name" required />
                    <input type="email" value={details.email} onChange={(event) => setDetails((current) => ({ ...current, email: event.target.value }))} className="field-input" placeholder="Email" required />
                    <input type="tel" value={details.phone} onChange={(event) => setDetails((current) => ({ ...current, phone: event.target.value }))} className="field-input" placeholder="Phone" required />
                    <input type="text" value={details.concern} onChange={(event) => setDetails((current) => ({ ...current, concern: event.target.value }))} className="field-input" placeholder="Primary concern" />
                    <textarea value={details.notes} onChange={(event) => setDetails((current) => ({ ...current, notes: event.target.value }))} className="field-textarea md:col-span-2" placeholder="Booking notes" />
                  </div>
                  {requestError && <p className="mt-4 text-[14px] text-[color:#9f3d32]">{requestError}</p>}
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button type="button" onClick={() => setCurrentStep(3)} className="button-shell button-ghost inline-flex min-h-[48px] items-center justify-center rounded-xl px-6 py-3 text-[15px] font-medium">Back</button>
                    <button type="submit" className={`button-shell button-primary inline-flex min-h-[48px] items-center justify-center rounded-xl px-6 py-3 text-[15px] font-medium ${requesting ? 'pointer-events-none opacity-70' : ''}`}>
                      {requesting ? 'Sending request...' : 'Request appointment'}
                    </button>
                  </div>
                </form>
              )}

              {currentStep === 5 && bookingConfirmation && (
                <div className="mt-8 space-y-6">
                  <div className="quiet-panel rounded-[1.6rem] p-6">
                    <span className="eyebrow">Request received</span>
                    <h2 className="mt-5 font-display text-[clamp(2.8rem,5vw,4.4rem)] leading-[0.92] tracking-[-0.08em] text-[color:var(--ink)]">{bookingConfirmation.reference}</h2>
                    <p className="mt-4 text-[15px] leading-7 text-[color:var(--ink-soft)]">
                      Your request is now stored in My Account with the treatment, clinic, and preferred slot.
                    </p>
                    {bookingSyncMessage && (
                      <p className="mt-4 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                        {bookingSyncMessage}
                      </p>
                    )}
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button href="/account">Open My Account</Button>
                      <Button href="/book" variant="ghost">Start another request</Button>
                    </div>
                  </div>

                  <BookingEngine treatmentName={bookingConfirmation.treatmentName} appointmentDate={bookingConfirmation.appointmentDate} appointmentTime={bookingConfirmation.appointmentTime} clientName={bookingConfirmation.guestName} location={bookingConfirmation.locationName} requestReference={bookingConfirmation.reference} />

                  <div className="quiet-panel rounded-[1.6rem] p-6">
                    <p className="font-display text-[30px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">Keep the follow-up in your inbox.</p>
                    <p className="mt-3 max-w-[520px] text-[14px] leading-7 text-[color:var(--ink-soft)]">
                      Add your email for preparation notes, treatment guidance, and the next steps around this booking request.
                    </p>
                    <div className="mt-6 max-w-[520px]">
                      <EmailCapture source="booking" />
                    </div>
                  </div>
                </div>
              )}
            </section>

            <aside className="space-y-6">
              <div className="soft-panel rounded-[2rem] p-6">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-[color:var(--accent-deep)]"><CalendarClock size={18} strokeWidth={1.8} /></span>
                  <div>
                    <p className="font-display text-[30px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">Booking status</p>
                    <p className="mt-3 text-[14px] leading-7 text-[color:var(--ink-soft)]">{bookingConfirmation ? `Reference ${bookingConfirmation.reference} is saved.` : `Step ${Math.min(currentStep, 4)} of 4 is in progress.`}</p>
                  </div>
                </div>
                <div className="mt-6 space-y-4">
                  {summary.map(([label, value]) => (
                    <div key={label} className="quiet-panel rounded-[1.4rem] p-4">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">{label}</p>
                      <p className="mt-2 text-[15px] leading-7 text-[color:var(--ink)]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="soft-panel rounded-[2rem] p-6">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-[color:var(--accent-deep)]"><CheckCircle2 size={18} strokeWidth={1.8} /></span>
                  <div>
                    <p className="font-display text-[28px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">What changed</p>
                    <p className="mt-3 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                      The booking flow now uses future dates, stores requests in-app, and connects straight to <Link href="/account" className="text-[color:var(--ink)] underline-offset-4 hover:underline">My Account</Link>.
                    </p>
                  </div>
                </div>
              </div>

              {selectedTreatment && (
                <div className="soft-panel rounded-[2rem] p-6">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-[color:var(--accent-deep)]"><Sparkles size={18} strokeWidth={1.8} /></span>
                    <div>
                      <p className="font-display text-[28px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">{selectedTreatment.name}</p>
                      <p className="mt-3 text-[14px] leading-7 text-[color:var(--ink-soft)]">{selectedTreatment.expectation}</p>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {selectedTreatment.idealFor.map((concern) => (
                      <span key={concern} className="rounded-full border border-[color:var(--line)] px-3 py-2 text-[12px] text-[color:var(--ink-soft)]">{concern}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedLocation && (
                <div className="soft-panel rounded-[2rem] p-6">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-[color:var(--accent-deep)]"><MapPin size={18} strokeWidth={1.8} /></span>
                    <div>
                      <p className="font-display text-[28px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">{selectedLocation.name}</p>
                      <p className="mt-3 text-[14px] leading-7 text-[color:var(--ink-soft)]">{selectedLocation.address}</p>
                      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">{selectedLocation.hours}</p>
                    </div>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>
    </main>
  )
}

export default function BookPage() {
  return (
    <Suspense fallback={<main className="pb-24" />}>
      <BookPageContent />
    </Suspense>
  )
}
