import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { approveSubmission } from '@/lib/utils/submissions'
import { notify } from '@/lib/utils/notifications'

interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const action = body.action as 'approve' | 'reject' | undefined
  const response = (body.response as string | undefined)?.trim() ?? ''

  const { data: contest } = await (supabaseAdmin as any)
    .from('submission_contests')
    .select('id, submission_id, user_id, status')
    .eq('id', id)
    .single()
  if (!contest) return NextResponse.json({ error: 'Contestation introuvable' }, { status: 404 })
  if (contest.status !== 'pending') {
    return NextResponse.json({ error: 'Contestation déjà résolue' }, { status: 400 })
  }

  if (action === 'approve') {
    await (supabaseAdmin as any)
      .from('submission_contests')
      .update({
        status: 'approved',
        admin_response: response || null,
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
      })
      .eq('id', id)

    const { xpAwarded } = await approveSubmission(contest.submission_id, user.id)
    await notify(contest.user_id, 'contest_approved', {
      contest_id: id,
      submission_id: contest.submission_id,
      xp: xpAwarded,
    })
    return NextResponse.json({ ok: true })
  }

  if (action === 'reject') {
    if (!response) {
      return NextResponse.json({ error: 'Réponse admin obligatoire' }, { status: 400 })
    }
    await (supabaseAdmin as any)
      .from('submission_contests')
      .update({
        status: 'rejected',
        admin_response: response,
        resolved_at: new Date().toISOString(),
        resolved_by: user.id,
      })
      .eq('id', id)

    await notify(contest.user_id, 'contest_rejected', {
      contest_id: id,
      submission_id: contest.submission_id,
      response,
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
}
