import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface Params { params: Promise<{ id: string }> }

const MIN_CONTENT = 3
const FREE_DAILY_LIMIT = 5

export async function POST(req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: parentId } = await params
  const body = await req.json().catch(() => ({}))
  const content = (body.content as string | undefined)?.trim() ?? ''

  if (content.length < MIN_CONTENT) {
    return NextResponse.json({ error: `Min ${MIN_CONTENT} caractères` }, { status: 400 })
  }

  // Find parent
  const { data: parent } = await (supabaseAdmin as any)
    .from('comments')
    .select('id, submission_id, parent_id')
    .eq('id', parentId)
    .single()
  if (!parent) return NextResponse.json({ error: 'Commentaire parent introuvable' }, { status: 404 })

  // Free limit check
  const { data: profile } = await (supabaseAdmin as any)
    .from('profiles').select('plan').eq('id', user.id).single()
  const isPro = profile?.plan === 'pro' || profile?.plan === 'studio'
  if (!isPro) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const { count } = await (supabaseAdmin as any)
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())
    if ((count ?? 0) >= FREE_DAILY_LIMIT) {
      return NextResponse.json({ error: `Limite atteinte (${FREE_DAILY_LIMIT}/jour)` }, { status: 403 })
    }
  }

  const { data: reply, error } = await (supabaseAdmin as any)
    .from('comments')
    .insert({
      submission_id: parent.submission_id,
      user_id: user.id,
      content,
      parent_id: parent.parent_id ?? parentId, // flatten one level (replies stay one level deep)
    })
    .select(`
      id, content, parent_id, likes_count, is_reported, created_at,
      user:profiles(id, username, avatar_url, plan, league)
    `)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ comment: { ...reply, liked_by_me: false } })
}
