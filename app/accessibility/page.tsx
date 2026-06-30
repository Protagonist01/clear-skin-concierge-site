import Button from '@/components/ui/Button'

export default function AccessibilityPage() {
  return (
    <main className="pb-24">
      <section className="section-shell">
        <div className="section-wrap px-4">
          <div className="soft-panel rounded-[2rem] p-6 lg:p-10">
            <span className="eyebrow">Accessibility</span>
            <h1 className="mt-6 font-display text-[clamp(3rem,6vw,5rem)] leading-[0.92] tracking-[-0.08em] text-[color:var(--ink)]">
              Clear information, keyboard-friendly flows, and readable clinic pages.
            </h1>
            <p className="mt-5 max-w-[720px] text-[16px] leading-8 text-[color:var(--ink-soft)]">
              This site is designed to keep booking, skincare, and account tasks
              available on desktop and mobile with visible labels, accessible form
              fields, and direct routes to the most important actions.
            </p>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              <div className="quiet-panel rounded-[1.6rem] p-5">
                <p className="font-display text-[28px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">
                  Navigation
                </p>
                <p className="mt-3 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                  Main actions including booking, bag, account, privacy, and terms
                  are now reachable through direct links instead of placeholder text.
                </p>
              </div>

              <div className="quiet-panel rounded-[1.6rem] p-5">
                <p className="font-display text-[28px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">
                  Booking and checkout
                </p>
                <p className="mt-3 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                  Interactive forms keep visible labels, error feedback, and clear
                  completion states so clients can understand what was saved.
                </p>
              </div>

              <div className="quiet-panel rounded-[1.6rem] p-5">
                <p className="font-display text-[28px] leading-none tracking-[-0.05em] text-[color:var(--ink)]">
                  Support
                </p>
                <p className="mt-3 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                  If any part of the site is hard to use, the clinic team should
                  provide an alternative route to complete the same task.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/book">Open booking</Button>
              <Button href="/account" variant="ghost">Open My Account</Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
