import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { leagueLabel } from '@/lib/utils/xp'
import { BADGE_DEFINITIONS } from '@/lib/utils/badges'
import { getUserStats, type UserSubmissionStat } from '@/lib/admin/user-stats'

interface Props { params: Promise<{ id: string }> }

const VALIDATION_STYLE: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  rejected: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  on_hold: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  pending: 'bg-muted text-muted-foreground',
}
const VALIDATION_LABEL: Record<string, string> = {
  approved: 'Approuvée',
  rejected: 'Rejetée',
  on_hold: 'En vérification',
  pending: 'En attente',
}

function pct(n: number | null): string {
  return n === null ? '—' : `${Math.round(n * 100)}%`
}

function StatCell({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

function SubmissionRow({ s }: { s: UserSubmissionStat }) {
  const status = s.validationStatus ?? 'pending'
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
      {s.cover_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.cover_url} alt="" className="size-14 rounded-lg object-cover shrink-0" />
      ) : (
        <div className="size-14 rounded-lg bg-muted shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium truncate">{s.challengeTitle ?? s.title ?? 'Challenge'}</p>
          {s.isDraft ? (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              Brouillon
            </span>
          ) : (
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${VALIDATION_STYLE[status] ?? VALIDATION_STYLE.pending}`}>
              {VALIDATION_LABEL[status] ?? status}
            </span>
          )}
          {(s.validatedByAI || s.validatedByAdmin) && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              {s.validatedByAI ? 'IA' : 'Admin'}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-mono mt-1">
          {new Date(s.createdAt).toLocaleDateString('fr')} · {s.likes} likes · {s.comments} comm.
          {s.reports > 0 && <span className="text-rose-500"> · {s.reports} report{s.reports > 1 ? 's' : ''}</span>}
          {s.hoursToSubmit !== null && (
            <span> · {s.hoursToSubmit < 48 ? `${Math.round(s.hoursToSubmit)}h` : `${Math.round(s.hoursToSubmit / 24)}j`} après join</span>
          )}
        </p>
      </div>
      <div className="text-end shrink-0">
        {s.aiScore !== null && <p className="text-sm font-bold">{s.aiScore}<span className="text-[11px] text-muted-foreground">/100</span></p>}
        {s.xpEarned > 0 && <p className="text-xs font-mono text-primary">+{s.xpEarned} XP</p>}
      </div>
    </div>
  )
}

export default async function UserDetail({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: user }, { data: badges }, { data: notifs }] = await Promise.all([
    (supabase as any).from('profiles').select('*').eq('id', id).single(),
    (supabase as any).from('badges').select('*').eq('user_id', id).order('created_at', { ascending: false }),
    (supabase as any).from('notifications').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(20),
  ])

  if (!user) notFound()

  const stats = await getUserStats({ id, league: user.league, specialty_id: user.specialty_id })

  return (
    <div className="p-6 max-w-4xl space-y-8">
      {/* Profile header */}
      <div className="flex items-start gap-4">
        <Avatar className="size-16 rounded-xl">
          <AvatarImage src={user.avatar_url} />
          <AvatarFallback className="rounded-xl text-xl">{user.username?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{user.full_name ?? user.username}</h1>
          <p className="text-sm text-muted-foreground font-mono">@{user.username}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-muted">{user.plan}</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary">{leagueLabel(user.league)}</span>
            <span className="text-xs font-mono text-muted-foreground">{user.xp?.toLocaleString()} XP</span>
            {stats.rank !== null && (
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                #{stats.rank} · top {stats.topPercent}%
              </span>
            )}
            {user.is_suspended && <span className="text-xs font-mono bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">Suspendu</span>}
            {user.role === 'admin' && <span className="text-xs font-mono bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Admin</span>}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Statistiques</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <StatCell label="Participations" value={stats.participations.total} sub={`${stats.participations.active} actives · ${stats.participations.expired} expirées`} />
          <StatCell label="Taux complétion" value={pct(stats.completionRate)} sub={`${stats.participations.submitted} soumises`} />
          <StatCell label="Taux abandon" value={pct(stats.abandonRate)} sub={`${stats.participations.expired} expirées`} />
          <StatCell label="Soumissions" value={stats.submissionsPublished} sub={`${stats.submissionsDrafts} brouillon${stats.submissionsDrafts > 1 ? 's' : ''}`} />
          <StatCell label="Score IA moyen" value={stats.avgAiScore !== null ? `${stats.avgAiScore}/100` : '—'} sub={`${stats.aiScoredCount} feedback${stats.aiScoredCount > 1 ? 's' : ''}`} />
          <StatCell label="Validations" value={`${stats.validations.approved}✓ ${stats.validations.rejected}✗`} sub={`IA ${stats.validations.byAI} · admin ${stats.validations.byAdmin}`} />
          <StatCell label="Engagement reçu" value={`${stats.likesReceived}♥`} sub={`${stats.commentsReceived} commentaires`} />
          <StatCell label="Comm. postés" value={stats.commentsGiven} sub="engagement donné" />
          <StatCell label="Streak" value={stats.streak ? `${stats.streak.current}🔥` : '—'} sub={stats.streak ? `record ${stats.streak.longest}` : undefined} />
          <StatCell label="Filleuls" value={stats.referrals.total} sub={`${stats.referrals.completed} validés`} />
          <StatCell label="Modération" value={`${stats.reportsReceived} report${stats.reportsReceived > 1 ? 's' : ''}`} sub={`${stats.contestsFiled} contestation${stats.contestsFiled > 1 ? 's' : ''}`} />
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Info */}
        <section className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Informations</h2>
          {[
            ['Spécialité', user.specialty],
            ['Pays', user.city ? `${user.city}, ${user.country}` : user.country],
            ['Objectif', user.objective],
            ['Langue', user.preferred_language],
            ['Inscrit', new Date(user.created_at).toLocaleDateString('fr')],
          ].map(([label, value]) => value ? (
            <div key={label as string} className="flex gap-3">
              <span className="text-xs font-mono text-muted-foreground w-24 shrink-0">{label}</span>
              <span className="text-sm">{value}</span>
            </div>
          ) : null)}
        </section>

        {/* Badges */}
        <section className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Badges ({badges?.length ?? 0})</h2>
          <div className="flex flex-wrap gap-2">
            {(badges ?? []).map((b: any) => {
              const def = BADGE_DEFINITIONS[b.badge_type]
              return def ? (
                <span key={b.id} title={def.description} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-lg">
                  {def.icon} {def.label}
                </span>
              ) : null
            })}
            {(!badges || badges.length === 0) && <p className="text-sm text-muted-foreground">Aucun badge</p>}
          </div>
        </section>
      </div>

      {/* Submissions */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Soumissions ({stats.submissions.length})</h2>
        <div className="space-y-2">
          {stats.submissions.map((s) => <SubmissionRow key={s.id} s={s} />)}
          {stats.submissions.length === 0 && <p className="text-sm text-muted-foreground">Aucune soumission</p>}
        </div>
      </section>

      {/* Notifications */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Notifications récentes</h2>
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
          {(notifs ?? []).map((n: any) => (
            <div key={n.id} className="flex items-center gap-4 px-4 py-3">
              <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded-full">{n.type}</span>
              <span className="text-xs text-muted-foreground font-mono flex-1 truncate">{JSON.stringify(n.data)}</span>
              <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                {new Date(n.created_at).toLocaleDateString('fr')}
              </span>
            </div>
          ))}
          {(!notifs || notifs.length === 0) && (
            <p className="px-4 py-3 text-sm text-muted-foreground">Aucune notification</p>
          )}
        </div>
      </section>
    </div>
  )
}
