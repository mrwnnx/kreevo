import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { challenge_id } = await request.json()
  if (!challenge_id) return NextResponse.json({ error: 'Missing challenge_id' }, { status: 400 })

  // Verify challenge is active
  const { data: challenge } = await (supabase as any)
    .from('challenges')
    .select('id, status')
    .eq('id', challenge_id)
    .single()

  if (!challenge || challenge.status !== 'active') {
    return NextResponse.json({ error: 'Challenge not active' }, { status: 400 })
  }

  // Check if already participated
  const { data: existing } = await (supabase as any)
    .from('participations')
    .select('id')
    .eq('challenge_id', challenge_id)
    .eq('user_id', user.id)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Already participating' }, { status: 409 })
  }

  const now = new Date()
  const personal_deadline = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  const { data: participation, error } = await (supabase as any)
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

  // Notification
  try {
    await (supabase as any).from('notifications').insert({
      user_id: user.id,
      type: 'joined_challenge',
      data: { challenge_id, deadline: personal_deadline.toISOString() },
    })
  } catch { /* ignore */ }

  // +50 XP
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
    .select('*, challenges(id, title, closes_at, track)')
    .eq('user_id', user.id)

  if (challenge_id) query = query.eq('challenge_id', challenge_id)

  const { data } = await query.order('joined_at', { ascending: false })
  return NextResponse.json({ participations: data ?? [] })
}
