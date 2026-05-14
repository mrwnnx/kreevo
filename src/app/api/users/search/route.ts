import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const q = (url.searchParams.get('q') ?? '').trim()
  if (q.length < 2) return NextResponse.json({ users: [] })

  // Coworker picker passes sameLeague=1 → restrict results to the requester's league.
  const sameLeague = url.searchParams.get('sameLeague') === '1'

  let query = (supabase as any)
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
    .neq('id', user.id)
    .limit(8)

  if (sameLeague) {
    const { data: me } = await (supabase as any)
      .from('profiles')
      .select('league')
      .eq('id', user.id)
      .single()
    if (me?.league) query = query.eq('league', me.league)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data ?? [] })
}
