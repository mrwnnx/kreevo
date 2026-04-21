import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DURATION_MS: Record<string, number> = {
  '1 heure':  1 * 60 * 60 * 1000,
  '3 heures': 3 * 60 * 60 * 1000,
  '1 jour':   24 * 60 * 60 * 1000,
  '3 jours':  3 * 24 * 60 * 60 * 1000,
}

export async function PATCH(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: brief } = await (supabase as any)
    .from('random_briefs')
    .select('id, user_id, status, prompt')
    .eq('id', id)
    .single()

  if (!brief) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (brief.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (brief.status !== 'active') return NextResponse.json({ error: 'Brief déjà commencé' }, { status: 409 })

  const duration = brief.prompt?.duration ?? '3 heures'
  const now = new Date()
  const deadlineAt = new Date(now.getTime() + (DURATION_MS[duration] ?? DURATION_MS['3 heures']))

  const { data: updated, error } = await (supabase as any)
    .from('random_briefs')
    .update({
      status: 'started',
      started_at: now.toISOString(),
      deadline_at: deadlineAt.toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ brief: updated })
}
