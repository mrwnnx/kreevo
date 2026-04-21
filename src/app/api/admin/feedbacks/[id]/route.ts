import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

interface Props { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Props) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()

  const update: Record<string, unknown> = {}
  if ('strengths' in body)      update.strengths = body.strengths
  if ('improvements' in body)   update.improvements = body.improvements
  if ('priority_action' in body) update.priority_action = body.priority_action
  if ('league_impact' in body)  update.league_impact = body.league_impact
  if ('score' in body)          update.score = body.score
  if ('status' in body) {
    update.status = body.status
    if (body.status === 'published') update.published_at = new Date().toISOString()
  }

  const { data: feedback, error: dbErr } = await (admin!.supabase as any)
    .from('feedbacks')
    .update(update)
    .eq('id', id)
    .select('submission_id')
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  // Notify user on publish
  if (body.status === 'published' && feedback?.submission_id) {
    const { data: sub } = await (admin!.supabase as any)
      .from('submissions')
      .select('user_id')
      .eq('id', feedback.submission_id)
      .single()

    if (sub?.user_id) {
      try {
        await (admin!.supabase as any).from('notifications').insert({
          user_id: sub.user_id,
          type: 'feedback_ready',
          data: { feedback_id: id },
        })
      } catch { /* ignore */ }
    }
  }

  return NextResponse.json({ ok: true })
}
