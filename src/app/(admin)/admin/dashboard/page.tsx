import { createClient } from '@/lib/supabase/server'
import { Users, Trophy, FileText, DollarSign, Clock, TrendingUp } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { leagueLabel } from '@/lib/utils/xp'

function StatCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; accent?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{label}</p>
        <Icon className={`size-4 ${accent ?? 'text-muted-foreground'}`} />
      </div>
      <p className="text-3xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export default async function AdminDashboard() {
  const supabase = await createClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfWeek = new Date(now.getTime() - 7 * 864e5).toISOString()
  const startOfLastWeek = new Date(now.getTime() - 14 * 864e5).toISOString()

  const [
    { count: totalUsers },
    { count: proUsers },
    { count: freeUsers },
    { count: activeChalls },
    { count: monthSubs },
    { count: weekSignups },
    { count: lastWeekSignups },
    { count: pendingFeedbacks },
    { data: recentUsers },
    { data: topDesigners },
  ] = await Promise.all([
    (supabase as any).from('profiles').select('id', { count: 'exact', head: true }),
    (supabase as any).from('profiles').select('id', { count: 'exact', head: true }).eq('plan', 'pro'),
    (supabase as any).from('profiles').select('id', { count: 'exact', head: true }).eq('plan', 'free'),
    (supabase as any).from('challenges').select('id', { count: 'exact', head: true }).eq('is_published', true),
    (supabase as any).from('submissions').select('id', { count: 'exact', head: true }).gte('created_at', startOfMonth),
    (supabase as any).from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', startOfWeek),
    (supabase as any).from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', startOfLastWeek).lt('created_at', startOfWeek),
    (supabase as any).from('feedbacks').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    (supabase as any).from('profiles').select('id, username, full_name, avatar_url, plan, league, created_at').order('created_at', { ascending: false }).limit(10),
    (supabase as any).from('profiles').select('id, username, full_name, avatar_url, league, xp').order('xp', { ascending: false }).limit(5),
  ])

  const revenue = (proUsers ?? 0) * 9
  const weekDiff = (weekSignups ?? 0) - (lastWeekSignups ?? 0)

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Vue d'ensemble Kreevo</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total users"
          value={totalUsers ?? 0}
          sub={`${freeUsers ?? 0} free · ${proUsers ?? 0} pro`}
          icon={Users}
          accent="text-primary"
        />
        <StatCard
          label="Nouveaux (7j)"
          value={`+${weekSignups ?? 0}`}
          sub={weekDiff >= 0 ? `+${weekDiff} vs semaine dernière` : `${weekDiff} vs semaine dernière`}
          icon={TrendingUp}
          accent={weekDiff >= 0 ? 'text-green-500' : 'text-destructive'}
        />
        <StatCard
          label="Challenges actifs"
          value={activeChalls ?? 0}
          icon={Trophy}
          accent="text-yellow-500"
        />
        <StatCard
          label="Soumissions ce mois"
          value={monthSubs ?? 0}
          icon={FileText}
          accent="text-blue-500"
        />
        <StatCard
          label="Revenu estimé"
          value={`$${revenue}`}
          sub={`${proUsers ?? 0} users Pro × $9`}
          icon={DollarSign}
          accent="text-green-500"
        />
        <StatCard
          label="Feedbacks en attente"
          value={pendingFeedbacks ?? 0}
          icon={Clock}
          accent={pendingFeedbacks ? 'text-orange-500' : 'text-muted-foreground'}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent signups */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold">Derniers inscrits</h2>
          </div>
          <div className="divide-y divide-border">
            {(recentUsers ?? []).map((u: any) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar className="size-7 rounded-md">
                  <AvatarImage src={u.avatar_url} />
                  <AvatarFallback className="rounded-md text-[10px]">{u.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.full_name ?? u.username}</p>
                  <p className="text-[11px] font-mono text-muted-foreground">@{u.username}</p>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${u.plan === 'pro' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {u.plan}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {new Date(u.created_at).toLocaleDateString('fr', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top designers */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-semibold">Top designers ce mois</h2>
          </div>
          <div className="divide-y divide-border">
            {(topDesigners ?? []).map((u: any, i: number) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <span className="text-sm font-mono text-muted-foreground w-5">#{i + 1}</span>
                <Avatar className="size-7 rounded-md">
                  <AvatarImage src={u.avatar_url} />
                  <AvatarFallback className="rounded-md text-[10px]">{u.username?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.full_name ?? u.username}</p>
                  <p className="text-[11px] font-mono text-muted-foreground">{leagueLabel(u.league)}</p>
                </div>
                <span className="text-sm font-mono font-semibold text-primary">{u.xp.toLocaleString()} XP</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
