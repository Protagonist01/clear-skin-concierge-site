'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AccountLogoutButton() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  async function handleLogout() {
    setSubmitting(true)

    try {
      await fetch('/api/account/logout', {
        method: 'POST',
      })
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={submitting}
      className="button-shell button-ghost inline-flex min-h-[48px] items-center justify-center rounded-xl px-6 py-3 text-[15px] font-medium"
    >
      {submitting ? 'Signing out...' : 'Sign out'}
    </button>
  )
}
