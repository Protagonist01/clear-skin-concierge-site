import Link from 'next/link'
import { cookies } from 'next/headers'
import { CalendarClock, PackageCheck, Sparkles } from 'lucide-react'
import AccountAccessPanel from '@/components/modules/AccountAccessPanel'
import AccountLogoutButton from '@/components/modules/AccountLogoutButton'
import Button from '@/components/ui/Button'
import {
  getAuthenticatedCustomer,
  listBookingsForCustomer,
  listOrdersForCustomer,
} from '@/lib/account-store'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00`))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)

  return new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value)
}

export const dynamic = 'force-dynamic'

export default function AccountPage() {
  const cookieStore = cookies()
  const customer = getAuthenticatedCustomer(cookieStore)

  if (!customer) {
    return (
      <main className="pb-24">
        <section className="section-shell">
          <div className="section-wrap px-4">
            <AccountAccessPanel />
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/privacy" variant="ghost">
                Privacy policy
              </Button>
              <Button href="/terms" variant="ghost">
                Terms
              </Button>
              <Button href="/accessibility" variant="ghost">
                Accessibility
              </Button>
            </div>
          </div>
        </section>
      </main>
    )
  }

  const bookings = listBookingsForCustomer(customer.id)
  const orders = listOrdersForCustomer(customer.id)
  const activeBookings = bookings.filter((booking) => booking.status !== 'completed')

  return (
    <main className="pb-24">
      <section className="section-shell">
        <div className="section-wrap px-4">
          <div className="soft-panel rounded-[2.2rem] p-6 lg:p-10">
            <span className="eyebrow">My account</span>
            <h1 className="mt-6 font-display text-[clamp(3.1rem,6vw,5.6rem)] leading-[0.9] tracking-[-0.08em] text-[color:var(--ink)]">
              Your recent bookings and orders.
            </h1>
            <p className="mt-5 max-w-[640px] text-[16px] leading-8 text-[color:var(--ink-soft)]">
              Signed in as {customer.fullName || customer.email}. This area keeps
              your consultation requests and skincare orders in one account-backed
              view so you can return from any browser with an email code.
            </p>
            <div className="mt-6">
              <AccountLogoutButton />
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="quiet-panel rounded-[1.6rem] p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Active consultations
                </p>
                <p className="mt-3 font-display text-[40px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">
                  {activeBookings.length}
                </p>
              </div>
              <div className="quiet-panel rounded-[1.6rem] p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Recent orders
                </p>
                <p className="mt-3 font-display text-[40px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">
                  {orders.length}
                </p>
              </div>
              <div className="quiet-panel rounded-[1.6rem] p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Latest activity
                </p>
                <p className="mt-3 text-[15px] leading-7 text-[color:var(--ink-soft)]">
                  {bookings[0]
                    ? `Consultation request created ${formatDateTime(bookings[0].createdAt)}`
                    : orders[0]
                      ? `Order captured ${formatDateTime(orders[0].createdAt)}`
                      : 'No recent account activity yet.'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-8 xl:grid-cols-[1.02fr_0.98fr]">
            <section className="soft-panel rounded-[2rem] p-6 lg:p-8">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-[color:var(--accent-deep)]">
                  <CalendarClock size={18} strokeWidth={1.8} />
                </span>
                <div>
                  <p className="font-display text-[34px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">
                    Consultation requests
                  </p>
                  <p className="mt-3 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                    Requests stay here after you submit them, including the clinic,
                    time, and reference number.
                  </p>
                </div>
              </div>

              {bookings.length === 0 ? (
                <div className="quiet-panel mt-6 rounded-[1.6rem] p-5">
                  <p className="font-display text-[28px] leading-none tracking-[-0.04em] text-[color:var(--ink)]">
                    No consultation requests yet.
                  </p>
                  <p className="mt-3 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                    Start with a clinician-led consultation and it will appear here
                    automatically after submission.
                  </p>
                  <Button href="/book" className="mt-5">
                    Book a consultation
                  </Button>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="quiet-panel rounded-[1.6rem] p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                            {booking.reference} / {booking.status.replace('_', ' ')} / {booking.scheduleStatus.replace('_', ' ')}
                          </p>
                          <p className="mt-3 font-display text-[30px] leading-[0.96] tracking-[-0.04em] text-[color:var(--ink)]">
                            {booking.treatmentName}
                          </p>
                          <p className="mt-2 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                            {booking.locationName} / {formatDate(booking.appointmentDate)} / {formatTime(booking.appointmentTime)}
                          </p>
                          <p className="mt-2 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                            Requested by {booking.guestName} on {formatDateTime(booking.createdAt)}
                          </p>
                        </div>
                        <Link
                          href={`/book?treatment=${booking.treatmentSlug}&location=${booking.locationId}&step=3`}
                          className="glass-pill inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 text-[14px] font-medium text-[color:var(--ink)] transition-transform duration-300 hover:-translate-y-0.5"
                        >
                          Rebook this plan
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="soft-panel rounded-[2rem] p-6 lg:p-8">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-[color:var(--accent-deep)]">
                  <PackageCheck size={18} strokeWidth={1.8} />
                </span>
                <div>
                  <p className="font-display text-[34px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">
                    Recent orders
                  </p>
                  <p className="mt-3 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                    Orders placed through checkout are captured here with the items
                    and totals that were submitted.
                  </p>
                </div>
              </div>

              {orders.length === 0 ? (
                <div className="quiet-panel mt-6 rounded-[1.6rem] p-5">
                  <p className="font-display text-[28px] leading-none tracking-[-0.04em] text-[color:var(--ink)]">
                    No skincare orders yet.
                  </p>
                  <p className="mt-3 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                    Add products to the bag and complete checkout to keep a record
                    of the latest order request.
                  </p>
                  <Button href="/skincare" className="mt-5">
                    Explore skincare
                  </Button>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="quiet-panel rounded-[1.6rem] p-5">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                            {order.orderNumber} / {order.status} / {order.paymentStatus}
                          </p>
                          <p className="mt-3 font-display text-[30px] leading-[0.96] tracking-[-0.04em] text-[color:var(--ink)]">
                            {formatCurrency(order.subtotal)}
                          </p>
                          <p className="mt-2 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                            {order.itemCount} items / {order.city} / captured {formatDateTime(order.createdAt)}
                          </p>
                          <p className="mt-2 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                            {order.paymentMethod} / ref {order.paymentReference}
                          </p>
                        </div>
                        <Link
                          href="/skincare"
                          className="glass-pill inline-flex min-h-[44px] items-center justify-center rounded-xl px-4 text-[14px] font-medium text-[color:var(--ink)] transition-transform duration-300 hover:-translate-y-0.5"
                        >
                          Shop again
                        </Link>
                      </div>

                      <div className="mt-4 space-y-2 border-t border-[color:var(--line)] pt-4 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                        {order.items.map((item) => (
                          <div key={`${order.id}-${item.slug}`} className="flex items-center justify-between gap-4">
                            <span>{item.name} / Qty {item.quantity}</span>
                            <span className="text-[color:var(--ink)]">{formatCurrency(item.lineTotal)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="mt-10 rounded-[2rem] border border-[color:var(--line)] bg-[color:rgba(255,250,244,0.58)] p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-[color:var(--accent-deep)]">
                  <Sparkles size={18} strokeWidth={1.8} />
                </span>
                <div>
                  <p className="font-display text-[28px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">
                    Looking for account controls?
                  </p>
                  <p className="mt-3 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                    Privacy, terms, and accessibility details now live in the
                    footer. For changes to marketing preferences, contact the clinic
                    directly from the email you subscribed with.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button href="/privacy" variant="ghost">
                  Privacy policy
                </Button>
                <Button href="/terms" variant="ghost">
                  Terms
                </Button>
                <Button href="/accessibility" variant="ghost">
                  Accessibility
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
