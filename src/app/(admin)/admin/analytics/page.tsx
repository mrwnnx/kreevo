import { Users, Activity, CheckCircle2, Star, Zap, CalendarClock, ShieldAlert } from 'lucide-react'
import { getPlatformStats, type ChallengeStat } from '@/lib/admin/platform-stats'
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

function BarRow({ label, emoji, count, max }: { label: string; emoji?: string | null; count: number; max: number }) {
  const w = max > 0 ? Math.round((count / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-28 shrink-0 truncate">{emoji ? `${emoji} ` : ''}{label}</span>
      <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary" style={{ width: `${w}%` }} />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-8 text-end shrink-0">{count}</span>
    </div>
  )
}

function pct(n: number | null): string {
  return n === null ? '—' : `${Math.round(n * 100)}%`
}

function ChallengeList({ title, items, metric }: {
  title: string
  items: ChallengeStat[]
  metric: (c: ChallengeStat) => string
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="divide-y divide-border">
        {items.length === 0 && <p className="px-5 py-4 text-sm text-muted-foreground">Aucune donnée</p>}
        {items.map((c, i) => (
          <div key={c.id} className="flex items-center gap-3 px-5 py-3">
            <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">#{i + 1}</span>
            <p className="text-sm flex-1 min-w-0 truncate">{c.title ?? 'Challenge'}</p>
            <span className="text-xs font-mono text-muted-foreground shrink-0">{metric(c)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function AdminAnalytics() {
  const s = await getPlatformStats()
  const maxLeague = Math.max(1, ...s.byLeague.map((l) => l.count))
  const maxSpec = Math.max(1, ...s.bySpecialty.map((x) => x.count))
  const paidTotal = s.plan.pro + s.plan.studio
  const conversion = s.totalUsers ? Math.round((paidTotal / s.totalUsers) * 100) : 0

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Statistiques détaillées de la plateforme</p>
      </div>

      {/* §1 — KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Total participants" value={s.totalUsers} sub={`${s.plan.free} free · ${paidTotal} payants`} icon={Users} accent="text-primary" />
        <StatCard label="Actifs (7j)" value={s.active7d} sub={`${s.active30d} sur 30j`} icon={Activity} accent="text-green-500" />
        <StatCard label="Taux complétion" value={pct(s.completionRate)} sub="soumises ÷ rejoint" icon={CheckCircle2} accent="text-blue-500" />
        <StatCard label="Score IA moyen" value={s.avgAiScore !== null ? `${s.avgAiScore}/100` : '—'} sub="sur feedbacks générés" icon={Star} accent="text-amber-500" />
        <StatCard label="XP distribué" value={s.xpDistributed.toLocaleString()} sub="via soumissions validées" icon={Zap} accent="text-yellow-500" />
        <StatCard label="Conversion payante" value={`${conversion}%`} sub={`${s.plan.pro} pro · ${s.plan.studio} studio`} icon={CalendarClock} accent="text-violet-500" />
      </div>

      {/* §4 — distributions */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold mb-1">Répartition par ligue</h2>
          {s.byLeague.map((l) => <BarRow key={l.name} label={leagueLabel(l.name)} count={l.count} max={maxLeague} />)}
        </div>
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold mb-1">Répartition par spécialité</h2>
          {s.bySpecialty.map((x) => <BarRow key={x.label} label={x.label} emoji={x.emoji} count={x.count} max={maxSpec} />)}
        </div>
      </div>

      {/* §4 — challenges */}
      <div className="grid lg:grid-cols-3 gap-6">
        <ChallengeList
          title="Plus populaires"
          items={s.topByParticipations}
          metric={(c) => `${c.participations} inscrits`}
        />
        <ChallengeList
          title="Mieux complétés"
          items={s.topByCompletion}
          metric={(c) => `${pct(c.completionRate)} · ${c.submitted}/${c.participations}`}
        />
        <ChallengeList
          title="Les plus durs (score IA)"
          items={s.hardest}
          metric={(c) => `${c.avgScore}/100`}
        />
      </div>

      {/* §6 + §5 */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-sm font-semibold">Monétisation & feedbacks</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              ['Free', s.plan.free],
              ['Pro', s.plan.pro],
              ['Studio', s.plan.studio],
            ].map(([l, v]) => (
              <div key={l as string} className="rounded-lg bg-muted/40 p-3">
                <p className="text-xl font-bold">{v}</p>
                <p className="text-[11px] font-mono text-muted-foreground uppercase">{l}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-1">
            <div className="flex-1 rounded-lg bg-muted/40 p-3 text-center">
              <p className="text-xl font-bold">{s.feedbackTier.basic}</p>
              <p className="text-[11px] font-mono text-muted-foreground uppercase">Feedbacks basic (free)</p>
            </div>
            <div className="flex-1 rounded-lg bg-muted/40 p-3 text-center">
              <p className="text-xl font-bold">{s.feedbackTier.detailed}</p>
              <p className="text-[11px] font-mono text-muted-foreground uppercase">Feedbacks detailed (pro)</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <ShieldAlert className="size-4 text-orange-500" /> File de modération
          </h2>
          {[
            ['Soumissions signalées', s.moderation.reported],
            ['En vérification (on-hold)', s.moderation.onHold],
            ['En attente de review admin', s.moderation.pendingReview],
            ['Contestations en attente', s.moderation.pendingContests],
          ].map(([l, v]) => (
            <div key={l as string} className="flex items-center justify-between border-b border-border last:border-0 py-2">
              <span className="text-sm">{l}</span>
              <span className={`text-sm font-mono font-semibold ${(v as number) > 0 ? 'text-orange-500' : 'text-muted-foreground'}`}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
