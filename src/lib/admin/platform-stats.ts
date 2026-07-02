import { supabaseAdmin } from '@/lib/supabase/admin'

function scoreFromContent(content: unknown): number | null {
  if (content && typeof content === 'object' && 'score' in content) {
    const raw = (content as { score: unknown }).score
    const n = typeof raw === 'number' ? raw : Number(raw)
    return Number.isFinite(n) ? n : null
  }
  return null
}

export interface LeagueBucket { name: string; count: number }
export interface SpecialtyBucket { label: string; emoji: string | null; count: number }
export interface ChallengeStat {
  id: string
  title: string | null
  participations: number
  submitted: number
  expired: number
  completionRate: number | null
  avgScore: number | null
}

export interface WeekBucket { label: string; count: number }
export interface Contributor {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  comments: number
  likesGiven: number
}

export interface PlatformStats {
  totalUsers: number
  active7d: number
  active30d: number
  completionRate: number | null
  avgAiScore: number | null
  xpDistributed: number
  plan: { free: number; pro: number; studio: number }
  feedbackTier: { basic: number; detailed: number }
  byLeague: LeagueBucket[]
  bySpecialty: SpecialtyBucket[]
  topByParticipations: ChallengeStat[]
  topByCompletion: ChallengeStat[]
  hardest: ChallengeStat[]
  moderation: { reported: number; onHold: number; pendingContests: number; pendingReview: number }
  signupsByWeek: WeekBucket[]
  submissionsByWeek: WeekBucket[]
  topContributors: Contributor[]
}

const WEEKS = 12

/** Bucket ISO timestamps into the last WEEKS 7-day windows (oldest first). */
function weeklyBuckets(now: number, dates: (string | null | undefined)[]): WeekBucket[] {
  const counts = new Array(WEEKS).fill(0)
  for (const d of dates) {
    if (!d) continue
    const weeksAgo = Math.floor((now - +new Date(d)) / (7 * 864e5))
    if (weeksAgo >= 0 && weeksAgo < WEEKS) counts[WEEKS - 1 - weeksAgo]++
  }
  return counts.map((count, i) => ({
    label: new Date(now - (WEEKS - 1 - i) * 7 * 864e5).toLocaleDateString('fr', {
      day: 'numeric',
      month: 'short',
    }),
    count,
  }))
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const now = Date.now()
  const d7 = new Date(now - 7 * 864e5).toISOString()
  const d30 = new Date(now - 30 * 864e5).toISOString()

  const [
    { data: profiles },
    { data: parts },
    { data: subs },
    { data: feedbacks },
    { data: challenges },
    { data: leagues },
    { data: specialties },
    { data: contests },
    { data: recentComments },
    { data: allComments },
    { data: commentLikes },
  ] = await Promise.all([
    supabaseAdmin.from('profiles').select('id, username, full_name, avatar_url, league, specialty_id, plan, xp, created_at'),
    supabaseAdmin.from('participations').select('user_id, status, joined_at, challenge_id'),
    supabaseAdmin
      .from('submissions')
      .select('id, user_id, validation_status, xp_earned, created_at, is_draft, reports_count, challenge_id'),
    // `tier` exists in prod but isn't in the generated types yet → cast to any.
    (supabaseAdmin as any).from('submission_feedbacks').select('submission_id, content, tier'),
    supabaseAdmin.from('challenges').select('id, title, specialty_id'),
    supabaseAdmin.from('leagues').select('id, name, order_index').order('order_index'),
    supabaseAdmin.from('specialties').select('id, name_fr, name, emoji'),
    supabaseAdmin.from('submission_contests').select('status'),
    supabaseAdmin.from('comments').select('user_id, created_at').gte('created_at', d30),
    supabaseAdmin.from('comments').select('user_id'),
    supabaseAdmin.from('comment_likes').select('user_id'),
  ])

  const profileList = (profiles ?? []) as Record<string, any>[]
  const partList = (parts ?? []) as Record<string, any>[]
  const subList = (subs ?? []) as Record<string, any>[]

  const totalUsers = profileList.length

  // Active users = distinct users with a participation joined / submission / comment in window.
  const active = (since: string) => {
    const set = new Set<string>()
    for (const p of partList) if (p.user_id && p.joined_at >= since) set.add(p.user_id)
    for (const s of subList) if (s.user_id && s.created_at >= since) set.add(s.user_id)
    for (const c of recentComments ?? []) if (c.user_id && c.created_at && c.created_at >= since) set.add(c.user_id)
    return set.size
  }

  // Completion (global) + XP distributed.
  const pTotal = partList.length
  const pSubmitted = partList.filter((p) => p.status === 'submitted').length
  const xpDistributed = subList.reduce((a, s) => a + (s.xp_earned ?? 0), 0)

  // AI scores by submission.
  const scoreBySub = new Map<string, number>()
  const feedbackTier = { basic: 0, detailed: 0 }
  for (const f of feedbacks ?? []) {
    const sc = scoreFromContent(f.content)
    if (sc !== null && f.submission_id) scoreBySub.set(f.submission_id, sc)
    if (f.tier === 'basic') feedbackTier.basic++
    else if (f.tier === 'detailed') feedbackTier.detailed++
  }
  const allScores = [...scoreBySub.values()]
  const avgAiScore = allScores.length ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : null

  // Plan distribution.
  const plan = { free: 0, pro: 0, studio: 0 }
  for (const p of profileList) {
    if (p.plan === 'pro') plan.pro++
    else if (p.plan === 'studio') plan.studio++
    else plan.free++
  }

  // By league (ordered by league order_index).
  const leagueCount = new Map<string, number>()
  for (const p of profileList) if (p.league) leagueCount.set(p.league, (leagueCount.get(p.league) ?? 0) + 1)
  const byLeague: LeagueBucket[] = (leagues ?? []).map((l: any) => ({
    name: l.name,
    count: leagueCount.get(l.name) ?? 0,
  }))

  // By specialty.
  const specById = new Map<string, { label: string; emoji: string | null }>()
  for (const s of specialties ?? []) specById.set(s.id, { label: s.name_fr ?? s.name ?? '—', emoji: s.emoji })
  const specCount = new Map<string, number>()
  let noSpec = 0
  for (const p of profileList) {
    if (p.specialty_id) specCount.set(p.specialty_id, (specCount.get(p.specialty_id) ?? 0) + 1)
    else noSpec++
  }
  const bySpecialty: SpecialtyBucket[] = [...specCount.entries()].map(([id, count]) => ({
    label: specById.get(id)?.label ?? '—',
    emoji: specById.get(id)?.emoji ?? null,
    count,
  }))
  if (noSpec > 0) bySpecialty.push({ label: 'Sans spécialité', emoji: '❓', count: noSpec })
  bySpecialty.sort((a, b) => b.count - a.count)

  // Per-challenge aggregates.
  const titleById = new Map<string, string | null>()
  for (const c of challenges ?? []) titleById.set(c.id, c.title)
  const cPart = new Map<string, number>()
  const cSubmitted = new Map<string, number>()
  const cExpired = new Map<string, number>()
  for (const p of partList) {
    if (!p.challenge_id) continue
    cPart.set(p.challenge_id, (cPart.get(p.challenge_id) ?? 0) + 1)
    if (p.status === 'submitted') cSubmitted.set(p.challenge_id, (cSubmitted.get(p.challenge_id) ?? 0) + 1)
    if (p.status === 'expired') cExpired.set(p.challenge_id, (cExpired.get(p.challenge_id) ?? 0) + 1)
  }
  const cScoreSum = new Map<string, number>()
  const cScoreCnt = new Map<string, number>()
  const subChallenge = new Map<string, string>()
  for (const s of subList) if (s.challenge_id) subChallenge.set(s.id, s.challenge_id)
  for (const [subId, score] of scoreBySub.entries()) {
    const cid = subChallenge.get(subId)
    if (!cid) continue
    cScoreSum.set(cid, (cScoreSum.get(cid) ?? 0) + score)
    cScoreCnt.set(cid, (cScoreCnt.get(cid) ?? 0) + 1)
  }
  const challengeStats: ChallengeStat[] = [...cPart.keys()].map((cid) => {
    const participations = cPart.get(cid) ?? 0
    const submitted = cSubmitted.get(cid) ?? 0
    const cnt = cScoreCnt.get(cid) ?? 0
    return {
      id: cid,
      title: titleById.get(cid) ?? null,
      participations,
      submitted,
      expired: cExpired.get(cid) ?? 0,
      completionRate: participations ? submitted / participations : null,
      avgScore: cnt ? Math.round((cScoreSum.get(cid) ?? 0) / cnt) : null,
    }
  })

  const topByParticipations = [...challengeStats].sort((a, b) => b.participations - a.participations).slice(0, 8)
  const topByCompletion = [...challengeStats]
    .filter((c) => c.participations >= 2 && c.completionRate !== null)
    .sort((a, b) => (b.completionRate ?? 0) - (a.completionRate ?? 0))
    .slice(0, 8)
  const hardest = [...challengeStats]
    .filter((c) => c.avgScore !== null)
    .sort((a, b) => (a.avgScore ?? 100) - (b.avgScore ?? 100))
    .slice(0, 8)

  // Moderation queue.
  const reported = subList.filter((s) => (s.reports_count ?? 0) > 0).length
  const onHold = subList.filter((s) => s.validation_status === 'on_hold').length
  const pendingReview = subList.filter((s) => s.validation_status === 'pending' && !s.is_draft).length
  const pendingContests = (contests ?? []).filter((c: any) => c.status === 'pending').length

  // Temporal buckets.
  const signupsByWeek = weeklyBuckets(now, profileList.map((p) => p.created_at))
  const submissionsByWeek = weeklyBuckets(now, subList.map((s) => s.created_at))

  // Top contributors (comments given + likes given).
  const commentsByUser = new Map<string, number>()
  for (const c of allComments ?? []) if (c.user_id) commentsByUser.set(c.user_id, (commentsByUser.get(c.user_id) ?? 0) + 1)
  const likesByUser = new Map<string, number>()
  for (const l of commentLikes ?? []) if (l.user_id) likesByUser.set(l.user_id, (likesByUser.get(l.user_id) ?? 0) + 1)
  const profById = new Map<string, Record<string, any>>()
  for (const p of profileList) profById.set(p.id, p)
  const topContributors: Contributor[] = [...commentsByUser.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([id, comments]) => {
      const p = profById.get(id)
      return {
        id,
        username: p?.username ?? null,
        full_name: p?.full_name ?? null,
        avatar_url: p?.avatar_url ?? null,
        comments,
        likesGiven: likesByUser.get(id) ?? 0,
      }
    })

  return {
    totalUsers,
    active7d: active(d7),
    active30d: active(d30),
    completionRate: pTotal ? pSubmitted / pTotal : null,
    avgAiScore,
    xpDistributed,
    plan,
    feedbackTier,
    byLeague,
    bySpecialty,
    topByParticipations,
    topByCompletion,
    hardest,
    moderation: { reported, onHold, pendingContests, pendingReview },
    signupsByWeek,
    submissionsByWeek,
    topContributors,
  }
}
