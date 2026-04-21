import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const allowed = ['full_name', 'username', 'bio', 'country', 'city', 'specialty', 'objective', 'tools', 'links', 'avatar_url']
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

  update.updated_at = new Date().toISOString()
  const { error } = await (supabase as any)
    .from('profiles')
    .update(update)
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
