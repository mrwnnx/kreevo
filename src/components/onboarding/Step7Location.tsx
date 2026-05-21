'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, MapPin, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StepHeader } from './StepHeader'
import { ALL_COUNTRIES, MENA_SUGGESTED } from './countries'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

type OnbT = Dictionary['onboarding']

interface Step7Props {
  country: string
  onNext: (data: { country: string }) => void
  onBack: () => void
  saving?: boolean
  t: OnbT['step7']
  tc: OnbT['common']
}

export function Step7Location({ country, onNext, onBack, saving, t, tc }: Step7Props) {
  const [value, setValue] = useState(country)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    const others = ALL_COUNTRIES.filter((c) => !MENA_SUGGESTED.includes(c)).sort()
    if (!q) return { suggested: MENA_SUGGESTED, others }
    return {
      suggested: MENA_SUGGESTED.filter((c) => c.toLowerCase().includes(q)),
      others: others.filter((c) => c.toLowerCase().includes(q)),
    }
  }, [query])

  const select = (c: string) => {
    setValue(c)
    setQuery('')
    setOpen(false)
  }

  return (
    <div>
      <StepHeader title={t.title} subtitle={t.subtitle} />

      <label className="block text-sm font-medium text-foreground mb-2">{t.countryLabel}</label>
      <div ref={wrapRef} className="relative">
        <div
          onClick={() => setOpen(true)}
          className={`relative flex items-center h-10 rounded-[var(--radius-input)] border bg-transparent dark:bg-input/30 cursor-text transition-colors ${
            open ? 'border-ring ring-3 ring-ring/50' : 'border-input hover:border-border-hover'
          }`}
        >
          <Search className="absolute left-3 size-4 text-muted-foreground" />
          {open ? (
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full h-full bg-transparent pl-10 pr-4 text-base md:text-sm focus:outline-none text-foreground placeholder:text-muted-foreground"
            />
          ) : (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="w-full h-full text-left pl-10 pr-4 text-base md:text-sm"
            >
              {value ? (
                <span className="text-foreground inline-flex items-center gap-2">
                  <MapPin className="size-3.5 text-primary" /> {value}
                </span>
              ) : (
                <span className="text-muted-foreground">{t.searchPlaceholder}</span>
              )}
            </button>
          )}
        </div>

        {open && (
          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-72 overflow-auto rounded-[var(--radius-popover)] border border-border bg-popover shadow-lg p-1">
            {list.suggested.length > 0 && (
              <>
                <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.suggestedLabel}
                </p>
                {list.suggested.map((c) => (
                  <CountryRow key={c} country={c} selected={value === c} onSelect={select} />
                ))}
              </>
            )}
            {list.others.length > 0 && (
              <>
                <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t.allLabel}
                </p>
                {list.others.map((c) => (
                  <CountryRow key={c} country={c} selected={value === c} onSelect={select} />
                ))}
              </>
            )}
            {list.suggested.length === 0 && list.others.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                {t.noCountry}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-8">
        <Button type="button" onClick={onBack} variant="outline" size="lg" className="h-12">
          {tc.back}
        </Button>
        <Button
          type="button"
          onClick={() => onNext({ country: value })}
          disabled={saving}
          size="lg"
          className="flex-1 h-12"
        >
          {saving ? tc.saving : tc.continue}
        </Button>
      </div>
    </div>
  )
}

function CountryRow({
  country,
  selected,
  onSelect,
}: {
  country: string
  selected: boolean
  onSelect: (c: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(country)}
      className={`w-full text-left px-3 py-2 text-sm rounded-[calc(var(--radius-popover)-4px)] flex items-center justify-between transition-colors ${
        selected
          ? 'bg-primary/10 text-primary'
          : 'hover:bg-accent/40 text-foreground'
      }`}
    >
      <span>{country}</span>
      {selected && <Check className="size-4 text-primary" />}
    </button>
  )
}
