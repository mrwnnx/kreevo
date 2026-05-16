import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Lock, Zap, Trophy, Clock, Users, ChevronRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getLeagueThreshold } from '@/lib/utils/leagues'
import { LeagueIcon } from '@/components/features/league/LeagueIcon'
import { getDict, tx } from '@/lib/i18n/lang'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

// ── Specialty visual config ───────────────────────────────────────────────────
const SPECIALTY_VISUAL: Record<string, { icon: string; bgClass: string }> = {
  'UX Designer':      { icon: '📱', bgClass: 'bg-blue-50 dark:bg-blue-950/40' },
  'UI Designer':      { icon: '🎨', bgClass: 'bg-violet-50 dark:bg-violet-950/40' },
  'Graphic Designer': { icon: '✏️', bgClass: 'bg-amber-50 dark:bg-amber-950/40' },
}
const DEFAULT_VISUAL = { icon: '🎨', bgClass: 'bg-muted' }

// ── Types ─────────────────────────────────────────────────────────────────────
interface LeagueRow {
  id: string; name: string; icon: string; color: string
  order_index: number; access: string; min_challenges: number; is_active: boolean
}

interface ChallengeRow {
  id: string; title: string; brief: string
  specialty: string | null; challenge_type: string | null; industry: string | null
  xp_reward: number | null; deadline_days: number | null
  league_id: string | null; is_published: boolean
  leagues: LeagueRow | null
}

type ChallengeStatus = 'available' | 'active' | 'locked' | 'completed' | 'blocked'

// ── ChallengeCard ─────────────────────────────────────────────────────────────
function ChallengeCard({
  challenge, status, participantCount, t,
}: {
  challenge: ChallengeRow
  status: ChallengeStatus
  participantCount?: number
  participants?: Array<{ username: string; avatar_url: string | null }>
  t: Dictionary['challengesPage']
}) {
  const isClickable = status === 'available' || status === 'active' || status === 'completed'
  const visual = SPECIALTY_VISUAL[challenge.specialty ?? ''] ?? DEFAULT_VISUAL

  const card = (
    <div className={cn(
      'group relative block rounded-[24px] border bg-card p-5 transition-all duration-150',
      status === 'available' && 'border-border hover:shadow-md hover:border-primary/30',
      status === 'active'    && 'border-green-400 dark:border-green-600 shadow-sm shadow-green-500/10',
      status === 'completed' && 'border-border/60',
      status === 'locked'    && 'border-border opacity-50 cursor-default',
      status === 'blocked'   && 'border-border opacity-60 cursor-default',
    )}>

      {status === 'blocked' && (
        <div className="absolute inset-0 bg-card/85 backdrop-blur-[2px] flex items-center justify-center rounded-[24px] z-10 p-4">
          <p className="text-xs text-center text-muted-foreground font-medium leading-relaxed">
            {t.blockedOverlay}
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          'size-11 rounded-2xl flex items-center justify-center text-2xl',
          visual.bgClass,
        )}>
          {visual.icon}
        </div>
        {challenge.industry && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {challenge.industry}
          </span>
        )}
      </div>

      <h3 className={cn(
        'text-base font-semibold text-foreground mb-1 leading-tight line-clamp-2',
        isClickable && 'group-hover:text-primary transition-colors',
      )}>
        {challenge.title}
      </h3>

      <p className="text-sm text-muted-foreground leading-snug mb-4 line-clamp-2">
        {challenge.brief}
      </p>

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 text-muted-foreground">
          {challenge.xp_reward != null && challenge.xp_reward > 0 && (
            <span className="flex items-center gap-1">
              <Zap className="size-3.5 text-amber-500" />
              <strong className="font-semibold text-foreground">{challenge.xp_reward}</strong> {t.xp}
            </span>
          )}
          {challenge.deadline_days != null && (
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              <strong className="font-semibold text-foreground">{challenge.deadline_days}</strong>{t.daysSuffix}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="size-3.5" />
            <strong className="font-semibold text-foreground">{participantCount ?? 0}</strong>
          </span>
        </div>

        {status === 'active' && (
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="font-medium">{t.inProgress}</span>
          </span>
        )}
        {status === 'completed' && <Check className="size-4 text-green-600 dark:text-green-400" />}
        {status === 'locked' && <Lock className="size-4 text-muted-foreground" />}
        {status === 'available' && (
          <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
        )}
      </div>
    </div>
  )

  if (!isClickable) return card
  return <Link href={`/dashboard/challenges/${challenge.id}`}>{card}</Link>
}

// ── Page ──────────────────────────────────────────────────────────────────────
type Filter = 'todo' | 'done'

export default async function ChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const sp = await searchParams
  const filter: Filter = sp.filter === 'done' ? 'done' : 'todo'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Parallel data fetches
  const [
    { data: profileData },
    { data: allLeagues },
    { data: allChallenges },
    { data: activePartRows },
    { data: userSubmissions },
    { data: allPartRows },
  ] = await Promise.all([
    supabase.from('profiles').select('league, plan, xp, specialty').eq('id', user.id).single(),
    (supabaseAdmin as any)
      .from('leagues')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true }),
    (supabaseAdmin as any)
      .from('challenges')
      .select('id, title, brief, specialty, challenge_type, industry, xp_reward, deadline_days, league_id, is_published, leagues(id, name, icon, color, order_index, access, min_challenges, is_active)')
      .eq('is_published', true)
      .order('created_at', { ascending: false }),
    (supabase as any)
      .from('participations')
      .select('id, challenge_id, personal_deadline')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('personal_deadline', new Date().toISOString())
      .limit(1),
    supabase.from('submissions').select('challenge_id').eq('user_id', user.id),
    (supabaseAdmin as any)
      .from('participations')
      .select('challenge_id, user_id'),
  ])

  const profile = profileData as any
  const leagues: LeagueRow[] = allLeagues ?? []
  const challenges: ChallengeRow[] = allChallenges ?? []
  const activeParticipation = ((activePartRows as any[]) ?? [])[0] ?? null
  const submittedIds = new Set((userSubmissions ?? []).map((s: any) => s.challenge_id))

  // Participation counts per challenge
  const partCounts: Record<string, number> = {}
  for (const p of (allPartRows ?? []) as any[]) {
    partCounts[p.challenge_id] = (partCounts[p.challenge_id] ?? 0) + 1
  }

  // Participants (with avatars) per challenge — fetch profiles for unique user_ids
  const uniqueUserIds = [...new Set(((allPartRows ?? []) as any[]).map((p) => p.user_id))]
  const { data: participantProfiles } = uniqueUserIds.length > 0
    ? await (supabaseAdmin as any)
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', uniqueUserIds)
    : { data: [] }
  const profileById = new Map<string, { username: string; avatar_url: string | null }>(
    ((participantProfiles ?? []) as any[]).map((p) => [p.id, { username: p.username, avatar_url: p.avatar_url }])
  )
  const participantsByChallenge: Record<string, Array<{ username: string; avatar_url: string | null }>> = {}
  for (const p of (allPartRows ?? []) as any[]) {
    const prof = profileById.get(p.user_id)
    if (!prof) continue
    if (!participantsByChallenge[p.challenge_id]) participantsByChallenge[p.challenge_id] = []
    participantsByChallenge[p.challenge_id].push(prof)
  }

  // Find user's current league in new table
  const userLeagueName = (profile?.league ?? '') as string
  const userLeagueRow = leagues.find(l => l.name.toLowerCase() === userLeagueName.toLowerCase()) ?? null
  const userLeagueIndex = userLeagueRow?.order_index ?? 0

  // XP threshold + completed count for current league
  let leagueXpThreshold = 0
  let leagueChallengesCompleted = 0

  if (userLeagueRow) {
    leagueXpThreshold = await getLeagueThreshold(userLeagueRow.id)

    const leagueChallengeIds = challenges
      .filter(c => c.league_id === userLeagueRow.id)
      .map(c => c.id)

    leagueChallengesCompleted = leagueChallengeIds.filter(id => submittedIds.has(id)).length
  }

  // Specialty filter : on filtre selon la spécialité du profil
  const profileSpecialty = (profile?.specialty ?? '') as string
  const userTrack: 'graphic' | 'ux_ui' | null = profileSpecialty
    ? (/graphic|illustration|brand|3d/i.test(profileSpecialty) ? 'graphic' : 'ux_ui')
    : null

  function matchesUserTrack(c: ChallengeRow): boolean {
    if (!userTrack) return true
    const cs = c.specialty ?? ''
    if (userTrack === 'graphic') return /graphic/i.test(cs)
    return /ux|ui/i.test(cs)
  }

  // My league challenges (sorted: active first)
  const myLeagueChallenges = challenges.filter(c => {
    if (!c.league_id) return false
    const cl = c.leagues
    if (!cl) return false
    if (!matchesUserTrack(c)) return false
    if (!userLeagueRow) return cl.order_index === 1
    return cl.order_index === userLeagueIndex
  })

  const activeChallId = activeParticipation?.challenge_id ?? null
  const sortedMyLeague = [...myLeagueChallenges].sort((a, b) => {
    if (a.id === activeChallId) return -1
    if (b.id === activeChallId) return 1
    return 0
  })

  // Pro gate: user is free but current league is pro_only
  const isPro = profile?.plan === 'pro' || profile?.plan === 'studio'
  const isProGated = (userLeagueRow?.access === 'pro_only') && !isPro

  // Progress percentages
  const minCh = userLeagueRow?.min_challenges ?? 3
  const userXp = (profile?.xp ?? 0) as number
  const xpPercent = leagueXpThreshold > 0 ? Math.min(100, Math.round((userXp / leagueXpThreshold) * 100)) : 0
  const challengesPercent = Math.min(100, Math.round((leagueChallengesCompleted / minCh) * 100))

  const dict = await getDict()
  const t = dict.challengesPage

  return (
    <div className="p-6 max-w-[960px] mx-auto pb-16 space-y-8">

      {/* ── Header ── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">{t.title}</h2>
          {userLeagueRow ? (
            <p className="text-sm text-muted-foreground mt-1">
              {t.currentLeague}{' '}
              <span className="inline-flex items-center gap-1 font-semibold" style={{ color: userLeagueRow.color }}>
                <LeagueIcon icon={userLeagueRow.icon} size="sm" />{userLeagueRow.name}
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
              {t.joinFirst}
            </p>
          )}
        </div>

        {/* Progress card */}
        {userLeagueRow && leagueXpThreshold > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4 grid sm:grid-cols-2 gap-4">
            {/* XP bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Zap className="size-3 text-amber-500" /> {t.xp}
                </span>
                <span className="font-mono font-semibold">
                  {userXp.toLocaleString()} / {leagueXpThreshold.toLocaleString()}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>

            {/* Challenges bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Trophy className="size-3 text-violet-500" /> {t.challengesCompleted}
                </span>
                <span className="font-mono font-semibold">{leagueChallengesCompleted} / {minCh} {t.minSuffix}</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${challengesPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Pro upgrade gate ── */}
      {isProGated && (
        <div className="rounded-2xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-900/10 p-5 flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-purple-700 dark:text-purple-400">
            {tx(t.proGate, { icon: userLeagueRow?.icon ?? '', league: userLeagueRow?.name ?? '' })}
          </p>
          <Link
            href="/dashboard/settings"
            className="shrink-0 inline-flex items-center gap-1.5 bg-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
          >
            {t.upgradeCta}
          </Link>
        </div>
      )}

      {/* ── Section 1 : Mes challenges ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {userLeagueRow && <LeagueIcon icon={userLeagueRow.icon} size="lg" />}
          <h3 className="text-base font-semibold">
            {userLeagueRow ? tx(t.leaguePrefix, { name: userLeagueRow.name }) : t.fallbackTitle}
          </h3>
          <span className="text-sm text-muted-foreground">({sortedMyLeague.length})</span>
        </div>

        {/* Filter tabs */}
        {(() => {
          const todoCount = sortedMyLeague.filter(c => !submittedIds.has(c.id)).length
          const doneCount = sortedMyLeague.filter(c => submittedIds.has(c.id)).length
          const tabs: Array<{ key: Filter; label: string; count: number }> = [
            { key: 'todo', label: t.tabs.todo, count: todoCount },
            { key: 'done', label: t.tabs.done, count: doneCount },
          ]
          return (
            <div className="inline-flex p-1 bg-muted/60 rounded-full w-fit">
              {tabs.map(t => {
                const active = filter === t.key
                const href = t.key === 'todo' ? '/dashboard/challenges' : `/dashboard/challenges?filter=${t.key}`
                return (
                  <Link
                    key={t.key}
                    href={href}
                    className={cn(
                      'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                      active
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {t.label}
                    <span className={cn(
                      'text-[11px] font-semibold tabular-nums tracking-tight',
                      active ? 'text-muted-foreground' : 'text-muted-foreground/60',
                    )}>
                      {t.count}
                    </span>
                  </Link>
                )
              })}
            </div>
          )
        })()}

        {activeParticipation && (
          <div className="rounded-xl border border-green-200 bg-green-50/50 dark:border-green-900/40 dark:bg-green-900/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
            {t.activeWarning}
          </div>
        )}

        {(() => {
          const visible = sortedMyLeague.filter(c =>
            filter === 'done' ? submittedIds.has(c.id) : !submittedIds.has(c.id),
          )

          if (visible.length === 0) {
            return (
              <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
                {filter === 'done' ? t.empty.done : t.empty.todo}
              </div>
            )
          }

          return (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map(c => {
                let status: ChallengeStatus = 'available'
                if (submittedIds.has(c.id))            status = 'completed'
                else if (activeChallId === c.id)        status = 'active'
                else if (activeParticipation)           status = 'blocked'
                else if (isProGated)                    status = 'locked'

                return (
                  <ChallengeCard
                    key={c.id}
                    challenge={c}
                    status={status}
                    participantCount={partCounts[c.id]}
                    participants={participantsByChallenge[c.id]}
                    t={t}
                  />
                )
              })}
            </div>
          )
        })()}
      </div>

    </div>
  )
}
