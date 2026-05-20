'use client'

import { useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StepHeader } from './StepHeader'
import { SocialLogo } from './SocialLogo'
import {
  SOCIAL_DEFS,
  SUGGESTED_BY_SPECIALTY,
  defForKey,
  slugifyPlatform,
} from './socials'
import type { Specialty } from './types'
import { tx } from '@/lib/i18n/tx'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

type OnbT = Dictionary['onboarding']

interface Step5Props {
  specialty: Specialty
  links: Record<string, string>
  onNext: (data: { links: Record<string, string> }) => void
  onBack: () => void
  onSkip: () => void
  saving?: boolean
  t: OnbT['step5']
  tc: OnbT['common']
}

const isValidUrl = (v: string) => v.length === 0 || v.trim().toLowerCase().startsWith('https://')

export function Step5Social({ specialty, links, onNext, onBack, onSkip, saving, t, tc }: Step5Props) {
  const [activeKeys, setActiveKeys] = useState<string[]>(() => Object.keys(links))
  const [values, setValues] = useState<Record<string, string>>(() => ({ ...links }))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showCustom, setShowCustom] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customUrl, setCustomUrl] = useState('')
  const [customError, setCustomError] = useState<string | null>(null)

  const suggestedKeys = useMemo(() => {
    const list = specialty
      ? SUGGESTED_BY_SPECIALTY[specialty as 'ux_ui' | 'graphic']
      : Object.keys(SOCIAL_DEFS)
    return list.filter((k) => !activeKeys.includes(k))
  }, [specialty, activeKeys])

  const addNetwork = (key: string) => {
    setActiveKeys((prev) => (prev.includes(key) ? prev : [...prev, key]))
    setValues((prev) => ({ ...prev, [key]: prev[key] ?? '' }))
  }

  const removeNetwork = (key: string) => {
    setActiveKeys((prev) => prev.filter((k) => k !== key))
    setValues((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const updateUrl = (key: string, url: string) => {
    setValues((prev) => ({ ...prev, [key]: url }))
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  const submitCustom = () => {
    setCustomError(null)
    const name = customName.trim()
    if (!name) {
      setCustomError(t.errorName)
      return
    }
    if (!isValidUrl(customUrl)) {
      setCustomError(t.errorUrl)
      return
    }
    const key = slugifyPlatform(name)
    if (!key) {
      setCustomError(t.errorInvalidName)
      return
    }
    if (!SOCIAL_DEFS[key]) {
      SOCIAL_DEFS[key] = {
        key,
        name,
        placeholder: 'https://...',
        iconText: name.slice(0, 2),
        iconBg: '#71717A',
        softBg: '#F4F4F5',
        softColor: '#3F3F46',
      }
    }
    addNetwork(key)
    setValues((prev) => ({ ...prev, [key]: customUrl.trim() }))
    setCustomName('')
    setCustomUrl('')
    setShowCustom(false)
  }

  const submit = () => {
    const newErrors: Record<string, string> = {}
    for (const key of activeKeys) {
      const v = (values[key] ?? '').trim()
      if (v && !isValidUrl(v)) newErrors[key] = t.errorUrl
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const out: Record<string, string> = {}
    for (const key of activeKeys) {
      const v = (values[key] ?? '').trim()
      if (v) out[key] = v
    }
    onNext({ links: out })
  }

  return (
    <div>
      <StepHeader title={t.title} subtitle={t.subtitle} />

      {activeKeys.length > 0 && (
        <div className="space-y-3 mb-6">
          {activeKeys.map((key) => {
            const def = defForKey(key)
            const err = errors[key]
            return (
              <div key={key}>
                <div className="flex items-center gap-2">
                  <SocialLogo def={def} />
                  <input
                    type="url"
                    value={values[key] ?? ''}
                    onChange={(e) => updateUrl(key, e.target.value)}
                    placeholder={def.placeholder}
                    className={`flex-1 h-10 px-3 text-base md:text-sm rounded-[var(--radius-input)] border bg-transparent dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-3 transition-colors ${
                      err
                        ? 'border-destructive focus-visible:ring-destructive/20'
                        : 'border-input focus-visible:ring-ring/50 focus-visible:border-ring'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => removeNetwork(key)}
                    aria-label={tx(t.removeAria, { name: def.name })}
                    className="size-9 inline-flex items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 transition-colors"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                {err ? (
                  <p className="text-xs text-destructive mt-1.5 ml-12">{err}</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1.5 ml-12">{def.name}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {suggestedKeys.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">
            {activeKeys.length === 0 ? t.whereFindYou : t.addAnother}
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestedKeys.map((key) => {
              const def = defForKey(key)
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => addNetwork(key)}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card text-sm text-foreground px-3 py-1.5 hover:border-primary/40 hover:bg-accent/30 transition-colors"
                >
                  <SocialLogo def={def} size="sm" />
                  {def.name}
                  <Plus className="size-3 text-muted-foreground" strokeWidth={2.5} />
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-5">
        {showCustom ? (
          <div className="rounded-[var(--radius-card)] border border-border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">{t.addCustomTitle}</p>
              <button
                type="button"
                onClick={() => {
                  setShowCustom(false)
                  setCustomError(null)
                }}
                className="text-muted-foreground hover:text-foreground"
                aria-label={t.closeAria}
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={t.customNamePlaceholder}
                className="h-10 px-3 text-base md:text-sm rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring transition-colors"
              />
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder={t.customUrlPlaceholder}
                className="h-10 px-3 text-base md:text-sm rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring transition-colors"
              />
            </div>
            {customError && <p className="text-xs text-destructive">{customError}</p>}
            <Button type="button" onClick={submitCustom} size="sm" className="w-full sm:w-auto">
              {t.addCustomButton}
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80"
          >
            <Plus className="size-3.5" strokeWidth={2.5} />
            {t.addCustomCta}
          </button>
        )}
      </div>

      <div className="flex gap-3 mt-8">
        <Button type="button" onClick={onBack} variant="outline" size="lg" className="h-12">
          {tc.back}
        </Button>
        <Button
          type="button"
          onClick={submit}
          disabled={saving}
          size="lg"
          className="flex-1 h-12"
        >
          {saving ? tc.saving : tc.continue}
        </Button>
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="mx-auto block mt-4 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
      >
        {tc.skip}
      </button>
    </div>
  )
}
