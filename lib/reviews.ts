export const REVIEW_HISTORY_COOKIE_KEY = 'clear-skin-reviews'
export const REVIEW_HISTORY_COOKIE_MAX_AGE = 60 * 60 * 24 * 180
const REVIEW_HISTORY_LIMIT = 12

interface CookieReader {
  get: (name: string) => { value: string } | undefined
}

export interface StoredReviewRecord {
  id: string
  itemName: string
  name: string
  location: string
  rating: number
  body: string
  createdAt: string
  verified: boolean
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isStoredReviewRecord(value: unknown): value is StoredReviewRecord {
  if (!value || typeof value !== 'object') return false

  const review = value as StoredReviewRecord
  return (
    isNonEmptyString(review.id)
    && isNonEmptyString(review.itemName)
    && isNonEmptyString(review.name)
    && isNonEmptyString(review.location)
    && typeof review.rating === 'number'
    && Number.isFinite(review.rating)
    && review.rating >= 1
    && review.rating <= 5
    && isNonEmptyString(review.body)
    && isNonEmptyString(review.createdAt)
    && typeof review.verified === 'boolean'
  )
}

function sortNewestFirst<T extends { createdAt: string }>(records: T[]) {
  return [...records].sort((left, right) => (
    new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  ))
}

function trimHistory<T extends { id: string }>(records: T[]) {
  const unique = new Map(records.map((record) => [record.id, record]))
  return Array.from(unique.values()).slice(0, REVIEW_HISTORY_LIMIT)
}

export function readReviewHistory(cookies: CookieReader) {
  const raw = cookies.get(REVIEW_HISTORY_COOKIE_KEY)?.value
  if (!raw) return [] as StoredReviewRecord[]

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return [] as StoredReviewRecord[]
    return sortNewestFirst(parsed.filter(isStoredReviewRecord))
  } catch {
    return [] as StoredReviewRecord[]
  }
}

export function serializeReviewHistory(records: StoredReviewRecord[]) {
  return JSON.stringify(trimHistory(sortNewestFirst(records)))
}

export function prependReviewRecord(records: StoredReviewRecord[], record: StoredReviewRecord) {
  return trimHistory([record, ...records.filter((entry) => entry.id !== record.id)])
}

export function formatReviewDate(createdAt: string) {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(createdAt))
}
