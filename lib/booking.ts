export type LocationId = 'london' | 'dubai' | 'lagos'
export type TimeSlotStatus = 'available' | 'last_slot' | 'booked'

export interface ClinicLocation {
  id: LocationId
  name: string
  address: string
  practitioners: number
  hours: string
  openDays: number[]
}

export interface AvailableDate {
  date: string
  day: string
  label: string
  month: string
  availableCount: number
}

export interface TimeSlotOption {
  time: string
  status: TimeSlotStatus
}

export const CLINIC_LOCATIONS: ClinicLocation[] = [
  {
    id: 'london',
    name: 'London',
    address: '12 Mount Street, Mayfair',
    practitioners: 2,
    hours: 'Mon-Sat, 09:00-19:00',
    openDays: [1, 2, 3, 4, 5, 6],
  },
  {
    id: 'dubai',
    name: 'Dubai',
    address: 'Gate Village 8, DIFC',
    practitioners: 3,
    hours: 'Mon-Sun, 10:00-20:00',
    openDays: [0, 1, 2, 3, 4, 5, 6],
  },
  {
    id: 'lagos',
    name: 'Lagos',
    address: '4A Akin Olugbade St, Victoria Island',
    practitioners: 2,
    hours: 'Tue-Sat, 09:00-18:00',
    openDays: [2, 3, 4, 5, 6],
  },
]

const TIME_SLOT_CATALOG: Record<LocationId, string[]> = {
  london: ['09:30', '11:00', '14:00', '17:30'],
  dubai: ['10:00', '12:30', '15:00', '18:00'],
  lagos: ['09:00', '11:30', '14:00', '16:30'],
}

function hashSeed(input: string) {
  return input.split('').reduce((total, character, index) => (
    total + character.charCodeAt(0) * (index + 17)
  ), 0)
}

function toIsoDate(value: Date) {
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, '0'),
    String(value.getDate()).padStart(2, '0'),
  ].join('-')
}

function formatDay(value: Date) {
  return value.toLocaleDateString('en-GB', { weekday: 'short' })
}

function formatMonth(value: Date) {
  return value.toLocaleDateString('en-GB', { month: 'short' })
}

function startOfDay(value: Date) {
  const next = new Date(value)
  next.setHours(0, 0, 0, 0)
  return next
}

export function getLocationById(locationId: string | null | undefined) {
  return CLINIC_LOCATIONS.find((location) => location.id === locationId)
}

export function buildAvailableDates(locationId: string | null | undefined, count = 8) {
  const location = getLocationById(locationId)
  const openDays = location?.openDays ?? [1, 2, 3, 4, 5, 6]
  const dates: AvailableDate[] = []
  const pointer = startOfDay(new Date())
  pointer.setDate(pointer.getDate() + 1)

  while (dates.length < count) {
    if (openDays.includes(pointer.getDay())) {
      const availableCount = pointer.getDay() === 6 ? 2 : pointer.getDay() === 5 ? 3 : 4
      dates.push({
        date: toIsoDate(pointer),
        day: formatDay(pointer),
        label: String(pointer.getDate()),
        month: formatMonth(pointer),
        availableCount,
      })
    }

    pointer.setDate(pointer.getDate() + 1)
  }

  return dates
}

export function buildTimeSlots(input: {
  locationId: string | null | undefined
  treatmentSlug: string | null | undefined
  dateStr: string | null | undefined
}) {
  const location = getLocationById(input.locationId) ?? CLINIC_LOCATIONS[0]
  const baseSlots = TIME_SLOT_CATALOG[location.id]

  if (!input.dateStr) {
    return baseSlots.map((time) => ({ time, status: 'available' as TimeSlotStatus }))
  }

  const seed = hashSeed([
    location.id,
    input.treatmentSlug || 'consultation',
    input.dateStr,
  ].join(':'))

  const bookedIndex = seed % baseSlots.length
  const lastSlotIndex = (bookedIndex + 2) % baseSlots.length

  return baseSlots.map((time, index) => {
    let status: TimeSlotStatus = 'available'

    if (index === bookedIndex) {
      status = 'booked'
    } else if (index === lastSlotIndex) {
      status = 'last_slot'
    }

    if (input.treatmentSlug === 'laser-renewal' && index === baseSlots.length - 1) {
      status = 'booked'
    }

    return { time, status }
  })
}
