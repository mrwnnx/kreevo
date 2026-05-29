import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { buildI18nColumns } from '@/lib/challenges/columns'

export async function GET(request: Request) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const leagueId = searchParams.get('league_id')

  let query = (admin!.supabase as any)
    .from('challenges')
    .select('*, leagues(id, name, icon)')
    .order('created_at', { ascending: false })

  if (leagueId) query = query.eq('league_id', leagueId)

  const { data: challenges } = await query
  return NextResponse.json({ challenges: challenges ?? [] })
}

export async function POST(request: Request) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { data, error: dbErr } = await (admin!.supabase as any)
    .from('challenges')
    .insert({
      // Localized text fields (18 columns) + legacy mirror + source_lang + status.
      ...buildI18nColumns(body),
      league_id: body.league_id || null,
      xp_reward: body.xp_reward || null,
      deadline_days: body.deadline_days || null,
      is_published: body.is_published ?? false,
      specialty: body.specialty || null,
      challenge_type: body.challenge_type || null,
      industry: body.industry || null,
      emoji: body.emoji || null,
    })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ challenge: data })
}
