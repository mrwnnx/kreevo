'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StepHeader } from './StepHeader'
import type { SpecialtyOption } from './types'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

type OnbT = Dictionary['onboarding']

interface StepSpecialtyProps {
  specialty: string // slug actuellement sélectionné
  specialties: SpecialtyOption[] // PHASE 5 — liste dynamique (DB)
  onNext: (data: { specialtyId: string; specialty: string }) => void
  onBack: () => void
  saving?: boolean
  t: OnbT['specialty']
  tc: OnbT['common']
}

export function StepSpecialty({ specialty, specialties, onNext, onBack, saving, t, tc }: StepSpecialtyProps) {
  const [selSlug, setSelSlug] = useState<string>(specialty)

  // i18n soigné par slug pour les spés historiques ; les nouvelles spés retombent
  // sur le `name` (label) et une description vide (fallback gracieux, cleanup PHASE 7).
  const LABEL_FALLBACK: Record<string, string> = { ux_ui: t.uxuiLabel, graphic: t.graphicLabel }
  const DESC_BY_SLUG: Record<string, string> = { ux_ui: t.uxuiDescription, graphic: t.graphicDescription }

  const chosen = specialties.find((s) => s.slug === selSlug) ?? null
  const canSubmit = !!chosen && !saving

  return (
    <div>
      <StepHeader title={t.title} subtitle={t.subtitle} />

      <div>
        <p className="text-sm font-semibold text-foreground mb-3">{t.specialtyLabel}</p>
        <div className="space-y-3">
          {specialties.map((s) => {
            const selected = selSlug === s.slug
            const label = s.name || LABEL_FALLBACK[s.slug] || s.slug
            const description = DESC_BY_SLUG[s.slug] ?? ''
            return (
              <button
                key={s.slug}
                type="button"
                onClick={() => setSelSlug(s.slug)}
                className={`relative w-full text-start rounded-[var(--radius-card)] border p-5 transition-all ${
                  selected
                    ? 'border-2 border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-accent/30'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{s.emoji || '🎯'}</div>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-foreground">{label}</p>
                    {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
                  </div>
                  {selected && (
                    <div className="size-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="size-3.5 text-primary-foreground" strokeWidth={3} />
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <Button type="button" onClick={onBack} variant="outline" size="lg" className="h-12">
          {tc.back}
        </Button>
        <Button
          type="button"
          onClick={() => chosen && onNext({ specialtyId: chosen.id, specialty: chosen.slug })}
          disabled={!canSubmit}
          size="lg"
          className="flex-1 h-12"
        >
          {saving ? tc.saving : t.completeCta}
        </Button>
      </div>
    </div>
  )
}
