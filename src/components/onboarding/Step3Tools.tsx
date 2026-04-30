'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StepHeader } from './StepHeader'
import { TOOLS_BY_SPECIALTY, type Specialty } from './types'

interface Step3Props {
  specialty: Specialty
  tools: string[]
  onNext: (data: { tools: string[] }) => void
  onBack: () => void
  saving?: boolean
}

export function Step3Tools({ specialty, tools, onNext, onBack, saving }: Step3Props) {
  const available = useMemo(
    () => (specialty ? TOOLS_BY_SPECIALTY[specialty as 'ux_ui' | 'graphic'] : []),
    [specialty]
  )
  const [selTools, setSelTools] = useState<string[]>(() =>
    tools.filter((t) => available.includes(t))
  )
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return available
    return available.filter((t) => t.toLowerCase().includes(q))
  }, [query, available])

  const toggleTool = (tool: string) => {
    setSelTools((prev) => (prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]))
  }
  const removeTool = (tool: string) => setSelTools((prev) => prev.filter((t) => t !== tool))

  return (
    <div>
      <StepHeader
        title="Which tools do you use? 🧰"
        subtitle="Pick everything you're comfortable with."
      />

      <div ref={wrapRef}>
        <p className="text-sm font-semibold text-foreground mb-2">Tools you use</p>

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
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 rounded-[var(--radius-popover)] border border-border bg-popover shadow-lg flex flex-col">
              <div className="relative p-2 border-b border-border">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tools…"
                  className="w-full h-9 pl-8 pr-3 text-sm rounded-[var(--radius-input)] bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-muted"
                />
              </div>
              <div className="max-h-64 overflow-auto p-1">
                {filtered.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {available.length === 0 ? 'Pick a specialty first' : 'No tools match'}
                  </p>
                ) : (
                  filtered.map((tool) => {
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
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {selTools.length > 0 ? (
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
        ) : (
          <p className="text-xs text-muted-foreground mt-2">
            Selected tools will appear here as removable chips.
          </p>
        )}
      </div>

      <div className="flex gap-3 mt-8">
        <Button type="button" onClick={onBack} variant="outline" size="lg" className="h-12">
          ← Back
        </Button>
        <Button
          type="button"
          onClick={() => onNext({ tools: selTools })}
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
