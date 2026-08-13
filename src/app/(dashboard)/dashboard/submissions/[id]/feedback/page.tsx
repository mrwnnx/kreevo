import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { FeedbackPanel } from '@/components/features/submissions/FeedbackPanel'
import { getDict, getLang } from '@/lib/i18n/lang'

interface Props { params: Promise<{ id: string }> }

const PRO_PLANS = new Set(['pro', 'studio'])

export default async function FeedbackPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: submission }, { data: profile }] = await Promise.all([
    (supabase as any)
      .from('submissions')
      .select('id, user_id, title, cover_url, validation_status')
      .eq('id', id)
      .single(),
    (supabase as any)
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single(),
  ])

  if (!submission) notFound()
  if (submission.user_id !== user.id) redirect(`/dashboard/submissions/${id}`)
  // Feedback IA réservé aux soumissions validées par l'IA.
  if (submission.validation_status !== 'approved') redirect(`/dashboard/submissions/${id}`)

  // Feedback IA ouvert à tous : free → 'basic', pro/studio → 'detailed'.
  const isProUser = PRO_PLANS.has(String(profile?.plan ?? ''))

  // Pre-fetch any existing feedback (server-side, bypasses RLS via admin)
  const { data: row } = await (supabaseAdmin as any)
    .from('submission_feedbacks')
    .select('content, lang, tier')
    .eq('submission_id', id)
    .maybeSingle()
  const initialFeedback = row?.content ?? null
  const feedbackLang = row?.lang ?? null

  const dict = await getDict()
  const currentLang = await getLang()
  const t = dict.submissionDetail.feedbackPage

  return (
    <div className="mx-auto max-w-[860px] px-6 py-8 pb-16">
      <Link
        href={`/dashboard/submissions/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        {t.backToSubmission}
      </Link>

      <div className="flex items-start gap-3 mb-6">
        <div className="size-10 rounded-full bg-violet-100 dark:bg-violet-900/30 inline-flex items-center justify-center shrink-0">
          <Sparkles className="size-5 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.title}</h1>
          {submission.title && (
            <p className="text-sm text-muted-foreground mt-1">{submission.title}</p>
          )}
        </div>
      </div>

      <FeedbackPanel
        submissionId={id}
        initialFeedback={initialFeedback}
        feedbackLang={feedbackLang}
        currentLang={currentLang}
        isProUser={isProUser}
        t={t}
      />
    </div>
  )
}
