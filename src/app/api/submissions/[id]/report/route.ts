import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { notify, notifyAllAdmins } from '@/lib/utils/notifications'

interface Params { params: Promise<{ id: string }> }

const REPORT_THRESHOLD = 3
const REPORT_WINDOW_HOURS = 24

export async function POST(req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const reason = (body.reason as string | undefined)?.trim()
  if (!reason) return NextResponse.json({ error: 'Raison requise' }, { status: 400 })

  const { data: submission } = await (supabase as any)
    .from('submissions')
    .select('id, user_id, created_at, reports_count, validation_status')
    .eq('id', id)
    .single()
  if (!submission) return NextResponse.json({ error: 'Soumission introuvable' }, { status: 404 })
  if (submission.user_id === user.id) {
    return NextResponse.json({ error: 'Tu ne peux pas signaler ta propre soumission' }, { status: 403 })
  }

  // Window check
  const submittedAt = new Date(submission.created_at)
  const hoursDiff = (Date.now() - submittedAt.getTime()) / 1000 / 3600
  if (hoursDiff > REPORT_WINDOW_HOURS) {
    return NextResponse.json({ error: 'Fenêtre de signalement expirée (24h)' }, { status: 403 })
  }

  // Insert report (UNIQUE constraint blocks duplicates)
  const { error: insertError } = await (supabaseAdmin as any)
    .from('submission_reports')
    .insert({ submission_id: id, user_id: user.id, reason })

  if (insertError) {
    if ((insertError as any).code === '23505') {
      return NextResponse.json({ error: 'Tu as déjà signalé cette soumission' }, { status: 409 })
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // Update count
  const newCount = (submission.reports_count ?? 0) + 1
  await (supabaseAdmin as any)
    .from('submissions')
    .update({ reports_count: newCount })
    .eq('id', id)

  // Threshold reached → on_hold + revoke XP if attributed
  if (newCount >= REPORT_THRESHOLD && submission.validation_status !== 'on_hold') {
    const { data: subFull } = await (supabaseAdmin as any)
      .from('submissions')
      .select('xp_attributed, user_id, challenges(xp_reward)')
      .eq('id', id)
      .single()

    if (subFull?.xp_attributed) {
      const xpReward = subFull.challenges?.xp_reward ?? 150
      const { data: prof } = await (supabaseAdmin as any)
        .from('profiles').select('xp').eq('id', subFull.user_id).single()
      const newXP = Math.max(0, (prof?.xp ?? 0) - xpReward)
      await (supabaseAdmin as any).from('profiles').update({ xp: newXP }).eq('id', subFull.user_id)
    }

    await (supabaseAdmin as any)
      .from('submissions')
      .update({
        validation_status: 'on_hold',
        reported_at: new Date().toISOString(),
        xp_attributed: false,
      })
      .eq('id', id)

    await notify(submission.user_id, 'submission_on_hold', { submission_id: id })
    await notifyAllAdmins('submission_reported', { submission_id: id, count: newCount })
  }

  return NextResponse.json({ ok: true, reports_count: newCount })
}

export async function GET(req: Request, { params }: Params) {
  // Check if current user has already reported
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ reported: false })

  const { id } = await params
  const { data } = await (supabase as any)
    .from('submission_reports')
    .select('id')
    .eq('submission_id', id)
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ reported: !!data })
}
