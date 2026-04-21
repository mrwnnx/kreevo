import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Heart, MapPin, Zap, ExternalLink } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { SubmissionComments } from '@/components/features/challenge/SubmissionComments'
import { LikeButton } from '@/components/features/challenge/LikeButton'
import { ProfilePanel } from '@/components/features/challenge/ProfilePanel'
import { LEAGUE_COLORS } from '@/lib/utils/xp'
import type { League } from '@/lib/utils/xp'
import { cn } from '@/lib/utils'

interface Props { params: Promise<{ id: string }> }

export default async function SubmissionDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: submission }, { data: comments }, { data: liked }] = await Promise.all([
    (supabase as any)
      .from('submissions')
      .select('*, profiles:user_id(id, username, full_name, avatar_url, bio, league, xp, specialty, tools, links, country, city, plan), challenges:challenge_id(id, title, track, closes_at, reveal_at, status)')
      .eq('id', id)
      .single(),
    (supabase as any)
      .from('comments')
      .select('*, profiles:user_id(username, avatar_url)')
      .eq('submission_id', id)
      .order('created_at', { ascending: true }),
    (supabase as any)
      .from('likes')
      .select('id')
      .eq('submission_id', id)
      .eq('user_id', user.id)
      .single(),
  ])

  if (!submission) notFound()

  const challenge = submission.challenges
  const author = submission.profiles
  const isOwn = submission.user_id === user.id

  // Blur check
  const isClosed = challenge?.closes_at ? new Date(challenge.closes_at) < new Date() : false
  const isRevealed = challenge?.reveal_at ? new Date(challenge.reveal_at) <= new Date() : isClosed
  const isBlurred = !isRevealed && !isOwn

  const league = (author?.league ?? 'rookie') as League
  const gradient = LEAGUE_COLORS[league] ?? LEAGUE_COLORS.rookie

  const figmaUrl = (submission.files as any)?.figma

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 pb-10">

      {/* Back */}
      <Link
        href={challenge?.id ? `/dashboard/challenges/${challenge.id}` : '/dashboard/challenges'}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="size-4" />
        {challenge?.title ?? 'Back to challenge'}
      </Link>

      {/* Track badge */}
      {challenge?.track && (
        <p className="text-xs font-medium text-violet-600 uppercase tracking-widest mb-2">{challenge.track}</p>
      )}

      {/* Main layout: content + right panel */}
      <div className="flex gap-4 items-start">

        {/* ── Left: project + comments ── */}
        <div className="flex-1 min-w-0 space-y-6">

          {/* Cover image */}
          <div className="relative rounded-2xl overflow-hidden border border-border bg-muted aspect-video">
            {submission.cover_url ? (
              <img
                src={submission.cover_url}
                alt="Submission cover"
                className={cn(
                  'w-full h-full object-cover',
                  isBlurred && 'blur-2xl scale-110'
                )}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                No preview
              </div>
            )}
            {isBlurred && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <p className="text-sm font-semibold text-foreground/70 bg-background/60 px-4 py-2 rounded-full backdrop-blur-sm">
                  🔒 Hidden until reveal
                </p>
              </div>
            )}
          </div>

          {/* Meta: likes + figma */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <LikeButton
                submissionId={id}
                initialLikes={submission.likes_count ?? 0}
                initialLiked={!!liked}
                currentUserId={user.id}
              />
              <span className="text-xs text-muted-foreground font-mono">
                {submission.comments_count ?? 0} commentaire{(submission.comments_count ?? 0) !== 1 ? 's' : ''}
              </span>
            </div>
            {figmaUrl && (
              <a
                href={figmaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
              >
                <ExternalLink className="size-3" /> Voir sur Figma
              </a>
            )}
          </div>

          {/* Description */}
          {submission.description && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-foreground">Description</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {submission.description}
              </p>
            </div>
          )}

          {/* Comments */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h2 className="text-sm font-semibold">
              Commentaires <span className="text-muted-foreground font-normal">({comments?.length ?? 0})</span>
            </h2>
            <SubmissionComments
              submissionId={id}
              initialComments={comments ?? []}
              currentUserId={user.id}
            />
          </div>
        </div>

        {/* ── Right: author profile panel ── */}
        <ProfilePanel author={author} gradient={gradient} league={league} isOwn={isOwn} />
      </div>
    </div>
  )
}
