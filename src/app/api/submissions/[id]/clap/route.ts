import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface Params { params: Promise<{ id: string }> }

const MAX_USER_CLAPS = 10

export async function POST(_req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })

  const { id: submissionId } = await params

  const { data: submission } = await (supabaseAdmin as any)
    .from('submissions')
    .select('user_id, total_claps')
    .eq('id', submissionId)
    .single()
  if (!submission) return NextResponse.json({ error: 'Soumission introuvable' }, { status: 404 })

  if (submission.user_id === user.id) {
    return NextResponse.json({ error: 'Tu ne peux pas clapper ton propre travail' }, { status: 403 })
  }

  const { data: existing } = await (supabaseAdmin as any)
    .from('submission_claps')
    .select('id, claps_count')
    .eq('submission_id', submissionId)
    .eq('user_id', user.id)
    .maybeSingle()

  const currentClaps = existing?.claps_count ?? 0
  if (currentClaps >= MAX_USER_CLAPS) {
    return NextResponse.json({ error: 'Maximum 10 claps atteint' }, { status: 400 })
  }

  const newUserClaps = currentClaps + 1
  const newTotal = (submission.total_claps ?? 0) + 1

  if (existing) {
    await (supabaseAdmin as any)
      .from('submission_claps')
      .update({ claps_count: newUserClaps, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    await (supabaseAdmin as any)
      .from('submission_claps')
      .insert({ submission_id: submissionId, user_id: user.id, claps_count: newUserClaps })
  }

  await (supabaseAdmin as any)
    .from('submissions')
    .update({ total_claps: newTotal })
    .eq('id', submissionId)

  // +2 XP to owner per clap
  const { data: ownerProf } = await (supabaseAdmin as any)
    .from('profiles').select('xp').eq('id', submission.user_id).single()
  const newXP = (ownerProf?.xp ?? 0) + 2
  await (supabaseAdmin as any).from('profiles').update({ xp: newXP }).eq('id', submission.user_id)

  return NextResponse.json({ userClaps: newUserClaps, totalClaps: newTotal })
}
