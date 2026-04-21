import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

interface Props { params: Promise<{ id: string }> }

export async function POST(_: Request, { params }: Props) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { id } = await params

  const { data, error: dbErr } = await (admin!.supabase as any)
    .from('submissions')
    .update({ is_visible: true })
    .eq('challenge_id', id)
    .eq('is_visible', false)
    .select('id')

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ revealed: data?.length ?? 0 })
}
