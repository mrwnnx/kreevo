import { ImageResponse } from 'next/og'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const alt = 'Kreevo designer profile'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// ── Layout tokens — tweak here to adjust the card ──────────────────
const LAYOUT = {
  bg: '#0A0A0B',
  fg: '#FFFFFF',
  muted: '#9CA3AF',
  padding: 80,
  accentBarWidth: 14,
  avatarSize: 220,
  avatarBorderWidth: 4,
  nameFontSize: 76,
  nameMaxChars: 32,
  jobFontSize: 36,
  jobMaxChars: 44,
  leagueFontSize: 28,
  wordmarkFontSize: 36,
  footerUrlFontSize: 22,
} as const

// ── League color mapping (raw hex — Satori cannot resolve Tailwind classes)
//    Hex values mirror the tailwind-500 shades used by `LEAGUE_STYLES.accent`
//    in src/lib/utils/league-style.ts so the OG card stays visually
//    consistent with the rest of the product.
type LeagueMeta = { color: string; label: string; emoji: string }
const LEAGUE_HEX: Record<string, LeagueMeta> = {
  Stone:    { color: '#f59e0b', label: 'Stone',    emoji: '🪨' },
  '7ajra':  { color: '#f59e0b', label: 'Stone',    emoji: '🪨' },
  Bronze:   { color: '#f97316', label: 'Bronze',   emoji: '🟤' },
  Silver:   { color: '#94a3b8', label: 'Silver',   emoji: '⚪' },
  Gold:     { color: '#eab308', label: 'Gold',     emoji: '🟡' },
  Platinum: { color: '#0ea5e9', label: 'Platinum', emoji: '🔵' },
  Diamond:  { color: '#06b6d4', label: 'Diamond',  emoji: '💎' },
  Master:   { color: '#8b5cf6', label: 'Master',   emoji: '👑' },
  Legend:   { color: '#f43f5e', label: 'Legend',   emoji: '🔴' },
}
const DEFAULT_LEAGUE: LeagueMeta = LEAGUE_HEX.Stone

type ProfileRow = {
  full_name: string | null
  username: string
  avatar_url: string | null
  job_title: string | null
  league: string | null
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, Math.max(0, max - 1)).trimEnd() + '…'
}

function initialsFor(profile: ProfileRow | null, fallback: string): string {
  const source = profile?.full_name ?? profile?.username ?? fallback
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2)
  const out = parts.map((p) => p[0]?.toUpperCase() ?? '').join('')
  return out || '?'
}

export default async function Image({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params

  const { data } = await (supabaseAdmin as any)
    .from('profiles')
    .select('full_name, username, avatar_url, job_title, league')
    .eq('username', username)
    .maybeSingle()

  const profile = (data ?? null) as ProfileRow | null

  const displayName = truncate(
    profile?.full_name ?? profile?.username ?? username ?? 'Designer',
    LAYOUT.nameMaxChars,
  )
  const jobTitle =
    profile?.job_title && profile.job_title.trim().length > 0
      ? truncate(profile.job_title.trim(), LAYOUT.jobMaxChars)
      : null
  const league = LEAGUE_HEX[profile?.league ?? 'Stone'] ?? DEFAULT_LEAGUE
  const accent = league.color
  const initials = initialsFor(profile, username)
  const handle = profile?.username ?? username

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: LAYOUT.bg,
          color: LAYOUT.fg,
          fontFamily: 'sans-serif',
        }}
      >
        {/* Left accent bar — league color */}
        <div
          style={{
            display: 'flex',
            width: LAYOUT.accentBarWidth,
            height: '100%',
            background: accent,
          }}
        />

        {/* Main padded area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: LAYOUT.padding,
            justifyContent: 'space-between',
          }}
        >
          {/* Top row — avatar + name block */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 56,
            }}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                width={LAYOUT.avatarSize}
                height={LAYOUT.avatarSize}
                style={{
                  width: LAYOUT.avatarSize,
                  height: LAYOUT.avatarSize,
                  borderRadius: LAYOUT.avatarSize,
                  objectFit: 'cover',
                  border: `${LAYOUT.avatarBorderWidth}px solid ${accent}`,
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
                  background: accent,
                  color: LAYOUT.bg,
                  fontSize: 96,
                  fontWeight: 800,
                }}
              >
                {initials}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontSize: LAYOUT.nameFontSize,
                  fontWeight: 800,
                  lineHeight: 1.05,
                  letterSpacing: '-0.02em',
                }}
              >
                {displayName}
              </div>

              {jobTitle && (
                <div
                  style={{
                    display: 'flex',
                    fontSize: LAYOUT.jobFontSize,
                    fontWeight: 500,
                    color: LAYOUT.muted,
                    lineHeight: 1.2,
                  }}
                >
                  {jobTitle}
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  marginTop: 8,
                }}
              >
                <span style={{ fontSize: LAYOUT.leagueFontSize }}>{league.emoji}</span>
                <span
                  style={{
                    fontSize: LAYOUT.leagueFontSize,
                    fontWeight: 700,
                    color: accent,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {league.label} League
                </span>
              </div>
            </div>
          </div>

          {/* Bottom row — wordmark + canonical URL */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
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
            <span
              style={{
                fontSize: LAYOUT.footerUrlFontSize,
                fontFamily: 'monospace',
                color: LAYOUT.muted,
              }}
            >
              kreevo.online/u/{handle}
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
