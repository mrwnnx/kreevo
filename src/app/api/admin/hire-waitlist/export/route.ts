import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

export async function GET() {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { data } = await (admin!.supabase as any)
    .from('hire_waitlist')
    .select('email, created_at')
    .order('created_at', { ascending: false })

  const rows = (data ?? []) as { email: string; created_at: string }[]
  const csv = ['email,date_inscription', ...rows.map((r) => `${r.email},${r.created_at}`)].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="hire-waitlist.csv"',
    },
  })
}
