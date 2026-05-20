'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { StepHeader } from './StepHeader'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

type OnbT = Dictionary['onboarding']

interface Step1Props {
  firstName: string
  lastName: string
  onNext: (data: { firstName: string; lastName: string }) => void
  saving?: boolean
  t: OnbT['step1']
  tc: OnbT['common']
}

export function Step1BasicInfo({ firstName, lastName, onNext, saving, t, tc }: Step1Props) {
  const [first, setFirst] = useState(firstName)
  const [last, setLast] = useState(lastName)
  const [firstError, setFirstError] = useState<string | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)
  const firstRef = useRef<HTMLInputElement>(null)
  const lastRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    firstRef.current?.focus()
  }, [])

  const canSubmit = first.trim().length > 0 && last.trim().length > 0 && !saving

  const validate = () => {
    let ok = true
    if (!first.trim()) {
      setFirstError(t.firstNameError)
      ok = false
    }
    if (!last.trim()) {
      setLastError(t.lastNameError)
      ok = false
    }
    return ok
  }

  const submit = () => {
    if (!validate()) return
    onNext({ firstName: first.trim(), lastName: last.trim() })
  }

  const inputCls = (err: string | null) =>
    `w-full h-10 px-3 text-base md:text-sm rounded-[var(--radius-input)] border bg-transparent dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-3 transition-colors ${
      err
        ? 'border-destructive focus-visible:ring-destructive/20'
        : 'border-input focus-visible:ring-ring/50 focus-visible:border-ring'
    }`

  return (
    <div>
      <StepHeader title={t.title} subtitle={t.subtitle} />

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">{t.firstNameLabel}</label>
          <input
            ref={firstRef}
            type="text"
            value={first}
            onChange={(e) => {
              setFirst(e.target.value)
              if (firstError) setFirstError(null)
            }}
            onBlur={() => {
              if (!first.trim()) setFirstError(t.firstNameError)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                lastRef.current?.focus()
              }
            }}
            placeholder={t.firstNamePlaceholder}
            className={inputCls(firstError)}
          />
          {firstError && <p className="text-xs text-destructive mt-1.5">{firstError}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">{t.lastNameLabel}</label>
          <input
            ref={lastRef}
            type="text"
            value={last}
            onChange={(e) => {
              setLast(e.target.value)
              if (lastError) setLastError(null)
            }}
            onBlur={() => {
              if (!last.trim()) setLastError(t.lastNameError)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submit()
              }
            }}
            placeholder={t.lastNamePlaceholder}
            className={inputCls(lastError)}
          />
          {lastError && <p className="text-xs text-destructive mt-1.5">{lastError}</p>}
        </div>

        <Button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          size="lg"
          className="w-full h-12 mt-2"
        >
          {saving ? tc.saving : tc.continue}
        </Button>
      </div>
    </div>
  )
}
