'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'

interface Labels {
  title: string
  regenerate: string
  regenerating: string
  error: string
}

interface PrivateLinkPanelProps {
  briefId: string
  token: string
  labels: Labels
}

/**
 * Affiche le lien privé du brief et permet de régénérer son jeton — invalide
 * l'ancien lien immédiatement (POST /api/briefs/[id]/token). Composant client
 * séparé du BriefForm : seul un brief existant en `visibility='private'` a un
 * jeton à régénérer, la page `/briefs/new` n'en a pas.
 */
export function PrivateLinkPanel({ briefId, token, labels }: PrivateLinkPanelProps) {
  const [currentToken, setCurrentToken] = useState(token)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function regenerate() {
    setError(null)
    startTransition(async () => {
      const res = await fetch(`/api/briefs/${briefId}/token`, { method: 'POST' })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.accessToken) {
        setError(labels.error)
        return
      }
      setCurrentToken(data.accessToken)
    })
  }

  return (
    <div className="space-y-2 rounded-2xl border border-border bg-muted/30 p-4">
      <p className="text-sm font-medium text-foreground">{labels.title}</p>
      <p className="break-all text-xs text-muted-foreground">/brief/{currentToken}</p>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button type="button" variant="outline" size="sm" onClick={regenerate} disabled={isPending}>
        {isPending ? labels.regenerating : labels.regenerate}
      </Button>
    </div>
  )
}
