import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

export async function GET() {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { data: users } = await (admin!.supabase as any)
    .from('profiles')
    .select('id, username, full_name, avatar_url, plan, league, xp, role, is_suspended, created_at')
    .order('created_at', { ascending: false })

  return NextResponse.json({ users: users ?? [] })
}
