import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface Params {
  params: Promise<{ id: string }>
}

export async function POST(req: Request, { params }: Params) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const kind = body.kind as 'helpful' | 'not_helpful' | undefined

  if (kind !== 'helpful' && kind !== 'not_helpful') {
    return NextResponse.json({ error: 'Invalid kind' }, { status: 400 })
  }

  const column = kind === 'helpful' ? 'helpful' : 'not_helpful'

  const { data: row } = await (supabaseAdmin as any)
    .from('help_articles')
    .select(column)
    .eq('id', id)
    .single()

  if (!row) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const next = (row[column] ?? 0) + 1
  await (supabaseAdmin as any)
    .from('help_articles')
    .update({ [column]: next })
    .eq('id', id)

  return NextResponse.json({ ok: true, [column]: next })
}
