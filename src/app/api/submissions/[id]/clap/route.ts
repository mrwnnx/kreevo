import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface Params { params: Promise<{ id: string }> }

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
    return NextResponse.json({ error: 'Tu ne peux pas liker ton propre travail' }, { status: 403 })
  }

  const { data: existing } = await (supabaseAdmin as any)
    .from('submission_claps')
    .select('id')
    .eq('submission_id', submissionId)
    .eq('user_id', user.id)
    .maybeSingle()

  let liked: boolean
  let newTotal: number
  let xpDelta: number

  if (existing) {
    await (supabaseAdmin as any).from('submission_claps').delete().eq('id', existing.id)
    newTotal = Math.max(0, (submission.total_claps ?? 0) - 1)
    liked = false
    xpDelta = -2
  } else {
    await (supabaseAdmin as any)
      .from('submission_claps')
      .insert({ submission_id: submissionId, user_id: user.id, claps_count: 1 })
    newTotal = (submission.total_claps ?? 0) + 1
    liked = true
    xpDelta = 2
  }

  await (supabaseAdmin as any)
    .from('submissions')
    .update({ total_claps: newTotal })
    .eq('id', submissionId)

  const { data: ownerProf } = await (supabaseAdmin as any)
    .from('profiles').select('xp').eq('id', submission.user_id).single()
  const newXP = Math.max(0, (ownerProf?.xp ?? 0) + xpDelta)
  await (supabaseAdmin as any).from('profiles').update({ xp: newXP }).eq('id', submission.user_id)

  return NextResponse.json({ liked, totalLikes: newTotal })
}
