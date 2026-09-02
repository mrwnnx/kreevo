'use client'

import { useState } from 'react'

/**
 * CTA of the private-brief page. Responding to a brief requires an account
 * (spec 2, not built yet) — clicking reveals an inline "coming soon" notice,
 * same message as the designer-side `/dashboard/briefs/[id]/start` (lot 07).
 * No navigation, no network call: nothing here can leak the page's token.
 */
export function PrivateBriefStartButton({
  startLabel,
  comingSoon,
}: {
  startLabel: string
  comingSoon: { title: string; body: string }
}) {
  const [revealed, setRevealed] = useState(false)

  if (revealed) {
    return (
      <div className="space-y-1 rounded-2xl border border-dashed border-border p-4 text-center">
        <p className="text-sm font-semibold text-foreground">{comingSoon.title}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{comingSoon.body}</p>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setRevealed(true)}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-85"
    >
      {startLabel}
    </button>
  )
}
