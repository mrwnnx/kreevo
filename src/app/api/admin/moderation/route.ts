import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

export async function GET(request: Request) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') ?? 'comments'

  let data: unknown[] = []

  if (type === 'comments') {
    const { data: items } = await (admin!.supabase as any)
      .from('comments')
      .select('*, profiles(username, avatar_url), submissions(challenge_id, challenges(title))')
      .eq('is_reported', true)
      .order('created_at', { ascending: false })
    data = items ?? []
  } else if (type === 'human_review') {
    const { data: items } = await (admin!.supabase as any)
      .from('submissions')
      .select('id, title, description, cover_url, ai_analysis, ai_rejection_count, created_at, challenge_id, profiles:user_id(username, avatar_url), challenges(title, brief)')
      .eq('validation_status', 'pending_human_review')
      .order('created_at', { ascending: false })
    data = items ?? []
  } else {
    const { data: items } = await (admin!.supabase as any)
      .from('submissions')
      .select('*, profiles(username, avatar_url), challenges(title)')
      .eq('is_reported', true)
      .order('created_at', { ascending: false })
    data = items ?? []
  }

  return NextResponse.json({ items: data })
}
