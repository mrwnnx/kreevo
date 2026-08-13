import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { XpIcon } from '@/components/ui/XpIcon'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ProBadge } from '@/components/ui/ProBadge'
import { LeagueIcon } from '@/components/features/league/LeagueIcon'
import { LeaguesRow } from '@/components/features/league/LeaguesRow'
import { GLASS_SURFACE, GLASS_GRADIENT } from '@/components/layout/GlassShell'
import { getScopedLeagueScores } from '@/lib/utils/leagues'
import { getSpecialtyRank } from '@/lib/utils/ranking'
import { getDict, tx } from '@/lib/i18n/lang'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────
interface LeagueRow {
  id: string; name: string; icon: string; color: string
  order_index: number; access: string; min_challenges: number; is_active: boolean
}

interface RankedUser {
  id: string; username: string; full_name: string | null
  avatar_url: string | null; specialty: string | null
  plan: string; xp: number; leagueXp: number; rank: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function initials(name: string | null, username: string): string {
  return (name ?? username).slice(0, 2).toUpperCase()
}

const RANK_BG: Record<number, string> = {
  1: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/40',
  2: 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700/40',
  3: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/40',
}

const RANK_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

// ── Page ──────────────────────────────────────────────────────────────────────
// PHASE 3 — classement scopé par specialty_id (plus de track switcher cosmétique).
// Un user ne voit QUE sa ligue ET sa spécialité.
export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const sp = await searchParams
  const tab: 'league' | 'specialty' = sp.tab === 'specialty' ? 'specialty' : 'league'
  const dict = await getDict()
  const tl = dict.dashboard.leaderboard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Parallel: profile + leagues
  const [{ data: profileData }, { data: allLeagues }] = await Promise.all([
    supabase.from('profiles')
      .select('id, username, full_name, avatar_url, specialty, specialty_id, plan, xp, league')
      .eq('id', user.id)
      .single(),
    (supabaseAdmin as any)
      .from('leagues')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true }),
  ])

  const profile = profileData as any
  const leagues: LeagueRow[] = allLeagues ?? []
  const isPro = profile?.plan === 'pro' || profile?.plan === 'studio'
  // PHASE 3 — la spécialité (FK) scope tout le classement. NULL = pas de classement.
  const userSpecialtyId = (profile?.specialty_id ?? null) as string | null

  // Find user's league
  const userLeagueName = (profile?.league ?? '') as string
  const userLeagueRow = leagues.find(
    l => l.name.toLowerCase() === userLeagueName.toLowerCase()
  ) ?? null
  const userLeagueIndex = userLeagueRow?.order_index ?? 0

  // League challenges + users + participations
  let rankedUsers: RankedUser[] = []
  let myRankedUser: RankedUser | null = null

  // ── Onglet « Ma ligue » — leagueXp, ligue COURANTE × spé (inchangé). ──
  if (tab === 'league' && userLeagueRow && userSpecialtyId) {
    // Score leagueXp scopé via la source unique (cohérent avec getLeagueThreshold).
    // leagueUsers = profils de la même ligue ET même spé (scope dur par FK).
    const [scoreByUser, { data: leagueUsers }] = await Promise.all([
      getScopedLeagueScores(userLeagueRow.id, userSpecialtyId),
      (supabaseAdmin as any)
        .from('profiles')
        .select('id, username, full_name, avatar_url, specialty, plan, xp')
        .ilike('league', userLeagueName)
        .eq('specialty_id', userSpecialtyId)
        .limit(100),
    ])

    const sorted = [...((leagueUsers ?? []) as any[])].sort((a, b) => {
      const diff = (scoreByUser[b.id] ?? 0) - (scoreByUser[a.id] ?? 0)
      return diff !== 0 ? diff : (b.xp ?? 0) - (a.xp ?? 0)
    })

    rankedUsers = sorted.map((u: any, i: number) => ({
      id: u.id,
      username: u.username,
      full_name: u.full_name ?? null,
      avatar_url: u.avatar_url ?? null,
      specialty: u.specialty ?? null,
      plan: u.plan ?? 'free',
      xp: u.xp ?? 0,
      leagueXp: scoreByUser[u.id] ?? 0,
      rank: i + 1,
    }))

    myRankedUser = rankedUsers.find(u => u.id === user.id) ?? null
  }

  // ── Onglet « Ma spécialité » — TOUS les designers de la spé (toutes ligues),
  // triés XP carrière (profiles.xp). leagueXp porte ici l'XP carrière (réutilise
  // le rendu). Rang « ma position » via getSpecialtyRank (source unique, = profil public).
  if (tab === 'specialty' && userSpecialtyId) {
    const { data: specDesigners } = await (supabaseAdmin as any)
      .from('profiles')
      .select('id, username, full_name, avatar_url, specialty, plan, xp')
      .eq('specialty_id', userSpecialtyId)
      .order('xp', { ascending: false })
      .limit(100)

    rankedUsers = ((specDesigners ?? []) as any[]).map((u: any, i: number) => ({
      id: u.id,
      username: u.username,
      full_name: u.full_name ?? null,
      avatar_url: u.avatar_url ?? null,
      specialty: u.specialty ?? null,
      plan: u.plan ?? 'free',
      xp: u.xp ?? 0,
      leagueXp: u.xp ?? 0, // XP carrière affichée via le rendu commun
      rank: i + 1,
    }))

    const me = await getSpecialtyRank(supabaseAdmin, userSpecialtyId, profile?.xp ?? 0, user.id)
    const myRow = rankedUsers.find(u => u.id === user.id)
    myRankedUser = myRow ? { ...myRow, rank: me.rank } : null
  }

  return (
    <div className="mx-auto w-full max-w-[720px] space-y-8 px-6 py-8 pb-16">
      {/* ── Header CONDITIONNEL au tab (navigation via sidebar/nav, pas de toggle) ── */}
      {tab === 'league' ? (
        // Onglet « Ma ligue » → bandeau ligue COMPLET (8 icônes + nom + « Voir mes défis »).
        userLeagueRow ? (
          <div className="text-center space-y-3 py-2">
            <LeaguesRow leagues={leagues} userLeagueIndex={userLeagueIndex} />

            <div className="pt-2">
              <h1 className="text-2xl font-semibold leading-[1.1] text-[#2b2c36]">{userLeagueRow.name} League</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Complète des défis pour accumuler des XP
              </p>
            </div>
            <Link
              href="/dashboard/challenges"
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2 rounded-full text-white transition-opacity hover:opacity-85"
              style={{ background: userLeagueRow.color }}
            >
              Voir mes défis <ArrowRight className="size-3.5" />
            </Link>
          </div>
        ) : (
          <div className="text-center py-8 space-y-2">
            <p className="text-2xl font-bold">Leaderboard</p>
            <p className="text-sm text-muted-foreground">Tu n'es pas encore dans une ligue du nouveau système.</p>
          </div>
        )
      ) : (
        // Onglet « Ma spécialité » → header NEUTRE : AUCUN élément ligue.
        <div className="text-center space-y-2 py-2">
          <h1 className="text-2xl font-bold">{tx(tl.specialtyTitle, { specialty: profile?.specialty ?? '' })}</h1>
          <p className="text-sm text-muted-foreground">{tl.subtitleSpecialty}</p>
        </div>
      )}

      {/* ── Pas de spécialité → CTA, aucun classement ── */}
      {userLeagueRow && !userSpecialtyId && (
        <div className="space-y-3 rounded-[24px] border border-dashed border-[#dcdce8] bg-white/40 p-12 text-center backdrop-blur-[59.18px]">
          <p className="text-sm font-medium">Choisis ta spécialité pour rejoindre un classement</p>
          <p className="text-xs text-muted-foreground">
            Le classement est propre à ta spécialité (UX/UI ou Graphic).
          </p>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-full hover:opacity-85 transition-opacity"
          >
            Choisir ma spécialité <ArrowRight className="size-3.5" />
          </Link>
        </div>
      )}

      {/* ── Ma position ── */}
      {userLeagueRow && userSpecialtyId && (
        <div className={`${GLASS_SURFACE} p-4`} style={GLASS_GRADIENT}>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Ma position</p>
          <div className="flex items-center gap-3">
            {/* Rank */}
            <div className="shrink-0 w-10 text-center">
              {myRankedUser ? (
                <span className="text-2xl font-bold font-mono" style={{ color: userLeagueRow.color }}>
                  #{myRankedUser.rank}
                </span>
              ) : (
                <span className="text-lg font-bold text-muted-foreground">—</span>
              )}
            </div>

            {/* Avatar */}
            <Avatar className="size-10 shrink-0">
              <AvatarImage src={profile?.avatar_url ?? undefined} />
              <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                {initials(profile?.full_name, profile?.username)}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold truncate">@{profile?.username}</span>
                <ProBadge plan={profile?.plan} />
              </div>
              {profile?.specialty && (
                <p className="text-xs text-muted-foreground truncate">{profile.specialty}</p>
              )}
            </div>

            {/* XP */}
            <div className="text-end shrink-0">
              <div className="flex items-center gap-1 justify-end">
                <XpIcon className="size-3" />
                <span className="text-sm font-bold font-mono">
                  {(myRankedUser?.leagueXp ?? 0).toLocaleString()}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">{tab === 'specialty' ? tl.careerXp : 'XP ligue'}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Classement ── */}
      {userLeagueRow && userSpecialtyId && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Classement</h2>
            <span className="text-xs text-muted-foreground">{rankedUsers.length} designers</span>
          </div>

          {rankedUsers.length === 0 && (
            <div className="rounded-[24px] border border-dashed border-[#dcdce8] bg-white/40 p-12 text-center text-sm text-[#484848] backdrop-blur-[59.18px]">
              Aucun designer dans cette catégorie pour l&apos;instant.
            </div>
          )}

          <div className={cn('rounded-2xl border border-border overflow-hidden', rankedUsers.length === 0 && 'hidden')}>
            {rankedUsers.map((u, i) => {
              const isMe = u.id === user.id
              const isTop3 = u.rank <= 3
              const isVisible = isPro || u.rank <= 3

              // Anonymous row for free users beyond top 3
              if (!isVisible) {
                return (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0 opacity-40"
                  >
                    <span className="w-8 text-center text-sm font-mono text-muted-foreground shrink-0">
                      {u.rank}
                    </span>
                    <div className="size-8 rounded-full bg-muted shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">Designer</p>
                    </div>
                    <span className="text-sm font-mono text-muted-foreground">— XP</span>
                  </div>
                )
              }

              return (
                <Link
                  key={u.id}
                  href={`/u/${u.username}`}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 border-b border-border/50 last:border-0 hover:opacity-90 transition-all',
                    isTop3 && RANK_BG[u.rank],
                    isMe && !isTop3 && 'bg-violet-50 dark:bg-violet-900/20 border-violet-100 dark:border-violet-900/30',
                  )}
                >
                  {/* Rank */}
                  <span className={cn(
                    'w-8 text-center text-sm font-bold font-mono shrink-0',
                    u.rank === 1 && 'text-yellow-600 dark:text-yellow-400',
                    u.rank === 2 && 'text-zinc-500',
                    u.rank === 3 && 'text-orange-600 dark:text-orange-400',
                    isMe && !isTop3 && 'text-violet-600 dark:text-violet-400',
                    !isTop3 && !isMe && 'text-muted-foreground',
                  )}>
                    {RANK_MEDAL[u.rank] ?? `#${u.rank}`}
                  </span>

                  {/* Avatar */}
                  <Avatar className="size-8 shrink-0">
                    <AvatarImage src={u.avatar_url ?? undefined} />
                    <AvatarFallback className="text-[11px] font-bold bg-primary/10 text-primary">
                      {initials(u.full_name, u.username)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-medium truncate">
                        {u.full_name?.trim() || u.username}
                      </span>
                      <ProBadge plan={u.plan} />
                      {isMe && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-violet-200 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300 shrink-0">
                          Toi
                        </span>
                      )}
                    </div>
                    {u.specialty && (
                      <p className="text-xs text-muted-foreground truncate">{u.specialty}</p>
                    )}
                  </div>

                  {/* XP */}
                  <div className="flex items-center gap-1 shrink-0">
                    <XpIcon className="size-3" />
                    <span className="text-sm font-bold font-mono">
                      {u.leagueXp.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium">XP</span>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Free gate */}
          {!isPro && rankedUsers.length > 3 && (
            <div className={`${GLASS_SURFACE} mt-2 space-y-3 p-5 text-center`} style={GLASS_GRADIENT}>
              <p className="text-sm font-medium">
                🔒 Passe en Pro pour voir le classement complet
              </p>
              <p className="text-xs text-muted-foreground">
                {rankedUsers.length - 3} designers cachés
              </p>
              <Link
                href="/dashboard/settings"
                className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-full hover:opacity-85 transition-opacity"
              >
                Upgrade Pro <ArrowRight className="size-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {userLeagueRow && userSpecialtyId && rankedUsers.length === 0 && (
        <div className="rounded-[24px] border border-dashed border-[#dcdce8] bg-white/40 p-12 text-center text-sm text-[#484848] backdrop-blur-[59.18px]">
          Aucun designer dans cette ligue pour l'instant.
        </div>
      )}

    </div>
  )
}
