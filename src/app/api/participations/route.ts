import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { challenge_id } = await request.json()
  if (!challenge_id) return NextResponse.json({ error: 'Missing challenge_id' }, { status: 400 })

  // Fetch user profile for plan + league check
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('plan, league')
    .eq('id', user.id)
    .single()

  // Fetch challenge + league (bypass RLS for public read)
  const { data: challenge } = await (supabaseAdmin as any)
    .from('challenges')
    .select('id, is_published, league_id, deadline_days, leagues(id, name, access, order_index)')
    .eq('id', challenge_id)
    .single()

  if (!challenge || !challenge.is_published) {
    return NextResponse.json({ error: 'Challenge not active' }, { status: 400 })
  }

  // Access check: free users can only join leagues with access = 'all'
  if (
    challenge.leagues &&
    challenge.leagues.access === 'pro_only' &&
    profile?.plan === 'free'
  ) {
    return NextResponse.json({ error: 'Ce challenge nécessite un plan Pro' }, { status: 403 })
  }

  // League match: if challenge has a league, verify user is in that league
  if (challenge.league_id && challenge.leagues && profile?.league) {
    const { data: userLeague } = await (supabaseAdmin as any)
      .from('leagues')
      .select('id, order_index')
      .ilike('name', profile.league)
      .maybeSingle()

    if (userLeague) {
      if (challenge.leagues.order_index > userLeague.order_index) {
        return NextResponse.json({
          error: `Atteins la ligue ${challenge.leagues.name} pour participer à ce défi`,
        }, { status: 403 })
      }
    }
  }

  // One active participation at a time
  const { data: activeParticipation } = await (supabaseAdmin as any)
    .from('participations')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (activeParticipation) {
    return NextResponse.json({ error: 'Tu as déjà une participation active en cours' }, { status: 409 })
  }

  // Check already participated in this specific challenge
  const { data: existing } = await (supabaseAdmin as any)
    .from('participations')
    .select('id')
    .eq('challenge_id', challenge_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Already participating' }, { status: 409 })
  }

  const deadlineDays = challenge.deadline_days ?? 3
  const now = new Date()
  const personal_deadline = new Date(now.getTime() + deadlineDays * 24 * 60 * 60 * 1000)

  const { data: participation, error } = await (supabaseAdmin as any)
    .from('participations')
    .insert({
      challenge_id,
      user_id: user.id,
      joined_at: now.toISOString(),
      personal_deadline: personal_deadline.toISOString(),
      status: 'active',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try {
    await (supabaseAdmin as any).from('notifications').insert({
      user_id: user.id,
      type: 'joined_challenge',
      data: { challenge_id, deadline: personal_deadline.toISOString() },
    })
  } catch { /* ignore */ }

  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/xp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: request.headers.get('cookie') ?? '' },
      body: JSON.stringify({ action: 'joined_challenge' }),
    })
  } catch { /* ignore */ }

  return NextResponse.json({ participation })
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const challenge_id = searchParams.get('challenge_id')

  let query = (supabase as any)
    .from('participations')
    .select('*, challenges(id, title, specialty, challenge_type, industry)')
    .eq('user_id', user.id)

  if (challenge_id) query = query.eq('challenge_id', challenge_id)

  const { data } = await query.order('joined_at', { ascending: false })
  return NextResponse.json({ participations: data ?? [] })
}
