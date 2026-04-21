import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  const isPro = profile?.plan === 'pro' || profile?.plan === 'studio'

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [{ data: briefs }, { count: monthCount }] = await Promise.all([
    (supabase as any)
      .from('random_briefs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    (supabase as any)
      .from('random_briefs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth.toISOString()),
  ])

  return NextResponse.json({
    briefs: briefs ?? [],
    monthCount: monthCount ?? 0,
    isPro,
  })
}
