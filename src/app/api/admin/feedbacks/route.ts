import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

export async function GET(request: Request) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? 'pending'

  const { data: feedbacks } = await (admin!.supabase as any)
    .from('feedbacks')
    .select('*, submissions(cover_url, user_id, challenges(title)), profiles:submissions(user_id(username, avatar_url, full_name, league))')
    .eq('status', status)
    .order('created_at', { ascending: false })

  return NextResponse.json({ feedbacks: feedbacks ?? [] })
}
