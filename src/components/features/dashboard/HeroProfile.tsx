import Link from 'next/link'
import { Pencil, ExternalLink, Zap, Trophy, BarChart2 } from 'lucide-react'
import { leagueLabel, leagueColor } from '@/lib/utils/xp'
import type { League } from '@/lib/utils/xp'
import { cn } from '@/lib/utils'

const LEAGUE_GRADIENT: Record<string, string> = {
  // Old system
  rookie: 'from-stone-400 to-stone-500',
  rising: 'from-slate-400 to-slate-500',
  pro:    'from-yellow-400 to-yellow-500',
  elite:  'from-blue-400 to-blue-500',
  legend: 'from-pink-500 to-red-500',
  // New system
  Stone:    'from-stone-400 to-stone-600',
  Bronze:   'from-orange-400 to-orange-700',
  Silver:   'from-slate-300 to-slate-500',
  Gold:     'from-yellow-400 to-yellow-600',
  Platinum: 'from-cyan-300 to-cyan-600',
  Diamond:  'from-blue-300 to-blue-600',
  Master:   'from-violet-500 to-violet-700',
  Legend:   'from-pink-500 to-red-600',
}

interface HeroProfileProps {
  username: string
  fullName: string | null
  avatarUrl: string | null
  specialty: string | null
  bio: string | null
  country: string | null
  league: string
  xp: number
  submissionCount: number
  rank: number | null
  totalUsers: number
  // New leagues system props
  leagueIcon?: string
  leagueDisplayName?: string
  leagueDisplayColor?: string
  leagueXpThreshold?: number
  leagueChallengesCompleted?: number
  minChallenges?: number
}

function countryFlag(code: string | null): string | null {
  if (!code || code.length !== 2) return null
  return [...code.toUpperCase()].map(c => String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))).join('')
}

function Avatar({ url, name, league }: { url: string | null; name: string; league: string }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const gradient = LEAGUE_GRADIENT[league] ?? 'from-slate-400 to-slate-500'

  return (
    <div className="relative shrink-0">
      <div className={cn('size-[88px] rounded-full p-[2px] bg-gradient-to-br', gradient)}>
        <div className="size-full rounded-full overflow-hidden bg-muted">
          {url ? (
            <img src={url} alt={name} className="size-full object-cover" />
          ) : (
            <div className="size-full flex items-center justify-center bg-primary/10 text-primary text-2xl font-bold">
              {initials}
            </div>
          )}
        </div>
      </div>
      <span className="absolute bottom-1 right-1 size-3 rounded-full bg-green-400 border-2 border-card" />
    </div>
  )
}

export function HeroProfile({
  username, fullName, avatarUrl, specialty, bio, country,
  league, xp, submissionCount, rank, totalUsers,
  leagueIcon, leagueDisplayName, leagueDisplayColor,
  leagueXpThreshold, leagueChallengesCompleted, minChallenges,
}: HeroProfileProps) {
  const displayName = fullName || `@${username}`
  const flag = countryFlag(country)
  const subtitle = specialty || bio || null
  const rankPercent = rank && totalUsers > 0 ? Math.round((rank / totalUsers) * 100) : null

  // Use new system if available, fallback to old
  const displayLeagueName = leagueDisplayName ?? leagueLabel(league as League)
  const displayLeagueColor = leagueDisplayColor ?? leagueColor(league as League)
  const displayLeagueIcon = leagueIcon ?? ''

  // XP remaining to next league
  const xpRemaining = leagueXpThreshold && leagueXpThreshold > 0
    ? Math.max(0, leagueXpThreshold - xp)
    : null

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-4">

        {/* Avatar */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <Avatar url={avatarUrl} name={displayName} league={league} />
        </div>

        {/* Nom + spécialité + boutons */}
        <div className="flex-1 flex flex-col items-center md:items-start gap-3 min-w-0">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold leading-tight tracking-tight">
              {displayName}
              {flag && <span className="ml-2 text-2xl align-middle">{flag}</span>}
            </h1>
            {subtitle && (
              <p className="text-base text-muted-foreground mt-1">{subtitle}</p>
            )}
            {!subtitle && (
              <p className="text-base text-muted-foreground mt-1">@{username}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start">
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center gap-1.5 bg-foreground text-background text-sm font-semibold px-4 py-2 rounded-full hover:opacity-85 transition-opacity"
            >
              <Pencil className="size-3.5" />
              Modifier mon profil
            </Link>
            <Link
              href={`/u/${username}`}
              className="inline-flex items-center gap-1.5 border border-border text-sm font-medium px-4 py-2 rounded-full hover:bg-muted transition-colors"
            >
              <ExternalLink className="size-3.5" />
              Profil public
            </Link>
          </div>
        </div>

        {/* Stats 2×2 */}
        <div className="w-full md:w-auto shrink-0">
          <div className="grid grid-cols-2 gap-2 md:w-[220px]">
            {/* XP */}
            <StatCell
              icon={<Zap className="size-4 text-amber-500" />}
              label="XP Total"
              value={xp.toLocaleString()}
              sub={xpRemaining !== null && xpRemaining > 0 ? `-${xpRemaining.toLocaleString()} XP` : undefined}
            />

            {/* Challenges */}
            <StatCell
              icon={<Trophy className="size-4 text-violet-500" />}
              label="Challenges"
              value={String(submissionCount)}
              sub={leagueChallengesCompleted !== undefined ? `${leagueChallengesCompleted}/${minChallenges ?? 3} ligue` : undefined}
            />

            {/* Ligue */}
            <StatCell
              icon={<span className="text-sm">{displayLeagueIcon || '🏅'}</span>}
              label="Ligue"
              value={displayLeagueName}
              valueColor={displayLeagueColor}
            />

            {/* Rang */}
            <StatCell
              icon={<BarChart2 className="size-4 text-blue-500" />}
              label="Rang"
              value={rankPercent !== null ? `Top ${rankPercent}%` : '—'}
            />
          </div>
        </div>

      </div>
    </div>
  )
}

function StatCell({
  icon, label, value, valueColor, sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  valueColor?: string
  sub?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-3 space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p
        className="text-base font-bold leading-none"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground leading-none">{sub}</p>}
    </div>
  )
}
