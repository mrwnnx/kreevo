import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Lock, Zap, Trophy, Clock, ArrowRight, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getLeagueThreshold } from '@/lib/utils/leagues'
import { LeagueIcon } from '@/components/features/league/LeagueIcon'
import { Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'

// ── Specialty visual config ───────────────────────────────────────────────────
const SPECIALTY_VISUAL: Record<string, { icon: string }> = {
  'UX Designer':      { icon: '📱' },
  'UI Designer':      { icon: '🎨' },
  'Graphic Designer': { icon: '✏️' },
}
const DEFAULT_VISUAL = { icon: '🎨' }

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
  challenge, status, participantCount, participants, lockedLeagueName, lockedLeagueIcon,
}: {
  challenge: ChallengeRow
  status: ChallengeStatus
  participantCount?: number
  participants?: Array<{ username: string; avatar_url: string | null }>
  lockedLeagueName?: string
  lockedLeagueIcon?: string
}) {
  const isClickable = status === 'available' || status === 'active' || status === 'completed'
  const visual = SPECIALTY_VISUAL[challenge.specialty ?? ''] ?? DEFAULT_VISUAL

  const card = (
    <div className={cn(
      'group relative flex flex-col bg-card border rounded-2xl overflow-hidden transition-all duration-200',
      status === 'available'  && 'border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md',
      status === 'active'     && 'border-green-400 dark:border-green-600 shadow-sm shadow-green-500/10',
      status === 'completed'  && 'border-border/40',
      status === 'locked'     && 'opacity-50 cursor-default',
      status === 'blocked'    && 'opacity-60 cursor-default',
    )}>

      {/* Cover image — 4:3 ratio */}
      <div className="relative w-full aspect-[4/3] bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
        <span className="text-6xl opacity-70">{visual.icon}</span>

        {challenge.industry && (
          <span className="absolute top-3 right-3 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900/70 text-slate-700 dark:text-slate-200 backdrop-blur-sm">
            {challenge.industry}
          </span>
        )}

        {status === 'active' && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-green-600/85 rounded-full px-2 py-0.5 backdrop-blur-sm">
            <span className="size-1.5 rounded-full bg-green-200 animate-pulse" />
            <span className="text-[11px] font-medium text-white">En cours</span>
          </div>
        )}

        {status === 'completed' && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <span className="text-3xl">✅</span>
          </div>
        )}

        {status === 'locked' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Lock className="size-7 text-white/85" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">

        {/* Blocked overlay */}
        {status === 'blocked' && (
          <div className="absolute inset-0 bg-card/85 backdrop-blur-[2px] flex items-center justify-center rounded-b-2xl z-10 p-4">
            <p className="text-xs text-center text-muted-foreground font-medium leading-relaxed">
              Termine ton challenge en cours d'abord
            </p>
          </div>
        )}

        <h3 className={cn(
          'text-base font-semibold leading-snug line-clamp-2',
          isClickable && 'group-hover:text-primary transition-colors',
        )}>
          {challenge.title}
        </h3>

        {/* Specialty + Type + Industry badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          {challenge.specialty && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
              {challenge.specialty}
            </span>
          )}
          {challenge.challenge_type && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {challenge.challenge_type}
            </span>
          )}
          {challenge.industry && (
            <span className="text-[11px] font-mono text-muted-foreground">
              {challenge.industry}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {challenge.xp_reward != null && challenge.xp_reward > 0 && (
            <span className="flex items-center gap-1">
              <Zap className="size-3 text-amber-500" />
              {challenge.xp_reward} XP
            </span>
          )}
          {challenge.deadline_days != null && (
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {challenge.deadline_days}j
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="size-3" />
            {participantCount ?? 0}
          </span>
        </div>

        {participantCount != null && participantCount > 0 && (
          <AvatarGroup data-size="sm">
            {(participants ?? []).slice(0, 3).map((p) => (
              <Avatar key={p.username} size="sm">
                {p.avatar_url && <AvatarImage src={p.avatar_url} alt={p.username} />}
                <AvatarFallback>{p.username?.[0]?.toUpperCase() ?? '?'}</AvatarFallback>
              </Avatar>
            ))}
            {participantCount > 3 && (
              <AvatarGroupCount className="size-6 text-xs">+{participantCount - 3}</AvatarGroupCount>
            )}
          </AvatarGroup>
        )}

        {/* Footer */}
        <div className="pt-1">
          {(status === 'available' || status === 'active' || status === 'completed') && (
            <span className={cn(
              'inline-flex items-center justify-center gap-1.5 w-full rounded-full text-xs font-semibold py-2 transition-colors',
              status === 'active'
                ? 'border border-green-400 dark:border-green-600 text-green-700 dark:text-green-400 group-hover:bg-green-50 dark:group-hover:bg-green-900/20'
                : status === 'completed'
                ? 'border border-border text-muted-foreground'
                : 'bg-primary text-primary-foreground group-hover:opacity-85',
            )}>
              {status === 'active' && <>Continuer <ArrowRight className="size-3" /></>}
              {status === 'completed' && <>✅ Complété</>}
              {status === 'available' && <>Voir le défi <ArrowRight className="size-3" /></>}
            </span>
          )}
          {status === 'locked' && lockedLeagueName && (
            <span className="inline-flex items-center justify-center gap-1.5 w-full text-xs text-muted-foreground">
              <Lock className="size-3" />
              Atteins {lockedLeagueIcon && <LeagueIcon icon={lockedLeagueIcon} size="sm" />} {lockedLeagueName}
            </span>
          )}
          {status === 'locked' && !lockedLeagueName && (
            <span className="inline-flex items-center justify-center gap-1.5 w-full text-xs text-muted-foreground">
              <Lock className="size-3" /> Verrouillé
            </span>
          )}
        </div>
      </div>
    </div>
  )

  if (!isClickable) return card
  return <Link href={`/dashboard/challenges/${challenge.id}`}>{card}</Link>
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function ChallengesPage() {
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

  // Higher leagues grouped
  const higherLeagues = leagues.filter(l => l.order_index > userLeagueIndex)
  const challengesByLeague: Record<string, ChallengeRow[]> = {}
  for (const l of higherLeagues) {
    challengesByLeague[l.id] = challenges.filter(c => c.league_id === l.id && matchesUserTrack(c))
  }

  // Pro gate: user is free but current league is pro_only
  const isPro = profile?.plan === 'pro' || profile?.plan === 'studio'
  const isProGated = (userLeagueRow?.access === 'pro_only') && !isPro

  // Progress percentages
  const minCh = userLeagueRow?.min_challenges ?? 3
  const userXp = (profile?.xp ?? 0) as number
  const xpPercent = leagueXpThreshold > 0 ? Math.min(100, Math.round((userXp / leagueXpThreshold) * 100)) : 0
  const challengesPercent = Math.min(100, Math.round((leagueChallengesCompleted / minCh) * 100))

  return (
    <div className="p-6 max-w-[960px] mx-auto pb-16 space-y-8">

      {/* ── Header ── */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Challenges</h2>
          {userLeagueRow ? (
            <p className="text-sm text-muted-foreground mt-1">
              Ligue actuelle :{' '}
              <span className="inline-flex items-center gap-1 font-semibold" style={{ color: userLeagueRow.color }}>
                <LeagueIcon icon={userLeagueRow.icon} size="sm" />{userLeagueRow.name}
              </span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-1">
              Rejoins un challenge pour commencer ta progression.
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
                  <Zap className="size-3 text-amber-500" /> XP
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
                  <Trophy className="size-3 text-violet-500" /> Challenges complétés
                </span>
                <span className="font-mono font-semibold">{leagueChallengesCompleted} / {minCh} min.</span>
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
            🔒 Passe en Pro pour accéder à {userLeagueRow?.icon} {userLeagueRow?.name} et au-delà
          </p>
          <Link
            href="/dashboard/settings"
            className="shrink-0 inline-flex items-center gap-1.5 bg-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
          >
            Upgrade Pro
          </Link>
        </div>
      )}

      {/* ── Section 1 : Mes challenges ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {userLeagueRow && <LeagueIcon icon={userLeagueRow.icon} size="lg" />}
          <h3 className="text-base font-semibold">
            {userLeagueRow ? `Ligue ${userLeagueRow.name}` : 'Mes challenges'}
          </h3>
          <span className="text-sm text-muted-foreground">({sortedMyLeague.length})</span>
        </div>

        {activeParticipation && (
          <div className="rounded-xl border border-green-200 bg-green-50/50 dark:border-green-900/40 dark:bg-green-900/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
            Tu as une participation active — termine-la avant d'en rejoindre une autre.
          </div>
        )}

        {sortedMyLeague.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedMyLeague.map(c => {
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
                />
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            Aucun challenge publié dans ta ligue pour l'instant.
          </div>
        )}
      </div>

      {/* ── Section 2 : Ligues supérieures verrouillées ── */}
      {higherLeagues.map(league => {
        const leagueChallenges = challengesByLeague[league.id] ?? []
        if (leagueChallenges.length === 0) return null

        return (
          <div key={league.id} className="space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-muted-foreground" />
              <LeagueIcon icon={league.icon} size="lg" />
              <h3 className="text-base font-semibold text-muted-foreground">
                Ligue {league.name}
              </h3>
              {league.access === 'pro_only' && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  Pro
                </span>
              )}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {leagueChallenges.map(c => (
                <ChallengeCard
                  key={c.id}
                  challenge={c}
                  status="locked"
                  participantCount={partCounts[c.id]}
                  participants={participantsByChallenge[c.id]}
                  lockedLeagueName={league.name}
                  lockedLeagueIcon={league.icon}
                />
              ))}
            </div>
          </div>
        )
      })}

    </div>
  )
}
