import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { approveSubmission, rejectSubmission } from '@/lib/utils/submissions'
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
  const action = body.action as 'validate' | 'reject' | undefined
  const feedback = (body.feedback as string | undefined)?.trim() ?? ''

  const { data: submission } = await (supabaseAdmin as any)
    .from('submissions')
    .select('id, user_id, validation_status')
    .eq('id', id)
    .single()
  if (!submission) return NextResponse.json({ error: 'Soumission introuvable' }, { status: 404 })

  if (action === 'validate') {
    await approveSubmission(id, user.id)
    await notify(submission.user_id, 'report_dismissed', { submission_id: id })
    return NextResponse.json({ ok: true })
  }

  if (action === 'reject') {
    if (!feedback) {
      return NextResponse.json({ error: 'Feedback obligatoire' }, { status: 400 })
    }
    await rejectSubmission(id, feedback, user.id)
    await notify(submission.user_id, 'report_confirmed', {
      submission_id: id,
      feedback,
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
}
