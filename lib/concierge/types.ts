import type { Product } from '@/data/products'
import type { Treatment } from '@/data/treatments'

export type ConciergeMode =
  | 'direct_action'
  | 'advisory_chat'
  | 'guided_workflow'
  | 'clarification_needed'

export type ConciergeActionType =
  | 'navigate'
  | 'show_products'
  | 'show_treatments'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'start_booking'
  | 'open_quiz'

export type ConciergeSuggestionType =
  | 'question'
  | 'navigation'
  | 'cart'
  | 'booking'
  | 'education'

export interface ConciergeAction {
  type: ConciergeActionType
  label: string
  requiresConfirmation: boolean
  payload: {
    href?: string
    products?: Array<Pick<Product, 'name' | 'slug' | 'price' | 'concern' | 'description' | 'image'>>
    treatments?: Array<Pick<Treatment, 'name' | 'slug' | 'price' | 'category' | 'description' | 'image'>>
    productNames?: string[]
    productSlugs?: string[]
    treatmentSlug?: string
    locationId?: string
    calendlyUrl?: string
    quizMode?: 'product' | 'treatment'
  }
}

export interface ConciergeSuggestion {
  label: string
  type: ConciergeSuggestionType
  prompt: string
}

export interface ConciergeDecision {
  mode: ConciergeMode
  reply: string
  action?: ConciergeAction
  suggestions: ConciergeSuggestion[]
  safetyNotes?: string[]
}

export interface ConciergeRetrievalSource {
  id: string
  title: string
  score: number
  retrieval: 'pinecone' | 'vector' | 'lexical'
}

export interface ConciergeChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ConciergeAppStateCartItem {
  slug: string
  name: string
  concern: string
  price: string
  quantity: number
}

export interface ConciergeAppState {
  currentPath?: string
  currentPageLabel?: string
  cart?: {
    count: number
    items: ConciergeAppStateCartItem[]
  }
  booking?: {
    active: boolean
    treatmentSlug?: string
    treatmentName?: string
    locationId?: string
    appointmentDate?: string
    appointmentTime?: string
  }
  pendingAction?: ConciergeAction
  lastResponse?: {
    reply?: string
    actionType?: ConciergeActionType
    actionLabel?: string
    concern?: string
    concerns?: string[]
    recommendationKind?: 'product' | 'treatment' | 'mixed' | 'quiz' | 'booking' | 'navigation' | 'cart' | 'advisory'
    productNames?: string[]
    productSlugs?: string[]
    treatmentNames?: string[]
    treatmentSlugs?: string[]
    href?: string
    quizMode?: 'product' | 'treatment'
  }
}

export interface ConciergeRequestBody {
  messages: ConciergeChatMessage[]
  currentPath?: string
  appState?: ConciergeAppState
}
