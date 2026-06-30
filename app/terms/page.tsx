import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function TermsPage() {
  return (
    <main className="pb-24">
      <section className="section-shell">
        <div className="section-wrap px-4">
          <div className="soft-panel rounded-[2rem] p-6 lg:p-10">
            <span className="eyebrow">Terms</span>
            <h1 className="mt-6 font-display text-[clamp(3rem,6vw,5rem)] leading-[0.92] tracking-[-0.08em] text-[color:var(--ink)]">
              The operating terms for booking, checkout, and clinic communication.
            </h1>
            <p className="mt-5 max-w-[720px] text-[16px] leading-8 text-[color:var(--ink-soft)]">
              Booking requests submitted through this site are treated as preferred
              appointment requests until the clinic confirms the final slot.
              Skincare orders captured in checkout are recorded in-app and can be
              reviewed again from My Account.
            </p>

            <div className="mt-10 space-y-4">
              <div className="quiet-panel rounded-[1.6rem] p-5">
                <p className="font-display text-[28px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">
                  Appointment requests
                </p>
                <p className="mt-3 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                  Selecting a time on the booking page creates a request record. The
                  clinic confirms the requested slot during operating hours or
                  proposes the closest suitable alternative.
                </p>
              </div>

              <div className="quiet-panel rounded-[1.6rem] p-5">
                <p className="font-display text-[28px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">
                  Checkout capture
                </p>
                <p className="mt-3 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                  The checkout flow records the submitted order, clears the cart,
                  and adds the latest order to the account history shown in-app.
                </p>
              </div>

              <div className="quiet-panel rounded-[1.6rem] p-5">
                <p className="font-display text-[28px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">
                  Clinic communications
                </p>
                <p className="mt-3 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                  Follow-up emails and reminders are limited to requested clinic
                  updates, skincare reminders, and account-related communication.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/book">Book a consultation</Button>
              <Button href="/privacy" variant="ghost">Privacy policy</Button>
            </div>

            <p className="mt-8 text-[13px] leading-7 text-[color:var(--ink-soft)]">
              Need a readable summary of site access and support? Visit{' '}
              <Link href="/accessibility" className="text-[color:var(--ink)] underline-offset-4 hover:underline">
                Accessibility
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
