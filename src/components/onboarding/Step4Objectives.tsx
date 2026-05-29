'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StepHeader } from './StepHeader'
import { type Objective } from './types'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

type OnbT = Dictionary['onboarding']

interface Step4Props {
  objectives: Objective[]
  onNext: (data: { objectives: Objective[] }) => void
  onBack: () => void
  saving?: boolean
  t: OnbT['step4']
  tc: OnbT['common']
}

export function Step4Objectives({ objectives, onNext, onBack, saving, t, tc }: Step4Props) {
  const [selected, setSelected] = useState<Objective[]>(objectives)

  const OPTIONS: Array<{ value: Objective; icon: string; title: string; subtitle: string }> = [
    { value: 'getting_hired', icon: '💼', title: t.hiredTitle, subtitle: t.hiredSubtitle },
    { value: 'improving_skills', icon: '📈', title: t.improveTitle, subtitle: t.improveSubtitle },
  ]

  const toggle = (value: Objective) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((o) => o !== value) : [...prev, value]
    )
  }

  const canSubmit = selected.length > 0 && !saving

  return (
    <div>
      <StepHeader title={t.title} subtitle={t.subtitle} />

      <div className="space-y-3">
        {OPTIONS.map((opt) => {
          const active = selected.includes(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={`relative w-full text-start rounded-[var(--radius-card)] border p-5 transition-all ${
                active
                  ? 'border-2 border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-accent/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{opt.icon}</div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-foreground">{opt.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{opt.subtitle}</p>
                </div>
                {active && (
                  <div className="size-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Check className="size-3.5 text-primary-foreground" strokeWidth={3} />
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex gap-3 mt-8">
        <Button type="button" onClick={onBack} variant="outline" size="lg" className="h-12">
          {tc.back}
        </Button>
        <Button
          type="button"
          onClick={() => canSubmit && onNext({ objectives: selected })}
          disabled={!canSubmit}
          size="lg"
          className="flex-1 h-12"
        >
          {saving ? tc.saving : tc.continue}
        </Button>
      </div>
    </div>
  )
}
