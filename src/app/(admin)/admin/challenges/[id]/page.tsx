import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ChallengeForm } from '@/components/admin/ChallengeForm'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface Props { params: Promise<{ id: string }> }

function fmt(d: string) { return d ? new Date(d).toISOString().slice(0, 16) : '' }

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 24) return `il y a ${h}h`
  return `il y a ${Math.floor(h / 24)}j`
}

export default async function EditChallenge({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data }, { data: participations }, stats] = await Promise.all([
    (supabase as any).from('challenges').select('*').eq('id', id).single(),
    (supabase as any)
      .from('participations')
      .select('*, profiles(username, avatar_url, league)')
      .eq('challenge_id', id)
      .order('joined_at', { ascending: false }),
    Promise.all([
      (supabase as any).from('participations').select('*', { count: 'exact', head: true }).eq('challenge_id', id),
      (supabase as any).from('participations').select('*', { count: 'exact', head: true }).eq('challenge_id', id).eq('status', 'submitted'),
      (supabase as any).from('participations').select('*', { count: 'exact', head: true }).eq('challenge_id', id).eq('status', 'expired'),
    ]).then(([total, submitted, expired]) => ({
      total: total.count ?? 0,
      submitted: submitted.count ?? 0,
      expired: expired.count ?? 0,
    })),
  ])

  if (!data) notFound()

  return (
    <div className="p-6 max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Éditer challenge</h1>
        <p className="text-sm text-muted-foreground">{data.title}</p>
      </div>

      {data.deadline_days && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 border border-border rounded-lg px-4 py-2.5">
          <span className="text-base">⏱</span>
          <span>Deadline : <strong className="text-foreground">{data.deadline_days} jours</strong> à partir du moment où le participant rejoint le challenge</span>
        </div>
      )}

      <ChallengeForm
        id={id}
        initial={{
          title: data.title ?? '',
          brief: data.brief ?? '',
          context: data.context ?? '',
          deliverable: data.deliverable ?? '',
          constraints: data.constraints ?? '',
          criteria: data.criteria ?? '',
          track: data.track ?? 'ux_ui',
          month: String(data.month ?? 1),
          year: String(data.year ?? new Date().getFullYear()),
          reveal_at: fmt(data.reveal_at),
          closes_at: fmt(data.closes_at),
          status: data.status ?? 'draft',
          league_id: data.league_id ?? '',
          xp_reward: String(data.xp_reward ?? 250),
          deadline_days: String(data.deadline_days ?? 7),
          is_published: data.is_published ?? false,
          specialty: data.specialty ?? '',
          challenge_type: data.challenge_type ?? '',
          industry: data.industry ?? '',
        }}
      />

      {/* Participants section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Participants</h2>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{stats.total} inscrits</span>
            <span className="text-green-600 font-medium">{stats.submitted} soumis</span>
            <span className="text-red-500">{stats.expired} expirés</span>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Participants</p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{stats.submitted}</p>
            <p className="text-xs text-green-600">Soumissions</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
            <p className="text-xs text-red-500">Expirés</p>
          </div>
        </div>

        {/* Participants list */}
        {participations && participations.length > 0 ? (
          <div className="rounded-xl border border-border overflow-hidden">
            {(participations as any[]).map(part => (
              <div key={part.id} className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0">
                <Avatar className="size-8">
                  <AvatarImage src={part.profiles?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                    {part.profiles?.username?.[0]?.toUpperCase() ?? '?'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/admin/users/${part.user_id}`}
                    className="text-sm font-medium hover:text-primary transition-colors"
                  >
                    @{part.profiles?.username ?? part.user_id.slice(0, 8)}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Inscrit {timeAgo(part.joined_at)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-mono">
                    Deadline: {new Date(part.personal_deadline).toLocaleDateString('fr', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <Badge
                  variant={
                    part.status === 'submitted' ? 'default' :
                    part.status === 'expired' ? 'destructive' :
                    'secondary'
                  }
                  className="text-xs capitalize"
                >
                  {part.status}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
            Aucun participant pour l&apos;instant.
          </div>
        )}
      </div>
    </div>
  )
}
