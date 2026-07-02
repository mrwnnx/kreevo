'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  Search, ChevronDown, ExternalLink, TrendingUp, TrendingDown,
  Ban, Shield, Trash2, Plus, Crown, Palette,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { getLeagueLabel } from '@/lib/utils/xp'

interface User {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  plan: string
  league: string
  xp: number
  role: string
  is_suspended: boolean
  created_at: string
  submissions: number
  completionRate: number | null
  avgScore: number | null
}

type SortKey = 'xp' | 'submissions' | 'completionRate' | 'avgScore' | 'created_at'

const PLAN_STYLE: Record<string, string> = {
  free:   'bg-muted text-muted-foreground',
  pro:    'bg-primary/10 text-primary',
  studio: 'bg-violet-100 text-violet-700',
}

const FILTER_TABS = ['Tous', 'Free', 'Pro', 'Suspendus', 'Admins']

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [leagues, setLeagues] = useState<{ id: string; name: string }[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('Tous')
  const [loading, setLoading] = useState(true)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [xpModal, setXpModal] = useState<string | null>(null)
  const [leagueModal, setLeagueModal] = useState<string | null>(null)
  const [specialtyModal, setSpecialtyModal] = useState<string | null>(null)
  const [xpAmount, setXpAmount] = useState('')
  const [leagueVal, setLeagueVal] = useState('')
  const [specialtyVal, setSpecialtyVal] = useState<'ux_ui' | 'graphic'>('ux_ui')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const [usersRes, leaguesRes] = await Promise.all([
      fetch('/api/admin/users'),
      fetch('/api/admin/leagues'),
    ])
    const usersData = await usersRes.json()
    const leaguesData = await leaguesRes.json()
    setUsers(usersData.users ?? [])
    const sortedLeagues = (leaguesData.leagues ?? []).sort((a: any, b: any) => a.order_index - b.order_index)
    setLeagues(sortedLeagues)
    if (sortedLeagues.length > 0 && !leagueVal) setLeagueVal(sortedLeagues[0].name)
    setLoading(false)
  }

  async function action(id: string, body: Record<string, unknown>) {
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setOpenMenu(null)
    load()
  }

  async function deleteUser(id: string) {
    setDeleting(true)
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    setDeleting(false)
    if (!res.ok) {
      const data = await res.json().catch(() => null)
      toast.error(`Suppression échouée : ${data?.error ?? `erreur ${res.status}`}`)
      return // la modale reste ouverte : l'admin voit l'échec, peut annuler ou réessayer
    }
    toast.success('Compte supprimé.')
    setConfirmDelete(null)
    load()
  }

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      filter === 'Tous'      ? true :
      filter === 'Free'      ? u.plan === 'free' :
      filter === 'Pro'       ? u.plan === 'pro' :
      filter === 'Suspendus' ? u.is_suspended :
      filter === 'Admins'    ? u.role === 'admin' : true
    return matchSearch && matchFilter
  })

  const sorted = filtered.slice().sort((a, b) => {
    const va = sortKey === 'created_at' ? +new Date(a.created_at) : (a[sortKey] ?? -1)
    const vb = sortKey === 'created_at' ? +new Date(b.created_at) : (b[sortKey] ?? -1)
    return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number)
  })

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-sm text-muted-foreground">{users.length} utilisateurs inscrits</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-border">
        {FILTER_TABS.map(t => (
          <button key={t} onClick={() => setFilter(t)}
            className={cn('px-4 py-2 text-sm font-medium transition-colors',
              filter === t
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}>
            {t}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom, username…"
          className="w-full h-10 ps-9 pe-4 rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 text-base md:text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors" />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white dark:bg-zinc-900/20 border-b border-border">
            <tr>
              {([
                ['User', null], ['Plan', null], ['Ligue', null], ['XP', 'xp'],
                ['Soum.', 'submissions'], ['Complétion', 'completionRate'], ['Score', 'avgScore'],
                ['Rôle', null], ['Statut', null], ['Inscrit', 'created_at'], ['Actions', null],
              ] as [string, SortKey | null][]).map(([h, key]) => (
                <th key={h} className="text-start text-xs font-mono text-muted-foreground uppercase tracking-widest px-4 py-3 whitespace-nowrap">
                  {key ? (
                    <button onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 hover:text-foreground transition-colors uppercase">
                      {h}{sortKey === key && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                    </button>
                  ) : h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">Chargement…</td></tr>
            ) : sorted.map(u => (
              <tr key={u.id} className={cn('hover:bg-muted/20 transition-colors', u.is_suspended && 'opacity-60')}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-7 rounded-md">
                      <AvatarImage src={u.avatar_url ?? undefined} />
                      <AvatarFallback className="rounded-md text-[10px]">{u.username?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{u.full_name ?? u.username}</p>
                      <p className="text-[11px] font-mono text-muted-foreground">@{u.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-[10px] font-mono px-2 py-0.5 rounded-full', PLAN_STYLE[u.plan] ?? PLAN_STYLE.free)}>
                    {u.plan}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs">{getLeagueLabel(u.league)}</td>
                <td className="px-4 py-3 font-mono text-xs">{u.xp?.toLocaleString()}</td>
                <td className="px-4 py-3 font-mono text-xs">{u.submissions}</td>
                <td className="px-4 py-3 font-mono text-xs">{u.completionRate === null ? '—' : `${u.completionRate}%`}</td>
                <td className="px-4 py-3 font-mono text-xs">{u.avgScore === null ? '—' : `${u.avgScore}/100`}</td>
                <td className="px-4 py-3">
                  {u.role === 'admin' && (
                    <span className="text-[10px] font-mono bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">admin</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {u.is_suspended && (
                    <span className="text-[10px] font-mono bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">Suspendu</span>
                  )}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString('fr', { day: 'numeric', month: 'short', year: '2-digit' })}
                </td>
                <td className="px-4 py-3">
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                      className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-muted transition-colors"
                    >
                      Actions <ChevronDown className="size-3" />
                    </button>

                    {openMenu === u.id && (
                      <div className="absolute end-0 top-full mt-1 z-50 w-52 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                        <Link href={`/u/${u.username}`} target="_blank"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                          <ExternalLink className="size-3.5" /> Voir profil public
                        </Link>
                        <Link href={`/admin/users/${u.id}`}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors">
                          <Search className="size-3.5" /> Détail complet
                        </Link>
                        <div className="border-t border-border" />
                        <button onClick={() => action(u.id, { plan: 'pro' })}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-start">
                          <TrendingUp className="size-3.5 text-green-500" /> Passer Pro
                        </button>
                        <button onClick={() => action(u.id, { plan: 'free' })}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-start">
                          <TrendingDown className="size-3.5" /> Passer Free
                        </button>
                        <button onClick={() => { setLeagueVal(u.league || (leagues[0]?.name ?? '')); setLeagueModal(u.id); setOpenMenu(null) }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-start">
                          <Shield className="size-3.5" /> Changer ligue
                        </button>
                        <button onClick={() => { setXpAmount(''); setXpModal(u.id); setOpenMenu(null) }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-start">
                          <Plus className="size-3.5" /> Ajouter XP
                        </button>
                        <button onClick={() => { setSpecialtyVal('ux_ui'); setSpecialtyModal(u.id); setOpenMenu(null) }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-start">
                          <Palette className="size-3.5 text-violet-500" /> Changer spécialité
                        </button>
                        <div className="border-t border-border" />
                        <button onClick={() => action(u.id, { is_suspended: !u.is_suspended })}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-start">
                          <Ban className="size-3.5 text-orange-500" />
                          {u.is_suspended ? 'Réactiver' : 'Suspendre'}
                        </button>
                        <button onClick={() => action(u.id, { role: u.role === 'admin' ? 'user' : 'admin' })}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors text-start">
                          <Crown className="size-3.5 text-amber-500" />
                          {u.role === 'admin' ? 'Rétrograder' : 'Passer admin'}
                        </button>
                        <div className="border-t border-border" />
                        <button onClick={() => { setConfirmDelete(u.id); setOpenMenu(null) }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors text-start">
                          <Trash2 className="size-3.5" /> Supprimer le compte
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* XP Modal */}
      {xpModal && (
        <Modal title="Ajouter XP" onClose={() => setXpModal(null)}>
          <input type="number" value={xpAmount} onChange={e => setXpAmount(e.target.value)}
            placeholder="Montant XP à ajouter"
            className="w-full h-10 rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 px-3 py-1 text-base md:text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors" />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setXpModal(null)} className="text-sm text-muted-foreground px-4 py-2">Annuler</button>
            <button onClick={() => { action(xpModal, { xp_add: parseInt(xpAmount) }); setXpModal(null) }}
              className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-full hover:opacity-85">
              Ajouter
            </button>
          </div>
        </Modal>
      )}

      {/* League Modal */}
      {leagueModal && (
        <Modal title="Changer ligue" onClose={() => setLeagueModal(null)}>
          <select value={leagueVal} onChange={e => setLeagueVal(e.target.value)}
            className="w-full h-10 rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 px-3 py-1 text-base md:text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors">
            {leagues.map(l => <option key={l.id} value={l.name}>{getLeagueLabel(l.name)}</option>)}
          </select>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setLeagueModal(null)} className="text-sm text-muted-foreground px-4 py-2">Annuler</button>
            <button onClick={() => { action(leagueModal, { league: leagueVal }); setLeagueModal(null) }}
              className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-full hover:opacity-85">
              Confirmer
            </button>
          </div>
        </Modal>
      )}

      {/* Specialty Modal */}
      {specialtyModal && (
        <Modal title="Changer spécialité" onClose={() => setSpecialtyModal(null)}>
          <select value={specialtyVal} onChange={e => setSpecialtyVal(e.target.value as 'ux_ui' | 'graphic')}
            className="w-full h-10 rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 px-3 py-1 text-base md:text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors">
            <option value="ux_ui">UX / UI Designer</option>
            <option value="graphic">Graphic Designer</option>
          </select>
          <p className="text-xs text-muted-foreground mt-2">
            ⚠️ Les outils choisis par l&apos;user dans son profil ne seront plus tous valides après le switch.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setSpecialtyModal(null)} className="text-sm text-muted-foreground px-4 py-2">Annuler</button>
            <button onClick={() => { action(specialtyModal, { specialty: specialtyVal }); setSpecialtyModal(null) }}
              className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-full hover:opacity-85">
              Confirmer
            </button>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <Modal title="Supprimer le compte" onClose={() => setConfirmDelete(null)}>
          <p className="text-sm text-muted-foreground">Cette action est irréversible. Toutes les données seront supprimées.</p>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setConfirmDelete(null)} className="text-sm text-muted-foreground px-4 py-2">Annuler</button>
            <button onClick={() => deleteUser(confirmDelete)} disabled={deleting}
              className="text-sm bg-destructive text-destructive-foreground px-4 py-2 rounded-full hover:opacity-85 disabled:opacity-50">
              {deleting ? 'Suppression…' : 'Supprimer définitivement'}
            </button>
          </div>
        </Modal>
      )}

      {/* Overlay to close menu */}
      {openMenu && <div className="fixed inset-0 z-40" onClick={() => setOpenMenu(null)} />}
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card border border-border rounded-2xl p-4 w-full max-w-sm shadow-xl">
        <h3 className="text-base font-semibold mb-4">{title}</h3>
        {children}
      </div>
    </div>
  )
}
