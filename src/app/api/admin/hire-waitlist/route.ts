import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

export async function GET() {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { data } = await (admin!.supabase as any)
    .from('hire_waitlist')
    .select('id, email, created_at')
    .order('created_at', { ascending: false })

  return NextResponse.json({ entries: data ?? [] })
}
