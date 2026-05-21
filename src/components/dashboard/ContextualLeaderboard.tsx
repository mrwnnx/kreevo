import Link from 'next/link'
import { TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tx } from '@/lib/i18n/tx'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

interface LeaderboardUser {
  rank: number
  username: string
  full_name: string | null
  avatar_url: string | null
  xp: number
  isCurrentUser?: boolean
}

interface ContextualLeaderboardProps {
  users: LeaderboardUser[]
  userRank: number
  totalInLeague: number
  league: string
  xpToTop10: number
  t: Dictionary['dashboard']['contextualLeaderboard']
}

export function ContextualLeaderboard({
  users,
  userRank,
  totalInLeague,
  league,
  xpToTop10,
  t,
}: ContextualLeaderboardProps) {
  const maxXP = Math.max(...users.map((u) => u.xp), 1)

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-violet-500" />
            {tx(t.yourRank, { league })}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {tx(t.countLine, { rank: userRank, total: totalInLeague })}
          </p>
        </div>
        <Link
          href="/dashboard/leaderboard"
          className="text-xs text-violet-600 hover:text-violet-700 font-medium"
        >
          {t.seeAll}
        </Link>
      </div>

      {xpToTop10 > 0 && (
        <div className="px-5 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-border">
          <p
            className="text-xs font-medium text-amber-700 dark:text-amber-400"
            dangerouslySetInnerHTML={{ __html: tx(t.onlyXpToTop10, { n: xpToTop10 }) }}
          />
        </div>
      )}

      <div className="divide-y divide-border">
        {users.map((user) => (
          <div
            key={user.rank}
            className={cn(
              'flex items-center gap-3 px-5 py-3',
              user.isCurrentUser && 'bg-violet-50 dark:bg-violet-900/20',
            )}
          >
            <span
              className={cn(
                'w-6 text-center text-sm font-bold flex-shrink-0',
                user.rank <= 3
                  ? 'text-amber-500'
                  : user.isCurrentUser
                    ? 'text-violet-600'
                    : 'text-muted-foreground',
              )}
            >
              #{user.rank}
            </span>

            <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-medium text-zinc-500">
              {user.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar_url}
                  alt={user.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.username[0]?.toUpperCase()
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  'text-sm font-medium truncate',
                  user.isCurrentUser && 'text-violet-700 dark:text-violet-400',
                )}
              >
                {user.isCurrentUser ? t.you : user.full_name || `@${user.username}`}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-16 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(user.xp / maxXP) * 100}%`,
                    backgroundColor: user.isCurrentUser ? '#7C3AED' : '#D1D5DB',
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums w-14 text-right">
                {user.xp.toLocaleString()} {t.xpSuffix}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
