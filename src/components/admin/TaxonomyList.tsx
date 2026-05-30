'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type TStatus = 'draft' | 'ai_generated' | 'validated'
interface TaxoRow {
  id: string
  name_fr: string | null
  name_en: string | null
  name_ar: string | null
  specialty?: string | null
  display_order: number
  translation_status: Record<string, TStatus> | null
}

const STATUS_DOT: Record<TStatus, string> = {
  draft: 'bg-muted-foreground/40',
  ai_generated: 'bg-amber-500',
  validated: 'bg-emerald-500',
}

function LangDot({ lang, status }: { lang: string; status?: TStatus }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase text-muted-foreground">
      <span className={cn('size-1.5 rounded-full', STATUS_DOT[status ?? 'draft'])} />
      {lang}
    </span>
  )
}

export function TaxonomyList({ kind }: { kind: 'type' | 'industry' }) {
  const endpoint = kind === 'type' ? 'challenge-types' : 'industries'
  const collection = kind === 'type' ? 'types' : 'industries'
  const base = kind === 'type' ? '/admin/challenges/types' : '/admin/challenges/industries'
  const title = kind === 'type' ? 'Types de challenge' : 'Industries'

  const [rows, setRows] = useState<TaxoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/admin/${endpoint}`)
    const data = await res.json()
    setRows(data[collection] ?? [])
    setLoading(false)
  }

  async function del(id: string) {
    if (!confirm('Supprimer cette entrée ? Action irréversible.')) return
    setError(null)
    setDeleting(id)
    const res = await fetch(`/api/admin/${endpoint}/${id}`, { method: 'DELETE' })
    const data = await res.json().catch(() => ({}))
    setDeleting(null)
    if (!res.ok) { setError(data.error ?? 'Suppression impossible.'); return }
    load()
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/challenges" className="text-xs text-muted-foreground hover:text-foreground">← Challenges</Link>
          <h1 className="text-2xl font-bold mt-1">{title}</h1>
          <p className="text-sm text-muted-foreground">{rows.length} entrées</p>
        </div>
        <Link
          href={`${base}/new`}
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-full hover:opacity-85 transition-opacity"
        >
          <Plus className="size-4" /> Créer
        </Link>
      </div>

      {error && (
        <p className="text-sm text-destructive font-mono bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-2">{error}</p>
      )}

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white dark:bg-zinc-900/20 border-b border-border">
            <tr>
              {['Ordre', 'FR', 'EN', 'AR', ...(kind === 'type' ? ['Spécialité'] : []), 'Statuts', 'Actions'].map(h => (
                <th key={h} className="text-start text-xs font-mono text-muted-foreground uppercase tracking-widest px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={kind === 'type' ? 7 : 6} className="px-4 py-8 text-center text-muted-foreground text-sm">Chargement…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={kind === 'type' ? 7 : 6} className="px-4 py-8 text-center text-muted-foreground text-sm">Aucune entrée. Applique la migration puis crée-en une.</td></tr>
            ) : rows.map(r => (
              <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{r.display_order}</td>
                <td className="px-4 py-3 font-medium">{r.name_fr ?? '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{r.name_en ?? '—'}</td>
                <td className="px-4 py-3 text-muted-foreground" dir="rtl">{r.name_ar ?? '—'}</td>
                {kind === 'type' && <td className="px-4 py-3 text-xs text-muted-foreground">{r.specialty ?? '—'}</td>}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {(['fr', 'en', 'ar'] as const).map(l => (
                      <LangDot key={l} lang={l} status={r.translation_status?.[l]} />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link href={`${base}/${r.id}`} title="Modifier" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="size-3.5" />
                    </Link>
                    <button
                      onClick={() => del(r.id)}
                      disabled={deleting === r.id}
                      title="Supprimer"
                      className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    >
                      {deleting === r.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
