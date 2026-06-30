import 'server-only'

import { randomBytes } from 'node:crypto'
import { getDb } from '@/lib/db'
import { encrypt, decrypt } from './encryption'

export const ACCOUNT_SESSION_COOKIE_KEY = 'clear-skin-account-session'
export const ACCOUNT_SESSION_MAX_AGE = 60 * 60 * 24 * 30
const LOGIN_CODE_TTL_MINUTES = 15

interface CookieReader {
  get: (name: string) => { value: string } | undefined
}

export interface CustomerAccount {
  id: string
  email: string
  fullName: string
  phone: string
}

export interface BookingRecord {
  id: string
  reference: string
  createdAt: string
  status: 'requested' | 'confirmed' | 'completed'
  scheduleStatus: 'requested' | 'confirmed' | 'completed'
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
  paymentStatus: 'authorized' | 'captured'
  paymentReference: string
  paymentMethod: string
  customerName: string
  email: string
  city: string
  itemCount: number
  subtotal: number
  items: OrderLineItemRecord[]
}

export interface ReviewRecord {
  id: string
  treatmentOrProduct: string
  name: string
  age: string
  location: string
  rating: number
  date: string
  body: string
  verified: boolean
}

interface CustomerRow {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  created_at?: string
  updated_at?: string
}

interface BookingRow {
  id: string
  reference: string
  created_at: string
  status: string
  schedule_status: string
  treatment_slug: string
  treatment_name: string
  location_id: string
  location_name: string
  appointment_date: string
  appointment_time: string
  guest_name: string
  email: string
  phone: string
  concern: string | null
  notes: string | null
}

interface OrderRow {
  id: string
  order_number: string
  created_at: string
  status: string
  payment_status: string
  payment_reference: string
  payment_method: string
  customer_name: string
  email: string
  city: string
  item_count: number
  subtotal: number
  items_json: string
}

interface ReviewRow {
  id: string
  item_name: string
  name: string
  location: string
  rating: number
  created_at: string
  body: string
  verified: number
}

interface LoginCodeRow {
  id: string
}

function createId() {
  return crypto.randomUUID()
}

function createSessionToken() {
  return randomBytes(32).toString('hex')
}

function createLoginCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60 * 1000)
}

function rowToCustomer(row: CustomerRow): CustomerAccount {
  return {
    id: String(row.id),
    email: String(row.email),
    fullName: decrypt(row.full_name || ''),
    phone: decrypt(row.phone || ''),
  }
}

function rowToBooking(row: BookingRow): BookingRecord {
  return {
    id: String(row.id),
    reference: String(row.reference),
    createdAt: String(row.created_at),
    status: String(row.status) as BookingRecord['status'],
    scheduleStatus: String(row.schedule_status) as BookingRecord['scheduleStatus'],
    treatmentSlug: String(row.treatment_slug),
    treatmentName: String(row.treatment_name),
    locationId: String(row.location_id),
    locationName: String(row.location_name),
    appointmentDate: String(row.appointment_date),
    appointmentTime: String(row.appointment_time),
    guestName: decrypt(row.guest_name),
    email: String(row.email),
    phone: decrypt(row.phone),
    concern: row.concern ? decrypt(row.concern) : undefined,
    notes: row.notes ? decrypt(row.notes) : undefined,
  }
}

function rowToOrder(row: OrderRow): OrderRecord {
  return {
    id: String(row.id),
    orderNumber: String(row.order_number),
    createdAt: String(row.created_at),
    status: String(row.status) as OrderRecord['status'],
    paymentStatus: String(row.payment_status) as OrderRecord['paymentStatus'],
    paymentReference: String(row.payment_reference),
    paymentMethod: String(row.payment_method),
    customerName: decrypt(row.customer_name),
    email: String(row.email),
    city: String(row.city),
    itemCount: Number(row.item_count),
    subtotal: Number(row.subtotal),
    items: JSON.parse(String(row.items_json)) as OrderLineItemRecord[],
  }
}

function formatReviewDate(createdAt: string) {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(createdAt))
}

function rowToReview(row: ReviewRow): ReviewRecord {
  return {
    id: String(row.id),
    treatmentOrProduct: String(row.item_name),
    name: String(row.name),
    age: '',
    location: String(row.location),
    rating: Number(row.rating),
    date: formatReviewDate(String(row.created_at)),
    body: String(row.body),
    verified: Boolean(row.verified),
  }
}

function cleanupExpiredAuthRecords() {
  const db = getDb()
  const now = new Date().toISOString()
  db.prepare('DELETE FROM account_sessions WHERE expires_at <= ?').run(now)
  db.prepare('DELETE FROM account_login_codes WHERE expires_at <= ? OR consumed_at IS NOT NULL').run(now)
}

export function upsertCustomer(input: {
  email: string
  fullName?: string
  phone?: string
}) {
  const db = getDb()
  const now = new Date().toISOString()
  const email = input.email.trim().toLowerCase()
  const fullName = input.fullName?.trim() || ''
  const phone = input.phone?.trim() || ''

  const existing = db.prepare('SELECT * FROM customers WHERE email = ?').get(email) as CustomerRow | undefined
  if (existing) {
    const existingFullName = decrypt(existing.full_name || '')
    const existingPhone = decrypt(existing.phone || '')
    const nextFullName = fullName || existingFullName
    const nextPhone = phone || existingPhone

    db.prepare(`
      UPDATE customers
      SET full_name = ?, phone = ?, updated_at = ?
      WHERE email = ?
    `).run(encrypt(nextFullName), encrypt(nextPhone), now, email)

    return rowToCustomer({
      ...existing,
      full_name: encrypt(nextFullName),
      phone: encrypt(nextPhone),
      updated_at: now,
    })
  }

  const customer = {
    id: createId(),
    email,
    full_name: encrypt(fullName),
    phone: encrypt(phone),
    created_at: now,
    updated_at: now,
  }

  db.prepare(`
    INSERT INTO customers (id, email, full_name, phone, created_at, updated_at)
    VALUES (@id, @email, @full_name, @phone, @created_at, @updated_at)
  `).run(customer)

  return rowToCustomer(customer)
}

export function createSessionForCustomer(customerId: string) {
  cleanupExpiredAuthRecords()

  const db = getDb()
  const now = new Date()
  const session = {
    id: createId(),
    customer_id: customerId,
    token: createSessionToken(),
    created_at: now.toISOString(),
    expires_at: addMinutes(now, ACCOUNT_SESSION_MAX_AGE / 60).toISOString(),
    last_seen_at: now.toISOString(),
  }

  db.prepare(`
    INSERT INTO account_sessions (id, customer_id, token, created_at, expires_at, last_seen_at)
    VALUES (@id, @customer_id, @token, @created_at, @expires_at, @last_seen_at)
  `).run(session)

  return session
}

export function getAuthenticatedCustomer(cookies: CookieReader) {
  cleanupExpiredAuthRecords()

  const token = cookies.get(ACCOUNT_SESSION_COOKIE_KEY)?.value
  if (!token) return null

  const db = getDb()
  const row = db.prepare(`
    SELECT customers.*
    FROM account_sessions
    INNER JOIN customers ON customers.id = account_sessions.customer_id
    WHERE account_sessions.token = ?
      AND account_sessions.expires_at > ?
    LIMIT 1
  `).get(token, new Date().toISOString()) as CustomerRow | undefined

  if (!row) return null

  db.prepare('UPDATE account_sessions SET last_seen_at = ? WHERE token = ?').run(
    new Date().toISOString(),
    token,
  )

  return rowToCustomer(row)
}

export function clearSessionByToken(token: string) {
  getDb().prepare('DELETE FROM account_sessions WHERE token = ?').run(token)
}

export function createEmailLoginChallenge(input: {
  email: string
  fullName?: string
  phone?: string
}) {
  const customer = upsertCustomer(input)
  cleanupExpiredAuthRecords()

  const db = getDb()
  const now = new Date()
  const challenge = {
    id: createId(),
    email: customer.email,
    code: createLoginCode(),
    created_at: now.toISOString(),
    expires_at: addMinutes(now, LOGIN_CODE_TTL_MINUTES).toISOString(),
  }

  db.prepare('DELETE FROM account_login_codes WHERE email = ?').run(customer.email)
  db.prepare(`
    INSERT INTO account_login_codes (id, email, code, created_at, expires_at)
    VALUES (@id, @email, @code, @created_at, @expires_at)
  `).run(challenge)

  return {
    customer,
    code: challenge.code,
    expiresAt: challenge.expires_at,
  }
}

export function verifyEmailLoginChallenge(email: string, code: string) {
  cleanupExpiredAuthRecords()

  const db = getDb()
  const normalizedEmail = email.trim().toLowerCase()
  const row = db.prepare(`
    SELECT *
    FROM account_login_codes
    WHERE email = ?
      AND code = ?
      AND consumed_at IS NULL
      AND expires_at > ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(normalizedEmail, code.trim(), new Date().toISOString()) as LoginCodeRow | undefined

  if (!row) return null

  db.prepare('UPDATE account_login_codes SET consumed_at = ? WHERE id = ?').run(
    new Date().toISOString(),
    row.id,
  )

  const customerRow = db.prepare('SELECT * FROM customers WHERE email = ? LIMIT 1').get(normalizedEmail) as CustomerRow | undefined
  return customerRow ? rowToCustomer(customerRow) : null
}

export function insertBookingRecord(input: Omit<BookingRecord, 'createdAt'> & { createdAt?: string, customerId: string }) {
  const db = getDb()
  const booking = {
    id: input.id,
    customer_id: input.customerId,
    reference: input.reference,
    created_at: input.createdAt || new Date().toISOString(),
    status: input.status,
    schedule_status: input.scheduleStatus,
    treatment_slug: input.treatmentSlug,
    treatment_name: input.treatmentName,
    location_id: input.locationId,
    location_name: input.locationName,
    appointment_date: input.appointmentDate,
    appointment_time: input.appointmentTime,
    guest_name: encrypt(input.guestName),
    email: input.email,
    phone: encrypt(input.phone),
    concern: input.concern ? encrypt(input.concern) : null,
    notes: input.notes ? encrypt(input.notes) : null,
  }

  db.prepare(`
    INSERT INTO bookings (
      id, customer_id, reference, created_at, status, schedule_status,
      treatment_slug, treatment_name, location_id, location_name,
      appointment_date, appointment_time, guest_name, email, phone, concern, notes
    ) VALUES (
      @id, @customer_id, @reference, @created_at, @status, @schedule_status,
      @treatment_slug, @treatment_name, @location_id, @location_name,
      @appointment_date, @appointment_time, @guest_name, @email, @phone, @concern, @notes
    )
  `).run(booking)

  return rowToBooking(booking as unknown as BookingRow)
}

export function getBookingById(bookingId: string) {
  const row = getDb().prepare('SELECT * FROM bookings WHERE id = ? LIMIT 1').get(bookingId) as BookingRow | undefined
  return row ? rowToBooking(row) : null
}

export function updateBookingScheduleState(input: {
  bookingId: string
  status: BookingRecord['status']
  scheduleStatus: BookingRecord['scheduleStatus']
}) {
  const db = getDb()

  db.prepare(`
    UPDATE bookings
    SET status = ?, schedule_status = ?
    WHERE id = ?
  `).run(input.status, input.scheduleStatus, input.bookingId)

  return getBookingById(input.bookingId)
}

export function listBookingsForCustomer(customerId: string) {
  const rows = getDb().prepare(`
    SELECT *
    FROM bookings
    WHERE customer_id = ?
    ORDER BY datetime(created_at) DESC
  `).all(customerId) as BookingRow[]

  return rows.map(rowToBooking)
}

export function insertOrderRecord(input: {
  id: string
  customerId: string
  orderNumber: string
  createdAt?: string
  status: OrderRecord['status']
  paymentStatus: OrderRecord['paymentStatus']
  paymentReference: string
  paymentMethod: string
  customerName: string
  email: string
  city: string
  addressLine1?: string
  addressLine2?: string
  phone?: string
  notes?: string
  itemCount: number
  subtotal: number
  items: OrderLineItemRecord[]
}) {
  const db = getDb()
  const order = {
    id: input.id,
    customer_id: input.customerId,
    order_number: input.orderNumber,
    created_at: input.createdAt || new Date().toISOString(),
    status: input.status,
    payment_status: input.paymentStatus,
    payment_reference: input.paymentReference,
    payment_method: input.paymentMethod,
    customer_name: encrypt(input.customerName),
    email: input.email,
    city: input.city,
    address_line_1: input.addressLine1 ? encrypt(input.addressLine1) : null,
    address_line_2: input.addressLine2 ? encrypt(input.addressLine2) : null,
    phone: input.phone ? encrypt(input.phone) : null,
    notes: input.notes ? encrypt(input.notes) : null,
    item_count: input.itemCount,
    subtotal: input.subtotal,
    items_json: JSON.stringify(input.items),
  }

  db.prepare(`
    INSERT INTO orders (
      id, customer_id, order_number, created_at, status, payment_status,
      payment_reference, payment_method, customer_name, email, city,
      address_line_1, address_line_2, phone, notes, item_count, subtotal, items_json
    ) VALUES (
      @id, @customer_id, @order_number, @created_at, @status, @payment_status,
      @payment_reference, @payment_method, @customer_name, @email, @city,
      @address_line_1, @address_line_2, @phone, @notes, @item_count, @subtotal, @items_json
    )
  `).run(order)

  return rowToOrder(order as unknown as OrderRow)
}

export function listOrdersForCustomer(customerId: string) {
  const rows = getDb().prepare(`
    SELECT *
    FROM orders
    WHERE customer_id = ?
    ORDER BY datetime(created_at) DESC
  `).all(customerId) as OrderRow[]

  return rows.map(rowToOrder)
}

export function insertReviewRecord(input: {
  itemName: string
  name: string
  location: string
  rating: number
  body: string
  customerId?: string | null
  verified?: boolean
}) {
  const review = {
    id: createId(),
    customer_id: input.customerId || null,
    item_name: input.itemName,
    name: input.name,
    location: input.location,
    rating: input.rating,
    body: input.body,
    created_at: new Date().toISOString(),
    verified: input.verified ? 1 : 0,
  }

  getDb().prepare(`
    INSERT INTO reviews (id, customer_id, item_name, name, location, rating, body, created_at, verified)
    VALUES (@id, @customer_id, @item_name, @name, @location, @rating, @body, @created_at, @verified)
  `).run(review)

  return rowToReview(review)
}

export function listReviewsForItem(itemName: string) {
  const rows = getDb().prepare(`
    SELECT *
    FROM reviews
    WHERE item_name = ?
    ORDER BY datetime(created_at) DESC
  `).all(itemName) as ReviewRow[]

  return rows.map(rowToReview)
}
