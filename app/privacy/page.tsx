import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function PrivacyPage() {
  return (
    <main className="pb-24">
      <section className="section-shell">
        <div className="section-wrap px-4">
          <div className="soft-panel rounded-[2rem] p-6 lg:p-10">
            <span className="eyebrow">Privacy</span>
            <h1 className="mt-6 font-display text-[clamp(3rem,6vw,5rem)] leading-[0.92] tracking-[-0.08em] text-[color:var(--ink)]">
              How Clear Skin handles client information.
            </h1>
            <p className="mt-5 max-w-[720px] text-[16px] leading-8 text-[color:var(--ink-soft)]">
              This site stores booking requests and recent order history inside the
              app experience so clients can revisit their latest activity. Email
              capture is used for treatment guidance, product reminders, and clinic
              updates only.
            </p>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <div className="quiet-panel rounded-[1.6rem] p-5">
                <p className="font-display text-[28px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">
                  What we collect
                </p>
                <p className="mt-3 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                  Contact details entered during booking or checkout, the selected
                  clinic and appointment request, skincare order details, and email
                  subscriptions for clinic communication.
                </p>
              </div>

              <div className="quiet-panel rounded-[1.6rem] p-5">
                <p className="font-display text-[28px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">
                  How it is used
                </p>
                <p className="mt-3 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                  To confirm appointments, prepare treatment follow-up, process
                  skincare orders, and send the specific updates the client asked
                  to receive.
                </p>
              </div>

              <div className="quiet-panel rounded-[1.6rem] p-5">
                <p className="font-display text-[28px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">
                  Account history
                </p>
                <p className="mt-3 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                  Recent bookings and orders are stored in secure first-party app
                  cookies so the latest activity can appear in My Account without
                  asking the client to start again.
                </p>
              </div>

              <div className="quiet-panel rounded-[1.6rem] p-5">
                <p className="font-display text-[28px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">
                  Contact and preferences
                </p>
                <p className="mt-3 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                  For privacy questions or marketing preference changes, use the
                  reply path in any clinic email or contact the support address
                  listed there.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/account">Open My Account</Button>
              <Button href="/accessibility" variant="ghost">Accessibility</Button>
            </div>

            <p className="mt-8 text-[13px] leading-7 text-[color:var(--ink-soft)]">
              Looking for the service terms as well? Visit{' '}
              <Link href="/terms" className="text-[color:var(--ink)] underline-offset-4 hover:underline">
                Terms of Service
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
