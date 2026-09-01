import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { approveSubmission, rejectSubmission } from '@/lib/utils/submissions'
import { SUBMISSION_KIND_PORTFOLIO } from '@/lib/utils/submission-constants'

interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const action = body.action as 'approve' | 'reject' | undefined
  const feedback = (body.feedback as string | undefined) ?? ''

  // `approveSubmission`/`rejectSubmission` both bail out silently on a row
  // without a `challenge_id` — which every portfolio project is. Called on
  // one they wrote nothing and still returned, so this route answered
  // `{ok:true}` and the admin UI refreshed onto an unchanged row: a success
  // that corresponds to nothing. Refuse explicitly instead.
  // Read through supabaseAdmin: a portfolio project hidden by moderation has
  // `is_visible = false`, which the RLS policy hides from everyone but its
  // author — including an admin's session client.
  const { data: target } = await (supabaseAdmin as any)
    .from('submissions').select('kind').eq('id', id).maybeSingle()
  if (!target) return NextResponse.json({ error: 'Soumission introuvable' }, { status: 404 })
  if (target.kind === SUBMISSION_KIND_PORTFOLIO) {
    return NextResponse.json(
      { error: "Un projet perso n'entre pas dans le flux de validation. Utilise « Masquer » pour le retirer du public." },
      { status: 409 },
    )
  }

  if (action === 'approve') {
    await approveSubmission(id, user.id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'reject') {
    if (!feedback.trim()) {
      return NextResponse.json({ error: 'Feedback obligatoire pour un rejet' }, { status: 400 })
    }
    await rejectSubmission(id, feedback, user.id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
}
