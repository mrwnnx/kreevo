import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// List blocked users for the current viewer.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await (supabase as any)
    .from('user_blocks')
    .select('id, created_at, profiles:blocked_id(id, username, full_name, avatar_url)')
    .eq('blocker_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ blocks: data ?? [] })
}

// Block a user.
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const blockedId = typeof body.blockedId === 'string' ? body.blockedId : null
  if (!blockedId) return NextResponse.json({ error: 'blockedId requis' }, { status: 400 })
  if (blockedId === user.id) return NextResponse.json({ error: 'Tu ne peux pas te bloquer toi-même' }, { status: 400 })

  // upsert via INSERT … ON CONFLICT (UNIQUE blocker, blocked)
  const { error } = await (supabaseAdmin as any)
    .from('user_blocks')
    .insert({ blocker_id: user.id, blocked_id: blockedId })
  if (error && !/duplicate key/i.test(error.message)) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// Unblock.
export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const blockedId = url.searchParams.get('blockedId')
  if (!blockedId) return NextResponse.json({ error: 'blockedId requis' }, { status: 400 })

  await (supabaseAdmin as any)
    .from('user_blocks')
    .delete()
    .eq('blocker_id', user.id)
    .eq('blocked_id', blockedId)

  return NextResponse.json({ success: true })
}
