'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TOUR_STEPS } from '@/lib/onboarding/tourSteps'
import { tx } from '@/lib/i18n/tx'
import { cn } from '@/lib/utils'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

interface Props {
  initialOpen: boolean
  t: Dictionary['onboardingTour']
}

export function OnboardingTour({ initialOpen, t }: Props) {
  const [open, setOpen] = useState(initialOpen)
  const [i, setI] = useState(0)

  const step = TOUR_STEPS[i]
  const total = TOUR_STEPS.length
  const isFirst = i === 0
  const isLast = i === total - 1
  const text = t.steps[step.id]
  const Icon = step.icon

  // Skip OU fin (étape 6) → mémorise pour ne plus réafficher.
  async function complete() {
    setOpen(false)
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tour_completed: true }),
      })
    } catch {
      /* silencieux : on ne rouvre pas le modal pour la session courante */
    }
  }

  function next() {
    if (isLast) complete()
    else setI((n) => n + 1)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) complete() }}>
      <DialogContent
        showCloseButton={false}
        className="p-0 gap-0 overflow-hidden max-w-md"
      >
        {/* ── Header illustré (gradient brand violet/rose — placeholder tant qu'image=null) ── */}
        <div className="relative h-44 w-full">
          {step.image ? (
            <Image src={step.image} alt="" fill className="object-cover" priority />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[var(--xp-from)] to-[var(--xp-to)]">
              <Icon className="size-14 text-white/90" strokeWidth={1.6} />
              <span className="absolute bottom-2 right-3 text-[10px] font-mono text-white/50">
                placeholder · {i + 1}/{total}
              </span>
            </div>
          )}
        </div>

        {/* ── Corps ── */}
        <div className="px-6 pt-5 pb-1 space-y-1.5 text-start">
          <p className="text-sm text-muted-foreground">
            {tx(t.stepOf, { current: i + 1, total, name: text.name })}
          </p>
          <DialogTitle className="text-lg font-medium leading-snug">{text.title}</DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            {text.description}
          </DialogDescription>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-4">
          <Button
            variant="secondary"
            onClick={() => setI((n) => Math.max(0, n - 1))}
            className={cn(isFirst && 'invisible')}
          >
            {t.back}
          </Button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={complete}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t.skip}
            </button>
            {/* Next : violet brand via token --xp-from (≈ #826EFF), pas de hardcode. */}
            <Button
              onClick={next}
              className="bg-[var(--xp-from)] text-white hover:bg-[var(--accent-hover)] hover:opacity-100"
            >
              {isLast ? t.finish : t.next}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
