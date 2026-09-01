import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { SUBMISSION_KIND_PORTFOLIO } from '@/lib/utils/submission-constants'

export async function GET(request: Request) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? 'comments'

  let data: unknown[] = []

  if (type === 'comments') {
    const { data: items } = await (admin!.supabase as any)
      .from('comments')
      .select('*, profiles(username, avatar_url), submissions(challenge_id, challenges(title))')
      .eq('is_reported', true)
      .order('created_at', { ascending: false })
    data = items ?? []
  } else if (type === 'human_review') {
    const { data: items } = await (admin!.supabase as any)
      .from('submissions')
      .select('id, title, description, cover_url, ai_analysis, ai_rejection_count, created_at, challenge_id, profiles:user_id(username, avatar_url), challenges(title, brief)')
      .eq('validation_status', 'pending_human_review')
      .order('created_at', { ascending: false })
    data = items ?? []
  } else {
    // Two different "reported and hidden" shapes, by kind: a challenge
    // submission is put on_hold; a portfolio project is hidden via
    // is_visible=false (see report/route.ts). `reported_at` distinguishes a
    // report-driven hide from the author's own "hide from profile" toggle.
    const { data: items } = await (admin!.supabase as any)
      .from('submissions')
      .select('id, kind, title, cover_url, description, reports_count, created_at, profiles(username, avatar_url), challenges(title)')
      .or(`validation_status.eq.on_hold,and(kind.eq.${SUBMISSION_KIND_PORTFOLIO},is_visible.eq.false,reported_at.not.is.null)`)
      .order('created_at', { ascending: false })
    data = items ?? []
  }

  return NextResponse.json({ items: data })
}
