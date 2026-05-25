import { ImageResponse } from 'next/og'

export const alt = 'Kreevo — Design challenges, AI feedback, league progression'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// ── Layout tokens — tweak here to adjust the card ──────────────────
const LANDING = {
  bg: '#0A0A0B',
  fg: '#FFFFFF',
  muted: '#A1A1AA',
  // Primary violet — matches the rest of the product brand.
  accent: '#8b5cf6',
  wordmarkFontSize: 200,
  taglineFontSize: 44,
  taglineMaxWidth: 940,
  badgeFontSize: 22,
  padding: 80,
} as const

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: LANDING.bg,
          // Soft violet glow centered slightly above middle.
          backgroundImage: `radial-gradient(circle at 50% 38%, ${LANDING.accent}26 0%, transparent 55%)`,
          color: LANDING.fg,
          fontFamily: 'sans-serif',
          padding: LANDING.padding,
          gap: 28,
        }}
      >
        {/* Top badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '8px 18px',
            border: `1px solid ${LANDING.accent}55`,
            borderRadius: 999,
            background: `${LANDING.accent}14`,
            color: LANDING.accent,
            fontSize: LANDING.badgeFontSize,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}
        >
          DESIGN CHALLENGES · LEAGUES
        </div>

        {/* Wordmark */}
        <div
          style={{
            display: 'flex',
            fontSize: LANDING.wordmarkFontSize,
            fontWeight: 800,
            letterSpacing: '-0.05em',
            lineHeight: 1,
          }}
        >
          kreevo
        </div>

        {/* Tagline */}
        <div
          style={{
            display: 'flex',
            fontSize: LANDING.taglineFontSize,
            fontWeight: 500,
            color: LANDING.muted,
            lineHeight: 1.25,
            textAlign: 'center',
            maxWidth: LANDING.taglineMaxWidth,
          }}
        >
          Weekly design challenges. AI feedback. League progression from Stone to Legend.
        </div>
      </div>
    ),
    { ...size },
  )
}
