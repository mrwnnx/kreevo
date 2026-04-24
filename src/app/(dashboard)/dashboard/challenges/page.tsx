import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Lock, Zap, Trophy, Clock, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getLeagueThreshold } from '@/lib/utils/leagues'
import { LeagueIcon } from '@/components/features/league/LeagueIcon'

// ── Track config ──────────────────────────────────────────────────────────────
const TRACK_CONFIG: Record<string, { icon: string; label: string; gradient: string }> = {
  ux_ui:    { icon: '📱', label: 'UX/UI',    gradient: 'from-violet-500 to-violet-700' },
  graphic:  { icon: '🎨', label: 'Graphic',  gradient: 'from-orange-400 to-orange-600' },
  motion:   { icon: '✨', label: 'Motion',   gradient: 'from-pink-400 to-pink-600'     },
  '3d':     { icon: '🧊', label: '3D',       gradient: 'from-green-400 to-green-600'   },
  branding: { icon: '💎', label: 'Branding', gradient: 'from-yellow-400 to-yellow-600' },
  web:      { icon: '🌐', label: 'Web',      gradient: 'from-blue-400 to-blue-600'     },
}

const DIFFICULTY_CONFIG: Record<string, { label: string; style: string }> = {
  easy:         { label: 'Facile',         style: 'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400'  },
  medium:       { label: 'Moyen',          style: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  hard:         { label: 'Difficile',      style: 'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400'    },
  expert:       { label: 'Expert',         style: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface LeagueRow {
  id: string; name: string; icon: string; color: string
  order_index: number; access: string; min_challenges: number; is_active: boolean
}

interface ChallengeRow {
  id: string; title: string; brief: string; track: string
  difficulty: string | null
  xp_reward: number | null; deadline_days: number | null
  closes_at: string; league_id: string | null; is_published: boolean
  leagues: LeagueRow | null
}

type ChallengeStatus = 'available' | 'active' | 'locked' | 'completed' | 'blocked'

// ── ChallengeCard ─────────────────────────────────────────────────────────────
function ChallengeCard({
  challenge, status, participantCount, lockedLeagueName, lockedLeagueIcon,
}: {
  challenge: ChallengeRow
  status: ChallengeStatus
  participantCount?: number
  lockedLeagueName?: string
  lockedLeagueIcon?: string
}) {
  const track = TRACK_CONFIG[challenge.track] ?? { icon: '🎨', label: '', gradient: 'from-slate-400 to-slate-600' }
  const diffKey = (challenge.difficulty ?? '') as string
  const diff = DIFFICULTY_CONFIG[diffKey] ?? DIFFICULTY_CONFIG.medium
  const isClickable = status === 'available' || status === 'active' || status === 'completed'

  const card = (
    <div className={cn(
      'group flex flex-col bg-card border rounded-2xl overflow-hidden transition-all duration-200',
      status === 'available'  && 'border-border hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md',
      status === 'active'     && 'border-green-400 dark:border-green-600 shadow-sm shadow-green-500/10',
      status === 'completed'  && 'border-border/40',
      status === 'locked'     && 'opacity-50 cursor-default',
      status === 'blocked'    && 'opacity-60 cursor-default',
    )}>

      {/* Track gradient header */}
      <div className={cn('relative h-[72px] bg-gradient-to-r flex items-center px-4 gap-3', track.gradient)}>
        <div className="size-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl shrink-0">
          {track.icon}
        </div>
        <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">{track.label}</span>

        {/* Difficulty badge */}
        {diffKey && DIFFICULTY_CONFIG[diffKey] && (
          <span className={cn('absolute top-2.5 right-2.5 text-[11px] font-semibold px-2 py-0.5 rounded-full', diff.style)}>
            {diff.label}
          </span>
        )}

        {/* Active badge */}
        {status === 'active' && (
          <div className="absolute bottom-2 right-3 flex items-center gap-1 bg-green-600/80 rounded-full px-2 py-0.5">
            <span className="size-1.5 rounded-full bg-green-300 animate-pulse" />
            <span className="text-[11px] font-medium text-white">En cours</span>
          </div>
        )}

        {/* Completed overlay */}
        {status === 'completed' && (
          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
            <span className="text-2xl">✅</span>
          </div>
        )}

        {/* Lock overlay */}
        {status === 'locked' && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <Lock className="size-6 text-white/80" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-3 flex-1 relative">

        {/* Blocked overlay */}
        {status === 'blocked' && (
          <div className="absolute inset-0 bg-card/85 backdrop-blur-[2px] flex items-center justify-center rounded-b-2xl z-10 p-4">
            <p className="text-xs text-center text-muted-foreground font-medium leading-relaxed">
              Termine ton challenge en cours d'abord
            </p>
          </div>
        )}

        <div>
          <h3 className={cn(
            'text-sm font-semibold leading-snug line-clamp-2',
            isClickable && 'group-hover:text-primary transition-colors',
          )}>
            {challenge.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
            {challenge.brief}
          </p>
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
              {challenge.deadline_days}j deadline
            </span>
          )}
        </div>

        {participantCount != null && participantCount > 0 && (
          <p className="text-xs text-muted-foreground">👥 {participantCount} designers</p>
        )}

        {/* Footer */}
        <div className="mt-auto pt-3 border-t border-border/60">
          {status === 'available' && (
            <span className="inline-flex items-center justify-center w-full rounded-full bg-primary text-primary-foreground text-xs font-semibold py-2 group-hover:opacity-90">
              Participer
            </span>
          )}
          {status === 'active' && (
            <span className="inline-flex items-center justify-center gap-1.5 w-full rounded-full border border-green-400 dark:border-green-600 text-green-700 dark:text-green-400 text-xs font-semibold py-2 group-hover:bg-green-50 dark:group-hover:bg-green-900/20 transition-colors">
              Continuer <ArrowRight className="size-3" />
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
          {status === 'completed' && (
            <span className="inline-flex items-center justify-center gap-1.5 w-full text-xs text-muted-foreground">
              ✅ Complété
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
    supabase.from('profiles').select('league, plan, xp').eq('id', user.id).single(),
    (supabaseAdmin as any)
      .from('leagues')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true }),
    (supabaseAdmin as any)
      .from('challenges')
      .select('id, title, brief, track, difficulty, xp_reward, deadline_days, closes_at, league_id, is_published, leagues(id, name, icon, color, order_index, access, min_challenges, is_active)')
      .eq('is_published', true)
      .order('closes_at', { ascending: true }),
    (supabase as any)
      .from('participations')
      .select('id, challenge_id, personal_deadline')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1),
    supabase.from('submissions').select('challenge_id').eq('user_id', user.id),
    (supabaseAdmin as any)
      .from('participations')
      .select('challenge_id'),
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

  // My league challenges (sorted: active first)
  const myLeagueChallenges = challenges.filter(c => {
    if (!c.league_id) return false
    const cl = c.leagues
    if (!cl) return false
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
    challengesByLeague[l.id] = challenges.filter(c => c.league_id === l.id)
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
