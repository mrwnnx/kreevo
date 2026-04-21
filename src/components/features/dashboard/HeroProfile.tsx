import Link from 'next/link'
import { Pencil, ExternalLink, Zap, Trophy, BarChart2 } from 'lucide-react'
import { leagueLabel, leagueColor } from '@/lib/utils/xp'
import type { League } from '@/lib/utils/xp'
import { cn } from '@/lib/utils'

const LEAGUE_GRADIENT: Record<League, string> = {
  rookie: 'from-stone-400 to-stone-500',
  rising: 'from-slate-400 to-slate-500',
  pro:    'from-yellow-400 to-yellow-500',
  elite:  'from-blue-400 to-blue-500',
  legend: 'from-pink-500 to-red-500',
}

interface HeroProfileProps {
  username: string
  fullName: string | null
  avatarUrl: string | null
  specialty: string | null
  bio: string | null
  league: League
  xp: number
  submissionCount: number
  rank: number | null
  totalUsers: number
}

function Avatar({ url, name, league }: { url: string | null; name: string; league: League }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="relative shrink-0">
      {/* Gradient border ring */}
      <div className={cn(
        'size-[88px] rounded-full p-[2px] bg-gradient-to-br',
        LEAGUE_GRADIENT[league]
      )}>
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
      {/* Online dot */}
      <span className="absolute bottom-1 right-1 size-3 rounded-full bg-green-400 border-2 border-white" />
    </div>
  )
}

export function HeroProfile({
  username,
  fullName,
  avatarUrl,
  specialty,
  bio,
  league,
  xp,
  submissionCount,
  rank,
  totalUsers,
}: HeroProfileProps) {
  const displayName = fullName || `@${username}`
  const subtitle = specialty || bio || null
  const rankPercent = rank && totalUsers > 0
    ? Math.round((rank / totalUsers) * 100)
    : null

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 p-4">

        {/* ── Gauche : Avatar + badge ligue ── */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          {/* Badge ligue pill */}
          <span className={cn(
            'text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full text-white bg-gradient-to-r',
            LEAGUE_GRADIENT[league]
          )}>
            {leagueLabel(league).toUpperCase()}
          </span>
          <Avatar url={avatarUrl} name={displayName} league={league} />
        </div>

        {/* ── Centre : Nom + spécialité + boutons ── */}
        <div className="flex-1 flex flex-col items-center md:items-start gap-3 min-w-0">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold leading-tight tracking-tight">{displayName}</h1>
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

        {/* ── Droite : Stats 2×2 ── */}
        <div className="w-full md:w-auto shrink-0">
          <div className="grid grid-cols-2 gap-2 md:w-[220px]">
            <StatCell
              icon={<Zap className="size-4 text-amber-500" />}
              label="XP Total"
              value={xp.toLocaleString()}
            />
            <StatCell
              icon={<Trophy className="size-4 text-violet-500" />}
              label="Challenges"
              value={String(submissionCount)}
            />
            <StatCell
              icon={<span className="text-sm">🏅</span>}
              label="Ligue"
              value={leagueLabel(league)}
              valueColor={leagueColor(league)}
            />
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
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ReactNode
  label: string
  value: string
  valueColor?: string
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
    </div>
  )
}
