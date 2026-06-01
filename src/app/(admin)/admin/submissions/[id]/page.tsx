'use server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { AdminSubmissionActions } from '@/components/admin/AdminSubmissionActions'
import { getLang } from '@/lib/i18n/lang'
import { getTaxonomyMaps, localizeType, localizeIndustry } from '@/lib/challenges/refs'

interface Props { params: Promise<{ id: string }> }

export default async function AdminSubmissionDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/dashboard')

  const { data: submission } = await (supabaseAdmin as any)
    .from('submissions')
    .select('*, profiles:user_id(id, username, avatar_url, full_name, league, plan), challenges(id, title, brief, specialty, challenge_type_id, industry_id, xp_reward, leagues(name))')
    .eq('id', id)
    .single()

  if (!submission) notFound()

  const { data: reports } = await (supabaseAdmin as any)
    .from('submission_reports')
    .select('id, reason, created_at, profiles(username)')
    .eq('submission_id', id)
    .order('created_at', { ascending: false })

  const { data: contest } = await (supabaseAdmin as any)
    .from('submission_contests')
    .select('id, message, status, admin_response, created_at, resolved_at')
    .eq('submission_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const s = submission as any
  const challenge = s.challenges
  const lang = await getLang()
  const taxoMaps = await getTaxonomyMaps()
  const challengeTypeLabel = localizeType(challenge ?? {}, lang, taxoMaps)
  const challengeIndustryLabel = localizeIndustry(challenge ?? {}, lang, taxoMaps)
  const userProfile = s.profiles

  return (
    <div className="p-6 max-w-[1100px] mx-auto space-y-6">
      <Link href="/admin/submissions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-3.5" /> Soumissions
      </Link>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        {/* Main */}
        <div className="space-y-6 min-w-0">
          {s.cover_url && (
            <div className="rounded-2xl overflow-hidden border border-border bg-muted">
              <img src={s.cover_url} alt={s.title ?? 'Soumission'} className="w-full h-auto object-contain" />
            </div>
          )}

          {(s.files?.images ?? []).length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {(s.files.images as any[]).map((img, i) => {
                const url = typeof img === 'string' ? img : img?.url
                const caption = typeof img === 'string' ? '' : (img?.caption ?? '')
                if (!url) return null
                return (
                  <div key={i} className="space-y-1">
                    <img src={url} alt="" className="aspect-square rounded-xl object-cover border border-border w-full" />
                    {caption && <p className="text-[11px] text-muted-foreground leading-snug">{caption}</p>}
                  </div>
                )
              })}
            </div>
          )}

          {s.title && (
            <div>
              <h1 className="text-2xl font-bold">{s.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{challenge?.title}</p>
            </div>
          )}

          {s.description && (
            <section className="space-y-2">
              <h2 className="text-base font-semibold">Description</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{s.description}</p>
            </section>
          )}

          {s.files?.link && (
            <a href={s.files.link} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
              {s.files.link}
            </a>
          )}

          {/* Brief */}
          <section className="rounded-2xl bg-zinc-50 dark:bg-zinc-900/30 p-5 space-y-2">
            <p className="text-xs font-mono uppercase text-muted-foreground">Brief du challenge</p>
            <p className="text-sm whitespace-pre-line">{challenge?.brief ?? '—'}</p>
            <div className="flex flex-wrap gap-2 pt-2">
              {challenge?.specialty && <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{challenge.specialty}</span>}
              {challengeTypeLabel && <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{challengeTypeLabel}</span>}
              {challengeIndustryLabel && <span className="text-xs px-2 py-0.5 rounded-full bg-muted">{challengeIndustryLabel}</span>}
              {challenge?.leagues?.name && <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">{challenge.leagues.name}</span>}
            </div>
          </section>

          {/* Contestation */}
          {contest && (
            <section className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 p-5 space-y-2">
              <p className="text-xs font-mono uppercase text-amber-700 dark:text-amber-400">⚖️ Contestation</p>
              <p className="text-sm">{contest.message}</p>
              <p className="text-xs text-muted-foreground">
                Soumise le {new Date(contest.created_at).toLocaleString('fr-FR')} · Statut : <strong>{contest.status}</strong>
              </p>
              {contest.admin_response && (
                <p className="text-xs mt-2 pt-2 border-t border-amber-200 dark:border-amber-900/40">
                  <strong>Réponse admin :</strong> {contest.admin_response}
                </p>
              )}
              {contest.status === 'pending' && (
                <ContestActions contestId={contest.id} />
              )}
            </section>
          )}

          {/* Reports */}
          {(reports ?? []).length > 0 && (
            <section className="space-y-2">
              <h2 className="text-base font-semibold">🚩 Signalements ({reports.length})</h2>
              <ul className="divide-y border border-border rounded-xl overflow-hidden">
                {(reports as any[]).map((r) => (
                  <li key={r.id} className="px-4 py-3 text-sm">
                    <p>{r.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      @{r.profiles?.username} · {new Date(r.created_at).toLocaleString('fr-FR')}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Actions */}
          <AdminSubmissionActions
            submissionId={s.id}
            status={s.validation_status}
            hasReports={(reports ?? []).length > 0}
            pendingContestId={contest?.status === 'pending' ? contest.id : null}
          />
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-border p-4 space-y-3">
            <p className="text-xs font-mono uppercase text-muted-foreground">User</p>
            <div className="flex items-center gap-3">
              {userProfile?.avatar_url && (
                <img src={userProfile.avatar_url} alt={userProfile.username} className="size-12 rounded-full object-cover" />
              )}
              <div>
                <p className="text-sm font-semibold">{userProfile?.full_name ?? userProfile?.username}</p>
                <p className="text-xs text-muted-foreground">@{userProfile?.username}</p>
                <p className="text-[11px] text-muted-foreground mt-1">{userProfile?.league} · {userProfile?.plan}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border p-4 space-y-2">
            <p className="text-xs font-mono uppercase text-muted-foreground">Statut</p>
            <p className="text-sm font-semibold">{s.validation_status}</p>
            {s.rejection_reason && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{s.rejection_reason}</p>
            )}
            {s.validated_at && (
              <p className="text-xs text-muted-foreground">Validée le {new Date(s.validated_at).toLocaleString('fr-FR')}</p>
            )}
            <div className="pt-2 space-y-1.5 text-xs text-muted-foreground">
              <p>Soumise : {new Date(s.created_at).toLocaleString('fr-FR')}</p>
              <p>XP attribués : {s.xp_attributed ? 'oui' : 'non'}</p>
              <p>Tentative : #{s.attempt_number}</p>
              <p>Signalements : {s.reports_count ?? 0}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function ContestActions({ contestId }: { contestId: string }) {
  return (
    <div className="pt-3 mt-2 border-t border-amber-200 dark:border-amber-900/40">
      <p className="text-xs text-muted-foreground mb-2">
        Pour résoudre cette contestation, descends à la section actions et utilise « Approuver contestation » ou « Rejeter contestation ».
      </p>
      <input type="hidden" data-contest-id={contestId} />
    </div>
  )
}
