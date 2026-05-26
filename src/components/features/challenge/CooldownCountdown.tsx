'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  reopensAt: string // ISO timestamp
  /** Template with `{h}` (hours) and `{m}` (minutes) placeholders. */
  template: string
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function render(template: string, hours: number, minutes: number): string {
  return template.replace('{h}', String(hours)).replace('{m}', pad(minutes))
}

/**
 * Live counter for the post-deadline reparticipation cooldown.
 * Refreshes the page when the countdown hits zero so the parent SSR re-renders
 * the "reparticipate" CTA instead of the cooldown card.
 */
export function CooldownCountdown({ reopensAt, template }: Props) {
  const router = useRouter()
  const [remaining, setRemaining] = useState<number>(() =>
    Math.max(0, new Date(reopensAt).getTime() - Date.now()),
  )

  useEffect(() => {
    if (remaining <= 0) {
      router.refresh()
      return
    }
    const tick = setInterval(() => {
      const next = Math.max(0, new Date(reopensAt).getTime() - Date.now())
      setRemaining(next)
      if (next <= 0) {
        clearInterval(tick)
        router.refresh()
      }
    }, 1000)
    return () => clearInterval(tick)
  }, [reopensAt, remaining, router])

  if (remaining <= 0) return null

  const hours = Math.floor(remaining / 3600000)
  const minutes = Math.floor((remaining % 3600000) / 60000)
  return <span className="font-mono font-semibold">{render(template, hours, minutes)}</span>
}
