import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { leagueLabel } from '@/lib/utils/xp'
import { BADGE_DEFINITIONS } from '@/lib/utils/badges'

interface Props { params: Promise<{ id: string }> }

export default async function UserDetail({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: user }, { data: subs }, { data: badges }, { data: notifs }] = await Promise.all([
    (supabase as any).from('profiles').select('*').eq('id', id).single(),
    (supabase as any).from('submissions').select('*, challenges(title)').eq('user_id', id).order('created_at', { ascending: false }),
    (supabase as any).from('badges').select('*').eq('user_id', id).order('created_at', { ascending: false }),
    (supabase as any).from('notifications').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(20),
  ])

  if (!user) notFound()

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
            {user.is_suspended && <span className="text-xs font-mono bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">Suspendu</span>}
            {user.role === 'admin' && <span className="text-xs font-mono bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Admin</span>}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Info */}
        <section className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Informations</h2>
          {[
            ['Spécialité', user.specialty],
            ['Pays', user.city ? `${user.city}, ${user.country}` : user.country],
            ['Objectif', user.objective],
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
        <h2 className="text-base font-semibold">Soumissions ({subs?.length ?? 0})</h2>
        <div className="space-y-2">
          {(subs ?? []).map((s: any) => (
            <div key={s.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
              {s.cover_url && (
                <img src={s.cover_url} alt="" className="size-14 rounded-lg object-cover shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.challenges?.title ?? 'Challenge'}</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {new Date(s.created_at).toLocaleDateString('fr')} · {s.likes_count} likes · {s.comments_count} commentaires
                </p>
              </div>
              <span className="text-xs font-mono text-primary">{s.xp_earned > 0 ? `+${s.xp_earned} XP` : ''}</span>
            </div>
          ))}
          {(!subs || subs.length === 0) && <p className="text-sm text-muted-foreground">Aucune soumission</p>}
        </div>
      </section>

      {/* Notifications */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Notifications récentes</h2>
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
          {(notifs ?? []).map((n: any) => (
            <div key={n.id} className="flex items-center gap-4 px-4 py-3">
              <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded-full">{n.type}</span>
              <span className="text-xs text-muted-foreground font-mono flex-1">{JSON.stringify(n.data)}</span>
              <span className="text-[11px] font-mono text-muted-foreground">
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
