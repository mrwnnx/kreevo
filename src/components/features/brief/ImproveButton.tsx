'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

export type BriefField = 'title' | 'context' | 'brief' | 'constraints' | 'criteria' | 'deliverable'

type ImproveT = Dictionary['company']['briefForm']['improve']

interface ImproveButtonProps {
  field: BriefField
  /** Lit la valeur ACTUELLE du champ (DOM, non contrôlé) au moment du clic. */
  getValue: () => string
  /** Écrit la proposition dans le champ — uniquement appelé par "accepter". */
  applyValue: (value: string) => void
  /** Lit les autres champs du formulaire tels que tapés, au moment du clic. */
  getContext: () => Record<string, string>
  busyField: BriefField | null
  setBusyField: (field: BriefField | null) => void
  t: ImproveT
}

/**
 * Un bouton « améliorer » par champ (POST /api/briefs/improve). La proposition
 * s'affiche À CÔTÉ du texte d'origine — jamais à sa place — avec
 * accepter/refuser. "accepter" écrit dans le champ via `applyValue` (le champ
 * reste un <textarea>/<Input> non contrôlé, cf. BriefForm) ; "refuser" se
 * contente d'effacer la proposition, le texte d'origine n'a jamais été touché.
 *
 * Un seul appel en vol pour tout le formulaire : `busyField` est levé dans
 * BriefForm et partagé entre les six boutons, pas un état local par champ.
 */
export function ImproveButton({
  field,
  getValue,
  applyValue,
  getContext,
  busyField,
  setBusyField,
  t,
}: ImproveButtonProps) {
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isThisLoading = busyField === field
  const isLocked = busyField !== null && busyField !== field

  async function handleClick() {
    const value = getValue().trim()
    setError(null)
    setSuggestion(null)
    if (!value) {
      setError(t.errorEmpty)
      return
    }

    setBusyField(field)
    try {
      const res = await fetch('/api/briefs/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field, value, context: getContext() }),
      })
      if (res.status === 429) {
        setError(t.errorRateLimit)
        return
      }
      const data = await res.json().catch(() => null)
      if (!res.ok || typeof data?.suggestion !== 'string' || !data.suggestion) {
        setError(t.errorGeneric)
        return
      }
      setSuggestion(data.suggestion)
    } catch {
      setError(t.errorGeneric)
    } finally {
      setBusyField(null)
    }
  }

  function accept() {
    if (suggestion) applyValue(suggestion)
    setSuggestion(null)
  }

  function reject() {
    setSuggestion(null)
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleClick}
        disabled={isLocked || isThisLoading}
        className="text-violet-600 hover:text-violet-700 dark:text-violet-400"
      >
        <Sparkles className="size-3.5" />
        {isThisLoading ? t.loading : t.trigger}
      </Button>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {suggestion && (
        <div className="space-y-2 rounded-2xl border border-violet-200 bg-violet-50/60 p-3 dark:border-violet-900 dark:bg-violet-950/30">
          <p className="text-xs font-medium text-violet-700 dark:text-violet-300">{t.suggestionLabel}</p>
          <p className="whitespace-pre-wrap text-sm text-foreground">{suggestion}</p>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={accept}>
              {t.accept}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={reject}>
              {t.reject}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
