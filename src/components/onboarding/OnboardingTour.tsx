'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { OnboardingSlide } from '@/components/onboarding/OnboardingSlide'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

// Étape déjà localisée (name/title/description dans la langue courante) — préparée
// côté serveur (layout) depuis la table onboarding_steps.
export interface TourStepData {
  id: string
  name: string
  title: string
  description: string
  image_url: string | null
}

interface Props {
  steps: TourStepData[]
  t: Dictionary['onboardingTour']
}

export function OnboardingTour({ steps, t }: Props) {
  const [open, setOpen] = useState(true)
  const [i, setI] = useState(0)

  const total = steps.length
  const step = steps[i]
  const isFirst = i === 0
  const isLast = i === total - 1

  // Skip OU fin → mémorise pour ne plus réafficher.
  async function complete() {
    setOpen(false)
    try {
      await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tour_completed: true }),
      })
    } catch {
      /* silencieux */
    }
  }

  function next() {
    if (isLast) complete()
    else setI((n) => n + 1)
  }

  if (!step) return null

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) complete() }}>
      <DialogContent showCloseButton={false} className="p-0 gap-0 overflow-hidden max-w-md">
        {/* a11y : Base UI exige un titre/description (le visuel est dans OnboardingSlide). */}
        <DialogTitle className="sr-only">{step.title}</DialogTitle>
        <DialogDescription className="sr-only">{step.description}</DialogDescription>
        <OnboardingSlide
          name={step.name}
          title={step.title}
          description={step.description}
          imageUrl={step.image_url}
          current={i + 1}
          total={total}
          t={t}
          isFirst={isFirst}
          isLast={isLast}
          onBack={() => setI((n) => Math.max(0, n - 1))}
          onSkip={complete}
          onNext={next}
        />
      </DialogContent>
    </Dialog>
  )
}
