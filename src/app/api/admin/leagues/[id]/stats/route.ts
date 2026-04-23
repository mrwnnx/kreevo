import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getLeagueThreshold } from '@/lib/utils/leagues'

interface Props { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Props) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params

  const [challengeCount, xpThreshold] = await Promise.all([
    supabaseAdmin
      .from('challenges')
      .select('*', { count: 'exact', head: true })
      .eq('league_id', id)
      .eq('is_published', true)
      .then(r => r.count ?? 0),
    getLeagueThreshold(id),
  ])

  return NextResponse.json({ challengeCount, xpThreshold })
}
