'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Mark a single `league_up` notification as seen, so the celebration modal
 * fires exactly once per promotion (a refresh won't re-trigger it).
 *
 * Targeted on purpose: the existing `PATCH /api/notifications` marks ALL
 * notifications read (would clear the whole unread bell). Here we touch only the
 * one row. Owner-scoped via the `notifications_owner` RLS policy
 * (`user_id = auth.uid()`) + an explicit `.eq('user_id')` guard.
 */
export async function markPromotionSeen(notificationId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await (supabase as any)
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)
    .eq('type', 'league_up')
}
