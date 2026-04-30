'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StepHeader } from './StepHeader'
import { type Specialty } from './types'

interface Step2Props {
  specialty: Specialty
  onNext: (data: { specialty: Specialty }) => void
  onBack: () => void
  saving?: boolean
}

const SPECIALTIES: Array<{
  value: 'ux_ui' | 'graphic'
  icon: string
  label: string
  description: string
}> = [
  {
    value: 'ux_ui',
    icon: '✏️',
    label: 'UX/UI Designer',
    description: 'Design digital experiences and interfaces',
  },
  {
    value: 'graphic',
    icon: '🎨',
    label: 'Graphic Designer',
    description: 'Create visual identities and brand assets',
  },
]

export function Step2Specialty({ specialty, onNext, onBack, saving }: Step2Props) {
  const [selSpec, setSelSpec] = useState<Specialty>(specialty)

  const canSubmit = !!selSpec && !saving

  return (
    <div>
      <StepHeader
        title="What's your specialty? 🎯"
        subtitle="Choose your main design discipline."
      />

      <div className="space-y-3">
        {SPECIALTIES.map((s) => {
          const selected = selSpec === s.value
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => setSelSpec(s.value)}
              className={`relative w-full text-left rounded-[var(--radius-card)] border p-5 transition-all ${
                selected
                  ? 'border-2 border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-accent/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{s.icon}</div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-foreground">{s.label}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{s.description}</p>
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

      <div className="flex gap-3 mt-8">
        <Button type="button" onClick={onBack} variant="outline" size="lg" className="h-12">
          ← Back
        </Button>
        <Button
          type="button"
          onClick={() => canSubmit && onNext({ specialty: selSpec })}
          disabled={!canSubmit}
          size="lg"
          className="flex-1 h-12"
        >
          {saving ? 'Saving…' : 'Continue →'}
        </Button>
      </div>
    </div>
  )
}
