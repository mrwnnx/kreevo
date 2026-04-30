'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, MapPin, Search } from 'lucide-react'
import { StepHeader } from './StepHeader'
import { ALL_COUNTRIES, MENA_SUGGESTED } from './countries'

interface Step6Props {
  country: string
  onNext: (data: { country: string }) => void
  onBack: () => void
  saving?: boolean
}

export function Step6Location({ country, onNext, onBack, saving }: Step6Props) {
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
    if (!q) {
      return { suggested: MENA_SUGGESTED, others }
    }
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
      <StepHeader
        title="Where are you based? 📍"
        subtitle="Help us connect you with designers from your region."
      />

      <label className="block text-sm font-medium text-zinc-700 mb-2">Country</label>
      <div ref={wrapRef} className="relative">
        <div
          onClick={() => setOpen(true)}
          className={`relative flex items-center h-12 rounded-xl border bg-white cursor-text transition ${
            open
              ? 'border-violet-500 ring-2 ring-violet-200'
              : 'border-zinc-200 hover:border-zinc-300'
          }`}
        >
          <Search className="absolute left-3 size-4 text-zinc-400" />
          {open ? (
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your country..."
              className="w-full h-full bg-transparent pl-10 pr-4 text-sm focus:outline-none placeholder:text-zinc-400"
            />
          ) : (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="w-full h-full text-left pl-10 pr-4 text-sm"
            >
              {value ? (
                <span className="text-zinc-900 inline-flex items-center gap-2">
                  <MapPin className="size-3.5 text-violet-600" /> {value}
                </span>
              ) : (
                <span className="text-zinc-400">Search your country...</span>
              )}
            </button>
          )}
        </div>

        {open && (
          <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 max-h-72 overflow-auto rounded-xl border border-zinc-200 bg-white shadow-lg p-1">
            {list.suggested.length > 0 && (
              <>
                <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  Suggested
                </p>
                {list.suggested.map((c) => (
                  <CountryRow key={c} country={c} selected={value === c} onSelect={select} />
                ))}
              </>
            )}
            {list.others.length > 0 && (
              <>
                <p className="px-3 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                  All countries
                </p>
                {list.others.map((c) => (
                  <CountryRow key={c} country={c} selected={value === c} onSelect={select} />
                ))}
              </>
            )}
            {list.suggested.length === 0 && list.others.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-zinc-500">No country found</p>
            )}
          </div>
        )}
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
          onClick={() => onNext({ country: value })}
          disabled={saving}
          className="flex-1 h-12 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Complete my profile →'}
        </button>
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
      className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between transition-colors ${
        selected ? 'bg-violet-50 text-violet-700' : 'hover:bg-zinc-50 text-zinc-800'
      }`}
    >
      <span>{country}</span>
      {selected && <Check className="size-4 text-violet-600" />}
    </button>
  )
}
