'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Owner-only toggle of a submission's public-portfolio visibility (`is_visible`).
 *
 * Security model (defense in depth):
 *  - `auth.getUser()` → 401-equivalent if no session.
 *  - User-scoped client: the RLS policy `submissions_owner_update`
 *    (USING `user_id = auth.uid()`) already restricts the writable row set to
 *    the caller's own submissions. The explicit `.eq('user_id', user.id)` is a
 *    redundant application-layer guard that keeps the intent visible and stays
 *    safe even if RLS is ever relaxed.
 *  - `validation_status = 'approved'` + `is_draft = false` in the filter: a
 *    non-approved or draft row simply matches nothing, so a non-approved
 *    submission can never be flipped public. `.select()` returning empty ⇒ the
 *    update touched no row, which we surface as an error.
 *
 * Note: this does NOT affect the public challenge gallery (`/challenges/[id]`),
 * which filters only on `validation_status='approved'` + `is_draft=false`.
 */
export async function setSubmissionVisibility(
  submissionId: string,
  isVisible: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'unauthorized' }

  const { data, error } = await supabase
    .from('submissions')
    .update({ is_visible: isVisible })
    .eq('id', submissionId)
    .eq('user_id', user.id)
    .eq('validation_status', 'approved')
    .eq('is_draft', false)
    .select('id')
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  if (!data) return { ok: false, error: 'not_found_or_not_approved' }

  revalidatePath('/dashboard/history')
  revalidatePath('/u/[username]', 'page')

  return { ok: true }
}
