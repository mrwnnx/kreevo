import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { LeaguesRow } from '@/components/features/league/LeaguesRow'

export const dynamic = 'force-dynamic'

interface League {
  id: string
  name: string
  icon: string
  color: string
  order_index: number
  is_active: boolean
}

export default async function LeaderboardPreviewPage() {
  const { data: dbLeagues } = await (supabaseAdmin as any)
    .from('leagues')
    .select('id, name, icon, color, order_index, is_active')
    .eq('is_active', true)
    .order('order_index', { ascending: true })

  const leagues: League[] = dbLeagues ?? []

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8 space-y-12">
      <div>
        <h1 className="text-2xl font-bold mb-1">Leaderboard preview</h1>
        <p className="text-sm text-muted-foreground">
          Visualisation du <code className="font-mono text-xs">LeaguesRow</code> + hero pour chacune des {leagues.length} ligues.
        </p>
      </div>

      {leagues.map((league) => (
        <section
          key={league.id}
          className="rounded-2xl border border-border overflow-hidden"
        >
          {/* Tag header */}
          <div className="px-6 py-3 bg-muted/40 border-b border-border flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Active = {league.name}
            </span>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full"
              style={{
                background: league.color + '22',
                color: league.color,
              }}
            >
              order {league.order_index}
            </span>
          </div>

          {/* Render the leaderboard hero block as if user was in this league */}
          <div className="text-center space-y-3 py-8 overflow-hidden">
            <LeaguesRow leagues={leagues} userLeagueIndex={league.order_index} />

            <div className="pt-2">
              <h2 className="text-2xl font-bold">{league.name} League</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Complète des défis pour accumuler des XP
              </p>
            </div>

            <Link
              href="/dashboard/challenges"
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2 rounded-full text-white transition-opacity hover:opacity-85"
              style={{ background: league.color }}
            >
              Voir mes défis <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </section>
      ))}
    </div>
  )
}
