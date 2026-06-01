import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { validateSubmissionWithAI, shouldAutoValidate } from '@/lib/utils/submissions'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const coverUrl = body.cover_url as string | undefined
  const challengeId = body.challenge_id as string | undefined

  if (!coverUrl || !challengeId) {
    return NextResponse.json({ error: 'cover_url et challenge_id requis' }, { status: 400 })
  }

  const { data: challenge } = await (supabaseAdmin as any)
    .from('challenges')
    .select('id, brief, specialty, challenge_types(name_fr), industries(name_fr), xp_reward, leagues(name)')
    .eq('id', challengeId)
    .single()
  if (!challenge) return NextResponse.json({ error: 'Challenge introuvable' }, { status: 404 })

  const leagueName = challenge.leagues?.name ?? null
  const autoValidate = shouldAutoValidate(leagueName)

  if (!autoValidate) {
    return NextResponse.json({
      valid: null,
      skipped: true,
      reason: 'Cette ligue requiert une validation manuelle par un admin.',
    })
  }

  const result = await validateSubmissionWithAI(
    { id: 'preview', user_id: user.id, cover_url: coverUrl, challenge_id: challengeId },
    {
      id: challenge.id,
      brief: challenge.brief,
      specialty: challenge.specialty,
      challenge_type: challenge.challenge_types?.name_fr ?? null,
      xp_reward: challenge.xp_reward,
      league_name: leagueName,
    }
  )

  return NextResponse.json({
    valid: result.valid,
    reason: result.reason ?? null,
    league: leagueName,
  })
}
