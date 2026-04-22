import { createClient } from '@/lib/supabase/server'

import { LeagueBadge } from '@/components/features/league/LeagueBadge'
import type { Profile } from '@/types/database.types'
import type { League } from '@/lib/utils/xp'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'

const TRACKS = ['Global', 'Graphic', 'UX-UI'] as const
type Track = typeof TRACKS[number]

interface LeaderRow {
  user_id: string
  username: string
  avatar_url: string | null
  league: string
  xp: number
  score: number
  submissions_count: number
}

async function getLeaderboard(track: Track): Promise<LeaderRow[]> {
  const supabase = await createClient()

  // Base: fetch all visible submissions with likes/comments
  let query = (supabase as any)
    .from('submissions')
    .select('user_id, likes_count, comments_count, challenge_id, challenges(track)')
    .eq('is_visible', true)

  if (track !== 'Global') {
    // filter by challenge track (need join)
    query = query.eq('challenges.track', track.toLowerCase().replace('ux-ui', 'ux'))
  }

  const { data: subs } = await query

  // aggregate per user: score = likes×5 + comments×3
  const byUser: Record<string, { likes: number; comments: number; count: number }> = {}
  for (const s of subs ?? []) {
    if (!byUser[s.user_id]) byUser[s.user_id] = { likes: 0, comments: 0, count: 0 }
    byUser[s.user_id].likes += s.likes_count ?? 0
    byUser[s.user_id].comments += s.comments_count ?? 0
    byUser[s.user_id].count++
  }

  // fetch profile info
  const userIds = Object.keys(byUser)
  if (!userIds.length) return []

  const { data: profiles } = await (supabase as any)
    .from('profiles')
    .select('id, username, avatar_url, league, xp')
    .in('id', userIds)

  const rows: LeaderRow[] = (profiles ?? []).map((p: any) => {
    const stats = byUser[p.id] ?? { likes: 0, comments: 0, count: 0 }
    return {
      user_id: p.id,
      username: p.username,
      avatar_url: p.avatar_url,
      league: p.league ?? 'rookie',
      xp: p.xp ?? 0,
      score: stats.likes * 5 + stats.comments * 3,
      submissions_count: stats.count,
    }
  })

  return rows.sort((a, b) => b.score - a.score || b.xp - a.xp)
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ track?: string }>
}) {
  const { track: trackParam } = await searchParams
  const track = (TRACKS.includes(trackParam as Track) ? trackParam : 'Global') as Track

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const [leaders] = await Promise.all([getLeaderboard(track)])
  const top3 = leaders.slice(0, 3)
  const rest = leaders.slice(3)
  const myRank = leaders.findIndex(l => l.user_id === user?.id) + 1

  return (
    <div className="pb-10">
      
      <div className="max-w-[960px] mx-auto px-6 py-8 space-y-8">

        {/* Track tabs */}
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
          {TRACKS.map(t => (
            <Link
              key={t}
              href={`/dashboard/leaderboard?track=${t}`}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                track === t
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t}
            </Link>
          ))}
        </div>

        {/* My rank */}
        {myRank > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/20">
            <span className="text-xs text-muted-foreground font-mono">Your rank</span>
            <span className="text-lg font-bold text-primary">#{myRank}</span>
            <span className="text-xs text-muted-foreground">out of {leaders.length} designers</span>
          </div>
        )}

        {leaders.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No submissions yet</div>
        ) : (
          <>
            {/* Podium */}
            <div className="grid grid-cols-3 gap-4 items-end">
              {[top3[1], top3[0], top3[2]].map((entry, i) => {
                if (!entry) return <div key={i} />
                const rank = i === 0 ? 2 : i === 1 ? 1 : 3
                const heights = ['h-24', 'h-32', 'h-20']
                const medals = ['🥈', '🥇', '🥉']
                return (
                  <Link
                    key={entry.user_id}
                    href={`/u/${entry.username}`}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <span className="text-2xl">{medals[i]}</span>
                    <Avatar className="size-12 ring-2 ring-border group-hover:ring-primary/40 transition-all">
                      <AvatarImage src={entry.avatar_url ?? undefined} />
                      <AvatarFallback className="text-sm font-bold bg-primary/10 text-primary">
                        {entry.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center">
                      <p className="text-xs font-semibold truncate max-w-[80px]">@{entry.username}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{entry.score} pts</p>
                    </div>
                    <div className={`${heights[i]} w-full rounded-t-lg bg-gradient-to-t from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center`}>
                      <span className="text-xl font-bold text-primary/40">#{rank}</span>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Rest of the list */}
            {rest.length > 0 && (
              <div className="rounded-xl border border-border overflow-hidden">
                {rest.map((entry, i) => (
                  <Link
                    key={entry.user_id}
                    href={`/u/${entry.username}`}
                    className="flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0 hover:bg-muted/40 transition-colors group"
                  >
                    <span className="w-6 text-center text-sm font-mono text-muted-foreground">
                      {i + 4}
                    </span>
                    <Avatar className="size-8">
                      <AvatarImage src={entry.avatar_url ?? undefined} />
                      <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                        {entry.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">@{entry.username}</p>
                      <p className="text-xs text-muted-foreground">{entry.submissions_count} submission{entry.submissions_count !== 1 ? 's' : ''}</p>
                    </div>
                    <LeagueBadge league={entry.league as League} size="sm" />
                    <div className="text-right">
                      <p className="text-sm font-bold font-mono">{entry.score}</p>
                      <p className="text-[10px] text-muted-foreground">pts</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Score = likes × 5 + comments × 3 · Updated in real-time
        </p>
      </div>
    </div>
  )
}
