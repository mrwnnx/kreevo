import { supabaseAdmin } from '@/lib/supabase/admin'
import type { AiMentor } from './types'
import { selectMentors } from './selection'

const FIVE_MIN = 5 * 60 * 1000
const TWENTY_HOURS = 20 * 60 * 60 * 1000 // keep under 24h so the daily cron picks them up promptly

/** After a submission is approved, schedule 2–4 mentor assignments (Pro/Studio only). */
export async function scheduleMentorAssignments(submissionId: string): Promise<void> {
  const sb = supabaseAdmin as any

  const { data: sub } = await sb
    .from('submissions')
    .select('id, user_id, challenge_id, profiles:user_id(plan), challenges:challenge_id(specialty)')
    .eq('id', submissionId)
    .single()
  if (!sub) return

  const plan = sub.profiles?.plan
  if (plan !== 'pro' && plan !== 'studio') return // Free → no mentors

  const specialty = sub.challenges?.specialty ?? null

  const { data: mentors } = await sb.from('ai_mentors').select('*').eq('is_active', true)
  const selected = selectMentors((mentors ?? []) as AiMentor[], specialty)
  if (selected.length === 0) return

  const now = Date.now()
  const rows = selected.map((m) => ({
    submission_id: submissionId,
    mentor_id: m.id,
    scheduled_at: new Date(now + FIVE_MIN + Math.random() * (TWENTY_HOURS - FIVE_MIN)).toISOString(),
    status: 'pending',
  }))
  // UNIQUE(submission_id, mentor_id) guards against double-scheduling on re-approval.
  await sb
    .from('ai_mentor_assignments')
    .upsert(rows, { onConflict: 'submission_id,mentor_id', ignoreDuplicates: true })
}
