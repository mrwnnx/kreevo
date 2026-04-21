import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

interface Props { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Props) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const { type, action } = await request.json()

  const table = type === 'comments' ? 'comments' : 'submissions'

  if (action === 'ignore') {
    await (admin!.supabase as any).from(table).update({ is_reported: false }).eq('id', id)
  } else if (action === 'delete') {
    await (admin!.supabase as any).from(table).delete().eq('id', id)
  }

  return NextResponse.json({ ok: true })
}
