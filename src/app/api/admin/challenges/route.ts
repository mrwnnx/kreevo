import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

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
      title: body.title,
      brief: body.brief,
      context: body.context || null,
      deliverable: body.deliverable || null,
      constraints: body.constraints || null,
      criteria: body.criteria || null,
      track: body.track,
      month: body.month,
      year: body.year,
      reveal_at: body.reveal_at || null,
      closes_at: body.closes_at || null,
      status: body.status ?? 'draft',
      league_id: body.league_id || null,
      difficulty: body.difficulty || null,
      xp_reward: body.xp_reward || null,
      deadline_days: body.deadline_days || null,
      is_published: body.is_published ?? false,
    })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ challenge: data })
}
