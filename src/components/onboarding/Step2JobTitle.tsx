'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { StepHeader } from './StepHeader'
import { JOB_TITLES, type ExperienceLevel } from './types'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

type OnbT = Dictionary['onboarding']

interface Step2Props {
  jobTitle: string
  experienceLevel: ExperienceLevel
  onNext: (data: { jobTitle: string; experienceLevel: ExperienceLevel }) => void
  onBack: () => void
  saving?: boolean
  t: OnbT['step2']
  tc: OnbT['common']
}

const inputClass =
  'h-10 w-full min-w-0 rounded-[var(--radius-input)] border border-input bg-transparent px-3 py-1 text-base md:text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function Step2JobTitle({
  jobTitle,
  experienceLevel,
  onNext,
  onBack,
  saving,
  t,
  tc,
}: Step2Props) {
  const [title, setTitle] = useState(jobTitle)
  const [selLevel, setSelLevel] = useState<ExperienceLevel>(experienceLevel)
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState(
    Boolean(jobTitle) && !(JOB_TITLES as readonly string[]).includes(jobTitle),
  )
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const LEVELS: Array<{ value: ExperienceLevel; label: string }> = [
    { value: 'entry', label: t.levelEntry },
    { value: 'junior', label: t.levelJunior },
    { value: 'senior', label: t.levelSenior },
  ]

  const canSubmit = !!title.trim() && !saving

  return (
    <div>
      <StepHeader title={t.title} subtitle={t.subtitle} />

      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">{t.jobTitleLabel}</p>
          {custom ? (
            <div className="space-y-2">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={60}
                placeholder={t.jobTitleCustomPlaceholder}
                className={inputClass}
                autoFocus
              />
              <button
                type="button"
                onClick={() => { setCustom(false); setTitle('') }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t.jobTitleBackToList}
              </button>
            </div>
          ) : (
            <div ref={wrapRef} className="relative">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className={cn(inputClass, 'flex items-center justify-between text-left')}
              >
                <span className={title ? 'text-foreground' : 'text-muted-foreground'}>
                  {title || t.jobTitlePlaceholder}
                </span>
                <ChevronDown className={cn('size-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
              </button>

              {open && (
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 rounded-[var(--radius-popover)] border border-border bg-popover shadow-lg flex flex-col">
                  <div className="max-h-64 overflow-auto p-1">
                    {JOB_TITLES.map((jt) => {
                      const active = title === jt
                      return (
                        <button
                          key={jt}
                          type="button"
                          onClick={() => { setTitle(jt); setOpen(false) }}
                          className={cn(
                            'w-full text-left px-3 py-2 text-sm rounded-[calc(var(--radius-popover)-4px)] flex items-center justify-between transition-colors',
                            active ? 'bg-primary/10 text-primary' : 'hover:bg-accent/40 text-foreground',
                          )}
                        >
                          <span>{jt}</span>
                          {active && <Check className="size-4 text-primary" />}
                        </button>
                      )
                    })}
                    <button
                      type="button"
                      onClick={() => { setCustom(true); setTitle(''); setOpen(false) }}
                      className="w-full text-left px-3 py-2 text-sm rounded-[calc(var(--radius-popover)-4px)] hover:bg-accent/40 text-muted-foreground transition-colors"
                    >
                      {t.jobTitleOther}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-foreground mb-3">{t.experienceLabel}</p>
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
          {tc.back}
        </Button>
        <Button
          type="button"
          onClick={() => canSubmit && onNext({ jobTitle: title.trim(), experienceLevel: selLevel })}
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
