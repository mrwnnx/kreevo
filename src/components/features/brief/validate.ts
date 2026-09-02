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
