'use client'

import { useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StepHeader } from './StepHeader'
import {
  SOCIAL_DEFS,
  SUGGESTED_BY_SPECIALTY,
  defForKey,
  slugifyPlatform,
  type SocialDef,
} from './socials'
import type { Specialty } from './types'

interface Step5Props {
  specialty: Specialty
  links: Record<string, string>
  onNext: (data: { links: Record<string, string> }) => void
  onBack: () => void
  onSkip: () => void
  saving?: boolean
}

const isValidUrl = (v: string) => v.length === 0 || v.trim().toLowerCase().startsWith('https://')

export function Step5Social({ specialty, links, onNext, onBack, onSkip, saving }: Step5Props) {
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
      setCustomError('Give it a name')
      return
    }
    if (!isValidUrl(customUrl)) {
      setCustomError('URL must start with https://')
      return
    }
    const key = slugifyPlatform(name)
    if (!key) {
      setCustomError('Invalid name')
      return
    }
    if (!SOCIAL_DEFS[key]) {
      SOCIAL_DEFS[key] = {
        key,
        name,
        placeholder: 'https://...',
        iconText: name.slice(0, 2),
        iconBg: '#71717A',
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
      if (v && !isValidUrl(v)) newErrors[key] = 'URL must start with https://'
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
      <StepHeader
        title="Connect your portfolio 🔗"
        subtitle="Add the platforms where you share your work."
      />

      {activeKeys.length > 0 && (
        <div className="space-y-3 mb-6">
          {activeKeys.map((key) => {
            const def = defForKey(key)
            const err = errors[key]
            return (
              <div key={key}>
                <div className="flex items-center gap-2">
                  <SocialIcon def={def} />
                  <input
                    type="url"
                    value={values[key] ?? ''}
                    onChange={(e) => updateUrl(key, e.target.value)}
                    placeholder={def.placeholder}
                    className={`flex-1 h-12 px-3 text-sm rounded-[var(--radius-input)] border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-3 transition-colors ${
                      err
                        ? 'border-destructive focus:ring-destructive/20'
                        : 'border-input focus:ring-ring/30 focus:border-ring'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => removeNetwork(key)}
                    aria-label={`Remove ${def.name}`}
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
            {activeKeys.length === 0 ? 'Where can people find you?' : 'Add another network'}
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
                  <SocialIcon def={def} small />
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
              <p className="text-sm font-semibold text-foreground">Add a custom platform</p>
              <button
                type="button"
                onClick={() => {
                  setShowCustom(false)
                  setCustomError(null)
                }}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Platform name"
                className="h-10 px-3 text-sm rounded-[var(--radius-input)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-3 focus:ring-ring/30 focus:border-ring"
              />
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://..."
                className="h-10 px-3 text-sm rounded-[var(--radius-input)] border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-3 focus:ring-ring/30 focus:border-ring"
              />
            </div>
            {customError && <p className="text-xs text-destructive">{customError}</p>}
            <Button type="button" onClick={submitCustom} size="sm" className="w-full sm:w-auto">
              Add platform
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80"
          >
            <Plus className="size-3.5" strokeWidth={2.5} />
            Add a custom platform
          </button>
        )}
      </div>

      <div className="flex gap-3 mt-8">
        <Button type="button" onClick={onBack} variant="outline" size="lg" className="h-12">
          ← Back
        </Button>
        <Button
          type="button"
          onClick={submit}
          disabled={saving}
          size="lg"
          className="flex-1 h-12"
        >
          {saving ? 'Saving…' : 'Continue →'}
        </Button>
      </div>

      <button
        type="button"
        onClick={onSkip}
        className="mx-auto block mt-4 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
      >
        Skip for now →
      </button>
    </div>
  )
}

function SocialIcon({ def, small }: { def: SocialDef; small?: boolean }) {
  const size = small ? 'size-5 text-[10px]' : 'size-9 text-xs'
  return (
    <span
      className={`${size} shrink-0 inline-flex items-center justify-center rounded-full font-bold tracking-tight`}
      style={{ backgroundColor: def.iconBg, color: def.iconColor ?? '#FFFFFF' }}
      aria-hidden
    >
      {def.iconText}
    </span>
  )
}
