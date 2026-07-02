import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

function scoreFromContent(content: unknown): number | null {
  if (content && typeof content === 'object' && 'score' in content) {
    const raw = (content as { score: unknown }).score
    const n = typeof raw === 'number' ? raw : Number(raw)
    return Number.isFinite(n) ? n : null
  }
  return null
}

export async function GET() {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const db = admin!.supabase as any

  const [{ data: users }, { data: parts }, { data: subs }, { data: feedbacks }] = await Promise.all([
    db
      .from('profiles')
      .select('id, username, full_name, avatar_url, plan, league, xp, role, is_suspended, created_at')
      .order('created_at', { ascending: false }),
    db.from('participations').select('user_id, status'),
    db.from('submissions').select('id, user_id, is_draft'),
    db.from('submission_feedbacks').select('submission_id, content'),
  ])

  // Aggregate per user (small dataset — done in memory).
  const partTotal = new Map<string, number>()
  const partSubmitted = new Map<string, number>()
  for (const p of parts ?? []) {
    if (!p.user_id) continue
    partTotal.set(p.user_id, (partTotal.get(p.user_id) ?? 0) + 1)
    if (p.status === 'submitted') partSubmitted.set(p.user_id, (partSubmitted.get(p.user_id) ?? 0) + 1)
  }

  const userBySub = new Map<string, string>()
  const publishedCount = new Map<string, number>()
  for (const s of subs ?? []) {
    if (!s.user_id) continue
    userBySub.set(s.id, s.user_id)
    if (!s.is_draft) publishedCount.set(s.user_id, (publishedCount.get(s.user_id) ?? 0) + 1)
  }

  const scoreSum = new Map<string, number>()
  const scoreCount = new Map<string, number>()
  for (const f of feedbacks ?? []) {
    const uid = f.submission_id ? userBySub.get(f.submission_id) : undefined
    const sc = scoreFromContent(f.content)
    if (!uid || sc === null) continue
    scoreSum.set(uid, (scoreSum.get(uid) ?? 0) + sc)
    scoreCount.set(uid, (scoreCount.get(uid) ?? 0) + 1)
  }

  const enriched = (users ?? []).map((u: any) => {
    const total = partTotal.get(u.id) ?? 0
    const submitted = partSubmitted.get(u.id) ?? 0
    const cnt = scoreCount.get(u.id) ?? 0
    return {
      ...u,
      submissions: publishedCount.get(u.id) ?? 0,
      completionRate: total ? Math.round((submitted / total) * 100) : null,
      avgScore: cnt ? Math.round((scoreSum.get(u.id) ?? 0) / cnt) : null,
    }
  })

  return NextResponse.json({ users: enriched })
}
