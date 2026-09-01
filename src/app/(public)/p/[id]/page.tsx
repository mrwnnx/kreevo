import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Heart, MessageCircle, Eye, ExternalLink } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { GlassShell, GLASS_SURFACE, GLASS_GRADIENT } from '@/components/layout/GlassShell'
import { GlassHeader } from '@/components/layout/GlassHeader'
import { PoweredByFooter } from '@/components/layout/PoweredByFooter'
import { ImageLightbox } from '@/components/features/challenge/ImageLightbox'
import { ValidatedBadge } from '@/components/features/portfolio/ValidatedBadge'
import { getDict } from '@/lib/i18n/lang'
import { SUBMISSION_KIND_CHALLENGE, SUBMISSION_KIND_PORTFOLIO } from '@/lib/utils/submission-constants'

// ── Public-read columns ──────────────────────────────────────────
// Explicit select, never `*` (security-audit rule). Author + origin
// challenge are pulled via FK embeds so a single query covers the page.
const PUBLIC_SUBMISSION_COLUMNS = [
  'id', 'user_id', 'kind', 'title', 'description', 'cover_url', 'files',
  'total_likes', 'comments_count', 'views_count', 'validation_status',
  'challenge_id', 'created_at',
  'profiles:user_id(id, username, full_name, avatar_url)',
  'challenges:challenge_id(title, specialty)',
].join(', ')

interface AuthorRow {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
}

interface ChallengeRow {
  title: string | null
  specialty: string | null
}

interface SubmissionRow {
  id: string
  user_id: string | null
  kind: string
  title: string | null
  description: string | null
  cover_url: string
  files: Record<string, unknown> | null
  total_likes: number | null
  comments_count: number | null
  views_count: number | null
  validation_status: string | null
  challenge_id: string | null
  created_at: string | null
  profiles: AuthorRow | null
  challenges: ChallengeRow | null
}

/**
 * The only public-read gate for a submission: not a draft, not hidden by
 * its author, and — unless it's a personal project — approved. A rejected
 * or pending challenge submission, or a draft of either kind, never
 * matches. Shared by the page and its `opengraph-image` route so both
 * enforce the exact same rule.
 */
async function getPublicSubmission(id: string): Promise<SubmissionRow | null> {
  const { data } = await (supabaseAdmin as any)
    .from('submissions')
    .select(PUBLIC_SUBMISSION_COLUMNS)
    .eq('id', id)
    .eq('is_draft', false)
    .eq('is_visible', true)
    .or(`kind.eq.${SUBMISSION_KIND_PORTFOLIO},validation_status.eq.approved`)
    .maybeSingle()
  return (data as SubmissionRow | null) ?? null
}

// ── Metadata ───────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const dict = await getDict()
  const submission = await getPublicSubmission(id)

  if (!submission) {
    return { title: dict.publicProject.notFoundTitle }
  }

  const authorName = submission.profiles?.full_name ?? submission.profiles?.username ?? ''
  const title = `${submission.title ?? 'Untitled'}${authorName ? ` by ${authorName}` : ''} | Kreevo`
  const rawDescription = submission.description ?? ''
  const description = rawDescription.length > 160 ? `${rawDescription.slice(0, 157)}…` : rawDescription

  return {
    title,
    description: description || undefined,
    alternates: {
      canonical: `/p/${id}`,
    },
    // `images` intentionally omitted — Next resolves the colocated
    // opengraph-image.tsx automatically (see that file for the Next 16
    // hashed-route quirk this sidesteps).
    openGraph: {
      title: submission.title ?? 'Kreevo',
      description: description || undefined,
      url: `/p/${id}`,
      siteName: 'Kreevo',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: submission.title ?? 'Kreevo',
      description: description || undefined,
    },
  }
}

// ── Page ───────────────────────────────────────────────────────
export default async function PublicProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [submission, { data: { user: viewer } }] = await Promise.all([
    getPublicSubmission(id),
    supabase.auth.getUser(),
  ])

  if (!submission) notFound()

  const isOwn = !!viewer && viewer.id === submission.user_id
  const isChallenge = submission.kind === SUBMISSION_KIND_CHALLENGE

  // View count — skip the owner looking at their own page.
  if (!isOwn) {
    await (supabaseAdmin as any).rpc('increment_submission_views', { sub_id: id }).then(
      () => null,
      () => null,
    )
  }
  const viewsCount = (submission.views_count ?? 0) + (isOwn ? 0 : 1)

  const dict = await getDict()
  const t = dict.publicProject
  const author = submission.profiles
  const challenge = isChallenge ? submission.challenges : null

  const files = submission.files ?? {}
  const projectLink = typeof files.link === 'string' ? files.link : null
  // Additional photos: { url, caption }[]. Backward-compat: legacy string[] → { url, caption: '' }.
  const additionalImages = (Array.isArray(files.images) ? files.images : [])
    .map((img: any) =>
      typeof img === 'string'
        ? { url: img, caption: '' }
        : { url: String(img?.url ?? ''), caption: String(img?.caption ?? '') },
    )
    .filter((p: { url: string }) => p.url) as { url: string; caption: string }[]
  const galleryImages = [submission.cover_url, ...additionalImages.map((p) => p.url)].filter(
    (u): u is string => !!u,
  )

  return (
    <GlassShell>
      <GlassHeader />

      <main className="mx-auto w-full max-w-[760px] flex-1 px-6 pb-20 pt-8 lg:pt-12 space-y-6">
        {/* ── Header: title, badge, challenge origin, author ── */}
        <header className="space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h1 className="text-[28px] md:text-[34px] font-semibold leading-[1.15] text-[#2b2c36]">
              {submission.title ?? t.noPreview}
            </h1>
            {isChallenge && <ValidatedBadge label={t.validatedBadge} />}
          </div>

          {isChallenge && challenge?.title && (
            <p className="text-sm text-[#71717a]">
              {t.fromChallenge}
              {' '}
              <span className="font-medium text-[#484848]">
                {challenge.title}
                {challenge.specialty ? ` · ${challenge.specialty}` : ''}
              </span>
            </p>
          )}

          {author && (
            <Link
              href={`/u/${author.username}`}
              className="inline-flex items-center gap-2.5 hover:opacity-80 transition-opacity"
            >
              <Avatar className="size-9">
                <AvatarImage src={author.avatar_url ?? undefined} />
                <AvatarFallback className="text-xs font-bold">
                  {(author.full_name ?? author.username)[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-semibold text-[#2b2c36]">
                {author.full_name ?? author.username}
              </span>
            </Link>
          )}

          {/* Counters — read-only on this public page */}
          <div className="flex items-center gap-4 text-sm text-[#71717a]">
            <span className="inline-flex items-center gap-1.5">
              <Heart className="size-4" /> {submission.total_likes ?? 0}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageCircle className="size-4" /> {submission.comments_count ?? 0}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="size-4" /> {viewsCount}
            </span>
          </div>
        </header>

        {/* ── Cover ── */}
        <div className={`${GLASS_SURFACE} overflow-hidden rounded-[24px]`} style={GLASS_GRADIENT}>
          <div className="relative aspect-video bg-muted">
            <ImageLightbox
              src={submission.cover_url}
              alt={t.coverAlt}
              openLabel={t.lightbox.open}
              closeLabel={t.lightbox.close}
              prevLabel={t.lightbox.prev}
              nextLabel={t.lightbox.next}
              images={galleryImages}
              index={0}
            />
          </div>
        </div>

        {/* ── Description + project link ── */}
        {(submission.description || projectLink) && (
          <div className="space-y-3">
            {submission.description && (
              <p className="text-base text-[#2b2c36] leading-relaxed whitespace-pre-wrap">
                {submission.description}
              </p>
            )}
            {projectLink && (
              <a
                href={projectLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium border border-[#dcdce8] px-3 py-1.5 rounded-full hover:bg-white/60 transition-colors"
              >
                <ExternalLink className="size-3" /> {t.seeProject}
              </a>
            )}
          </div>
        )}

        {/* ── Additional photos — full-width stacked, each in its own lightbox ── */}
        {additionalImages.length > 0 && (
          <div className="space-y-8">
            {additionalImages.map((photo, i) => (
              <div key={i} className={`${GLASS_SURFACE} overflow-hidden rounded-[24px]`} style={GLASS_GRADIENT}>
                <div className="relative aspect-video bg-muted">
                  <ImageLightbox
                    src={photo.url}
                    alt={photo.caption || `${t.additionalAlt.replace('{n}', String(i + 1))}`}
                    openLabel={t.lightbox.open}
                    closeLabel={t.lightbox.close}
                    prevLabel={t.lightbox.prev}
                    nextLabel={t.lightbox.next}
                    images={galleryImages}
                    index={1 + i}
                  />
                </div>
                {photo.caption && (
                  <p className="px-4 py-3 text-sm text-[#484848] leading-relaxed">{photo.caption}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {!viewer && <PoweredByFooter label={t.poweredBy} />}
    </GlassShell>
  )
}
