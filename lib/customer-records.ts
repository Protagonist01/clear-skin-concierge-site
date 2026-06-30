export const BOOKING_HISTORY_COOKIE_KEY = 'clear-skin-bookings'
export const ORDER_HISTORY_COOKIE_KEY = 'clear-skin-orders'
export const HISTORY_COOKIE_MAX_AGE = 60 * 60 * 24 * 120
const HISTORY_LIMIT = 8

interface CookieReader {
  get: (name: string) => { value: string } | undefined
}

export interface BookingRecord {
  id: string
  reference: string
  createdAt: string
  status: 'requested' | 'confirmed' | 'completed'
  treatmentSlug: string
  treatmentName: string
  locationId: string
  locationName: string
  appointmentDate: string
  appointmentTime: string
  guestName: string
  email: string
  phone: string
  concern?: string
  notes?: string
}

export interface OrderLineItemRecord {
  slug: string
  name: string
  quantity: number
  lineTotal: number
}

export interface OrderRecord {
  id: string
  orderNumber: string
  createdAt: string
  status: 'processing' | 'fulfilled'
  customerName: string
  email: string
  city: string
  itemCount: number
  subtotal: number
  items: OrderLineItemRecord[]
}

function readJsonArray<T>(
  cookies: CookieReader,
  key: string,
  guard: (value: unknown) => value is T,
) {
  const raw = cookies.get(key)?.value
  if (!raw) return [] as T[]

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return [] as T[]
    return parsed.filter(guard)
  } catch {
    return [] as T[]
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isOrderLineItemRecord(value: unknown): value is OrderLineItemRecord {
  if (!value || typeof value !== 'object') return false

  const item = value as OrderLineItemRecord
  return (
    isNonEmptyString(item.slug)
    && isNonEmptyString(item.name)
    && isFiniteNumber(item.quantity)
    && item.quantity > 0
    && isFiniteNumber(item.lineTotal)
    && item.lineTotal >= 0
  )
}

function isBookingRecord(value: unknown): value is BookingRecord {
  if (!value || typeof value !== 'object') return false

  const booking = value as BookingRecord
  return (
    isNonEmptyString(booking.id)
    && isNonEmptyString(booking.reference)
    && isNonEmptyString(booking.createdAt)
    && (booking.status === 'requested' || booking.status === 'confirmed' || booking.status === 'completed')
    && isNonEmptyString(booking.treatmentSlug)
    && isNonEmptyString(booking.treatmentName)
    && isNonEmptyString(booking.locationId)
    && isNonEmptyString(booking.locationName)
    && isNonEmptyString(booking.appointmentDate)
    && isNonEmptyString(booking.appointmentTime)
    && isNonEmptyString(booking.guestName)
    && isNonEmptyString(booking.email)
    && isNonEmptyString(booking.phone)
  )
}

function isOrderRecord(value: unknown): value is OrderRecord {
  if (!value || typeof value !== 'object') return false

  const order = value as OrderRecord
  return (
    isNonEmptyString(order.id)
    && isNonEmptyString(order.orderNumber)
    && isNonEmptyString(order.createdAt)
    && (order.status === 'processing' || order.status === 'fulfilled')
    && isNonEmptyString(order.customerName)
    && isNonEmptyString(order.email)
    && isNonEmptyString(order.city)
    && isFiniteNumber(order.itemCount)
    && order.itemCount >= 0
    && isFiniteNumber(order.subtotal)
    && order.subtotal >= 0
    && Array.isArray(order.items)
    && order.items.every(isOrderLineItemRecord)
  )
}

function sortNewestFirst<T extends { createdAt: string }>(records: T[]) {
  return [...records].sort((left, right) => (
    new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  ))
}

function trimHistory<T extends { id: string }>(records: T[]) {
  const unique = new Map(records.map((record) => [record.id, record]))
  return Array.from(unique.values()).slice(0, HISTORY_LIMIT)
}

export function readBookingHistory(cookies: CookieReader) {
  return sortNewestFirst(readJsonArray(cookies, BOOKING_HISTORY_COOKIE_KEY, isBookingRecord))
}

export function readOrderHistory(cookies: CookieReader) {
  return sortNewestFirst(readJsonArray(cookies, ORDER_HISTORY_COOKIE_KEY, isOrderRecord))
}

export function serializeBookingHistory(records: BookingRecord[]) {
  return JSON.stringify(trimHistory(sortNewestFirst(records)))
}

export function serializeOrderHistory(records: OrderRecord[]) {
  return JSON.stringify(trimHistory(sortNewestFirst(records)))
}

export function prependBookingRecord(records: BookingRecord[], record: BookingRecord) {
  return trimHistory([record, ...records.filter((entry) => entry.id !== record.id)])
}

export function prependOrderRecord(records: OrderRecord[], record: OrderRecord) {
  return trimHistory([record, ...records.filter((entry) => entry.id !== record.id)])
}

function randomToken(length: number) {
  return Math.random().toString(36).slice(2, 2 + length).toUpperCase()
}

export function buildBookingReference() {
  return `CSR-${randomToken(6)}`
}

export function buildOrderNumber() {
  return `CS-${randomToken(6)}`
}
