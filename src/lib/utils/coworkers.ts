import { supabaseAdmin } from '@/lib/supabase/admin'
import { notify } from './notifications'

export const MAX_COWORKERS_PER_SUBMISSION = 3
export const COWORKER_XP_SHARE = 0.5

export type CoworkerStatus = 'pending' | 'accepted' | 'declined'

export interface CoworkerRow {
  id: string
  submission_id: string
  user_id: string
  invited_by: string
  status: CoworkerStatus
  invited_at: string
  responded_at: string | null
  email_sent_at: string | null
  xp_awarded: number
}

export async function getBlockedUserIds(blockerId: string): Promise<Set<string>> {
  const { data } = await (supabaseAdmin as any)
    .from('user_blocks')
    .select('blocked_id')
    .eq('blocker_id', blockerId)
  return new Set(((data ?? []) as { blocked_id: string }[]).map((r) => r.blocked_id))
}

export async function getBlockedByUserIds(authorId: string): Promise<Set<string>> {
  const { data } = await (supabaseAdmin as any)
    .from('user_blocks')
    .select('blocker_id')
    .eq('blocked_id', authorId)
  return new Set(((data ?? []) as { blocker_id: string }[]).map((r) => r.blocker_id))
}

/**
 * Sync invited coworkers for a submission.
 * - Rows present in DB but missing from targetIds → deleted (only pending; accepted are kept).
 * - Rows missing in DB but present in targetIds → inserted as pending + notification.
 * - Skip target users who blocked the author.
 * - Enforce MAX_COWORKERS_PER_SUBMISSION on the total kept set.
 *
 * Returns the final accepted+pending coworker user IDs after sync.
 */
export async function syncCoworkerInvitations(
  submissionId: string,
  authorId: string,
  challengeId: string,
  submissionTitle: string | null,
  targetIds: string[],
): Promise<{ accepted: string[]; pending: string[]; skipped: string[] }> {
  const blockedBy = await getBlockedByUserIds(authorId)
  const dedupedTargets = Array.from(new Set(targetIds)).filter((id) => id && id !== authorId)

  // Coworkers must be in the same league as the author.
  const { data: authorProfile } = await (supabaseAdmin as any)
    .from('profiles')
    .select('league')
    .eq('id', authorId)
    .single()
  const authorLeague: string | null = authorProfile?.league ?? null

  let sameLeagueIds = new Set<string>(dedupedTargets)
  if (authorLeague && dedupedTargets.length > 0) {
    const { data: targetProfiles } = await (supabaseAdmin as any)
      .from('profiles')
      .select('id, league')
      .in('id', dedupedTargets)
    sameLeagueIds = new Set(
      ((targetProfiles ?? []) as Array<{ id: string; league: string | null }>)
        .filter((p) => p.league === authorLeague)
        .map((p) => p.id),
    )
  }

  const allowed: string[] = []
  const skipped: string[] = []
  for (const id of dedupedTargets) {
    if (blockedBy.has(id) || !sameLeagueIds.has(id)) skipped.push(id)
    else allowed.push(id)
  }
  const capped = allowed.slice(0, MAX_COWORKERS_PER_SUBMISSION)

  const { data: existing } = await (supabaseAdmin as any)
    .from('submission_coworkers')
    .select('id, user_id, status')
    .eq('submission_id', submissionId)
  const existingRows = (existing ?? []) as Array<{ id: string; user_id: string; status: CoworkerStatus }>

  const targetSet = new Set(capped)
  const toDelete = existingRows
    .filter((r) => r.status !== 'accepted' && !targetSet.has(r.user_id))
    .map((r) => r.id)
  if (toDelete.length) {
    await (supabaseAdmin as any)
      .from('submission_coworkers')
      .delete()
      .in('id', toDelete)
  }

  const existingUserIds = new Set(existingRows.map((r) => r.user_id))
  const toInsert = capped.filter((id) => !existingUserIds.has(id))
  if (toInsert.length) {
    const rows = toInsert.map((user_id) => ({
      submission_id: submissionId,
      user_id,
      invited_by: authorId,
      status: 'pending' as const,
    }))
    await (supabaseAdmin as any).from('submission_coworkers').insert(rows)
    for (const user_id of toInsert) {
      await notify(user_id, 'coworker_invitation_received', {
        submission_id: submissionId,
        challenge_id: challengeId,
        invited_by: authorId,
        title: submissionTitle ?? null,
      })
    }
  }

  const { data: after } = await (supabaseAdmin as any)
    .from('submission_coworkers')
    .select('user_id, status')
    .eq('submission_id', submissionId)
  const rows = (after ?? []) as Array<{ user_id: string; status: CoworkerStatus }>
  return {
    accepted: rows.filter((r) => r.status === 'accepted').map((r) => r.user_id),
    pending: rows.filter((r) => r.status === 'pending').map((r) => r.user_id),
    skipped,
  }
}

export async function getAcceptedCoworkers(submissionId: string) {
  const { data } = await (supabaseAdmin as any)
    .from('submission_coworkers')
    .select('user_id, profiles:user_id(id, username, full_name, avatar_url)')
    .eq('submission_id', submissionId)
    .eq('status', 'accepted')
  return ((data ?? []) as Array<{ user_id: string; profiles: any }>)
    .map((r) => r.profiles)
    .filter(Boolean)
}

/** Award a coworker their share of XP for an approved submission. Idempotent via xp_awarded. */
export async function awardCoworkerXp(
  coworkerRowId: string,
  coworkerUserId: string,
  submissionId: string,
  baseXp: number,
): Promise<number> {
  const shareXp = Math.round(baseXp * COWORKER_XP_SHARE)
  if (shareXp <= 0) return 0

  const { data: cur } = await (supabaseAdmin as any)
    .from('submission_coworkers')
    .select('xp_awarded, status')
    .eq('id', coworkerRowId)
    .single()
  if (!cur || cur.status !== 'accepted' || (cur.xp_awarded ?? 0) > 0) return 0

  const { data: prof } = await (supabaseAdmin as any)
    .from('profiles')
    .select('xp')
    .eq('id', coworkerUserId)
    .single()
  const newXP = (prof?.xp ?? 0) + shareXp
  await (supabaseAdmin as any).from('profiles').update({ xp: newXP }).eq('id', coworkerUserId)
  await (supabaseAdmin as any)
    .from('submission_coworkers')
    .update({ xp_awarded: shareXp })
    .eq('id', coworkerRowId)

  const { checkAndUpdateLeague } = await import('@/lib/utils/leagues')
  await checkAndUpdateLeague(coworkerUserId)

  await notify(coworkerUserId, 'coworker_xp_awarded', {
    submission_id: submissionId,
    xp: shareXp,
  })

  return shareXp
}

/** Revoke a coworker's XP share if the submission is later rejected/on_hold. */
export async function revokeCoworkerXp(coworkerRowId: string): Promise<void> {
  const { data: row } = await (supabaseAdmin as any)
    .from('submission_coworkers')
    .select('user_id, xp_awarded')
    .eq('id', coworkerRowId)
    .single()
  if (!row || (row.xp_awarded ?? 0) <= 0) return

  const { data: prof } = await (supabaseAdmin as any)
    .from('profiles')
    .select('xp')
    .eq('id', row.user_id)
    .single()
  const newXP = Math.max(0, (prof?.xp ?? 0) - (row.xp_awarded ?? 0))
  await (supabaseAdmin as any).from('profiles').update({ xp: newXP }).eq('id', row.user_id)
  await (supabaseAdmin as any)
    .from('submission_coworkers')
    .update({ xp_awarded: 0 })
    .eq('id', coworkerRowId)
}

/** Award XP to all accepted coworkers of an approved submission. */
export async function awardAllAcceptedCoworkers(
  submissionId: string,
  baseXp: number,
): Promise<{ totalShared: number; count: number }> {
  const { data } = await (supabaseAdmin as any)
    .from('submission_coworkers')
    .select('id, user_id, xp_awarded')
    .eq('submission_id', submissionId)
    .eq('status', 'accepted')
  const rows = (data ?? []) as Array<{ id: string; user_id: string; xp_awarded: number }>

  let total = 0
  for (const r of rows) {
    const awarded = await awardCoworkerXp(r.id, r.user_id, submissionId, baseXp)
    total += awarded
  }
  return { totalShared: total, count: rows.length }
}

/** Revoke XP from all coworkers on a submission (called when a submission flips out of approved). */
export async function revokeAllCoworkerXp(submissionId: string): Promise<void> {
  const { data } = await (supabaseAdmin as any)
    .from('submission_coworkers')
    .select('id, xp_awarded')
    .eq('submission_id', submissionId)
    .gt('xp_awarded', 0)
  for (const r of (data ?? []) as Array<{ id: string }>) {
    await revokeCoworkerXp(r.id)
  }
}
