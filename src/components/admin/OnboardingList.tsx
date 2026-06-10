'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Loader2, ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepRow {
  id: string
  order_index: number
  image_url: string | null
  name_fr: string
  title_fr: string
  is_active: boolean
}

export function OnboardingList() {
  const [rows, setRows] = useState<StepRow[]>([])
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [stepsRes, settingsRes] = await Promise.all([
      fetch('/api/admin/onboarding-steps'),
      fetch('/api/admin/settings'),
    ])
    const stepsData = await stepsRes.json().catch(() => ({}))
    const settingsData = await settingsRes.json().catch(() => ({}))
    setRows(stepsData.steps ?? [])
    // flag absent → considéré activé (défaut)
    setEnabled(settingsData.settings?.onboarding_tour_enabled !== false)
    setLoading(false)
  }

  async function toggleEnabled() {
    setError(null)
    setBusy('flag')
    const next = !enabled
    setEnabled(next)
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'onboarding_tour_enabled', value: next }),
    })
    setBusy(null)
    if (!res.ok) { setEnabled(!next); const d = await res.json().catch(() => ({})); setError(d.error ?? 'Échec.') }
  }

  async function toggleActive(row: StepRow) {
    setError(null)
    setBusy(row.id)
    const res = await fetch(`/api/admin/onboarding-steps/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !row.is_active }),
    })
    setBusy(null)
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? 'Échec.'); return }
    load()
  }

  // Swap order_index avec le voisin (haut/bas) via /reorder.
  async function move(index: number, dir: -1 | 1) {
    const neighbor = index + dir
    if (neighbor < 0 || neighbor >= rows.length) return
    const a = rows[index]
    const b = rows[neighbor]
    setError(null)
    setBusy(a.id)
    const res = await fetch('/api/admin/onboarding-steps/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [
        { id: a.id, order_index: b.order_index },
        { id: b.id, order_index: a.order_index },
      ] }),
    })
    setBusy(null)
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? 'Échec.'); return }
    load()
  }

  async function del(id: string) {
    if (!confirm('Supprimer cette étape ? Action irréversible (sinon désactive-la).')) return
    setError(null)
    setBusy(id)
    const res = await fetch(`/api/admin/onboarding-steps/${id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    setBusy(null)
    if (!res.ok) { setError(data.error ?? 'Suppression impossible.'); return }
    load()
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Onboarding</h1>
          <p className="text-sm text-muted-foreground">{rows.length} étape(s) — tour de bienvenue</p>
        </div>
        <Link
          href="/admin/onboarding/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-full hover:opacity-85 transition-opacity"
        >
          <Plus className="size-4" /> Ajouter une étape
        </Link>
      </div>

      {/* Toggle global */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div>
          <p className="text-sm font-semibold">Tour activé</p>
          <p className="text-xs text-muted-foreground">Désactivé → aucun user ne voit le tour, même non terminé.</p>
        </div>
        <button
          onClick={toggleEnabled}
          disabled={busy === 'flag'}
          className={cn('relative w-12 h-6 rounded-full transition-colors disabled:opacity-50', enabled ? 'bg-primary' : 'bg-muted')}
        >
          <span className={cn('absolute top-1 size-4 rounded-full bg-white shadow transition-transform', enabled ? 'start-7' : 'start-1')} />
        </button>
      </div>

      {error && (
        <p className="text-sm text-destructive font-mono bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-2">{error}</p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Chargement…</div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white dark:bg-zinc-900/20 border-b border-border">
              <tr>
                {['Ordre', 'Nom (FR)', 'Titre (FR)', 'Active', 'Actions'].map((h) => (
                  <th key={h} className="text-start px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className={cn('border-b border-border/50 last:border-0', !r.is_active && 'opacity-50')}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-muted-foreground w-5">{r.order_index}</span>
                      <button onClick={() => move(i, -1)} disabled={i === 0 || busy === r.id} className="text-muted-foreground hover:text-foreground disabled:opacity-30" title="Monter"><ChevronUp className="size-4" /></button>
                      <button onClick={() => move(i, 1)} disabled={i === rows.length - 1 || busy === r.id} className="text-muted-foreground hover:text-foreground disabled:opacity-30" title="Descendre"><ChevronDown className="size-4" /></button>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{r.name_fr}</td>
                  <td className="px-4 py-3 text-muted-foreground truncate max-w-[260px]">{r.title_fr}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(r)}
                      disabled={busy === r.id}
                      className={cn(
                        'text-[11px] font-semibold px-2 py-0.5 rounded-full transition-colors disabled:opacity-50',
                        r.is_active
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {r.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/onboarding/${r.id}`} className="text-muted-foreground hover:text-foreground" title="Modifier"><Pencil className="size-4" /></Link>
                      <button onClick={() => del(r.id)} disabled={busy === r.id} className="text-muted-foreground hover:text-destructive disabled:opacity-50" title="Supprimer">
                        {busy === r.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Aucune étape.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
