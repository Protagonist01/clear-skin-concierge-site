'use client';

import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BellRing,
  CalendarCheck2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Info,
  MessageSquareQuote,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import {
  Reveal,
  StaggerGroup,
  StaggerItem,
} from '@/components/ui/ExperienceMotion';

interface BookingEngineProps {
  treatmentName: string;
  appointmentDate: string;
  appointmentTime: string;
  clientName: string;
  location: string;
  requestReference?: string;
}

interface TimelineEntry {
  label: string;
  body: string;
  stamp: string;
  icon: typeof CalendarCheck2;
  conditional?: boolean;
}

function parseAppointmentDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

function formatRelative(target: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const hour = target.getHours();
  const minute = target.getMinutes();
  const ampm = hour >= 12 ? 'pm' : 'am';
  const h12 = hour % 12 || 12;
  return `${target.getDate()} ${months[target.getMonth()]}, ${h12}:${minute
    .toString()
    .padStart(2, '0')}${ampm}`;
}

function formatTimeDisplay(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

function Calculator() {
  const [weeklyAppointments, setWeeklyAppointments] = useState(60);
  const [avgValue, setAvgValue] = useState(280);

  const noShowRate = 0.2;
  const weeklyLost = weeklyAppointments * noShowRate * avgValue;
  const monthlyLost = weeklyLost * 4.3;
  const conservativeRecovery = monthlyLost * 0.3;
  const optimisticRecovery = monthlyLost * 0.4;
  const threeAppointmentsMonthly = 3 * avgValue * 4.3;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-display text-[clamp(2rem,4vw,3rem)] leading-[0.95] tracking-[-0.06em] text-[color:var(--ink)]">
          What no-show recovery means for your month.
        </h3>
        <p className="mt-3 max-w-[560px] text-[14px] leading-7 text-[color:var(--ink-soft)]">
          Adjust the booking volume and average treatment value to estimate how
          much of the missed revenue the recovery sequence can realistically win back.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="quiet-panel p-5">
          <label className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
            Weekly appointments
          </label>
          <p className="mt-3 font-display text-[36px] leading-none tracking-[-0.06em] text-[color:var(--ink)]">
            {weeklyAppointments}
          </p>
          <input
            type="range"
            min="10"
            max="200"
            value={weeklyAppointments}
            onChange={(event) => setWeeklyAppointments(Number.parseInt(event.target.value, 10))}
            className="booking-slider mt-6"
          />
        </div>

        <div className="quiet-panel p-5">
          <label className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
            Average treatment value
          </label>
          <p className="mt-3 font-display text-[36px] leading-none tracking-[-0.06em] text-[color:var(--ink)]">
            £{avgValue}
          </p>
          <input
            type="range"
            min="120"
            max="550"
            value={avgValue}
            onChange={(event) => setAvgValue(Number.parseInt(event.target.value, 10))}
            className="booking-slider mt-6"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="soft-panel p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
            Currently at risk
          </p>
          <p className="mt-4 font-display text-[34px] leading-none tracking-[-0.06em] text-[color:var(--ink)]">
            £{Math.round(monthlyLost).toLocaleString()}
          </p>
          <p className="mt-2 text-[13px] leading-6 text-[color:var(--ink-soft)]">
            Estimated revenue slipping each month from missed slots.
          </p>
        </div>

        <div className="soft-panel p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
            Conservative recovery
          </p>
          <p className="mt-4 font-display text-[34px] leading-none tracking-[-0.06em] text-[color:var(--accent-deep)]">
            +£{Math.round(conservativeRecovery).toLocaleString()}
          </p>
          <p className="mt-2 text-[13px] leading-6 text-[color:var(--ink-soft)]">
            Based on a 30% recovery rate from the no-show follow-up sequence.
          </p>
        </div>

        <div className="soft-panel p-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
            Optimistic recovery
          </p>
          <p className="mt-4 font-display text-[34px] leading-none tracking-[-0.06em] text-[color:var(--accent-strong)]">
            +£{Math.round(optimisticRecovery).toLocaleString()}
          </p>
          <p className="mt-2 text-[13px] leading-6 text-[color:var(--ink-soft)]">
            A stronger outcome when the follow-up lands quickly and rebooking is frictionless.
          </p>
        </div>
      </div>

      <p className="text-[13px] leading-7 text-[color:var(--ink-soft)]">
        At this treatment value, recovering three appointments per week adds roughly{' '}
        <span className="font-medium text-[color:var(--ink)]">
          £{Math.round(threeAppointmentsMonthly).toLocaleString()}/month
        </span>.
      </p>
    </div>
  );
}

export default function BookingEngine({
  treatmentName,
  appointmentDate,
  appointmentTime,
  clientName,
  location,
  requestReference,
}: BookingEngineProps) {
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [productionNoteOpen, setProductionNoteOpen] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  const timestamps = useMemo(() => {
    const appointment = parseAppointmentDateTime(appointmentDate, appointmentTime);
    const reminder48h = new Date(appointment.getTime() - 48 * 60 * 60 * 1000);
    const reminder2h = new Date(appointment.getTime() - 2 * 60 * 60 * 1000);
    const followUp = new Date(appointment.getTime() + 2 * 24 * 60 * 60 * 1000);

    return {
      reminder48h: formatRelative(reminder48h),
      reminder2h: formatRelative(reminder2h),
      followUp: formatRelative(followUp),
    };
  }, [appointmentDate, appointmentTime]);

  const confirmedTimeline: TimelineEntry[] = [
    {
      label: 'Request received',
      body: `The clinic has logged your ${treatmentName} request and attached the preferred slot to your profile.`,
      stamp: 'Just now',
      icon: CalendarCheck2,
    },
    {
      label: 'Clinic confirmation',
      body: 'A coordinator confirms the slot or offers the nearest available match with preparation guidance.',
      stamp: 'During clinic hours',
      icon: BellRing,
    },
    {
      label: '48-hour reminder',
      body: 'Preparation notes and what to avoid before the confirmed appointment.',
      stamp: timestamps.reminder48h,
      icon: BellRing,
    },
    {
      label: '2-hour reminder',
      body: 'Arrival instructions, location details, and what to bring.',
      stamp: timestamps.reminder2h,
      icon: Clock3,
    },
    {
      label: 'Post-treatment follow-up',
      body: 'Homecare instructions and review request after your visit.',
      stamp: timestamps.followUp,
      icon: Sparkles,
    },
  ];

  const conditionalTimeline: TimelineEntry[] = [
    {
      label: 'No-show recovery',
      body: 'A personalised recovery message is drafted and sent automatically.',
      stamp: '4 hours after a missed slot',
      icon: MessageSquareQuote,
      conditional: true,
    },
    {
      label: 'Waitlist notification',
      body: 'The next waitlisted client is notified and offered the opening.',
      stamp: 'Immediately on cancellation',
      icon: BellRing,
      conditional: true,
    },
    {
      label: 'Re-engagement sequence',
      body: 'If 60+ days pass without rebooking, the clinic can restart outreach.',
      stamp: '60 days after inactivity',
      icon: TrendingUp,
      conditional: true,
    },
  ];

  const triggerNoshowSimulation = async () => {
    if (hasTriggered) {
      setSimulatorOpen((current) => !current);
      return;
    }

    setSimulatorOpen(true);
    setIsLoading(true);
    setHasTriggered(true);

    try {
      const response = await fetch('/api/noshow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientName, treatmentName, location }),
      });
      const data = await response.json();
      setRecoveryMessage(data.message);
    } catch {
      setRecoveryMessage(
        `${clientName}, we noticed you were unable to make your ${treatmentName} appointment today. We understand that schedules shift and there is no need to explain.\n\nYour treatment plan remains on file, and we have availability this week that may suit you better.\n\nWhenever you are ready, we are here. You can rebook at a time that works for you, and we will take it from there.\n\nThe Clear Skin Team`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <Reveal>
        <div className="soft-panel rounded-[2rem] p-6 sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="eyebrow">Care timeline</span>
              <h2 className="mt-5 font-display text-[clamp(2.4rem,4vw,3.8rem)] leading-[0.94] tracking-[-0.06em] text-[color:var(--ink)]">
                What happens after your request is sent.
              </h2>
              <p className="mt-3 max-w-[560px] text-[15px] leading-7 text-[color:var(--ink-soft)]">
                Here&apos;s how the clinic moves from request to confirmation,
                reminders, and aftercare once the slot is locked in.
              </p>
            </div>

            <div className="glass-pill px-4 py-3 font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
              {requestReference ? `${requestReference} · ` : ''}{appointmentDate} · {formatTimeDisplay(appointmentTime)} · {location}
            </div>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
            <StaggerGroup className="space-y-5" stagger={0.08}>
              {confirmedTimeline.map((entry) => {
                const Icon = entry.icon;

                return (
                  <StaggerItem key={entry.label}>
                    <div className="quiet-panel rounded-[1.6rem] p-5">
                      <div className="flex gap-4">
                        <span className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-[color:var(--accent-deep)]">
                          <Icon size={18} strokeWidth={1.9} />
                        </span>
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                            {entry.stamp}
                          </p>
                          <p className="mt-2 font-display text-[28px] leading-[0.96] tracking-[-0.04em] text-[color:var(--ink)]">
                            {entry.label}
                          </p>
                          <p className="mt-3 text-[14px] leading-6 text-[color:var(--ink-soft)]">
                            {entry.body}
                          </p>
                        </div>
                      </div>
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerGroup>

            <Reveal delay={0.08}>
              <div className="quiet-panel rounded-[1.7rem] p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                  Contingency logic
                </p>
                <p className="mt-3 font-display text-[30px] leading-[0.98] tracking-[-0.05em] text-[color:var(--ink)]">
                  If a confirmed appointment changes, the recovery flow takes over.
                </p>
                <div className="mt-6 space-y-4">
                  {conditionalTimeline.map((entry) => {
                    const Icon = entry.icon;

                    return (
                      <div
                        key={entry.label}
                        className="rounded-[1.25rem] border border-dashed border-[color:var(--line-strong)] bg-[color:rgba(255,250,244,0.46)] p-4"
                      >
                        <div className="flex gap-3">
                          <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-[color:rgba(171,109,70,0.22)] bg-[color:rgba(255,250,244,0.62)] text-[color:var(--muted)]">
                            <Icon size={16} strokeWidth={1.8} />
                          </span>
                          <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                              {entry.stamp}
                            </p>
                            <p className="mt-2 text-[17px] font-medium text-[color:var(--ink)]">
                              {entry.label}
                            </p>
                            <p className="mt-2 text-[14px] leading-6 text-[color:var(--ink-soft)]">
                              {entry.body}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </Reveal>

      <div className="mt-6 space-y-4">
        <div className="soft-panel rounded-[1.8rem] p-5">
          <button
            type="button"
            onClick={triggerNoshowSimulation}
            className="flex w-full items-center justify-between gap-4 text-left"
          >
            <div>
              <p className="font-display text-[28px] leading-none tracking-[-0.04em] text-[color:var(--ink)]">
                Simulate no-show recovery
              </p>
              <p className="mt-2 text-[14px] leading-6 text-[color:var(--ink-soft)]">
                Preview the message sequence a client would receive if the confirmed appointment is missed.
              </p>
            </div>
            <span className="glass-pill flex h-10 w-10 items-center justify-center text-[color:var(--ink)]">
              {simulatorOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </span>
          </button>

          <AnimatePresence initial={false}>
            {simulatorOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-6 border-t border-[color:var(--line)] pt-6">
                  <p className="text-[14px] leading-7 text-[color:var(--ink-soft)]">
                    {clientName} missed their {treatmentName} appointment at{' '}
                    <span className="font-medium text-[color:var(--ink)]">
                      {formatTimeDisplay(appointmentTime)}
                    </span>.
                    The workflow detects the no-show and drafts this recovery message four hours later.
                  </p>

                  {isLoading && (
                    <div className="mt-5 flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <span className="booking-dot h-2.5 w-2.5 rounded-full bg-[color:var(--accent-strong)]" />
                        <span className="booking-dot h-2.5 w-2.5 rounded-full bg-[color:var(--accent-strong)] [animation-delay:0.18s]" />
                        <span className="booking-dot h-2.5 w-2.5 rounded-full bg-[color:var(--accent-strong)] [animation-delay:0.36s]" />
                      </div>
                      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                        Composing recovery message
                      </span>
                    </div>
                  )}

                  {recoveryMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35 }}
                      className="mt-6 grid gap-4 lg:grid-cols-[0.88fr_0.12fr]"
                    >
                      <div className="quiet-panel rounded-[1.6rem] p-5">
                        <div className="border-b border-[color:var(--line)] pb-4">
                          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
                            From Clear Skin {location}
                          </p>
                          <p className="mt-2 font-display text-[24px] leading-none tracking-[-0.04em] text-[color:var(--ink)]">
                            Let&apos;s find a new time.
                          </p>
                        </div>
                        <div className="mt-4 space-y-4 text-[14px] leading-7 text-[color:var(--ink-soft)]">
                          {recoveryMessage.split('\n\n').map((paragraph, index) => (
                            <p key={`${paragraph}-${index}`}>{paragraph}</p>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-end lg:items-start lg:justify-end">
                        <Button href="/book" className="w-full lg:w-auto">
                          Rebook Now
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    Benchmark: 20-40% of no-shows rebook within 48 hours when contacted quickly.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="soft-panel rounded-[1.8rem] p-5">
          <button
            type="button"
            onClick={() => setCalculatorOpen((current) => !current)}
            className="flex w-full items-center justify-between gap-4 text-left"
          >
            <div>
              <p className="font-display text-[28px] leading-none tracking-[-0.04em] text-[color:var(--ink)]">
                See the monthly impact
              </p>
              <p className="mt-2 text-[14px] leading-6 text-[color:var(--ink-soft)]">
                Estimate the revenue recovered when missed appointments are handled automatically.
              </p>
            </div>
            <span className="glass-pill flex h-10 w-10 items-center justify-center text-[color:var(--ink)]">
              {calculatorOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </span>
          </button>

          <AnimatePresence initial={false}>
            {calculatorOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-6 border-t border-[color:var(--line)] pt-6">
                  <Calculator />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="soft-panel rounded-[1.8rem] p-5">
          <button
            type="button"
            onClick={() => setProductionNoteOpen((current) => !current)}
            className="flex w-full items-center justify-between gap-4 text-left"
          >
            <div className="flex items-start gap-4">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--accent-soft)] text-[color:var(--accent-deep)]">
                <Info size={18} strokeWidth={1.8} />
              </span>
              <div>
                <p className="font-display text-[28px] leading-none tracking-[-0.04em] text-[color:var(--ink)]">
                  How this works in production
                </p>
                <p className="mt-2 text-[14px] leading-6 text-[color:var(--ink-soft)]">
                  A plain-language view of what the agent would monitor and automate behind the scenes.
                </p>
              </div>
            </div>
            <span className="glass-pill flex h-10 w-10 items-center justify-center text-[color:var(--ink)]">
              {productionNoteOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </span>
          </button>

          <AnimatePresence initial={false}>
            {productionNoteOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-6 border-t border-[color:var(--line)] pt-6">
                  <p className="text-[14px] leading-7 text-[color:var(--ink-soft)]">
                    In an operational setup, this layer monitors the booking
                    feed, detects no-shows automatically, sends personalised
                    recovery messages by SMS or email, manages the waitlist,
                    and keeps every interaction tied to the client record. The
                    AI shapes the message while the workflow handles the timing.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        .booking-slider {
          appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 999px;
          background: rgba(95, 72, 54, 0.14);
          outline: none;
        }

        .booking-slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 999px;
          background: var(--accent-strong);
          border: 2px solid rgba(255, 250, 244, 0.92);
          box-shadow: 0 4px 12px rgba(21, 19, 18, 0.16);
          cursor: pointer;
        }

        .booking-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 999px;
          background: var(--accent-strong);
          border: 2px solid rgba(255, 250, 244, 0.92);
          box-shadow: 0 4px 12px rgba(21, 19, 18, 0.16);
          cursor: pointer;
        }

        .booking-dot {
          animation: booking-dot-pulse 1.2s ease-in-out infinite;
        }

        @keyframes booking-dot-pulse {
          0%, 80%, 100% {
            opacity: 0.3;
            transform: scale(0.84);
          }
          40% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}
