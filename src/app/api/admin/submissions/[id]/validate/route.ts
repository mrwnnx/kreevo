import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { approveSubmission, rejectSubmission } from '@/lib/utils/submissions'

interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const action = body.action as 'approve' | 'reject' | undefined
  const feedback = (body.feedback as string | undefined) ?? ''

  if (action === 'approve') {
    await approveSubmission(id, user.id)
    return NextResponse.json({ ok: true })
  }

  if (action === 'reject') {
    if (!feedback.trim()) {
      return NextResponse.json({ error: 'Feedback obligatoire pour un rejet' }, { status: 400 })
    }
    await rejectSubmission(id, feedback, user.id)
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Action invalide' }, { status: 400 })
}
