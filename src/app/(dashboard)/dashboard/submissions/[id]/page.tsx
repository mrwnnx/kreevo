import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { LikeButton } from '@/components/features/challenge/LikeButton'
import { ProfilePanel } from '@/components/features/challenge/ProfilePanel'
import { ReportButton } from '@/components/features/challenge/ReportButton'
import { ImageLightbox } from '@/components/features/challenge/ImageLightbox'
import { CommentSection } from '@/components/features/submissions/CommentSection'

interface Props { params: Promise<{ id: string }> }

export default async function SubmissionDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: submission }, { data: liked }, { data: currentProfile }, { data: ratings }] = await Promise.all([
    (supabase as any)
      .from('submissions')
      .select('*, profiles:user_id(id, username, full_name, avatar_url, bio, league, xp, specialty, tools, links, country, city, plan), challenges:challenge_id(id, title, specialty, challenge_type, industry)')
      .eq('id', id)
      .single(),
    (supabase as any)
      .from('likes')
      .select('id')
      .eq('submission_id', id)
      .eq('user_id', user.id)
      .single(),
    (supabase as any)
      .from('profiles')
      .select('username, avatar_url, plan')
      .eq('id', user.id)
      .single(),
    (supabase as any)
      .from('comments')
      .select('rating')
      .eq('submission_id', id)
      .eq('is_reported', false)
      .not('rating', 'is', null),
  ])

  if (!submission) notFound()

  const challenge = submission.challenges
  const author = submission.profiles
  const isOwn = submission.user_id === user.id


  const figmaUrl = (submission.files as any)?.figma
  const fireSum = ((ratings ?? []) as { rating: number | null }[])
    .reduce((s, r) => s + (r.rating ?? 0), 0)

  return (
    <div className="max-w-[960px] mx-auto px-6 py-8 pb-16">

      {/* Back */}
      <Link
        href={challenge?.id ? `/dashboard/challenges/${challenge.id}` : '/dashboard/challenges'}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="size-4" />
        {challenge?.title ?? 'Retour'}
      </Link>

      {/* 2-col layout */}
      <div className="flex flex-col md:flex-row gap-4 items-start">

        {/* ── Colonne gauche ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Card image — seule */}
          <div className="rounded-2xl border border-border overflow-hidden bg-card">
            <div className="relative aspect-video bg-muted">
              {submission.cover_url ? (
                <ImageLightbox src={submission.cover_url} alt="Submission cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                  Pas de preview
                </div>
              )}
            </div>
          </div>

          {/* Card actions : likes + commentaires + signaler */}
          <div className="rounded-2xl border border-border bg-card flex items-center gap-4 px-4 py-3">
            <LikeButton
              submissionId={id}
              initialLikes={submission.likes_count ?? 0}
              initialLiked={!!liked}
              currentUserId={user.id}
              displayCount={fireSum}
            />
            <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-1.5 rounded-full text-muted-foreground">
              💬 {submission.comments_count ?? 0}
            </span>
            {!isOwn && submission.created_at && (
              <div className="ml-auto">
                <ReportButton submissionId={id} submissionCreatedAt={submission.created_at} />
              </div>
            )}
          </div>

          {/* Card description */}
          {(submission.description || figmaUrl) && (
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <p className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-widest">Description</p>
              {submission.description && (
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {submission.description}
                </p>
              )}
              {figmaUrl && (
                <a
                  href={figmaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium border border-border px-3 py-1.5 rounded-full hover:bg-muted transition-colors"
                >
                  <ExternalLink className="size-3" />
                  Voir sur Figma →
                </a>
              )}
            </div>
          )}

          {/* Reviews & commentaires */}
          {submission.validation_status === 'approved' && (
            <>
              <hr className="border-border" />
              <CommentSection
                submissionId={id}
                currentUserId={user.id}
                userPlan={currentProfile?.plan ?? null}
                userAvatar={currentProfile?.avatar_url ?? null}
                username={currentProfile?.username}
                submissionOwnerId={submission.user_id}
                isVisible={true}
              />
            </>
          )}
        </div>

        {/* ── Colonne droite ── */}
        <ProfilePanel
          author={author}
          isOwn={isOwn}
          challenge={challenge}
        />
      </div>
    </div>
  )
}
