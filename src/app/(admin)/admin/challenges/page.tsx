'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Eye, Pencil, Trash2, Zap, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Challenge {
  id: string
  title: string
  track: string
  level: string
  month: number
  year: number
  status: string
  reveal_at: string
  closes_at: string
  _count?: number
}

const STATUS_STYLE: Record<string, string> = {
  draft:    'bg-muted text-muted-foreground',
  active:   'bg-green-100 text-green-700',
  closed:   'bg-orange-100 text-orange-700',
  archived: 'bg-slate-100 text-slate-500',
}

export default function AdminChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/challenges')
    const data = await res.json()
    setChallenges(data.challenges ?? [])
    setLoading(false)
  }

  async function publish(id: string) {
    await fetch(`/api/admin/challenges/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    })
    load()
  }

  async function reveal(id: string) {
    await fetch(`/api/admin/challenges/${id}/reveal`, { method: 'POST' })
    load()
  }

  async function del(id: string) {
    setDeleting(id)
    await fetch(`/api/admin/challenges/${id}`, { method: 'DELETE' })
    setConfirming(null)
    setDeleting(null)
    load()
  }

  const filtered = challenges.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.track.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Challenges</h1>
          <p className="text-sm text-muted-foreground">{challenges.length} challenges au total</p>
        </div>
        <Link
          href="/admin/challenges/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-full hover:opacity-85 transition-opacity"
        >
          <Plus className="size-4" />
          Nouveau challenge
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par titre ou track…"
          className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              {['Titre', 'Track', 'Niveau', 'Période', 'Status', 'Reveal', 'Closes', 'Actions'].map(h => (
                <th key={h} className="text-left text-xs font-mono text-muted-foreground uppercase tracking-widest px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">Chargement…</td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium max-w-[200px] truncate">{c.title}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.track}</td>
                <td className="px-4 py-3 capitalize text-xs">{c.level}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.month}/{c.year}</td>
                <td className="px-4 py-3">
                  <span className={cn('text-[10px] font-mono px-2 py-0.5 rounded-full capitalize', STATUS_STYLE[c.status] ?? STATUS_STYLE.draft)}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                  {c.reveal_at ? new Date(c.reveal_at).toLocaleDateString('fr') : '—'}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                  {c.closes_at ? new Date(c.closes_at).toLocaleDateString('fr') : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {c.status === 'draft' && (
                      <button onClick={() => publish(c.id)} title="Publier" className="p-1.5 rounded-md hover:bg-green-100 text-green-600 transition-colors">
                        <CheckCircle className="size-3.5" />
                      </button>
                    )}
                    {c.status === 'active' && (
                      <button onClick={() => reveal(c.id)} title="Reveal maintenant" className="p-1.5 rounded-md hover:bg-blue-100 text-blue-600 transition-colors">
                        <Eye className="size-3.5" />
                      </button>
                    )}
                    <Link href={`/admin/challenges/${c.id}`} title="Éditer" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="size-3.5" />
                    </Link>
                    {confirming === c.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => del(c.id)} disabled={!!deleting} className="text-[10px] font-mono bg-destructive text-destructive-foreground px-2 py-0.5 rounded">
                          {deleting === c.id ? '…' : 'Confirmer'}
                        </button>
                        <button onClick={() => setConfirming(null)} className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 rounded hover:bg-muted">
                          Non
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirming(c.id)} title="Supprimer" className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
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
