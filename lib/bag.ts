'use client'

import type { BagItem, CartPayload } from '@/lib/cart'

export const BAG_UPDATED_EVENT = 'clearskin:bag-updated'
export const BAG_UPDATED_STORAGE_KEY = 'clearskin:bag-updated-at'

let bagCache: BagItem[] = []

function emitBagUpdated(items: BagItem[]) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(BAG_UPDATED_EVENT, { detail: { items } }))
  try {
    window.localStorage.setItem(BAG_UPDATED_STORAGE_KEY, String(Date.now()))
  } catch {
    // Storage can be unavailable in private browsing; the same-tab event still works.
  }
}

function updateCache(payload: CartPayload, notify = true) {
  bagCache = payload.items
  if (notify) {
    emitBagUpdated(payload.items)
  }
  return payload.items
}

async function requestCart<T>(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', body?: Record<string, unknown>) {
  const response = await fetch('/api/cart', {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    throw new Error(`Cart request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export function readBag() {
  return bagCache
}

export function getBagCount() {
  return bagCache.reduce((total, item) => total + item.quantity, 0)
}

export async function hydrateBag() {
  const payload = await requestCart<CartPayload>('GET')
  return updateCache(payload, false)
}

export async function addProductsToBag(productNames: string[]) {
  const payload = await requestCart<CartPayload>('POST', { products: productNames })
  return updateCache(payload)
}

export async function updateBagItemQuantity(slug: string, quantity: number) {
  const payload = await requestCart<CartPayload>('PATCH', { slug, quantity })
  return updateCache(payload)
}

export async function removeBagItem(slug: string) {
  const payload = await requestCart<CartPayload>('DELETE', { slug })
  return updateCache(payload)
}

export async function clearBag() {
  const payload = await requestCart<CartPayload>('DELETE', {})
  return updateCache(payload)
}
