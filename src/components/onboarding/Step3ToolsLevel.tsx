'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StepHeader } from './StepHeader'
import { TOOLS_BY_SPECIALTY, type ExperienceLevel, type Specialty } from './types'

interface Step3Props {
  specialty: Specialty
  tools: string[]
  experienceLevel: ExperienceLevel
  onNext: (data: { tools: string[]; experienceLevel: ExperienceLevel }) => void
  onBack: () => void
  saving?: boolean
}

const LEVELS: Array<{ value: ExperienceLevel; label: string }> = [
  { value: 'entry', label: 'Entry Level' },
  { value: 'junior', label: 'Junior' },
  { value: 'senior', label: 'Senior' },
]

export function Step3ToolsLevel({
  specialty,
  tools,
  experienceLevel,
  onNext,
  onBack,
  saving,
}: Step3Props) {
  const available = useMemo(
    () => (specialty ? TOOLS_BY_SPECIALTY[specialty as 'ux_ui' | 'graphic'] : []),
    [specialty]
  )
  const [selTools, setSelTools] = useState<string[]>(() =>
    tools.filter((t) => available.includes(t))
  )
  const [selLevel, setSelLevel] = useState<ExperienceLevel>(experienceLevel)
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const toggleTool = (tool: string) => {
    setSelTools((prev) => (prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]))
  }
  const removeTool = (tool: string) => setSelTools((prev) => prev.filter((t) => t !== tool))

  return (
    <div>
      <StepHeader
        title="Your tools & experience 🧰"
        subtitle="Help us tailor challenges to your level."
      />

      <div className="space-y-6">
        <div ref={wrapRef}>
          <p className="text-sm font-semibold text-foreground mb-1">Tools you use</p>
          <p className="text-xs text-muted-foreground mb-3">Select all that apply</p>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={`w-full flex items-center justify-between h-12 px-4 rounded-[var(--radius-input)] border bg-background text-sm transition-colors ${
                open ? 'border-ring ring-3 ring-ring/30' : 'border-input hover:border-border-hover'
              }`}
            >
              <span className={selTools.length === 0 ? 'text-muted-foreground' : 'text-foreground'}>
                {selTools.length === 0
                  ? 'Select your tools…'
                  : `${selTools.length} tool${selTools.length > 1 ? 's' : ''} selected`}
              </span>
              <ChevronDown
                className={`size-4 text-muted-foreground transition-transform ${
                  open ? 'rotate-180' : ''
                }`}
              />
            </button>

            {open && (
              <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-72 overflow-auto rounded-[var(--radius-popover)] border border-border bg-popover shadow-lg p-1">
                {available.map((tool) => {
                  const active = selTools.includes(tool)
                  return (
                    <button
                      key={tool}
                      type="button"
                      onClick={() => toggleTool(tool)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-[calc(var(--radius-popover)-4px)] flex items-center justify-between transition-colors ${
                        active ? 'bg-primary/10 text-primary' : 'hover:bg-accent/40 text-foreground'
                      }`}
                    >
                      <span>{tool}</span>
                      {active && <Check className="size-4 text-primary" />}
                    </button>
                  )
                })}
                {available.length === 0 && (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    No tools available — pick a specialty first
                  </p>
                )}
              </div>
            )}
          </div>

          {selTools.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {selTools.map((tool) => (
                <span
                  key={tool}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm px-3 py-1"
                >
                  {tool}
                  <button
                    type="button"
                    onClick={() => removeTool(tool)}
                    aria-label={`Remove ${tool}`}
                    className="hover:opacity-70"
                  >
                    <X className="size-3" strokeWidth={2.5} />
                  </button>
                </span>
              ))}
            </div>
          )}
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

      <div className="flex gap-3 mt-8">
        <Button type="button" onClick={onBack} variant="outline" size="lg" className="h-12">
          ← Back
        </Button>
        <Button
          type="button"
          onClick={() => onNext({ tools: selTools, experienceLevel: selLevel })}
          disabled={saving}
          size="lg"
          className="flex-1 h-12"
        >
          {saving ? 'Saving…' : 'Continue →'}
        </Button>
      </div>
    </div>
  )
}
