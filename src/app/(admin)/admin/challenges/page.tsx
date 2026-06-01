'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LeagueIcon } from '@/components/features/league/LeagueIcon'

interface League { id: string; name: string; icon: string }

interface Challenge {
  id: string
  title: string
  specialty: string | null
  challenge_types: { name_fr: string | null } | null
  industries: { name_fr: string | null } | null
  xp_reward: number | null
  deadline_days: number | null
  is_published: boolean
  league_id: string | null
  leagues: League | null
}

export default function AdminChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [leagues, setLeagues] = useState<League[]>([])
  const [selectedLeague, setSelectedLeague] = useState<string>('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/leagues')
      .then(r => r.json())
      .then(d => setLeagues(d.leagues ?? []))
  }, [])

  useEffect(() => { load() }, [selectedLeague])

  async function load() {
    setLoading(true)
    const url = selectedLeague
      ? `/api/admin/challenges?league_id=${selectedLeague}`
      : '/api/admin/challenges'
    const res = await fetch(url)
    const data = await res.json()
    setChallenges(data.challenges ?? [])
    setLoading(false)
  }

  async function publish(id: string, value: boolean) {
    await fetch(`/api/admin/challenges/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_published: value }),
    })
    load()
  }

  async function del(id: string) {
    setDeleting(id)
    await fetch(`/api/admin/challenges/${id}`, { method: 'DELETE' })
    setConfirming(null)
    setDeleting(null)
    load()
  }

  const q = search.toLowerCase()
  const filtered = challenges.filter(c =>
    c.title.toLowerCase().includes(q) ||
    (c.specialty ?? '').toLowerCase().includes(q) ||
    (c.challenge_types?.name_fr ?? '').toLowerCase().includes(q) ||
    (c.industries?.name_fr ?? '').toLowerCase().includes(q)
  )

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Challenges</h1>
          <p className="text-sm text-muted-foreground">{challenges.length} challenges</p>
        </div>
        <Link
          href="/admin/challenges/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-full hover:opacity-85 transition-opacity"
        >
          <Plus className="size-4" />
          Nouveau challenge
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedLeague('')}
            className={cn(
              'shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-all',
              !selectedLeague
                ? 'bg-foreground text-background border-foreground'
                : 'border-border text-muted-foreground hover:border-foreground/40'
            )}
          >
            Toutes les ligues
          </button>
          {leagues.map(l => (
            <button
              key={l.id}
              onClick={() => setSelectedLeague(l.id)}
              className={cn(
                'shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-all',
                selectedLeague === l.id
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:border-foreground/40'
              )}
            >
              <LeagueIcon icon={l.icon} size="sm" /> {l.name}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="w-full h-10 ps-9 pe-4 rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 text-base md:text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white dark:bg-zinc-900/20 border-b border-border">
            <tr>
              {['Titre', 'Ligue', 'Spécialité', 'Type', 'Industrie', 'XP', 'Deadline', 'Publié', 'Actions'].map(h => (
                <th key={h} className="text-start text-xs font-mono text-muted-foreground uppercase tracking-widest px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground text-sm">Chargement…</td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium max-w-[180px] truncate">{c.title}</td>
                <td className="px-4 py-3 text-xs">
                  {c.leagues
                    ? <span className="flex items-center gap-1"><LeagueIcon icon={c.leagues.icon} size="sm" /><span className="text-muted-foreground">{c.leagues.name}</span></span>
                    : <span className="text-muted-foreground/40">—</span>}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.specialty ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.challenge_types?.name_fr ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.industries?.name_fr ?? '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {c.xp_reward ? `${c.xp_reward} XP` : '—'}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {c.deadline_days ? `${c.deadline_days}j` : '—'}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => publish(c.id, !c.is_published)}
                    className={cn(
                      'text-[10px] font-mono px-2 py-0.5 rounded-full transition-colors',
                      c.is_published
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-muted text-muted-foreground hover:bg-muted/70'
                    )}
                  >
                    {c.is_published ? 'Publié' : 'Draft'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/challenges/${c.id}`} title="Éditer" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="size-3.5" />
                    </Link>
                    {confirming === c.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => del(c.id)} disabled={!!deleting} className="text-[10px] font-mono bg-destructive text-destructive-foreground px-2 py-0.5 rounded">
                          {deleting === c.id ? '…' : 'Confirmer'}
                        </button>
                        <button onClick={() => setConfirming(null)} className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 rounded hover:bg-muted">Non</button>
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
