'use server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Props {
  searchParams: Promise<{ tab?: string }>
}

export default async function AdminSubmissionsPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { tab = 'pending' } = await searchParams

  let query = (supabaseAdmin as any)
    .from('submissions')
    .select('id, title, cover_url, validation_status, reports_count, created_at, validated_at, rejection_reason, profiles(username, avatar_url), challenges(title, leagues(name))')
    .eq('is_draft', false)
    .order('created_at', { ascending: false })
    .limit(100)

  if (tab === 'pending') query = query.eq('validation_status', 'pending')
  else if (tab === 'reported') query = query.eq('validation_status', 'on_hold')
  else if (tab === 'rejected') query = query.eq('validation_status', 'rejected')

  const { data: submissions } = await query

  // Counts for tabs
  const { count: pendingCount } = await (supabaseAdmin as any)
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('is_draft', false)
    .eq('validation_status', 'pending')

  const { count: reportedCount } = await (supabaseAdmin as any)
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('is_draft', false)
    .eq('validation_status', 'on_hold')

  const { count: contestsCount } = await (supabaseAdmin as any)
    .from('submission_contests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const TABS: Array<{ id: string; label: string; count?: number | null }> = [
    { id: 'all',       label: 'Toutes' },
    { id: 'pending',   label: 'En attente',  count: pendingCount },
    { id: 'reported',  label: 'Signalées',   count: reportedCount },
    { id: 'rejected',  label: 'Rejetées' },
    { id: 'contested', label: 'Contestées',  count: contestsCount },
  ]

  // Fetch contests if tab=contested
  const contests = tab === 'contested'
    ? (await (supabaseAdmin as any)
        .from('submission_contests')
        .select('id, message, status, created_at, submissions(id, title, cover_url, validation_status, profiles(username, avatar_url), challenges(title))')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })).data ?? []
    : []

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Soumissions</h1>
        <p className="text-sm text-muted-foreground mt-1">Validation, modération et contestations.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin/submissions?tab=${t.id}`}
            className={cn(
              '-mb-px px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              tab === t.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {t.label}
            {t.count !== undefined && t.count !== null && t.count > 0 && (
              <span className="ml-2 text-[10px] font-mono bg-destructive text-destructive-foreground rounded-full px-1.5 py-0.5">
                {t.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      {tab === 'contested' ? (
        <div className="space-y-3">
          {contests.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
              Aucune contestation en attente.
            </div>
          ) : (
            contests.map((cnt: any) => (
              <Link
                key={cnt.id}
                href={`/admin/submissions/${cnt.submissions.id}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/40 transition-colors"
              >
                {cnt.submissions.cover_url && (
                  <img src={cnt.submissions.cover_url} alt="" className="size-14 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{cnt.submissions.title ?? cnt.submissions.challenges?.title}</p>
                  <p className="text-xs text-muted-foreground truncate">@{cnt.submissions.profiles?.username} · {cnt.message.slice(0, 80)}</p>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  contesté
                </span>
              </Link>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {((submissions ?? []) as any[]).length === 0 ? (
            <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
              Aucune soumission dans cette catégorie.
            </div>
          ) : (
            ((submissions ?? []) as any[]).map((s) => (
              <Link
                key={s.id}
                href={`/admin/submissions/${s.id}`}
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted/40 transition-colors"
              >
                {s.cover_url && (
                  <img src={s.cover_url} alt="" className="size-14 rounded-lg object-cover shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{s.title ?? s.challenges?.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    @{s.profiles?.username} · {s.challenges?.leagues?.name ?? '—'} · {new Date(s.created_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <StatusBadge status={s.validation_status} reportsCount={s.reports_count} />
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status, reportsCount }: { status: string; reportsCount?: number }) {
  const config: Record<string, { label: string; cls: string }> = {
    pending:   { label: 'en attente',   cls: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' },
    approved:  { label: 'validée',      cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    rejected:  { label: 'rejetée',      cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    on_hold:   { label: `signalée${reportsCount ? ` ×${reportsCount}` : ''}`, cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  }
  const c = config[status] ?? config.pending
  return (
    <span className={cn('text-[11px] font-mono px-2 py-0.5 rounded-full whitespace-nowrap', c.cls)}>
      {c.label}
    </span>
  )
}
