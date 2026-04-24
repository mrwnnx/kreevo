'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Power } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LeagueIcon } from '@/components/features/league/LeagueIcon'

interface League {
  id: string
  name: string
  icon: string
  color: string
  order_index: number
  min_challenges: number
  access: 'all' | 'pro_only'
  is_active: boolean
}

interface LeagueStats {
  challengeCount: number
  xpThreshold: number
}

export default function AdminLeagues() {
  const [leagues, setLeagues] = useState<League[]>([])
  const [stats, setStats] = useState<Record<string, LeagueStats>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadLeagues() }, [])

  async function loadLeagues() {
    setLoading(true)
    const res = await fetch('/api/admin/leagues')
    const data = await res.json()
    const ls: League[] = data.leagues ?? []
    setLeagues(ls)
    setLoading(false)

    const entries = await Promise.all(
      ls.map(async l => {
        const r = await fetch(`/api/admin/leagues/${l.id}/stats`)
        const s = await r.json()
        return [l.id, s] as [string, LeagueStats]
      })
    )
    setStats(Object.fromEntries(entries))
  }

  async function toggleActive(league: League) {
    await fetch(`/api/admin/leagues/${league.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !league.is_active }),
    })
    loadLeagues()
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ligues</h1>
          <p className="text-sm text-muted-foreground">{leagues.length} ligues configurées</p>
        </div>
        <Link
          href="/admin/leagues/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-full hover:opacity-85 transition-opacity"
        >
          <Plus className="size-4" />
          Créer une ligue
        </Link>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white dark:bg-zinc-900/20 border-b border-border">
            <tr>
              {['Ligue', 'Ordre', 'Défis actifs', 'XP seuil', 'Accès', 'Statut', 'Actions'].map(h => (
                <th key={h} className="text-left text-xs font-mono text-muted-foreground uppercase tracking-widest px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">Chargement…</td></tr>
            ) : leagues.map(league => (
              <tr key={league.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <LeagueIcon icon={league.icon} size="md" />
                    <span className="font-medium">{league.name}</span>
                    <span className="inline-block size-3 rounded-full shrink-0" style={{ backgroundColor: league.color }} />
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{league.order_index}</td>
                <td className="px-4 py-3 font-mono text-xs">
                  {stats[league.id] !== undefined ? stats[league.id].challengeCount : '…'}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {stats[league.id] !== undefined ? `${stats[league.id].xpThreshold} XP` : '…'}
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'text-[10px] font-mono px-2 py-0.5 rounded-full',
                    league.access === 'all' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                  )}>
                    {league.access === 'all' ? 'Free + Pro' : 'Pro only'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'text-[10px] font-mono px-2 py-0.5 rounded-full',
                    league.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                  )}>
                    {league.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/leagues/${league.id}`}
                      title="Modifier"
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Pencil className="size-3.5" />
                    </Link>
                    <button
                      onClick={() => toggleActive(league)}
                      title={league.is_active ? 'Désactiver' : 'Activer'}
                      className={cn(
                        'p-1.5 rounded-md transition-colors',
                        league.is_active ? 'hover:bg-orange-100 text-orange-500' : 'hover:bg-green-100 text-green-600'
                      )}
                    >
                      <Power className="size-3.5" />
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
