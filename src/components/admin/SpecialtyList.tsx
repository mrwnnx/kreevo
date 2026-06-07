'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Loader2, Medal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SpecialtyRow {
  id: string
  slug: string
  name: string | null
  name_fr: string | null
  emoji: string | null
  order_index: number
  is_active: boolean
}

export function SpecialtyList() {
  const [rows, setRows] = useState<SpecialtyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/specialties')
    const data = await res.json().catch(() => ({}))
    setRows(data.specialties ?? [])
    setLoading(false)
  }

  async function toggleActive(row: SpecialtyRow) {
    setError(null)
    setBusy(row.id)
    const res = await fetch(`/api/admin/specialties/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !row.is_active }),
    })
    setBusy(null)
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? 'Échec.'); return }
    load()
  }

  async function del(id: string) {
    if (!confirm('Supprimer cette spécialité ? Action irréversible (sinon désactive-la).')) return
    setError(null)
    setBusy(id)
    const res = await fetch(`/api/admin/specialties/${id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    setBusy(null)
    if (!res.ok) { setError(data.error ?? 'Suppression impossible.'); return }
    load()
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/challenges" className="text-xs text-muted-foreground hover:text-foreground">← Challenges</Link>
          <h1 className="text-2xl font-bold mt-1">Spécialités</h1>
          <p className="text-sm text-muted-foreground">{rows.length} spécialité(s)</p>
        </div>
        <Link
          href="/admin/specialties/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-full hover:opacity-85 transition-opacity"
        >
          <Plus className="size-4" /> Créer
        </Link>
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
                {['Ordre', 'Emoji', 'Nom', 'Slug', 'Active', 'Actions'].map((h) => (
                  <th key={h} className="text-start px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 font-mono text-muted-foreground">{r.order_index}</td>
                  <td className="px-4 py-3 text-lg">{r.emoji ?? '—'}</td>
                  <td className="px-4 py-3 font-medium">{r.name_fr || r.name || r.slug}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.slug}</td>
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
                      <Link href={`/admin/specialties/${r.id}/leagues`} className="text-muted-foreground hover:text-foreground" title="Voir les ligues"><Medal className="size-4" /></Link>
                      <Link href={`/admin/specialties/${r.id}`} className="text-muted-foreground hover:text-foreground" title="Modifier"><Pencil className="size-4" /></Link>
                      <button onClick={() => del(r.id)} disabled={busy === r.id} className="text-muted-foreground hover:text-destructive disabled:opacity-50" title="Supprimer">
                        {busy === r.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Aucune spécialité.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
