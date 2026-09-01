import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { approveSubmission, rejectSubmission } from '@/lib/utils/submissions'
import { notify } from '@/lib/utils/notifications'
import { SUBMISSION_KIND_PORTFOLIO } from '@/lib/utils/submission-constants'

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
    .select('id, user_id, validation_status, kind')
    .eq('id', id)
    .single()
  if (!submission) return NextResponse.json({ error: 'Soumission introuvable' }, { status: 404 })

  // Both branches below call approveSubmission/rejectSubmission, which return
  // without writing anything when the row has no challenge_id — the case for
  // every portfolio project. Answering {ok:true} there would report a
  // resolution that never happened. A portfolio report is resolved through
  // /api/admin/moderation/[id] instead (restore = 'ignore', hide = 'hide').
  if (submission.kind === SUBMISSION_KIND_PORTFOLIO) {
    return NextResponse.json(
      { error: "Un projet perso ne se résout pas ici. Utilise « Masquer » ou « Restaurer »." },
      { status: 409 },
    )
  }

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
