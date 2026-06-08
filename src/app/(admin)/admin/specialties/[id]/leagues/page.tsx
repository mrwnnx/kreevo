import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { BucketThresholdEditor } from '@/components/admin/BucketThresholdEditor'

interface Props { params: Promise<{ id: string }> }

interface LeagueRow { id: string; name: string; icon: string | null; order_index: number; xp_threshold_percent: number }
interface ChallengeRow {
  id: string
  title: string | null
  xp_reward: number | null
  is_published: boolean | null
  league_id: string | null
}

export default async function SpecialtyLeaguesPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Lecture pure (server). 5 reads en parallèle.
  const [{ data: specialty }, { data: leaguesData }, { data: challengesData }, { data: usersData }, { data: overridesData }] = await Promise.all([
    (supabase as any).from('specialties').select('id, slug, name, name_fr, emoji').eq('id', id).single(),
    (supabase as any).from('leagues').select('id, name, icon, order_index, xp_threshold_percent').order('order_index', { ascending: true }),
    (supabase as any)
      .from('challenges')
      .select('id, title, xp_reward, is_published, league_id, created_at')
      .eq('specialty_id', id)
      .order('created_at', { ascending: false }),
    // users par ligue : join texte profiles.league = leagues.name (confirmé fiable).
    (supabase as any).from('profiles').select('league').eq('specialty_id', id),
    // PHASE TEMPS 2 — seuils manuels (overrides) de cette spé, par ligue.
    (supabase as any).from('league_specialty_thresholds').select('league_id, xp_threshold').eq('specialty_id', id),
  ])

  if (!specialty) notFound()

  const leagues: LeagueRow[] = leaguesData ?? []
  const challenges: ChallengeRow[] = challengesData ?? []

  // Map des overrides par league_id (override manuel s'il existe).
  const overrideByLeague = new Map<string, number>()
  for (const o of (overridesData ?? []) as { league_id: string; xp_threshold: number }[]) {
    overrideByLeague.set(o.league_id, o.xp_threshold)
  }

  // Regroupement / agrégats côté serveur depuis la liste déjà fetchée.
  const byLeague = new Map<string, ChallengeRow[]>()
  for (const c of challenges) {
    if (!c.league_id) continue
    if (!byLeague.has(c.league_id)) byLeague.set(c.league_id, [])
    byLeague.get(c.league_id)!.push(c)
  }

  // users par nom de ligue.
  const usersByLeague = new Map<string, number>()
  for (const u of (usersData ?? []) as { league: string | null }[]) {
    if (!u.league) continue
    usersByLeague.set(u.league, (usersByLeague.get(u.league) ?? 0) + 1)
  }

  const specialtyLabel = specialty.name_fr || specialty.name || specialty.slug

  return (
    <div className="p-6 space-y-6">
      <div>
        <Link href="/admin/specialties" className="text-xs text-muted-foreground hover:text-foreground">← Spécialités</Link>
        <h1 className="text-2xl font-bold mt-1 flex items-center gap-2">
          <span className="text-2xl">{specialty.emoji ?? '🎯'}</span>
          {specialtyLabel}
        </h1>
        <p className="text-sm text-muted-foreground">Catalogue par ligue — repère les trous.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {leagues.map((l) => {
          const list = byLeague.get(l.id) ?? []
          const nChallenges = list.length
          const nPublished = list.filter((c) => c.is_published).length
          const xpTotal = list.filter((c) => c.is_published).reduce((s, c) => s + (c.xp_reward ?? 0), 0)
          const nUsers = usersByLeague.get(l.name) ?? 0
          // Seuil auto (fallback) recalculé inline — PAS getLeagueThreshold (qui renverrait l'override).
          const auto = Math.floor((xpTotal * (l.xp_threshold_percent ?? 60)) / 100)
          const override = overrideByLeague.has(l.id) ? (overrideByLeague.get(l.id) as number) : null

          return (
            <div key={l.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold flex items-center gap-1.5">
                  <span>{l.icon ?? '🏅'}</span> {l.name}
                </h2>
                <span className="text-[11px] font-mono text-muted-foreground">#{l.order_index}</span>
              </div>

              {/* 3 stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/50 py-2">
                  <p className="text-sm font-bold">{nChallenges}</p>
                  <p className="text-[10px] text-muted-foreground">{nPublished} publiés</p>
                </div>
                <div className="rounded-lg bg-muted/50 py-2">
                  <p className="text-sm font-bold">{xpTotal.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">XP dispo</p>
                </div>
                <div className="rounded-lg bg-muted/50 py-2">
                  <p className="text-sm font-bold">{nUsers}</p>
                  <p className="text-[10px] text-muted-foreground">users</p>
                </div>
              </div>

              {/* Seuil XP de promotion (manuel/auto) */}
              <BucketThresholdEditor
                leagueId={l.id}
                specialtyId={specialty.id}
                leagueName={l.name}
                auto={auto}
                override={override}
              />

              {/* Liste des challenges de la spé dans cette ligue */}
              {list.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2 text-center">Aucun challenge — trou de catalogue</p>
              ) : (
                <ul className="space-y-1">
                  {list.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/admin/challenges/${c.id}`}
                        className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-accent/40 transition-colors text-sm"
                      >
                        <span className="truncate">{c.title || '(sans titre)'}</span>
                        <span className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-xs text-muted-foreground">{c.xp_reward ?? 0} XP</span>
                          <span
                            className={
                              c.is_published
                                ? 'text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : 'text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground'
                            }
                          >
                            {c.is_published ? 'Publié' : 'Brouillon'}
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <Link
                href={`/admin/challenges/new?specialty_id=${specialty.id}&league_id=${l.id}`}
                className="flex items-center justify-center gap-1.5 w-full text-xs font-semibold border border-dashed border-border rounded-lg py-2 text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
              >
                <Plus className="size-3.5" /> Ajouter dans {l.name} · {specialtyLabel}
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
