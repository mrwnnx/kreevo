import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notifyAllAdmins } from '@/lib/utils/notifications'

interface Params { params: Promise<{ id: string }> }

const CONTEST_WINDOW_HOURS = 24

export async function POST(req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const message = (body.message as string | undefined)?.trim()
  if (!message) return NextResponse.json({ error: 'Message requis' }, { status: 400 })

  const { data: submission } = await (supabase as any)
    .from('submissions')
    .select('id, user_id, validation_status, validated_at, challenge_id')
    .eq('id', id)
    .single()
  if (!submission) return NextResponse.json({ error: 'Soumission introuvable' }, { status: 404 })
  if (submission.user_id !== user.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  if (submission.validation_status !== 'rejected') {
    return NextResponse.json({ error: 'Tu peux contester uniquement une soumission rejetée' }, { status: 400 })
  }

  // 24h window after rejection
  if (submission.validated_at) {
    const hoursDiff = (Date.now() - new Date(submission.validated_at).getTime()) / 1000 / 3600
    if (hoursDiff > CONTEST_WINDOW_HOURS) {
      return NextResponse.json({ error: 'Fenêtre de contestation expirée (24h)' }, { status: 403 })
    }
  }

  // 1 contest max per submission
  const { data: existing } = await (supabaseAdmin as any)
    .from('submission_contests')
    .select('id')
    .eq('submission_id', id)
    .single()
  if (existing) {
    return NextResponse.json({ error: 'Tu as déjà contesté cette décision' }, { status: 409 })
  }

  const { data: created, error } = await (supabaseAdmin as any)
    .from('submission_contests')
    .insert({ submission_id: id, user_id: user.id, message, status: 'pending' })
    .select('id')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await notifyAllAdmins('submission_contested', {
    submission_id: id,
    contest_id: created?.id,
    user_id: user.id,
    challenge_id: submission.challenge_id,
  })

  return NextResponse.json({ ok: true, contest_id: created?.id })
}
