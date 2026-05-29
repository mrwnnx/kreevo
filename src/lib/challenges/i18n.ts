/**
 * Read-side helper: resolve a challenge's 6 text fields for a given UI locale.
 *
 * Fallback chain per field:
 *   1. localized column  (<field>_<lang>) — only if its status is 'validated' and non-empty
 *   2. source-language column (<field>_<source_lang>) — the canonical, always validated
 *   3. legacy column (<field>) — pre-migration / safety net
 *   4. '' (empty)
 *
 * Returns the row with the 6 text fields overwritten by the resolved values,
 * so existing reads (`c.title`, `c.brief`, …) keep working unchanged.
 * Resilient before the i18n migration is applied (localized columns absent → legacy).
 */

export type ChallengeLang = 'fr' | 'en' | 'ar'

const TEXT_FIELDS = ['title', 'brief', 'context', 'deliverable', 'constraints', 'criteria'] as const

type TStatus = 'draft' | 'ai_generated' | 'validated'

const nonEmpty = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0

export function localizeChallenge<T extends Record<string, any>>(row: T, lang: ChallengeLang): T {
  if (!row) return row

  const source = (row.source_lang ?? 'fr') as ChallengeLang
  const statusMap = (row.translation_status ?? {}) as Partial<Record<ChallengeLang, TStatus>>

  const resolved: Record<string, string> = {}
  for (const field of TEXT_FIELDS) {
    const localized = row[`${field}_${lang}`]
    const sourceVal = row[`${field}_${source}`]
    const legacy = row[field]

    if (statusMap[lang] === 'validated' && nonEmpty(localized)) {
      resolved[field] = localized
    } else if (nonEmpty(sourceVal)) {
      resolved[field] = sourceVal
    } else if (nonEmpty(legacy)) {
      resolved[field] = legacy
    } else {
      resolved[field] = ''
    }
  }

  return { ...row, ...resolved }
}

/** Convenience for lists. */
export function localizeChallenges<T extends Record<string, any>>(rows: T[], lang: ChallengeLang): T[] {
  return (rows ?? []).map((r) => localizeChallenge(r, lang))
}
