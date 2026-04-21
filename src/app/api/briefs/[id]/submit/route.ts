import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { awardBadge } from '@/lib/utils/badges'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { cover_url, figma_url, description } = await request.json()
  if (!cover_url) return NextResponse.json({ error: 'Cover requis' }, { status: 400 })

  const { data: brief } = await (supabase as any)
    .from('random_briefs')
    .select('id, user_id, status, deadline_at')
    .eq('id', id)
    .single()

  if (!brief) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (brief.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (brief.status !== 'started') return NextResponse.json({ error: 'Brief non démarré' }, { status: 409 })
  if (new Date(brief.deadline_at) < new Date()) {
    return NextResponse.json({ error: 'Deadline dépassée' }, { status: 409 })
  }

  const { error } = await (supabase as any)
    .from('random_briefs')
    .update({ status: 'submitted', cover_url, figma_url: figma_url || null, description })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // XP
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/xp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') ?? '' },
    body: JSON.stringify({ userId: user.id, action: 'random_brief_complete' }),
  })

  // Badges — basés sur les briefs soumis
  const { count: totalSubmitted } = await (supabase as any)
    .from('random_briefs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'submitted')

  const total = totalSubmitted ?? 0
  if (total === 1)  await awardBadge(user.id, 'first_draft', {}, supabase as any)
  if (total === 5)  await awardBadge(user.id, 'consistent', {}, supabase as any)
  if (total === 10) await awardBadge(user.id, 'machine', {}, supabase as any)
  if (total === 30) await awardBadge(user.id, 'obsessed', {}, supabase as any)

  return NextResponse.json({ success: true, xp: 50 })
}
