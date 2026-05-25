/**
 * Username — single source of truth for format rules.
 *
 * A valid username:
 *  - 3 to 30 characters
 *  - lowercase letters a-z, digits 0-9, hyphens `-`, underscores `_`
 *  - starts and ends with an alphanumeric character
 *
 * Spaces, uppercase letters, accented characters, and any other punctuation
 * are rejected. The normalizer transforms a free-form string into a valid
 * username when possible.
 */

export const USERNAME_MIN_LENGTH = 3
export const USERNAME_MAX_LENGTH = 30

/**
 * Strict format validator. Matches a username that is already canonical.
 * Used as the gatekeeper on every server write path.
 */
export const USERNAME_REGEX = /^[a-z0-9][a-z0-9_-]{1,28}[a-z0-9]$/

export function isValidUsername(value: string): boolean {
  return USERNAME_REGEX.test(value)
}

/**
 * Turn an arbitrary string into a valid username.
 *
 *   "Dougari Yassine"       → "dougari-yassine"
 *   "  Élise.Martin!! "     → "elise-martin"
 *   "__alex__"              → "alex"
 *   "a"                     → ""        (too short → caller decides)
 *
 * The result is guaranteed to either be empty or satisfy `USERNAME_REGEX`.
 * Callers that need a non-empty result must validate the output themselves.
 */
export function normalizeUsername(raw: string): string {
  let s = raw
    .normalize('NFD')                       // separate accents from letters
    .replace(/[̀-ͯ]/g, '')        // strip combining marks (accents)
    .toLowerCase()
    .replace(/\s+/g, '-')                   // spaces → hyphens
    .replace(/[^a-z0-9_-]/g, '')            // drop disallowed chars
    .replace(/[-_]{2,}/g, (m) => m[0])      // collapse repeats while keeping the original symbol
    .replace(/^[-_]+|[-_]+$/g, '')          // trim leading/trailing separators

  if (s.length > USERNAME_MAX_LENGTH) {
    s = s.slice(0, USERNAME_MAX_LENGTH).replace(/[-_]+$/g, '')
  }

  if (s.length < USERNAME_MIN_LENGTH) return ''
  return s
}
