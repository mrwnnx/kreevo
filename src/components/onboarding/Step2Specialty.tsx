'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
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
                className="relative rounded-2xl border border-zinc-200 p-5 text-left opacity-40 cursor-not-allowed"
              >
                <div className="text-2xl mb-2">{s.icon}</div>
                <p className="text-sm font-semibold text-zinc-900">{s.label}</p>
                <span className="absolute top-2 right-2 text-[10px] uppercase tracking-wider font-semibold bg-zinc-900 text-white px-2 py-0.5 rounded-full">
                  Coming Soon
                </span>
              </div>
            )
          }
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => setSelSpec(s.value)}
              className={`relative rounded-2xl border p-5 text-left transition-all ${
                selected
                  ? 'border-2 border-violet-600 bg-violet-50'
                  : 'border-zinc-200 hover:border-violet-400 hover:bg-violet-50/40'
              }`}
            >
              <div className="text-2xl mb-2">{s.icon}</div>
              <p className="text-sm font-semibold text-zinc-900">{s.label}</p>
              {selected && (
                <div className="absolute top-2 right-2 size-5 rounded-full bg-violet-600 flex items-center justify-center">
                  <Check className="size-3 text-white" strokeWidth={3} />
                </div>
              )}
            </button>
          )
        })}
      </div>

      {selSpec && (
        <div
          className="mt-8 space-y-6"
          style={{
            animation: 'onbFadeUp 0.3s ease-out',
          }}
        >
          <div>
            <p className="text-sm font-semibold text-zinc-900 mb-1">Tools you use</p>
            <p className="text-xs text-zinc-500 mb-3">Select all that apply</p>
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
                        ? 'bg-violet-100 border-violet-500 text-violet-700'
                        : 'border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    {tool}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-zinc-900 mb-3">Your experience level</p>
            <div className="flex gap-2">
              {LEVELS.map((lvl) => {
                const active = selLevel === lvl.value
                return (
                  <button
                    key={lvl.value}
                    type="button"
                    onClick={() => setSelLevel(lvl.value)}
                    className={`flex-1 rounded-xl px-4 py-2.5 text-sm border transition-colors ${
                      active
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'border-zinc-200 text-zinc-700 hover:bg-zinc-50'
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
        <button
          type="button"
          onClick={onBack}
          className="h-12 px-5 rounded-xl border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="flex-1 h-12 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Continue →'}
        </button>
      </div>

      <style jsx>{`
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
