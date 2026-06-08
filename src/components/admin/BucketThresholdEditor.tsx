'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, RotateCcw, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  leagueId: string
  specialtyId: string
  leagueName: string
  auto: number          // valeur calculée (fallback), recalculée côté page
  override: number | null // seuil manuel si défini, sinon null
}

export function BucketThresholdEditor({ leagueId, specialtyId, auto, override }: Props) {
  const router = useRouter()
  const isManual = override !== null
  const effective = isManual ? (override as number) : auto

  const [value, setValue] = useState<string>(String(isManual ? override : auto))
  const [busy, setBusy] = useState<null | 'save' | 'clear'>(null)
  const [error, setError] = useState<string | null>(null)

  const parsed = Number(value)
  const validInput = Number.isInteger(parsed) && parsed >= 0

  async function save() {
    if (!validInput) { setError('Entier ≥ 0 requis.'); return }
    setError(null); setBusy('save')
    const res = await fetch('/api/admin/league-thresholds', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ league_id: leagueId, specialty_id: specialtyId, xp_threshold: parsed }),
    })
    setBusy(null)
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? 'Échec.'); return }
    router.refresh()
  }

  async function clear() {
    setError(null); setBusy('clear')
    const res = await fetch('/api/admin/league-thresholds', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ league_id: leagueId, specialty_id: specialtyId }),
    })
    setBusy(null)
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? 'Échec.'); return }
    router.refresh()
  }

  // Libellé du seuil effectif (0 manuel = explicite, pas « vide »).
  const effectiveLabel = isManual && effective === 0
    ? 'aucune barrière XP'
    : `${effective.toLocaleString()} XP`

  const showAutoHint = !isManual && validInput && parsed === auto

  return (
    <div className="rounded-lg border border-border/70 bg-muted/30 p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Seuil promo : <span className="font-semibold text-foreground">{effectiveLabel}</span></span>
        <span
          className={cn(
            'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
            isManual
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {isManual ? (effective === 0 ? 'Manuel — aucune barrière XP' : 'Manuel') : 'Auto'}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          step={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full h-8 rounded-md border border-input bg-transparent dark:bg-input/30 px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <button
          onClick={save}
          disabled={busy !== null || !validInput}
          title="Enregistrer le seuil manuel"
          className="shrink-0 inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-semibold px-2.5 h-8 rounded-md hover:opacity-85 transition-opacity disabled:opacity-50"
        >
          {busy === 'save' ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
        </button>
        {isManual && (
          <button
            onClick={clear}
            disabled={busy !== null}
            title="Réinitialiser (revenir au calcul auto)"
            className="shrink-0 inline-flex items-center gap-1 border border-border text-muted-foreground text-xs font-semibold px-2.5 h-8 rounded-md hover:text-foreground hover:border-foreground/40 transition-colors disabled:opacity-50"
          >
            {busy === 'clear' ? <Loader2 className="size-3.5 animate-spin" /> : <RotateCcw className="size-3.5" />}
          </button>
        )}
      </div>

      {showAutoHint && <p className="text-[10px] text-muted-foreground">= valeur auto calculée ({auto.toLocaleString()})</p>}
      {error && <p className="text-[10px] text-destructive">{error}</p>}
    </div>
  )
}
