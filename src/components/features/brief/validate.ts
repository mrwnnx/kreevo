/**
 * Règles de validation de `saveBrief`, extraites en fonctions pures (aucun
 * import Supabase/Next) pour être exercées directement par un script de
 * vérification sans avoir à rejouer une requête serveur complète.
 *
 * Deux règles distinctes, à ne pas confondre :
 * - `maxResponses` fourni mais < 1 est **toujours** refusé (brouillon compris)
 *   — ce n'est pas une exigence de contenu, c'est une valeur absurde quel que
 *   soit le moment. Le formulaire ne peut pas la produire (`min={1}` sur
 *   l'input), seul un appel direct à l'action le peut.
 * - `deadlineAt` déjà passée n'est refusée **qu'à la publication** — un
 *   brouillon reste libre de porter une date qu'on corrigera avant de publier.
 */

export type BriefValidationError =
  | 'invalid_max_responses'
  | 'cannot_publish'
  | 'incomplete_for_publish'
  | 'deadline_in_past'

export type BriefValidationResult = { ok: true } | { ok: false; error: BriefValidationError }

export function parseMaxResponses(raw: string | null): number | null {
  return raw !== null ? Math.trunc(Number(raw)) : null
}

/**
 * Une échéance saisie « 2 septembre » s'entend comme « jusqu'à la fin du 2
 * septembre », pas son tout début. Un `<input type="date">` rend une chaîne
 * `YYYY-MM-DD`, que `new Date(...)` interprète comme minuit UTC pile — donc
 * déjà passée dès que l'heure serveur dépasse minuit ce jour-là, ce qui
 * refuserait "aujourd'hui" à tous les coups (et parfois "demain" selon le
 * fuseau). Convertit vers la fin de la journée calendaire UTC de la date
 * reçue (23:59:59.999 UTC), en ISO. C'est cette valeur, fin de journée, qui
 * est à la fois comparée à l'instant présent ET stockée en base — pour que
 * la lecture de `deadline_at` par un autre lot (ex. lot 07, "fermé" quand la
 * date est dépassée) retombe sur la même interprétation que la publication.
 */
export function endOfDayUTC(dateStr: string): string {
  const d = new Date(dateStr)
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999)).toISOString()
}

export interface ValidateBriefFieldsInput {
  action: 'draft' | 'publish'
  title: string | null
  brief: string | null
  deliverable: string | null
  /** ISO string or null. */
  deadlineAt: string | null
  /** Raw trimmed form value, or null if the field was empty. */
  maxResponsesRaw: string | null
  canPublish: boolean
  /** Injectable clock for tests — defaults to `Date.now()`. */
  now?: number
}

export function validateBriefFields(input: ValidateBriefFieldsInput): BriefValidationResult {
  const { action, title, brief, deliverable, deadlineAt, maxResponsesRaw, canPublish, now = Date.now() } = input

  if (maxResponsesRaw !== null) {
    const parsed = Number(maxResponsesRaw)
    if (!Number.isFinite(parsed) || parsed < 1) return { ok: false, error: 'invalid_max_responses' }
  }

  if (action === 'publish') {
    if (!canPublish) return { ok: false, error: 'cannot_publish' }
    if (!title || !brief || !deliverable) return { ok: false, error: 'incomplete_for_publish' }
    if (deadlineAt && new Date(deadlineAt).getTime() < now) return { ok: false, error: 'deadline_in_past' }
  }

  return { ok: true }
}

export interface BriefClosedInput {
  /** ISO string, end-of-day UTC (see `endOfDayUTC`) — or null for no deadline. */
  deadlineAt: string | null
  maxResponses: number | null
  /**
   * Responses aren't built yet (spec 2) — every caller today passes 0. Kept as
   * a parameter (not hardcoded) so this function doesn't need to change the
   * day a response counter exists.
   */
  responseCount: number
}

/**
 * A brief is CLOSED (not hidden) once its deadline has passed or its response
 * cap is reached — lot 07, "fermé, pas caché". Same end-of-day-UTC reading of
 * `deadline_at` as `validateBriefFields`/publish, so a brief published today
 * with a deadline of today shows OPEN, not closed a few hours later.
 */
export function isBriefClosed(input: BriefClosedInput, now = Date.now()): boolean {
  const { deadlineAt, maxResponses, responseCount } = input
  if (deadlineAt && new Date(deadlineAt).getTime() < now) return true
  if (maxResponses != null && responseCount >= maxResponses) return true
  return false
}
