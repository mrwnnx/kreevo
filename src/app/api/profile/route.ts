import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const allowed = [
    'full_name',
    'username',
    'bio',
    'country',
    'city',
    'specialty',
    'objective',
    'objectives',
    'tools',
    'links',
    'avatar_url',
    'first_name',
    'last_name',
    'experience_level',
    'job_title',
    'behance_url',
    'linkedin_url',
    'onboarding_completed',
  ]
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }

  if (update.username) {
    const { data: existing } = await (supabase as any)
      .from('profiles')
      .select('id')
      .eq('username', update.username)
      .neq('id', user.id)
      .single()
    if (existing) return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
  }

  // Specialty change: allowed only while in Stone/Bronze (forfeits progression
  // and restarts from zero), locked from Silver and above.
  let specialtyReset = false
  if ('specialty' in update && update.specialty) {
    const { data: current } = await (supabase as any)
      .from('profiles')
      .select('specialty, onboarding_completed, league')
      .eq('id', user.id)
      .single()
    const changing =
      current?.onboarding_completed &&
      current?.specialty &&
      current.specialty !== update.specialty
    if (changing) {
      // Tiers that still allow a free discipline switch.
      const UNLOCKED = ['stone', '7ajra', 'bronze']
      const currentLeague = (current.league ?? 'Stone').toLowerCase()
      if (!UNLOCKED.includes(currentLeague)) {
        return NextResponse.json(
          { error: 'Specialty cannot be changed from Silver onward', code: 'SPECIALTY_LOCKED' },
          { status: 403 },
        )
      }
      // Allowed: forfeit progression and restart in the new discipline.
      update.xp = 0
      update.league = 'Stone'
      update.league_entered_at = new Date().toISOString()
      specialtyReset = true
    }
  }

  if (update.first_name || update.last_name) {
    const { data: current } = await (supabase as any)
      .from('profiles')
      .select('first_name, last_name, full_name')
      .eq('id', user.id)
      .single()
    const first = (update.first_name as string) ?? current?.first_name ?? ''
    const last = (update.last_name as string) ?? current?.last_name ?? ''
    const composed = `${first} ${last}`.trim()
    if (composed) update.full_name = composed
  }

  update.updated_at = new Date().toISOString()
  const { error } = await (supabase as any)
    .from('profiles')
    .update(update)
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, specialtyReset })
}
