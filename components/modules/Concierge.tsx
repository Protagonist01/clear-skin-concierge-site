'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePathname, useRouter } from 'next/navigation'
import {
  ArrowRight,
  CalendarClock,
  Check,
  Clock3,
  MapPin,
  MessageCircle,
  Send,
  ShoppingBag,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { TREATMENTS } from '@/data/treatments'
import { openQuiz } from '@/components/modules/SkinQuiz'
import { addProductsToBag, hydrateBag, readBag, removeBagItem } from '@/lib/bag'
import {
  CLINIC_LOCATIONS,
  type AvailableDate,
  type LocationId,
  type TimeSlotOption,
} from '@/lib/booking'
import { findConcernRule, findConcernRules } from '@/lib/concierge/expert-rules'
import type {
  ConciergeAction,
  ConciergeAppState,
  ConciergeChatMessage,
  ConciergeDecision,
  ConciergeSuggestion,
} from '@/lib/concierge/types'

interface LocalMessage extends ConciergeChatMessage {
  id: string
  decision?: ConciergeDecision
}

interface BookingDetails {
  name: string
  email: string
  phone: string
  concern: string
  notes: string
}

interface BookingDraft {
  treatmentSlug: string
  locationId: LocationId | ''
  appointmentDate: string
  appointmentTime: string
  details: BookingDetails
}

interface BookingResponse {
  success: boolean
  booking?: {
    reference: string
    treatmentName: string
    locationName: string
    appointmentDate: string
    appointmentTime: string
  }
  syncMessage?: string
  error?: string
}

type ProductResult = NonNullable<ConciergeAction['payload']['products']>[number]
type TreatmentResult = NonNullable<ConciergeAction['payload']['treatments']>[number]

const CHAT_STORAGE_KEY = 'clear-skin-concierge-history-v5'

const EMPTY_DETAILS: BookingDetails = {
  name: '',
  email: '',
  phone: '',
  concern: '',
  notes: '',
}

const WELCOME_MESSAGE: LocalMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'Hello, I am Claire. Tell me the skin concern, treatment, or booking you want to handle.',
}

const WELCOME_SUGGESTIONS: ConciergeSuggestion[] = [
  { label: 'Find a routine', type: 'education', prompt: 'Help me find the right skincare routine.' },
  { label: 'Book consultation', type: 'booking', prompt: 'Help me book a consultation.' },
  { label: 'Start quiz', type: 'education', prompt: 'I am not sure where to start. Open the skin quiz.' },
]

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function cleanText(input: string) {
  return input
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/^[-*]\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
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

function pageLabelForPath(pathname: string) {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/cart')) return 'cart'
  if (pathname.startsWith('/checkout')) return 'checkout'
  if (pathname.startsWith('/skincare')) return 'skincare'
  if (pathname.startsWith('/treatments')) return 'treatments'
  if (pathname.startsWith('/about')) return 'about'
  if (pathname.startsWith('/account')) return 'account'
  return pathname.replace(/^\/+/, '').replace(/[-/]+/g, ' ') || 'current page'
}

function buildLastResponseState(messages: LocalMessage[]): ConciergeAppState['lastResponse'] {
  const lastDecisionMessage = [...messages].reverse().find((message) => message.decision)
  const decision = lastDecisionMessage?.decision
  const action = decision?.action
  if (!decision) return undefined

  const treatmentSlug = action?.payload.treatmentSlug
  const actionTreatment = treatmentSlug
    ? TREATMENTS.find((treatment) => treatment.slug === treatmentSlug)
    : undefined
  const treatmentNames = [
    ...(action?.payload.treatments?.map((treatment) => treatment.name) || []),
    ...(actionTreatment ? [actionTreatment.name] : []),
  ]
  const treatmentSlugs = [
    ...(action?.payload.treatments?.map((treatment) => treatment.slug) || []),
    ...(actionTreatment ? [actionTreatment.slug] : []),
  ]
  const concernRules = findConcernRules(decision.reply)
  const concernRule = concernRules[0] ?? findConcernRule(decision.reply)
  const recommendationKind = action?.type === 'show_products'
    ? 'product'
    : action?.type === 'show_treatments'
      ? 'treatment'
      : action?.type === 'start_booking'
        ? 'booking'
        : action?.type === 'open_quiz'
          ? 'quiz'
          : action?.type === 'navigate'
            ? 'navigation'
            : action?.type === 'add_to_cart' || action?.type === 'remove_from_cart'
              ? 'cart'
              : 'advisory'

  return {
    reply: decision.reply,
    actionType: action?.type,
    actionLabel: action?.label,
    concern: concernRule?.concern,
    concerns: concernRules.map((rule) => rule.concern),
    recommendationKind,
    productNames: action?.payload.productNames || action?.payload.products?.map((product) => product.name),
    productSlugs: action?.payload.productSlugs || action?.payload.products?.map((product) => product.slug),
    treatmentNames: treatmentNames.length ? treatmentNames : undefined,
    treatmentSlugs: treatmentSlugs.length ? treatmentSlugs : undefined,
    href: action?.payload.href,
    quizMode: action?.payload.quizMode,
  }
}

function productAction(product: ProductResult): ConciergeAction {
  return {
    type: 'add_to_cart',
    label: `Add ${product.name}`,
    requiresConfirmation: true,
    payload: {
      products: [product],
      productNames: [product.name],
      productSlugs: [product.slug],
    },
  }
}

function removeProductAction(product: ProductResult): ConciergeAction {
  return {
    type: 'remove_from_cart',
    label: `Remove ${product.name}`,
    requiresConfirmation: true,
    payload: {
      products: [product],
      productNames: [product.name],
      productSlugs: [product.slug],
    },
  }
}

function bookingAction(treatment?: TreatmentResult): ConciergeAction {
  return {
    type: 'start_booking',
    label: treatment ? `Book ${treatment.name}` : 'Start booking',
    requiresConfirmation: true,
    payload: {
      treatmentSlug: treatment?.slug,
    },
  }
}

function ResultButton({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg border border-[color:var(--line)] bg-[rgba(255,250,244,0.74)] px-3 text-[12px] font-medium text-[color:var(--ink)] transition hover:border-[color:var(--accent-strong)]"
    >
      {children}
    </button>
  )
}

function TypingDots() {
  return (
    <div className="inline-flex items-center gap-1.5" aria-label="Claire is typing">
      <span className="concierge-dot" />
      <span className="concierge-dot [animation-delay:0.15s]" />
      <span className="concierge-dot [animation-delay:0.3s]" />
    </div>
  )
}

export default function Concierge() {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<LocalMessage[]>([WELCOME_MESSAGE])
  const [historyReady, setHistoryReady] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [pendingAction, setPendingAction] = useState<ConciergeAction | null>(null)
  const [activity, setActivity] = useState('')
  const [bookingDraft, setBookingDraft] = useState<BookingDraft | null>(null)
  const [availableDates, setAvailableDates] = useState<AvailableDate[]>([])
  const [availableSlots, setAvailableSlots] = useState<TimeSlotOption[]>([])
  const [availabilityLoading, setAvailabilityLoading] = useState(false)
  const [availabilityError, setAvailabilityError] = useState('')
  const [bookingSubmitting, setBookingSubmitting] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const conversationVersionRef = useRef(0)

  const visibleSuggestions = useMemo(() => {
    const latestDecision = [...messages].reverse().find((message) => message.decision)?.decision
    return latestDecision?.suggestions?.length ? latestDecision.suggestions : WELCOME_SUGGESTIONS
  }, [messages])

  const canClearChat = messages.length > 1 || Boolean(pendingAction || bookingDraft || activity || input.trim())

  const selectedTreatment = useMemo(
    () => TREATMENTS.find((item) => item.slug === bookingDraft?.treatmentSlug) ?? null,
    [bookingDraft?.treatmentSlug],
  )

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CHAT_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as LocalMessage[]
        const validMessages = Array.isArray(parsed)
          ? parsed.filter((message) => (
              message
              && typeof message.id === 'string'
              && (message.role === 'assistant' || message.role === 'user')
              && typeof message.content === 'string'
            ))
          : []

        if (validMessages.length) {
          setMessages(validMessages.map((message) => ({
            ...message,
            content: cleanText(message.content),
          })))
        }
      }
    } catch {
      window.localStorage.removeItem(CHAT_STORAGE_KEY)
    } finally {
      setHistoryReady(true)
    }
  }, [])

  useEffect(() => {
    if (!historyReady) return
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-40)))
  }, [historyReady, messages])

  useEffect(() => {
    function syncHistory(event: StorageEvent) {
      if (event.key !== CHAT_STORAGE_KEY) return

      if (!event.newValue) {
        setMessages([WELCOME_MESSAGE])
        setPendingAction(null)
        setBookingDraft(null)
        setActivity('')
        setInput('')
        return
      }

      try {
        const parsed = JSON.parse(event.newValue) as LocalMessage[]
        if (Array.isArray(parsed) && parsed.length) {
          setMessages(parsed.map((message) => ({ ...message, content: cleanText(message.content) })))
        }
      } catch {
        // Ignore malformed history from another tab.
      }
    }

    window.addEventListener('storage', syncHistory)
    return () => window.removeEventListener('storage', syncHistory)
  }, [])

  useEffect(() => {
    function refreshWhenVisible() {
      if (document.visibilityState === 'visible') {
        router.refresh()
      }
    }

    window.addEventListener('focus', refreshWhenVisible)
    document.addEventListener('visibilitychange', refreshWhenVisible)

    return () => {
      window.removeEventListener('focus', refreshWhenVisible)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [router])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, pendingAction, activity, bookingDraft, availabilityLoading, availableDates, availableSlots])

  useEffect(() => {
    if (!bookingDraft?.locationId) {
      setAvailableDates([])
      setAvailableSlots([])
      setAvailabilityLoading(false)
      setAvailabilityError('')
      return
    }

    const locationId = bookingDraft.locationId
    const appointmentDate = bookingDraft.appointmentDate
    const controller = new AbortController()
    let active = true

    async function loadAvailability(showLoading = true) {
      if (showLoading) setAvailabilityLoading(true)
      setAvailabilityError('')

      const params = new URLSearchParams({ locationId })
      if (appointmentDate) {
        params.set('date', appointmentDate)
      }

      try {
        const response = await fetch(`/api/schedule/availability?${params.toString()}`, {
          signal: controller.signal,
        })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload?.error || 'Availability is not loading right now.')
        }

        if (!active) return

        const nextDates = Array.isArray(payload?.dates) ? payload.dates as AvailableDate[] : []
        const nextSlots = Array.isArray(payload?.slots) ? payload.slots as TimeSlotOption[] : []

        setAvailableDates(nextDates)
        setAvailableSlots(nextSlots)

        if (typeof payload?.effectiveDate === 'string' && payload.effectiveDate !== appointmentDate) {
          setBookingDraft((current) => current
            ? { ...current, appointmentDate: payload.effectiveDate, appointmentTime: '' }
            : current)
        }
      } catch (error) {
        if (!active || controller.signal.aborted) return
        setAvailableDates([])
        setAvailableSlots([])
        setAvailabilityError(error instanceof Error ? error.message : 'Availability is not loading right now.')
      } finally {
        if (active && showLoading) setAvailabilityLoading(false)
      }
    }

    void loadAvailability()
    const interval = window.setInterval(() => {
      void loadAvailability(false)
    }, 30000)

    return () => {
      active = false
      controller.abort()
      window.clearInterval(interval)
    }
  }, [bookingDraft?.locationId, bookingDraft?.appointmentDate])

  useEffect(() => {
    if (!bookingDraft || !availableSlots.length) return
    const currentSlotIsOpen = availableSlots.some((slot) => (
      slot.time === bookingDraft.appointmentTime && slot.status !== 'booked'
    ))
    if (currentSlotIsOpen) return

    const firstOpenSlot = availableSlots.find((slot) => slot.status !== 'booked')?.time || ''
    setBookingDraft((current) => current ? { ...current, appointmentTime: firstOpenSlot } : current)
  }, [availableSlots, bookingDraft?.appointmentTime, bookingDraft])

  function appendAssistant(content: string, decision?: ConciergeDecision) {
    setMessages((current) => [
      ...current,
      {
        id: createId(),
        role: 'assistant',
        content: cleanText(content),
        decision,
      },
    ])
  }

  function clearChatHistory() {
    if (!canClearChat) return
    const confirmed = window.confirm('Clear this concierge chat history?')
    if (!confirmed) return

    conversationVersionRef.current += 1
    setMessages([WELCOME_MESSAGE])
    setInput('')
    setPendingAction(null)
    setActivity('')
    setBookingDraft(null)
    setAvailableDates([])
    setAvailableSlots([])
    setAvailabilityLoading(false)
    setAvailabilityError('')
    setBookingSubmitting(false)
    setBookingError('')
    window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify([WELCOME_MESSAGE]))
  }

  function runNavigation(href: string) {
    if (/^https?:\/\//.test(href)) {
      window.open(href, '_blank', 'noopener,noreferrer')
      return
    }

    router.push(href)
  }

  function startBookingFromAction(action: ConciergeAction) {
    if (action.payload.calendlyUrl && /^https:\/\//.test(action.payload.calendlyUrl)) {
      window.open(action.payload.calendlyUrl, '_blank', 'noopener,noreferrer')
      appendAssistant('I have opened the Calendly booking handoff. Choose the slot that works best for you there.')
      return
    }

    const treatmentSlug = action.payload.treatmentSlug || ''
    const locationId = CLINIC_LOCATIONS.some((location) => location.id === action.payload.locationId)
      ? action.payload.locationId as LocationId
      : ''

    setBookingError('')
    setBookingDraft({
      treatmentSlug,
      locationId,
      appointmentDate: '',
      appointmentTime: '',
      details: { ...EMPTY_DETAILS },
    })
    setIsOpen(true)
  }

  async function executeAction(action: ConciergeAction) {
    setActivity('')

    if (action.type === 'navigate') {
      const href = action.payload.href
      if (href) {
        setActivity(`Opening ${action.label.toLowerCase()}...`)
        runNavigation(href)
      }
      return
    }

    if (action.type === 'open_quiz') {
      openQuiz(action.payload.quizMode || 'product')
      return
    }

    if (action.type === 'start_booking') {
      startBookingFromAction(action)
      return
    }

    if (action.type === 'add_to_cart') {
      const productNames = action.payload.productNames || []
      if (!productNames.length) return

      setActivity('Updating your bag...')
      await addProductsToBag(productNames)
      router.refresh()
      appendAssistant(`Added ${productNames.join(' and ')} to your bag.`)
      return
    }

    if (action.type === 'remove_from_cart') {
      const productSlugs = action.payload.productSlugs || []
      if (!productSlugs.length) return

      setActivity('Updating your bag...')
      for (const slug of productSlugs) {
        await removeBagItem(slug)
      }
      router.refresh()
      appendAssistant(`Removed ${action.payload.productNames?.join(' and ') || 'the selected item'} from your bag.`)
    }
  }

  async function handleAction(action: ConciergeAction) {
    if (action.requiresConfirmation) {
      setPendingAction(action)
      return
    }

    try {
      await executeAction(action)
    } catch (error) {
      appendAssistant(error instanceof Error ? error.message : 'I could not complete that just now.')
    } finally {
      setActivity('')
    }
  }

  async function confirmPendingAction() {
    if (!pendingAction) return
    const action = pendingAction
    setPendingAction(null)

    try {
      await executeAction(action)
    } catch (error) {
      appendAssistant(error instanceof Error ? error.message : 'I could not complete that just now.')
    } finally {
      setActivity('')
    }
  }

  async function sendMessage(nextPrompt?: string) {
    const prompt = (nextPrompt ?? input).trim()
    if (!prompt || isSending) return

    const requestVersion = conversationVersionRef.current + 1
    conversationVersionRef.current = requestVersion
    const nextUserMessage: LocalMessage = { id: createId(), role: 'user', content: prompt }
    const history = [...messages, nextUserMessage].map(({ role, content }) => ({ role, content }))
    const pendingActionSnapshot = pendingAction

    setMessages((current) => [...current, nextUserMessage])
    setInput('')
    setPendingAction(null)
    setIsSending(true)

    try {
      const bagItems = await hydrateBag().catch(() => readBag())
      const appState: ConciergeAppState = {
        currentPath: pathname,
        currentPageLabel: pageLabelForPath(pathname),
        cart: {
          count: bagItems.reduce((total, item) => total + item.quantity, 0),
          items: bagItems.map((item) => ({
            slug: item.slug,
            name: item.name,
            concern: item.concern,
            price: item.price,
            quantity: item.quantity,
          })),
        },
        booking: {
          active: Boolean(bookingDraft),
          treatmentSlug: bookingDraft?.treatmentSlug || undefined,
          treatmentName: selectedTreatment?.name,
          locationId: bookingDraft?.locationId || undefined,
          appointmentDate: bookingDraft?.appointmentDate || undefined,
          appointmentTime: bookingDraft?.appointmentTime || undefined,
        },
        pendingAction: pendingActionSnapshot || undefined,
        lastResponse: buildLastResponseState(messages),
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          currentPath: pathname,
          appState,
        }),
      })

      const decision = await response.json() as ConciergeDecision
      if (!response.ok) throw new Error(decision.reply || 'The concierge could not respond.')
      if (requestVersion !== conversationVersionRef.current) return

      const assistantMessage: LocalMessage = {
        id: createId(),
        role: 'assistant',
        content: cleanText(decision.reply),
        decision: {
          ...decision,
          reply: cleanText(decision.reply),
        },
      }
      setMessages((current) => [...current, assistantMessage])

      if (decision.action && !decision.action.requiresConfirmation) {
        void handleAction(decision.action)
      } else if (decision.action?.requiresConfirmation) {
        setPendingAction(decision.action)
      }
    } catch (error) {
      if (requestVersion !== conversationVersionRef.current) return
      appendAssistant(error instanceof Error ? error.message : 'I could not respond just now. Please try again.')
    } finally {
      if (requestVersion === conversationVersionRef.current) {
        setIsSending(false)
      }
    }
  }

  async function submitBookingRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!bookingDraft) return

    setBookingSubmitting(true)
    setBookingError('')

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          treatmentSlug: bookingDraft.treatmentSlug,
          locationId: bookingDraft.locationId,
          appointmentDate: bookingDraft.appointmentDate,
          appointmentTime: bookingDraft.appointmentTime,
          details: bookingDraft.details,
        }),
      })

      const payload = await response.json() as BookingResponse
      if (!response.ok) throw new Error(payload.error || 'Unable to request the appointment.')

      const booking = payload.booking
      appendAssistant(
        booking
          ? `Request ${booking.reference} is in. ${booking.treatmentName} at ${booking.locationName}, ${formatDateLabel(booking.appointmentDate)} at ${formatTimeLabel(booking.appointmentTime)}. The clinic will confirm the slot.`
          : 'Your appointment request is in. The clinic will confirm the slot.',
      )
      setBookingDraft(null)
      setAvailableDates([])
      setAvailableSlots([])
      router.refresh()
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Unable to request the appointment.')
    } finally {
      setBookingSubmitting(false)
    }
  }

  function updateBookingDetails(nextDetails: Partial<BookingDetails>) {
    setBookingDraft((current) => current
      ? { ...current, details: { ...current.details, ...nextDetails } }
      : current)
  }

  function renderProducts(products: ProductResult[]) {
    return (
      <div className="mt-3 space-y-2">
        {products.map((product) => (
          <div key={product.slug} className="rounded-xl border border-[color:var(--line)] bg-[rgba(255,250,244,0.72)] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-[22px] leading-none text-[color:var(--ink)]">{product.name}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--muted)]">{product.concern} / {product.price}</p>
              </div>
              <ShoppingBag size={16} className="mt-1 text-[color:var(--accent-deep)]" />
            </div>
            <p className="mt-2 text-[12px] leading-5 text-[color:var(--ink-soft)]">{product.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ResultButton onClick={() => runNavigation(`/skincare/${product.slug}`)}>
                View
                <ArrowRight size={12} />
              </ResultButton>
              <ResultButton onClick={() => setPendingAction(productAction(product))}>
                Add
                <Check size={12} />
              </ResultButton>
              <ResultButton onClick={() => setPendingAction(removeProductAction(product))}>
                Remove
              </ResultButton>
            </div>
          </div>
        ))}
      </div>
    )
  }

  function renderTreatments(treatments: TreatmentResult[]) {
    return (
      <div className="mt-3 space-y-2">
        {treatments.map((treatment) => (
          <div key={treatment.slug} className="rounded-xl border border-[color:var(--line)] bg-[rgba(255,250,244,0.72)] p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-[22px] leading-none text-[color:var(--ink)]">{treatment.name}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[color:var(--muted)]">{treatment.category} / {treatment.price}</p>
              </div>
              <CalendarClock size={16} className="mt-1 text-[color:var(--accent-deep)]" />
            </div>
            <p className="mt-2 text-[12px] leading-5 text-[color:var(--ink-soft)]">{treatment.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <ResultButton onClick={() => runNavigation(`/treatments/${treatment.slug}`)}>
                View
                <ArrowRight size={12} />
              </ResultButton>
              <ResultButton onClick={() => setPendingAction(bookingAction(treatment))}>
                Book
                <CalendarClock size={12} />
              </ResultButton>
            </div>
          </div>
        ))}
      </div>
    )
  }

  function renderBookingPanel() {
    if (!bookingDraft) return null

    const canSubmit = Boolean(
      bookingDraft.treatmentSlug
      && bookingDraft.locationId
      && bookingDraft.appointmentDate
      && bookingDraft.appointmentTime
      && bookingDraft.details.name.trim()
      && bookingDraft.details.email.trim()
      && bookingDraft.details.phone.trim(),
    )

    return (
      <div className="rounded-2xl border border-[rgba(171,109,70,0.28)] bg-[rgba(255,250,244,0.78)] p-3 shadow-[0_14px_34px_rgba(21,19,18,0.06)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-[26px] leading-none text-[color:var(--ink)]">Booking</p>
            <p className="mt-1 text-[12px] leading-5 text-[color:var(--ink-soft)]">
              {selectedTreatment ? selectedTreatment.name : 'Choose a treatment'}, then pick a clinic and slot.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setBookingDraft(null)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[color:var(--muted)] transition hover:bg-[rgba(21,19,18,0.06)]"
            aria-label="Close booking"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[12px] font-medium text-[color:var(--ink)]">
              <Sparkles size={14} />
              Treatment
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {TREATMENTS.map((treatment) => (
                <button
                  key={treatment.slug}
                  type="button"
                  onClick={() => setBookingDraft((current) => current
                    ? { ...current, treatmentSlug: treatment.slug }
                    : current)}
                  className={`rounded-lg border p-3 text-left text-[12px] leading-5 transition ${
                    bookingDraft.treatmentSlug === treatment.slug
                      ? 'border-[color:var(--accent-strong)] bg-[rgba(199,155,115,0.16)] text-[color:var(--ink)]'
                      : 'border-[color:var(--line)] bg-[rgba(255,255,255,0.36)] text-[color:var(--ink-soft)] hover:border-[color:var(--accent-strong)]'
                  }`}
                >
                  <span className="block font-medium text-[color:var(--ink)]">{treatment.name}</span>
                  <span className="block text-[11px]">{treatment.price}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 text-[12px] font-medium text-[color:var(--ink)]">
              <MapPin size={14} />
              Clinic
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {CLINIC_LOCATIONS.map((location) => (
                <button
                  key={location.id}
                  type="button"
                  onClick={() => setBookingDraft((current) => current
                    ? { ...current, locationId: location.id, appointmentDate: '', appointmentTime: '' }
                    : current)}
                  className={`rounded-lg border p-3 text-left text-[12px] leading-5 transition ${
                    bookingDraft.locationId === location.id
                      ? 'border-[color:var(--accent-strong)] bg-[rgba(199,155,115,0.16)] text-[color:var(--ink)]'
                      : 'border-[color:var(--line)] bg-[rgba(255,255,255,0.36)] text-[color:var(--ink-soft)] hover:border-[color:var(--accent-strong)]'
                  }`}
                >
                  <span className="block font-medium text-[color:var(--ink)]">{location.name}</span>
                  <span className="block text-[11px]">{location.hours}</span>
                </button>
              ))}
            </div>
          </div>

          {bookingDraft.locationId && (
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[12px] font-medium text-[color:var(--ink)]">
                  <Clock3 size={14} />
                  Slot
                </div>
                {availabilityLoading && <TypingDots />}
              </div>

              {availabilityError && (
                <p className="mb-2 text-[12px] leading-5 text-[color:#9f3d32]">{availabilityError}</p>
              )}

              <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                {availableDates.map((date) => (
                  <button
                    key={date.date}
                    type="button"
                    onClick={() => setBookingDraft((current) => current
                      ? { ...current, appointmentDate: date.date, appointmentTime: '' }
                      : current)}
                    className={`min-w-[74px] rounded-lg border p-2 text-left transition ${
                      bookingDraft.appointmentDate === date.date
                        ? 'border-[color:var(--accent-strong)] bg-[rgba(199,155,115,0.16)]'
                        : 'border-[color:var(--line)] bg-[rgba(255,255,255,0.36)] hover:border-[color:var(--accent-strong)]'
                    }`}
                  >
                    <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-[color:var(--muted)]">{date.day}</span>
                    <span className="block font-display text-[24px] leading-none text-[color:var(--ink)]">{date.label}</span>
                    <span className="block text-[11px] text-[color:var(--ink-soft)]">{date.month}</span>
                  </button>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={slot.status === 'booked'}
                    onClick={() => setBookingDraft((current) => current
                      ? { ...current, appointmentTime: slot.time }
                      : current)}
                    className={`rounded-lg border p-2 text-left text-[12px] transition ${
                      bookingDraft.appointmentTime === slot.time
                        ? 'border-[color:var(--accent-strong)] bg-[rgba(199,155,115,0.16)] text-[color:var(--ink)]'
                        : 'border-[color:var(--line)] bg-[rgba(255,255,255,0.36)] text-[color:var(--ink-soft)] hover:border-[color:var(--accent-strong)]'
                    } ${slot.status === 'booked' ? 'cursor-not-allowed opacity-45' : ''}`}
                  >
                    <span className="block font-medium text-[color:var(--ink)]">{formatTimeLabel(slot.time)}</span>
                    <span className="block text-[11px]">{slot.status === 'last_slot' ? 'Last slot' : slot.status === 'booked' ? 'Booked' : 'Open'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={submitBookingRequest}>
            <div className="mb-2 flex items-center gap-2 text-[12px] font-medium text-[color:var(--ink)]">
              <UserRound size={14} />
              Contact
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                type="text"
                value={bookingDraft.details.name}
                onChange={(event) => updateBookingDetails({ name: event.target.value })}
                className="min-h-[42px] rounded-lg border border-[color:var(--line)] bg-[rgba(255,255,255,0.5)] px-3 text-[13px] text-[color:var(--ink)] outline-none focus:border-[color:var(--accent-strong)]"
                placeholder="Full name"
                required
              />
              <input
                type="email"
                value={bookingDraft.details.email}
                onChange={(event) => updateBookingDetails({ email: event.target.value })}
                className="min-h-[42px] rounded-lg border border-[color:var(--line)] bg-[rgba(255,255,255,0.5)] px-3 text-[13px] text-[color:var(--ink)] outline-none focus:border-[color:var(--accent-strong)]"
                placeholder="Email"
                required
              />
              <input
                type="tel"
                value={bookingDraft.details.phone}
                onChange={(event) => updateBookingDetails({ phone: event.target.value })}
                className="min-h-[42px] rounded-lg border border-[color:var(--line)] bg-[rgba(255,255,255,0.5)] px-3 text-[13px] text-[color:var(--ink)] outline-none focus:border-[color:var(--accent-strong)]"
                placeholder="Phone"
                required
              />
              <input
                type="text"
                value={bookingDraft.details.concern}
                onChange={(event) => updateBookingDetails({ concern: event.target.value })}
                className="min-h-[42px] rounded-lg border border-[color:var(--line)] bg-[rgba(255,255,255,0.5)] px-3 text-[13px] text-[color:var(--ink)] outline-none focus:border-[color:var(--accent-strong)]"
                placeholder="Primary concern"
              />
              <textarea
                value={bookingDraft.details.notes}
                onChange={(event) => updateBookingDetails({ notes: event.target.value })}
                className="min-h-[72px] rounded-lg border border-[color:var(--line)] bg-[rgba(255,255,255,0.5)] px-3 py-2 text-[13px] text-[color:var(--ink)] outline-none focus:border-[color:var(--accent-strong)] sm:col-span-2"
                placeholder="Notes"
              />
            </div>

            {bookingError && (
              <p className="mt-3 text-[12px] leading-5 text-[color:#9f3d32]">{bookingError}</p>
            )}

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setBookingDraft(null)}
                className="inline-flex min-h-[42px] flex-1 items-center justify-center rounded-lg border border-[color:var(--line)] px-4 text-[13px] font-medium text-[color:var(--ink)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit || bookingSubmitting}
                className="inline-flex min-h-[42px] flex-1 items-center justify-center rounded-lg bg-[color:var(--ink)] px-4 text-[13px] font-medium text-[color:var(--chalk)] transition disabled:opacity-45"
              >
                {bookingSubmitting ? <TypingDots /> : 'Request slot'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-x-2 bottom-3 isolate z-[9999] flex flex-col items-end pb-[env(safe-area-inset-bottom)] sm:inset-x-auto sm:right-4 sm:bottom-4">
      <AnimatePresence>
        {isOpen && (
          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="mb-3 flex h-[82vh] max-h-[760px] w-full flex-col overflow-hidden rounded-[1.5rem] border border-[rgba(95,72,54,0.18)] bg-[rgba(255,250,244,0.94)] shadow-[0_28px_90px_rgba(21,19,18,0.18)] backdrop-blur-2xl sm:h-[700px] sm:w-[520px] lg:w-[560px]"
            aria-label="Clear Skin concierge"
          >
            <header className="border-b border-[color:var(--line)] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--ink)] text-[color:var(--chalk)]">
                    <Sparkles size={17} strokeWidth={1.8} />
                  </span>
                  <div>
                    <p className="font-display text-[27px] leading-none text-[color:var(--ink)]">Claire</p>
                    <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[color:var(--muted)]">Clear Skin concierge</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={clearChatHistory}
                    disabled={!canClearChat}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[color:var(--ink-soft)] transition hover:bg-[rgba(21,19,18,0.06)] disabled:cursor-not-allowed disabled:opacity-35"
                    aria-label="Clear concierge chat history"
                    title="Clear chat"
                  >
                    <Trash2 size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[color:var(--ink-soft)] transition hover:bg-[rgba(21,19,18,0.06)]"
                    aria-label="Close concierge"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
              {messages.map((message) => (
                <div key={message.id} className={message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div className={message.role === 'user'
                    ? 'max-w-[82%] rounded-2xl bg-[color:var(--ink)] px-4 py-3 text-[13px] leading-6 text-[color:var(--chalk)]'
                    : 'max-w-[92%] rounded-2xl border border-[color:var(--line)] bg-[rgba(255,255,255,0.46)] px-4 py-3 text-[13px] leading-6 text-[color:var(--ink-soft)]'}
                  >
                    <p className="whitespace-pre-line">{cleanText(message.content)}</p>
                    {message.decision?.action?.payload.products && renderProducts(message.decision.action.payload.products)}
                    {message.decision?.action?.payload.treatments && renderTreatments(message.decision.action.payload.treatments)}
                  </div>
                </div>
              ))}

              {isSending && (
                <div className="flex justify-start">
                  <div className="inline-flex items-center rounded-2xl border border-[color:var(--line)] bg-[rgba(255,255,255,0.46)] px-4 py-3 text-[13px] text-[color:var(--ink-soft)]">
                    <TypingDots />
                  </div>
                </div>
              )}

              {bookingDraft && renderBookingPanel()}

              {pendingAction && (
                <div className="rounded-2xl border border-[rgba(171,109,70,0.32)] bg-[rgba(199,155,115,0.12)] p-3">
                  <p className="text-[13px] leading-6 text-[color:var(--ink)]">
                    {pendingAction.label}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={confirmPendingAction}
                      className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl bg-[color:var(--ink)] px-4 text-[13px] font-medium text-[color:var(--chalk)]"
                    >
                      <Check size={14} />
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingAction(null)}
                      className="inline-flex min-h-[42px] flex-1 items-center justify-center rounded-xl border border-[color:var(--line)] px-4 text-[13px] font-medium text-[color:var(--ink)]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {activity && (
                <p className="text-center text-[12px] text-[color:var(--muted)]">{activity}</p>
              )}
            </div>

            <div className="border-t border-[color:var(--line)] p-3">
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                {visibleSuggestions.map((suggestion) => (
                  <button
                    key={`${suggestion.label}-${suggestion.prompt}`}
                    type="button"
                    onClick={() => sendMessage(suggestion.prompt)}
                    className="inline-flex min-h-[36px] shrink-0 items-center rounded-full border border-[color:var(--line)] bg-[rgba(255,250,244,0.74)] px-3 text-[12px] text-[color:var(--ink)] transition hover:border-[color:var(--accent-strong)]"
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault()
                  void sendMessage()
                }}
              >
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask Claire"
                  className="min-h-[48px] flex-1 rounded-xl border border-[color:var(--line)] bg-[rgba(255,250,244,0.84)] px-3 text-[14px] text-[color:var(--ink)] outline-none transition focus:border-[color:var(--accent-strong)]"
                />
                <button
                  type="submit"
                  disabled={isSending || !input.trim()}
                  className="inline-flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-xl bg-[color:var(--ink)] text-[color:var(--chalk)] transition disabled:opacity-45"
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--ink)] text-[color:var(--chalk)] shadow-[0_18px_42px_rgba(21,19,18,0.22)] transition hover:-translate-y-0.5"
        aria-label={isOpen ? 'Close concierge' : 'Open concierge'}
      >
        {isOpen ? <X size={20} /> : <MessageCircle size={21} />}
      </button>

      <style>{`
        .concierge-dot {
          width: 0.45rem;
          height: 0.45rem;
          border-radius: 999px;
          background: currentColor;
          display: inline-block;
          opacity: 0.35;
          animation: concierge-dot-pulse 1s ease-in-out infinite;
        }

        @keyframes concierge-dot-pulse {
          0%, 80%, 100% {
            opacity: 0.28;
            transform: translateY(0);
          }
          40% {
            opacity: 1;
            transform: translateY(-2px);
          }
        }
      `}</style>
    </div>
  )
}
