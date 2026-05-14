import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ProfilePanel } from '@/components/features/challenge/ProfilePanel'
import { SubmissionDetailContent } from '@/components/features/submissions/SubmissionDetailContent'
import { getDict, getLang } from '@/lib/i18n/lang'

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ from?: string }>
}

export default async function SubmissionDetailPage({ params, searchParams }: Props) {
  const { id } = await params
  const { from } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: submission }, { data: likeData }, { data: currentProfile }] = await Promise.all([
    (supabase as any)
      .from('submissions')
      .select('*, profiles:user_id(id, username, full_name, avatar_url, bio, league, xp, specialty, tools, links, country, city, plan), challenges:challenge_id(id, title, specialty, challenge_type, industry)')
      .eq('id', id)
      .single(),
    (supabase as any)
      .from('submission_claps')
      .select('id')
      .eq('submission_id', id)
      .eq('user_id', user.id)
      .maybeSingle(),
    (supabase as any)
      .from('profiles')
      .select('username, avatar_url, plan')
      .eq('id', user.id)
      .single(),
  ])

  if (!submission) notFound()

  const challenge = submission.challenges
  const author = submission.profiles
  const isOwn = submission.user_id === user.id
  const userLiked = !!likeData
  const filesObj = (submission.files as Record<string, unknown> | null) ?? {}
  const projectLink = typeof filesObj.link === 'string' ? filesObj.link : null

  // Increment view count (skip own submission)
  if (!isOwn) {
    await (supabase as any).rpc('increment_submission_views', { sub_id: id }).then(
      () => null,
      () => null,
    )
  }
  const viewsCount = (submission.views_count ?? 0) + (isOwn ? 0 : 1)

  const dict = await getDict()
  const lang = await getLang()
  const t = dict.submissionDetail
  const dateLocale = lang === 'en' ? 'en-US' : 'fr-FR'

  return (
    <div className="max-w-[960px] mx-auto px-6 py-8 pb-16">

      {/* Back — context-aware: if user came from /history, return there; else default to challenge page */}
      <Link
        href={
          from === 'history'
            ? '/dashboard/history'
            : challenge?.id
              ? `/dashboard/challenges/${challenge.id}`
              : '/dashboard/challenges'
        }
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="size-4" />
        {from === 'history' ? t.backToHistory : (challenge?.title ?? t.backFallback)}
      </Link>

      <SubmissionDetailContent
        submission={submission}
        author={author ? { id: author.id, username: author.username, full_name: author.full_name ?? null, avatar_url: author.avatar_url } : null}
        currentUserId={user.id}
        currentProfilePlan={currentProfile?.plan ?? null}
        initialUserLiked={userLiked}
        isOwn={isOwn}
        t={t}
        dateLocale={dateLocale}
        sidebar={
          <ProfilePanel
            author={author}
            isOwn={isOwn}
            challenge={challenge}
            projectLink={projectLink}
            viewsCount={viewsCount}
            t={{
              you: t.you,
              challengeLabel: t.challengeLabel,
              seeChallenge: t.seeChallenge,
              linksLabel: t.linksLabel,
              seeProject: t.seeProject,
            }}
          />
        }
      />
    </div>
  )
}
