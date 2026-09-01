import { ImageResponse } from 'next/og'
import sharp from 'sharp'
import { createClient } from '@/lib/supabase/server'
import { SUBMISSION_KIND_CHALLENGE, SUBMISSION_KIND_PORTFOLIO } from '@/lib/utils/submission-constants'

export const alt = 'Kreevo project'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// ── Layout tokens ────────────────────────────────────────────────
const LAYOUT = {
  bg: '#0A0A0B',
  fg: '#FFFFFF',
  muted: '#D4D4D8',
  badge: '#10B981', // emerald-500 — mirrors ValidatedBadge's palette
  padding: 64,
  titleFontSize: 56,
  titleMaxChars: 60,
  authorFontSize: 28,
  wordmarkFontSize: 32,
  avatarSize: 56,
} as const

type SubmissionRow = {
  title: string | null
  cover_url: string
  kind: string
  profiles: { username: string; full_name: string | null; avatar_url: string | null } | null
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, Math.max(0, max - 1)).trimEnd() + '…'
}

/**
 * Fetches the cover and re-encodes it to a PNG data URI. `ImageResponse`
 * (satori/resvg) can't decode WebP — and `ImageUpload`'s client-side
 * compression writes WebP for every submission cover whose browser
 * supports it, which is effectively all of them. Without this, the OG
 * card silently renders with no photo (confirmed against real covers in
 * this repo's data). `sharp` ships with Next's image pipeline already.
 */
async function coverToPngDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    const png = await sharp(buf).resize(size.width, size.height, { fit: 'cover' }).png().toBuffer()
    return `data:image/png;base64,${png.toString('base64')}`
  } catch {
    return null
  }
}

/**
 * Same public-read gate as `page.tsx`'s `getPublicSubmission` — this route
 * is fetched independently of the page (it's a separate Next handler), so
 * without this filter a draft or rejected submission's cover + title would
 * leak through the OG image even though the page itself 404s.
 *
 * Reads through the session client (anon-key, RLS-scoped), same as
 * `page.tsx` — the `.eq`/`.or` chain below is defense in depth on top of
 * the `submissions_visible` RLS policy, not the only gate.
 */
async function getPublicSubmission(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
): Promise<SubmissionRow | null> {
  const { data } = await (supabase as any)
    .from('submissions')
    .select('title, cover_url, kind, profiles:user_id(username, full_name, avatar_url)')
    .eq('id', id)
    .eq('is_draft', false)
    .eq('is_visible', true)
    .or(`kind.eq.${SUBMISSION_KIND_PORTFOLIO},validation_status.eq.approved`)
    .maybeSingle()
  return (data as SubmissionRow | null) ?? null
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const submission = await getPublicSubmission(supabase, id)

  const title = truncate(submission?.title ?? 'Kreevo project', LAYOUT.titleMaxChars)
  const author = submission?.profiles ?? null
  const authorName = author?.full_name ?? author?.username ?? null
  const isChallenge = submission?.kind === SUBMISSION_KIND_CHALLENGE
  const coverDataUri = submission?.cover_url ? await coverToPngDataUri(submission.cover_url) : null

  return new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          background: LAYOUT.bg,
          fontFamily: 'sans-serif',
        }}
      >
        {/* Cover photo — full-bleed background */}
        {coverDataUri && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverDataUri}
            width={size.width}
            height={size.height}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}

        {/* Bottom gradient for text legibility over the photo */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            background: 'linear-gradient(180deg, rgba(10,10,11,0) 28%, rgba(10,10,11,0.94) 100%)',
          }}
        />

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            height: '100%',
            padding: LAYOUT.padding,
          }}
        >
          {/* Top row — wordmark + validated badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: LAYOUT.wordmarkFontSize,
                fontWeight: 800,
                color: LAYOUT.fg,
                letterSpacing: '-0.03em',
              }}
            >
              kreevo
            </span>
            {isChallenge && (
              // Plain text, no glyph — satori has no local checkmark glyph and
              // silently fails fetching one dynamically (confirmed in dev).
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: 22,
                  fontWeight: 700,
                  color: LAYOUT.bg,
                  background: LAYOUT.badge,
                  padding: '8px 20px',
                  borderRadius: 999,
                }}
              >
                Validated
              </span>
            )}
          </div>

          {/* Bottom block — title + author */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div
              style={{
                display: 'flex',
                fontSize: LAYOUT.titleFontSize,
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: '-0.02em',
                color: LAYOUT.fg,
              }}
            >
              {title}
            </div>
            {authorName && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {author?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={author.avatar_url}
                    width={LAYOUT.avatarSize}
                    height={LAYOUT.avatarSize}
                    style={{
                      width: LAYOUT.avatarSize,
                      height: LAYOUT.avatarSize,
                      borderRadius: LAYOUT.avatarSize,
                      objectFit: 'cover',
                      border: `3px solid ${LAYOUT.fg}`,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: LAYOUT.avatarSize,
                      height: LAYOUT.avatarSize,
                      borderRadius: LAYOUT.avatarSize,
                      background: LAYOUT.badge,
                      color: LAYOUT.bg,
                      fontSize: 24,
                      fontWeight: 800,
                    }}
                  >
                    {authorName[0]?.toUpperCase()}
                  </div>
                )}
                <span style={{ fontSize: LAYOUT.authorFontSize, fontWeight: 600, color: LAYOUT.muted }}>
                  {authorName}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
