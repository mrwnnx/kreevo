import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ExternalLink, Clock, BarChart2 } from 'lucide-react'
import { SubmissionComments } from '@/components/features/challenge/SubmissionComments'
import { LikeButton } from '@/components/features/challenge/LikeButton'
import { ProfilePanel } from '@/components/features/challenge/ProfilePanel'
import { LEAGUE_COLORS } from '@/lib/utils/xp'
import type { League } from '@/lib/utils/xp'
import { cn } from '@/lib/utils'

interface Props { params: Promise<{ id: string }> }

const TRACK_STYLE: Record<string, string> = {
  ux_ui:   'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  graphic: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  motion:  'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
  '3d':    'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
}

export default async function SubmissionDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: submission }, { data: comments }, { data: liked }] = await Promise.all([
    (supabase as any)
      .from('submissions')
      .select('*, profiles:user_id(id, username, full_name, avatar_url, bio, league, xp, specialty, tools, links, country, city, plan), challenges:challenge_id(id, title, track, level, closes_at, reveal_at, status)')
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

  const isClosed = challenge?.closes_at ? new Date(challenge.closes_at) < new Date() : false
  const isRevealed = challenge?.reveal_at ? new Date(challenge.reveal_at) <= new Date() : isClosed
  const isBlurred = !isRevealed && !isOwn

  const league = (author?.league ?? 'rookie') as League
  const gradient = LEAGUE_COLORS[league] ?? LEAGUE_COLORS.rookie
  const figmaUrl = (submission.files as any)?.figma
  const trackStyle = TRACK_STYLE[challenge?.track] ?? 'bg-muted text-muted-foreground'
  const trackLabel = challenge?.track?.replace('_', '/').toUpperCase() ?? ''

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 pb-16">

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

          {/* Card image */}
          <div className="rounded-2xl border border-border overflow-hidden bg-card">
            {/* Header track */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              {trackLabel ? (
                <span className={cn('text-[11px] font-mono font-bold px-2.5 py-1 rounded-full uppercase tracking-widest', trackStyle)}>
                  {trackLabel}
                </span>
              ) : <span />}
            </div>

            {/* Image */}
            <div className="relative aspect-video bg-muted">
              {submission.cover_url ? (
                <img
                  src={submission.cover_url}
                  alt="Submission cover"
                  className={cn('w-full h-full object-cover', isBlurred && 'blur-2xl scale-110')}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                  Pas de preview
                </div>
              )}
              {isBlurred && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm font-semibold bg-background/70 backdrop-blur-sm px-4 py-2 rounded-full">
                    🔒 Caché jusqu'à la révélation
                  </p>
                </div>
              )}
            </div>

            {/* Footer : likes + commentaires */}
            <div className="flex items-center gap-4 px-4 py-3 border-t border-border">
              <LikeButton
                submissionId={id}
                initialLikes={submission.likes_count ?? 0}
                initialLiked={!!liked}
                currentUserId={user.id}
              />
              <span className="text-xs text-muted-foreground font-mono">
                💬 {submission.comments_count ?? 0} commentaire{(submission.comments_count ?? 0) !== 1 ? 's' : ''}
              </span>
            </div>
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

          {/* Card commentaires */}
          <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
            <p className="text-[11px] font-mono font-semibold text-muted-foreground uppercase tracking-widest">
              Commentaires ({comments?.length ?? 0})
            </p>
            <SubmissionComments
              submissionId={id}
              initialComments={comments ?? []}
              currentUserId={user.id}
            />
          </div>
        </div>

        {/* ── Colonne droite ── */}
        <ProfilePanel
          author={author}
          gradient={gradient}
          league={league}
          isOwn={isOwn}
          challenge={challenge}
        />
      </div>
    </div>
  )
}
