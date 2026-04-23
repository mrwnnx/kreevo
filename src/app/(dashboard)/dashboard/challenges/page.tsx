import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Users, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Track config ─────────────────────────────────────────────
const TRACK_CONFIG: Record<string, { icon: string; bg: string }> = {
  ux_ui:    { icon: '📱', bg: 'bg-violet-100 dark:bg-violet-900/30' },
  graphic:  { icon: '🎨', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  motion:   { icon: '✨', bg: 'bg-pink-100   dark:bg-pink-900/30'   },
  '3d':     { icon: '🧊', bg: 'bg-green-100  dark:bg-green-900/30'  },
  branding: { icon: '💎', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  web:      { icon: '🌐', bg: 'bg-blue-100   dark:bg-blue-900/30'   },
}

const DEFAULT_TRACK = { icon: '🎨', bg: 'bg-muted' }

const LEVEL_STYLE: Record<string, string> = {
  rookie:       'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
  rising:       'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
  pro:          'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  elite:        'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
  legend:       'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  intermediate: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  advanced:     'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
}

function deadlineLabel(closesAt: string) {
  const diff = new Date(closesAt).getTime() - Date.now()
  const days = Math.ceil(diff / 86400000)
  if (days < 0) return 'Terminé'
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Demain'
  return `${days}j restants`
}

interface LeagueRow { id: string; name: string; icon: string; color: string; order_index: number; access: string }
interface ChallengeRow {
  id: string; title: string; brief: string; track: string; level: string
  closes_at: string; league_id: string | null
  leagues: LeagueRow | null
}

function ChallengeCard({
  challenge, hasSubmitted, participantCount, hasActive,
}: {
  challenge: ChallengeRow
  hasSubmitted: boolean
  participantCount: number
  hasActive: boolean
}) {
  const track = TRACK_CONFIG[challenge.track] ?? DEFAULT_TRACK
  const levelStyle = LEVEL_STYLE[challenge.level] ?? 'bg-muted text-muted-foreground'
  const closed = new Date(challenge.closes_at) < new Date()

  return (
    <Link
      href={`/dashboard/challenges/${challenge.id}`}
      className="group flex flex-col bg-card border border-border rounded-2xl p-5 gap-4 hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-3">
        <div className={cn('size-12 rounded-xl flex items-center justify-center text-2xl shrink-0', track.bg)}>
          {track.icon}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={cn('text-[12px] font-medium px-3 py-1 rounded-full capitalize shrink-0', levelStyle)}>
            {challenge.level}
          </span>
          {challenge.leagues && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {challenge.leagues.icon} {challenge.leagues.name}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1 flex-1">
        <h3 className="text-base font-medium text-foreground leading-snug group-hover:text-primary transition-colors">
          {challenge.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{challenge.brief}</p>
      </div>

      <div className="border-t border-border/60" />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Calendar className="size-3.5 shrink-0" />
            {deadlineLabel(challenge.closes_at)}
          </span>
          {participantCount > 0 && (
            <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Users className="size-3.5 shrink-0" />
              {participantCount}
            </span>
          )}
        </div>
        <span className={cn(
          'inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full border transition-all shrink-0',
          hasSubmitted
            ? 'border-border text-muted-foreground'
            : closed
              ? 'border-border text-muted-foreground'
              : hasActive
                ? 'border-border text-muted-foreground'
                : 'border-primary/30 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary'
        )}>
          {hasSubmitted ? 'Soumis ✓' : closed ? 'Terminé' : hasActive ? 'En cours' : 'Participer'}
        </span>
      </div>
    </Link>
  )
}

function LockedCard({ leagueName, leagueIcon }: { leagueName: string; leagueIcon: string }) {
  return (
    <div className="flex flex-col items-center justify-center bg-card border border-dashed border-border/50 rounded-2xl p-8 gap-3 opacity-60">
      <Lock className="size-5 text-muted-foreground" />
      <p className="text-sm text-center text-muted-foreground">
        Atteins {leagueIcon} <span className="font-medium">{leagueName}</span> pour débloquer
      </p>
    </div>
  )
}

interface PageProps { searchParams: Promise<{ track?: string }> }

export default async function ChallengesPage({ searchParams }: PageProps) {
  const { track: trackFilter } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profileData },
    { data: allLeagues },
    { data: userSubmissions },
  ] = await Promise.all([
    supabase.from('profiles').select('league, plan').eq('id', user.id).single(),
    (supabaseAdmin as any).from('leagues').select('*').eq('is_active', true).order('order_index', { ascending: true }),
    supabase.from('submissions').select('challenge_id').eq('user_id', user.id),
  ])

  const submittedIds = new Set((userSubmissions ?? []).map((s: any) => s.challenge_id))
  const leagues: LeagueRow[] = allLeagues ?? []

  // Find user's current league in new leagues table (by name match)
  const userLeagueName = (profileData as any)?.league ?? ''
  const userLeague = leagues.find(l => l.name.toLowerCase() === userLeagueName.toLowerCase()) ?? null
  const userLeagueIndex = userLeague ? userLeague.order_index : 0

  // Fetch challenges with league join
  let challengeQuery = (supabaseAdmin as any)
    .from('challenges')
    .select('id, title, brief, track, level, closes_at, league_id, leagues(id, name, icon, color, order_index, access)')
    .eq('status', 'active')
    .order('closes_at', { ascending: true })

  if (trackFilter && trackFilter !== 'all') {
    challengeQuery = challengeQuery.eq('track', trackFilter)
  }

  const { data: allChallenges } = await challengeQuery
  const challenges: ChallengeRow[] = allChallenges ?? []

  // Participation counts + user active
  const { data: participations } = await (supabaseAdmin as any)
    .from('participations')
    .select('challenge_id, user_id, status')

  const partCounts: Record<string, number> = {}
  let userHasActive = false
  for (const p of (participations ?? []) as any[]) {
    partCounts[p.challenge_id] = (partCounts[p.challenge_id] ?? 0) + 1
    if (p.user_id === user.id && p.status === 'active') userHasActive = true
  }

  // Classify challenges
  const userLeagueChallenges = challenges.filter(c => {
    if (!c.league_id) return true // no league → always show
    const cLeague = c.leagues
    if (!cLeague) return true
    if (!userLeague) return cLeague.order_index === 1 // no league match → show Stone only
    return cLeague.order_index === userLeagueIndex
  })

  // Higher leagues (locked) - grouped
  const higherLeagues = leagues.filter(l => l.order_index > userLeagueIndex)
  const higherByChallenges: Record<string, ChallengeRow[]> = {}
  for (const l of higherLeagues) {
    higherByChallenges[l.id] = challenges.filter(c => c.league_id === l.id)
  }

  const TRACKS = [
    { value: 'all', label: 'Tous' },
    { value: 'ux_ui', label: '📱 UX-UI' },
    { value: 'graphic', label: '🎨 Graphic' },
  ]

  return (
    <div className="p-6 max-w-[960px] mx-auto pb-16 space-y-8">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-1">Design Challenges</h2>
        <p className="text-sm text-muted-foreground">
          {userLeague
            ? `Ligue ${userLeague.icon} ${userLeague.name} — challenges de ta ligue`
            : 'Rejoins un challenge, soumets ton travail, gagne des XP.'}
        </p>
      </div>

      {/* Track filter */}
      <div className="flex items-center gap-2">
        {TRACKS.map(t => (
          <Link
            key={t.value}
            href={t.value === 'all' ? '/dashboard/challenges' : `/dashboard/challenges?track=${t.value}`}
            className={cn(
              'text-sm font-medium px-4 py-1.5 rounded-full border transition-all',
              (t.value === 'all' && !trackFilter) || trackFilter === t.value
                ? 'bg-foreground text-background border-foreground'
                : 'border-border text-muted-foreground hover:border-foreground/40'
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Active participation warning */}
      {userHasActive && (
        <div className="rounded-xl border border-orange-200 bg-orange-50/50 dark:border-orange-900/40 dark:bg-orange-900/10 px-4 py-3 text-sm text-orange-700 dark:text-orange-400">
          Tu as une participation active en cours — termine-la d'abord avant d'en rejoindre une autre.
        </div>
      )}

      {/* User's league challenges */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {userLeague && (
            <span className="text-lg">{userLeague.icon}</span>
          )}
          <h3 className="text-base font-semibold">
            {userLeague ? `Ligue ${userLeague.name}` : 'Challenges actifs'}
          </h3>
          <span className="text-sm text-muted-foreground">({userLeagueChallenges.length})</span>
        </div>

        {userLeagueChallenges.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userLeagueChallenges.map(c => (
              <ChallengeCard
                key={c.id}
                challenge={c}
                hasSubmitted={submittedIds.has(c.id)}
                participantCount={partCounts[c.id] ?? 0}
                hasActive={userHasActive}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
            Aucun challenge actif dans ta ligue pour l'instant.
          </div>
        )}
      </div>

      {/* Higher leagues (locked) */}
      {higherLeagues.map(league => {
        const leagueChallenges = higherByChallenges[league.id] ?? []
        if (leagueChallenges.length === 0 && trackFilter) return null

        return (
          <div key={league.id} className="space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-muted-foreground" />
              <span className="text-lg">{league.icon}</span>
              <h3 className="text-base font-semibold text-muted-foreground">
                Ligue {league.name}
              </h3>
              {league.access === 'pro_only' && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  Pro
                </span>
              )}
            </div>

            {leagueChallenges.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {leagueChallenges.map(c => (
                  <LockedCard key={c.id} leagueName={league.name} leagueIcon={league.icon} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground opacity-60">
                {league.icon} Aucun challenge dans cette ligue pour l'instant.
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
