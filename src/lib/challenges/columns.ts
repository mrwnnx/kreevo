/**
 * Write-side helper: turn the admin form payload ({ texts, source_lang,
 * translation_status }) into the challenge DB columns.
 *
 * - Fills the 18 per-language columns (<field>_<lang>), null when empty.
 * - Mirrors the source language into the legacy columns (title/brief are
 *   NOT NULL) so untranslated readers + the read fallback keep working.
 */

export const CHALLENGE_LANGS = ['fr', 'en', 'ar'] as const
export type ChallengeLang = (typeof CHALLENGE_LANGS)[number]

export const CHALLENGE_TEXT_FIELDS = [
  'title', 'brief', 'context', 'deliverable', 'constraints', 'criteria',
] as const
export type ChallengeTextField = (typeof CHALLENGE_TEXT_FIELDS)[number]

const nz = (v: unknown): string | null =>
  typeof v === 'string' && v.trim() ? v : null

/** Returns the i18n + legacy-mirror columns to insert/update. */
export function buildI18nColumns(body: any): Record<string, unknown> {
  const texts: Partial<Record<ChallengeLang, Partial<Record<ChallengeTextField, string>>>> =
    body?.texts ?? {}
  const src: ChallengeLang = (CHALLENGE_LANGS as readonly string[]).includes(body?.source_lang)
    ? body.source_lang
    : 'fr'
  const srcFields = texts[src] ?? {}

  const cols: Record<string, unknown> = {}

  // Per-language columns (null when empty).
  for (const lang of CHALLENGE_LANGS) {
    const f = texts[lang] ?? {}
    for (const field of CHALLENGE_TEXT_FIELDS) {
      cols[`${field}_${lang}`] = nz(f[field])
    }
  }

  // Legacy mirror = source language. title/brief are NOT NULL → empty string fallback.
  for (const field of CHALLENGE_TEXT_FIELDS) {
    const v = srcFields[field]
    if (field === 'title' || field === 'brief') cols[field] = typeof v === 'string' ? v : ''
    else cols[field] = nz(v)
  }

  cols.source_lang = src
  cols.translation_status = body?.translation_status ?? { fr: 'draft', en: 'draft', ar: 'draft' }

  return cols
}
