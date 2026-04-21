import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { XP_REWARDS, getLeagueFromXP } from '@/lib/utils/xp'
import { checkAndUpdateLeague } from '@/lib/utils/leagues'
import type { XPAction } from '@/lib/utils/xp'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId, action } = await request.json() as { userId: string; action: XPAction }

  if (!userId || !action || !(action in XP_REWARDS)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const xpEarned = XP_REWARDS[action]

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('xp, league')
    .eq('id', userId)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

  const newXP = (profile.xp ?? 0) + xpEarned

  await (supabase as any)
    .from('profiles')
    .update({ xp: newXP })
    .eq('id', userId)

  await checkAndUpdateLeague(userId, supabase)

  const newLeague = getLeagueFromXP(newXP)
  const leagueChanged = newLeague !== profile.league

  return NextResponse.json({ xpEarned, newXP, newLeague, leagueChanged })
}
