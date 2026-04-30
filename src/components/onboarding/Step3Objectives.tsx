'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { StepHeader } from './StepHeader'
import { type Objective } from './types'

interface Step3Props {
  objectives: Objective[]
  onNext: (data: { objectives: Objective[] }) => void
  onBack: () => void
  saving?: boolean
}

const OPTIONS: Array<{ value: Objective; icon: string; title: string; subtitle: string }> = [
  {
    value: 'getting_hired',
    icon: '💼',
    title: 'Getting hired',
    subtitle: 'Land your first design job',
  },
  {
    value: 'improving_skills',
    icon: '📈',
    title: 'Improving my skills',
    subtitle: 'Level up through challenges',
  },
]

export function Step3Objectives({ objectives, onNext, onBack, saving }: Step3Props) {
  const [selected, setSelected] = useState<Objective[]>(objectives)

  const toggle = (value: Objective) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((o) => o !== value) : [...prev, value]
    )
  }

  const canSubmit = selected.length > 0 && !saving

  return (
    <div>
      <StepHeader
        title="What's your main goal? 🎯"
        subtitle="We'll personalize your experience based on your objectives."
      />

      <div className="space-y-3">
        {OPTIONS.map((opt) => {
          const active = selected.includes(opt.value)
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={`relative w-full text-left rounded-2xl border p-5 transition-all ${
                active
                  ? 'border-2 border-violet-600 bg-violet-50'
                  : 'border-zinc-200 hover:border-violet-400'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">{opt.icon}</div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-zinc-900">{opt.title}</p>
                  <p className="text-sm text-zinc-500 mt-0.5">{opt.subtitle}</p>
                </div>
                {active && (
                  <div className="size-6 rounded-full bg-violet-600 flex items-center justify-center shrink-0">
                    <Check className="size-3.5 text-white" strokeWidth={3} />
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex gap-3 mt-8">
        <button
          type="button"
          onClick={onBack}
          className="h-12 px-5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={() => canSubmit && onNext({ objectives: selected })}
          disabled={!canSubmit}
          className="flex-1 h-12 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Continue →'}
        </button>
      </div>
    </div>
  )
}
