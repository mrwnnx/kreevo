import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { ArrowRight, Clock, Play, Lock, ChevronRight, Zap } from 'lucide-react'
import { LeagueIcon } from '@/components/features/league/LeagueIcon'
import { getLeagueThreshold } from '@/lib/utils/leagues'
import { CountdownTimer } from '@/components/features/challenge/CountdownTimer'
import { GettingStarted } from '@/components/features/dashboard/GettingStarted'
import { StreakCard } from '@/components/features/dashboard/StreakCard'
import { LeagueCard } from '@/components/features/dashboard/LeagueCard'
import { HeroProfile } from '@/components/features/dashboard/HeroProfile'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types/database.types'

const SPECIALTY_CONFIG: Record<string, { icon: string; bg: string }> = {
  'UX Designer':      { icon: '📱', bg: 'bg-violet-100 dark:bg-violet-900/30' },
  'UI Designer':      { icon: '🎨', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  'Graphic Designer': { icon: '✏️', bg: 'bg-orange-100 dark:bg-orange-900/30' },
}
const DEFAULT_SPECIALTY = { icon: '🎨', bg: 'bg-muted' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── Parallel data fetches ──
  const [
    { data: profile },
    { data: submissions },
    { data: activeParticipations },
    { count: participationCount },
    { count: submissionCount },
    { data: recentActivity },
    { data: allLeagues },
    { data: publishedChallenges },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('submissions').select('*, challenges(title, specialty, challenge_type, industry)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    (supabase as any)
      .from('participations')
      .select('*, challenges(id, title, specialty, challenge_type, industry)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('personal_deadline', { ascending: true }),
    (supabase as any).from('participations').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    (supabase as any).from('submissions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    (supabase as any)
      .from('participations')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
      .order('created_at', { ascending: false }),
    // All active leagues
    (supabaseAdmin as any)
      .from('leagues')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true }),
    // Published challenges with league data
    (supabaseAdmin as any)
      .from('challenges')
      .select('id, title, brief, specialty, challenge_type, industry, xp_reward, deadline_days, league_id, is_published, leagues(id, name, icon, color, order_index, access)')
      .eq('is_published', true)
      .order('created_at', { ascending: false }),
  ])

  if (!profile) redirect('/login')

  const p = profile as Profile
  const leagues: any[] = allLeagues ?? []
  const challenges: any[] = publishedChallenges ?? []

  // ── League data ──
  const userLeagueRow = leagues.find(
    l => l.name.toLowerCase() === (p.league ?? '').toLowerCase()
  ) ?? null

  const nextLeagueRow = userLeagueRow
    ? leagues.find(l => l.order_index === userLeagueRow.order_index + 1) ?? null
    : null

  // XP threshold + challenges completed in current league
  let leagueXpThreshold = 0
  let leagueChallengesCompleted = 0

  if (userLeagueRow) {
    const { data: leagueChallengeIds } = await supabaseAdmin
      .from('challenges')
      .select('id')
      .eq('league_id', userLeagueRow.id)
      .eq('is_published', true)

    const ids = (leagueChallengeIds ?? []).map((c: any) => c.id)

    const [threshold, submittedCount] = await Promise.all([
      getLeagueThreshold(userLeagueRow.id),
      ids.length > 0
        ? supabaseAdmin
            .from('submissions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .in('challenge_id', ids)
            .then(r => r.count ?? 0)
        : Promise.resolve(0),
    ])

    leagueXpThreshold = threshold
    leagueChallengesCompleted = submittedCount
  }

  // ── Rank ──
  const [{ count: usersAhead }, { count: totalUsers }] = await Promise.all([
    (supabase as any).from('profiles').select('id', { count: 'exact', head: true }).gt('xp', p.xp),
    (supabase as any).from('profiles').select('id', { count: 'exact', head: true }),
  ])
  const rank = usersAhead !== null ? usersAhead + 1 : null

  // ── Challenges classification ──
  const userLeagueIndex = userLeagueRow?.order_index ?? 0

  // Specialty filter
  const profileSpecialty = (p.specialty ?? '') as string
  const userTrack: 'graphic' | 'ux_ui' | null = profileSpecialty
    ? (/graphic|illustration|brand|3d/i.test(profileSpecialty) ? 'graphic' : 'ux_ui')
    : null

  function matchesUserTrack(c: any): boolean {
    if (!userTrack) return true
    const cs = (c.specialty ?? '') as string
    if (userTrack === 'graphic') return /graphic/i.test(cs)
    return /ux|ui/i.test(cs)
  }

  const myLeagueChallenges = challenges.filter(c => {
    if (!c.league_id) return true
    const cl = c.leagues
    if (!cl) return false
    if (!matchesUserTrack(c)) return false
    return userLeagueRow ? cl.order_index === userLeagueIndex : cl.order_index === 1
  }).slice(0, 6)

  // Higher leagues with at least one challenge
  const higherLeagues = leagues.filter(l => l.order_index > userLeagueIndex)
  const lockedByLeague: Record<string, any[]> = {}
  for (const l of higherLeagues) {
    const lChallenges = challenges.filter(c => c.league_id === l.id)
    if (lChallenges.length > 0) lockedByLeague[l.id] = lChallenges.slice(0, 3)
  }

  // Active participations keyed by challenge_id
  const activePartsByChallengeId = new Set(
    (activeParticipations as any[] ?? []).map(p => p.challenges?.id)
  )
  const userHasActiveParticipation = (activeParticipations as any[] ?? []).length > 0

  // ── Getting Started steps ──
  const isInNewLeague = !!userLeagueRow
  const hasLeveledUp = userLeagueRow ? userLeagueRow.order_index > 1 : false

  const gettingStartedSteps = [
    {
      id: 'profile',
      label: 'Compléter ton profil',
      done: !!(p.full_name && p.avatar_url),
      href: '/dashboard/profile',
    },
    {
      id: 'first_league',
      label: 'Rejoindre ta première ligue 🪨',
      done: true, // Stone is default — always done
      href: '/dashboard/challenges',
    },
    {
      id: 'challenge',
      label: 'Participer à ton premier challenge',
      done: (participationCount ?? 0) > 0,
      href: '/dashboard/challenges',
    },
    {
      id: 'submission',
      label: 'Soumettre ton premier travail',
      done: (submissionCount ?? 0) > 0,
      href: '/dashboard/challenges',
    },
    {
      id: 'league_complete',
      label: `Compléter ${userLeagueRow?.min_challenges ?? 3} challenges dans ta ligue`,
      done: leagueChallengesCompleted >= (userLeagueRow?.min_challenges ?? 3),
      href: '/dashboard/challenges',
    },
    {
      id: 'league_up',
      label: 'Monter de ligue',
      done: hasLeveledUp,
      href: '/dashboard/challenges',
    },
  ]

  // ── Streak ──
  const now = new Date()
  const todayIndex = (now.getDay() + 6) % 7

  const activeDays = Array(7).fill(false)
  if (recentActivity) {
    for (const item of recentActivity as any[]) {
      const d = new Date(item.created_at)
      activeDays[(d.getDay() + 6) % 7] = true
    }
  }
  let streak = 0
  for (let i = todayIndex; i >= 0; i--) {
    if (activeDays[i]) streak++
    else break
  }

  // ── League progression message ──
  const minCh = userLeagueRow?.min_challenges ?? 3
  const xpOk = leagueXpThreshold > 0 && p.xp >= leagueXpThreshold
  const challengesOk = leagueChallengesCompleted >= minCh

  let progressionMessage = ''
  if (xpOk && challengesOk) {
    progressionMessage = '🎉 Tu es prêt à monter de ligue !'
  } else if (xpOk && !challengesOk) {
    const remaining = minCh - leagueChallengesCompleted
    progressionMessage = `Tu as l'XP ! Complète encore ${remaining} challenge${remaining > 1 ? 's' : ''}`
  } else if (!xpOk && challengesOk) {
    progressionMessage = 'Continue à accumuler des XP !'
  } else {
    progressionMessage = 'Continue tes efforts !'
  }

  const xpPercent = leagueXpThreshold > 0 ? Math.min(100, Math.round((p.xp / leagueXpThreshold) * 100)) : 0
  const challengesPercent = Math.min(100, Math.round((leagueChallengesCompleted / minCh) * 100))

  return (
    <div className="p-6 max-w-[960px] mx-auto pb-10 space-y-6">

      {/* ── Hero Profile ── */}
      <HeroProfile
        username={p.username}
        fullName={p.full_name}
        avatarUrl={p.avatar_url}
        specialty={p.specialty ?? null}
        bio={p.bio ?? null}
        country={p.country ?? null}
        league={p.league}
        xp={p.xp}
        submissionCount={submissionCount ?? 0}
        rank={rank}
        totalUsers={totalUsers ?? 0}
        leagueIcon={userLeagueRow?.icon}
        leagueDisplayName={userLeagueRow?.name}
        leagueDisplayColor={userLeagueRow?.color}
        leagueXpThreshold={leagueXpThreshold > 0 ? leagueXpThreshold : undefined}
        leagueChallengesCompleted={leagueChallengesCompleted}
        minChallenges={userLeagueRow?.min_challenges}
      />

      {/* ── Grid 3 colonnes ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Colonne gauche ×2 */}
        <div className="lg:col-span-2 space-y-6">

          {/* Participations actives */}
          {(activeParticipations as any[] ?? []).length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Participations actives</h3>
                <span className="size-5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs flex items-center justify-center font-bold">
                  {(activeParticipations as any[]).length}
                </span>
              </div>
              {(activeParticipations as any[]).map(part => (
                <div key={part.id} className="rounded-xl border border-green-200 dark:border-green-900/50 bg-green-50/50 dark:bg-green-900/10 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-green-700 dark:text-green-400 uppercase tracking-wide">
                        {[part.challenges?.specialty, part.challenges?.challenge_type].filter(Boolean).join(' · ')}
                      </p>
                      <p className="text-sm font-semibold">{part.challenges?.title}</p>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 shrink-0">
                      <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                      En cours
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <CountdownTimer deadline={part.personal_deadline} label="Deadline personnelle" compact />
                    <Link
                      href={`/dashboard/challenges/${part.challenges?.id}`}
                      className="inline-flex items-center gap-2 rounded-full border border-green-300 dark:border-green-800 bg-card px-3 h-8 text-xs font-medium text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors shrink-0"
                    >
                      <Play className="size-3" fill="currentColor" />
                      Soumettre mon travail
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Colonne droite */}
        <div className="space-y-6">
          <GettingStarted steps={gettingStartedSteps} />
          <StreakCard streak={streak} activeDays={activeDays} todayIndex={todayIndex} />
          <LeagueCard
            league={p.league}
            xp={p.xp}
            plan={p.plan}
            leagueIcon={userLeagueRow?.icon}
            leagueDbColor={userLeagueRow?.color}
            xpThreshold={leagueXpThreshold > 0 ? leagueXpThreshold : undefined}
            challengesCompleted={leagueChallengesCompleted}
            minChallenges={userLeagueRow?.min_challenges}
            nextLeagueName={nextLeagueRow?.name}
            nextLeagueIcon={nextLeagueRow?.icon}
          />
        </div>
      </div>

      {/* ── Ma progression de ligue ── */}
      {userLeagueRow && nextLeagueRow && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h3 className="text-sm font-semibold">Ma progression de ligue</h3>

          {/* Current → Next */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2">
              <LeagueIcon icon={userLeagueRow.icon} size="lg" />
              <span className="text-sm font-semibold" style={{ color: userLeagueRow.color }}>{userLeagueRow.name}</span>
            </div>
            <ChevronRight className="size-4 text-muted-foreground shrink-0" />
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2 opacity-60">
              <LeagueIcon icon={nextLeagueRow.icon} size="lg" />
              <span className="text-sm font-semibold" style={{ color: nextLeagueRow.color }}>{nextLeagueRow.name}</span>
            </div>
          </div>

          {/* XP bar */}
          {leagueXpThreshold > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">XP</span>
                <span className="font-mono font-semibold">
                  {p.xp.toLocaleString()} / {leagueXpThreshold.toLocaleString()}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Challenges bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Challenges complétés</span>
              <span className="font-mono font-semibold">{leagueChallengesCompleted} / {minCh}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                style={{ width: `${challengesPercent}%` }}
              />
            </div>
            {/* Dots */}
            <div className="flex items-center gap-1.5 pt-0.5">
              {Array.from({ length: minCh }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    'size-2 rounded-full',
                    i < leagueChallengesCompleted ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                  )}
                />
              ))}
              <span className="text-xs text-muted-foreground ml-1">
                {leagueChallengesCompleted < minCh
                  ? `${minCh - leagueChallengesCompleted} restant${minCh - leagueChallengesCompleted > 1 ? 's' : ''}`
                  : 'Complétés ✓'}
              </span>
            </div>
          </div>

          {/* Motivating message */}
          <div className={cn(
            'rounded-xl px-4 py-3 text-sm font-medium',
            xpOk && challengesOk
              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40'
              : 'bg-muted/60 text-muted-foreground'
          )}>
            {progressionMessage}
          </div>
        </div>
      )}

      {/* ── Challenges — par ligue ── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {userLeagueRow && <LeagueIcon icon={userLeagueRow.icon} size="lg" />}
            <h3 className="text-base font-semibold">
              {userLeagueRow ? `Challenges ${userLeagueRow.name}` : 'Challenges actifs'}
            </h3>
          </div>
          <Link href="/dashboard/challenges" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            Voir tout <ArrowRight className="size-3" />
          </Link>
        </div>

        {/* Warning: active participation */}
        {userHasActiveParticipation && (
          <div className="rounded-xl border border-orange-200 bg-orange-50/50 dark:border-orange-900/40 dark:bg-orange-900/10 px-4 py-3 text-sm text-orange-700 dark:text-orange-400">
            Termine ton challenge en cours avant d'en rejoindre un autre.
          </div>
        )}

        {/* User's league challenges */}
        {myLeagueChallenges.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-4">
            {myLeagueChallenges.map(c => {
              const isActive = activePartsByChallengeId.has(c.id)
              const spec = SPECIALTY_CONFIG[c.specialty ?? ''] ?? DEFAULT_SPECIALTY
              const blocked = userHasActiveParticipation && !isActive
              return (
                <Link
                  key={c.id}
                  href={blocked ? '#' : `/dashboard/challenges/${c.id}`}
                  className={cn(
                    'group flex flex-col bg-card border rounded-2xl p-5 gap-3 transition-all duration-200',
                    blocked
                      ? 'border-border/50 opacity-50 cursor-not-allowed'
                      : 'border-border hover:border-primary/40 hover:-translate-y-0.5'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className={cn('size-10 rounded-xl flex items-center justify-center text-xl shrink-0', spec.bg)}>
                      {spec.icon}
                    </div>
                    {isActive && (
                      <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 shrink-0">
                        <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                        En cours
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium leading-snug group-hover:text-primary transition-colors line-clamp-2">{c.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.brief}</p>
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/60">
                    <div className="flex items-center gap-2">
                      {c.xp_reward && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Zap className="size-3 text-yellow-500" />
                          {c.xp_reward} XP
                        </span>
                      )}
                      {c.deadline_days && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="size-3" />
                          {c.deadline_days}j
                        </span>
                      )}
                    </div>
                    {c.leagues && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        <LeagueIcon icon={c.leagues.icon} size="sm" />{c.leagues.name}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            Aucun challenge actif dans ta ligue pour l'instant.
          </div>
        )}

        {/* Locked higher leagues */}
        {Object.entries(lockedByLeague).map(([leagueId, lChallenges]) => {
          const league = leagues.find(l => l.id === leagueId)
          if (!league) return null
          return (
            <div key={leagueId} className="space-y-3">
              <div className="flex items-center gap-2">
                <Lock className="size-3.5 text-muted-foreground" />
                <LeagueIcon icon={league.icon} size="md" />
                <h4 className="text-sm font-medium text-muted-foreground">Ligue {league.name}</h4>
                {league.access === 'pro_only' && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Pro</span>
                )}
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {lChallenges.map(c => (
                  <div
                    key={c.id}
                    className="flex flex-col items-center justify-center bg-card border border-dashed border-border/50 rounded-2xl p-8 gap-2 opacity-50"
                  >
                    <Lock className="size-4 text-muted-foreground" />
                    <p className="text-xs text-center text-muted-foreground">
                      Atteins <LeagueIcon icon={league.icon} size="sm" /> <span className="font-medium">{league.name}</span> pour débloquer
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Activité récente ── */}
      {(submissions as any[] ?? []).length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-4">Activité récente</h3>
          <div className="space-y-2">
            {(submissions as any[]).map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/40 transition-colors">
                <div>
                  <p className="text-sm font-medium">{s.challenges?.title ?? 'Challenge'}</p>
                  <p className="text-xs text-muted-foreground">
                    {[s.challenges?.specialty, s.challenges?.challenge_type, s.challenges?.industry].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {s.xp_earned > 0 && <span className="text-xs font-semibold text-violet-600">+{s.xp_earned} XP</span>}
                  <Badge variant={s.is_visible ? 'default' : 'secondary'}>
                    {s.is_visible ? 'visible' : 'draft'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
