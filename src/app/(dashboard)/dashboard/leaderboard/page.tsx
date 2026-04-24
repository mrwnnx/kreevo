import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Lock, ArrowRight, Zap } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LeagueIcon } from '@/components/features/league/LeagueIcon'
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

function iconSize(dist: number): number {
  if (dist === 0) return 56
  if (dist === 1) return 44
  if (dist === 2) return 36
  return 28
}

const RANK_BG: Record<number, string> = {
  1: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/40',
  2: 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700/40',
  3: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800/40',
}

const RANK_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Parallel: profile + leagues
  const [{ data: profileData }, { data: allLeagues }] = await Promise.all([
    supabase.from('profiles')
      .select('id, username, full_name, avatar_url, specialty, plan, xp, league')
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

  // Find user's league
  const userLeagueName = (profile?.league ?? '') as string
  const userLeagueRow = leagues.find(
    l => l.name.toLowerCase() === userLeagueName.toLowerCase()
  ) ?? null
  const userLeagueIndex = userLeagueRow?.order_index ?? 0

  // League challenges + users + participations
  let rankedUsers: RankedUser[] = []
  let myRankedUser: RankedUser | null = null

  if (userLeagueRow) {
    const [{ data: leagueChallenges }, { data: leagueUsers }] = await Promise.all([
      supabaseAdmin
        .from('challenges')
        .select('id, xp_reward')
        .eq('league_id', userLeagueRow.id)
        .eq('is_published', true),
      (supabaseAdmin as any)
        .from('profiles')
        .select('id, username, full_name, avatar_url, specialty, plan, xp')
        .ilike('league', userLeagueName)
        .limit(100),
    ])

    const leagueChallengeIds = (leagueChallenges ?? []).map((c: any) => c.id)
    const xpByChallenge: Record<string, number> = {}
    for (const c of (leagueChallenges ?? []) as any[]) {
      xpByChallenge[c.id] = c.xp_reward ?? 0
    }

    const scoreByUser: Record<string, number> = {}

    if (leagueChallengeIds.length > 0) {
      const { data: parts } = await (supabaseAdmin as any)
        .from('participations')
        .select('user_id, challenge_id')
        .in('challenge_id', leagueChallengeIds)
        .eq('status', 'submitted')

      for (const p of (parts ?? []) as any[]) {
        scoreByUser[p.user_id] = (scoreByUser[p.user_id] ?? 0) + (xpByChallenge[p.challenge_id] ?? 0)
      }
    }

    const sorted = [...(leagueUsers ?? []) as any[]].sort((a, b) => {
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

  return (
    <div className="max-w-[720px] mx-auto px-6 py-8 pb-16 space-y-8">

      {/* ── Leagues navigation row ── */}
      <div className="overflow-x-auto -mx-6 px-6">
        <div className="flex items-end justify-center gap-4 min-w-max mx-auto py-2">
          {leagues.map(league => {
            const dist = Math.abs(league.order_index - userLeagueIndex)
            const isActive = league.order_index === userLeagueIndex
            const isPast = league.order_index < userLeagueIndex
            const isLocked = league.order_index > userLeagueIndex
            const sz = iconSize(dist)

            return (
              <div key={league.id} className="flex flex-col items-center gap-2">
                {/* Icon bubble */}
                <div
                  className={cn(
                    'rounded-full flex items-center justify-center transition-all duration-300',
                  )}
                  style={{
                    width: sz,
                    height: sz,
                    background: isActive
                      ? `linear-gradient(135deg, ${league.color}66, ${league.color})`
                      : isPast
                      ? 'hsl(var(--muted))'
                      : 'hsl(var(--muted))',
                    boxShadow: isActive ? `0 0 0 2.5px ${league.color}, 0 0 0 5px ${league.color}22` : undefined,
                    opacity: isLocked ? 0.45 : isPast ? 0.6 : 1,
                  }}
                >
                  {isLocked ? (
                    <Lock className="text-muted-foreground" style={{ width: sz * 0.38, height: sz * 0.38 }} />
                  ) : (
                    <LeagueIcon
                      icon={league.icon}
                      size={isActive ? 'xl' : dist === 1 ? 'lg' : 'md'}
                    />
                  )}
                </div>

                {/* Name */}
                <span
                  className={cn(
                    'text-[11px] font-medium leading-none whitespace-nowrap transition-all',
                    isActive ? 'font-semibold' : 'text-muted-foreground',
                  )}
                  style={isActive ? { color: league.color } : undefined}
                >
                  {league.name}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Hero ── */}
      {userLeagueRow ? (
        <div className="text-center space-y-3 py-2">
          <div
            className="size-16 rounded-2xl mx-auto flex items-center justify-center shadow-md"
            style={{ background: `linear-gradient(135deg, ${userLeagueRow.color}55, ${userLeagueRow.color})` }}
          >
            <LeagueIcon icon={userLeagueRow.icon} size="xl" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{userLeagueRow.name} League</h1>
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
      )}

      {/* ── Ma position ── */}
      {userLeagueRow && (
        <div className="rounded-2xl border border-border bg-zinc-50 dark:bg-zinc-900/50 p-4">
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
                {isPro && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 shrink-0">
                    Pro
                  </span>
                )}
              </div>
              {profile?.specialty && (
                <p className="text-xs text-muted-foreground truncate">{profile.specialty}</p>
              )}
            </div>

            {/* XP */}
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 justify-end">
                <Zap className="size-3 text-amber-500" />
                <span className="text-sm font-bold font-mono">
                  {(myRankedUser?.leagueXp ?? 0).toLocaleString()}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">XP ligue</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Classement ── */}
      {userLeagueRow && rankedUsers.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Classement</h2>
            <span className="text-xs text-muted-foreground">{rankedUsers.length} designers</span>
          </div>

          <div className="rounded-2xl border border-border overflow-hidden">
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
                      <span className="text-sm font-medium truncate">@{u.username}</span>
                      {(u.plan === 'pro' || u.plan === 'studio') && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 shrink-0">
                          Pro
                        </span>
                      )}
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
                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <Zap className="size-3 text-amber-500" />
                      <span className="text-sm font-bold font-mono">{u.leagueXp.toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">XP</p>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Free gate */}
          {!isPro && rankedUsers.length > 3 && (
            <div className="rounded-2xl border border-border bg-card p-5 text-center space-y-3 mt-2">
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
      {userLeagueRow && rankedUsers.length === 0 && (
        <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          Aucun designer dans cette ligue pour l'instant.
        </div>
      )}

    </div>
  )
}
