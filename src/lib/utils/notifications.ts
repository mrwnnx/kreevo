import { supabaseAdmin } from '@/lib/supabase/admin'

export type NotificationType =
  | 'submission_approved'
  | 'submission_rejected'
  | 'submission_received'
  | 'submission_on_hold'
  | 'submission_pending_review'
  | 'submission_reported'
  | 'submission_contested'
  | 'contest_approved'
  | 'contest_rejected'
  | 'report_dismissed'
  | 'report_confirmed'
  | 'referral_completed'
  | 'league_window_failed'
  | 'submission_liked'
  | 'submission_commented'
  | 'comment_replied'
  | 'submission_human_review_pending'
  | 'submission_human_review_requested'
  | 'submission_human_review_approved'
  | 'submission_human_review_rejected'
  | 'coworker_invitation_received'
  | 'coworker_invitation_accepted'
  | 'coworker_invitation_declined'
  | 'coworker_removed'
  | 'coworker_xp_awarded'

export async function notify(
  userId: string,
  type: NotificationType,
  data: Record<string, unknown> = {}
): Promise<void> {
  await (supabaseAdmin as any).from('notifications').insert({
    user_id: userId,
    type,
    data,
    is_read: false,
  })
}

export async function notifyAllAdmins(
  type: NotificationType,
  data: Record<string, unknown> = {}
): Promise<void> {
  const { data: admins } = await (supabaseAdmin as any)
    .from('profiles')
    .select('id')
    .eq('role', 'admin')

  const rows = ((admins ?? []) as { id: string }[]).map((a) => ({
    user_id: a.id,
    type,
    data,
    is_read: false,
  }))

  if (rows.length === 0) return
  await (supabaseAdmin as any).from('notifications').insert(rows)
}
