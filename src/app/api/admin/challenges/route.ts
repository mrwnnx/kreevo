import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

export async function GET() {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { data: challenges } = await (admin!.supabase as any)
    .from('challenges')
    .select('*')
    .order('created_at', { ascending: false })

  return NextResponse.json({ challenges: challenges ?? [] })
}

export async function POST(request: Request) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { data, error: dbErr } = await (admin!.supabase as any)
    .from('challenges')
    .insert({
      title: body.title,
      brief: body.brief,
      context: body.context || null,
      deliverable: body.deliverable || null,
      constraints: body.constraints || null,
      criteria: body.criteria || null,
      track: body.track,
      level: body.level,
      month: body.month,
      year: body.year,
      reveal_at: body.reveal_at || null,
      closes_at: body.closes_at || null,
      status: body.status ?? 'draft',
    })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ challenge: data })
}
