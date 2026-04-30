'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StepHeader } from './StepHeader'
import { TOOLS_BY_SPECIALTY, type ExperienceLevel, type Specialty } from './types'

interface Step2Props {
  specialty: Specialty
  tools: string[]
  experienceLevel: ExperienceLevel
  onNext: (data: { specialty: Specialty; tools: string[]; experienceLevel: ExperienceLevel }) => void
  onBack: () => void
  saving?: boolean
}

const SPECIALTIES: Array<{
  value: Specialty
  icon: string
  label: string
  disabled?: boolean
  comingSoon?: boolean
}> = [
  { value: 'ux_ui', icon: '✏️', label: 'UX/UI Designer' },
  { value: 'graphic', icon: '🎨', label: 'Graphic Designer' },
  { value: '' as Specialty, icon: '💻', label: 'Developer', disabled: true, comingSoon: true },
  { value: '' as Specialty, icon: '🎬', label: 'Video Editor', disabled: true, comingSoon: true },
]

const LEVELS: Array<{ value: ExperienceLevel; label: string }> = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'junior', label: 'Junior' },
  { value: 'senior', label: 'Senior' },
]

export function Step2Specialty({
  specialty,
  tools,
  experienceLevel,
  onNext,
  onBack,
  saving,
}: Step2Props) {
  const [selSpec, setSelSpec] = useState<Specialty>(specialty)
  const [selTools, setSelTools] = useState<string[]>(tools)
  const [selLevel, setSelLevel] = useState<ExperienceLevel>(experienceLevel)

  useEffect(() => {
    if (selSpec && selSpec !== specialty) {
      const allowed = TOOLS_BY_SPECIALTY[selSpec as 'ux_ui' | 'graphic']
      setSelTools((prev) => prev.filter((t) => allowed.includes(t)))
    }
  }, [selSpec, specialty])

  const canSubmit = !!selSpec && !saving
  const availableTools = selSpec ? TOOLS_BY_SPECIALTY[selSpec as 'ux_ui' | 'graphic'] : []

  const toggleTool = (tool: string) => {
    setSelTools((prev) => (prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]))
  }

  const submit = () => {
    if (!canSubmit) return
    onNext({ specialty: selSpec, tools: selTools, experienceLevel: selLevel })
  }

  return (
    <div>
      <StepHeader
        title="What's your specialty? 🎯"
        subtitle="Choose your main design discipline."
      />

      <div className="grid grid-cols-2 gap-3">
        {SPECIALTIES.map((s, idx) => {
          const selected = selSpec === s.value && !s.disabled
          if (s.disabled) {
            return (
              <div
                key={`disabled-${idx}`}
                title="Coming soon — stay tuned! 🔔"
                className="relative rounded-[var(--radius-card)] border border-border bg-card p-5 text-left opacity-50 cursor-not-allowed"
              >
                <div className="text-2xl mb-2">{s.icon}</div>
                <p className="text-sm font-semibold text-foreground">{s.label}</p>
                <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wider font-semibold bg-foreground text-background px-2 py-0.5 rounded-full">
                  Soon
                </span>
              </div>
            )
          }
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => setSelSpec(s.value)}
              className={`relative rounded-[var(--radius-card)] border p-5 text-left transition-all ${
                selected
                  ? 'border-2 border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-accent/30'
              }`}
            >
              <div className="text-2xl mb-2">{s.icon}</div>
              <p className="text-sm font-semibold text-foreground">{s.label}</p>
              {selected && (
                <div className="absolute top-2 right-2 size-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="size-3 text-primary-foreground" strokeWidth={3} />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {selSpec && (
        <div className="mt-8 space-y-6 onb-fade-up">
          <div>
            <p className="text-sm font-semibold text-foreground mb-1">Tools you use</p>
            <p className="text-xs text-muted-foreground mb-3">Select all that apply</p>
            <div className="flex flex-wrap gap-2">
              {availableTools.map((tool) => {
                const active = selTools.includes(tool)
                return (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => toggleTool(tool)}
                    className={`rounded-full px-3 py-1.5 text-sm border transition-colors ${
                      active
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'border-border text-foreground hover:border-primary/40 hover:bg-accent/30'
                    }`}
                  >
                    {tool}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Your experience level</p>
            <div className="flex gap-2">
              {LEVELS.map((lvl) => {
                const active = selLevel === lvl.value
                return (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => setSelLevel(lvl.value)}
                    className={`flex-1 rounded-[var(--radius-input)] px-4 py-2.5 text-sm border transition-colors ${
                      active
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-foreground hover:bg-accent/30'
                    }`}
                  >
                    {lvl.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-8">
        <Button type="button" onClick={onBack} variant="outline" size="lg" className="h-12">
          ← Back
        </Button>
        <Button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          size="lg"
          className="flex-1 h-12"
        >
          {saving ? 'Saving…' : 'Continue →'}
        </Button>
      </div>

      <style jsx>{`
        :global(.onb-fade-up) {
          animation: onbFadeUp 0.3s ease-out;
        }
        @keyframes onbFadeUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
