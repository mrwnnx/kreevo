/**
 * Reparticipation cooldown after a missed deadline.
 *
 * When a user joins a challenge but never submits before personal_deadline,
 * the cron flips their participation to status='expired'. The challenge is
 * then closed for THAT user for {@link REPARTICIPATE_COOLDOWN_HOURS} hours.
 * After the cooldown elapses, the existing participation row is reset
 * (status='active', fresh joined_at + personal_deadline) — see the
 * POST /api/participations handler.
 */

export const REPARTICIPATE_COOLDOWN_HOURS = 24
const COOLDOWN_MS = REPARTICIPATE_COOLDOWN_HOURS * 60 * 60 * 1000

/**
 * Returns the ISO timestamp at which an expired participation becomes
 * eligible for reparticipation: `personal_deadline + 24h`.
 */
export function cooldownEnd(personalDeadlineIso: string): Date {
  return new Date(new Date(personalDeadlineIso).getTime() + COOLDOWN_MS)
}

/**
 * True when the user is currently within the post-deadline cooldown window
 * and must wait before they can reparticipate.
 */
export function isInCooldown(personalDeadlineIso: string, now: Date = new Date()): boolean {
  return now.getTime() < cooldownEnd(personalDeadlineIso).getTime()
}

/**
 * Remaining cooldown duration in milliseconds. Clamped to 0.
 */
export function cooldownRemainingMs(personalDeadlineIso: string, now: Date = new Date()): number {
  return Math.max(0, cooldownEnd(personalDeadlineIso).getTime() - now.getTime())
}
