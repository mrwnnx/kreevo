import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = (new URL(req.url).searchParams.get('q') ?? '').trim()
  if (q.length < 2) return NextResponse.json({ users: [] })

  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .or(`username.ilike.%${q}%,full_name.ilike.%${q}%`)
    .neq('id', user.id)
    .limit(8)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data ?? [] })
}
