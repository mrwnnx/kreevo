import { supabaseAdmin } from '@/lib/supabase/admin'
import { getScopedLeagueScores } from '@/lib/utils/leagues'

export interface UserSubmissionStat {
  id: string
  title: string | null
  cover_url: string | null
  challengeTitle: string | null
  validationStatus: string | null
  /** Decided (approved/rejected) with no admin => validated by the AI flow. */
  validatedByAI: boolean
  validatedByAdmin: boolean
  isDraft: boolean
  likes: number
  comments: number
  xpEarned: number
  aiScore: number | null
  createdAt: string
  /** Hours between joining the challenge and this submission (null if unknown). */
  hoursToSubmit: number | null
  reports: number
}

export interface UserStats {
  participations: { total: number; active: number; submitted: number; expired: number }
  /** submitted / total — null when the user never joined a challenge. */
  completionRate: number | null
  /** expired / total — null when the user never joined a challenge. */
  abandonRate: number | null
  submissionsPublished: number
  submissionsDrafts: number
  validations: {
    approved: number
    rejected: number
    pending: number
    onHold: number
    byAI: number
    byAdmin: number
  }
  /** Average score across generated AI feedbacks for this user's submissions. */
  avgAiScore: number | null
  aiScoredCount: number
  likesReceived: number
  commentsReceived: number
  commentsGiven: number
  reportsReceived: number
  contestsFiled: number
  streak: { current: number; longest: number } | null
  referrals: { total: number; completed: number }
  /** Rank within the user's league scoped by specialty (1-based). */
  rank: number | null
  /** Top n% within the league (1-100). */
  topPercent: number | null
  submissions: UserSubmissionStat[]
}

interface StatProfile {
  id: string
  league: string | null
  specialty_id: string | null
}

function scoreFromContent(content: unknown): number | null {
  if (content && typeof content === 'object' && 'score' in content) {
    const raw = (content as { score: unknown }).score
    const n = typeof raw === 'number' ? raw : Number(raw)
    return Number.isFinite(n) ? n : null
  }
  return null
}

export async function getUserStats(profile: StatProfile): Promise<UserStats> {
  const userId = profile.id

  const [
    { data: parts },
    { data: subs },
    { count: commentsGiven },
    { data: streakRow },
    { data: referralRows },
    { data: contestRows },
  ] = await Promise.all([
    supabaseAdmin
      .from('participations')
      .select('id, status, joined_at, challenge_id')
      .eq('user_id', userId),
    supabaseAdmin
      .from('submissions')
      .select(
        'id, title, cover_url, validation_status, validated_by, is_draft, total_likes, comments_count, xp_earned, created_at, participation_id, challenges(title)',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabaseAdmin
      .from('comments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabaseAdmin
      .from('streaks')
      .select('current_streak, longest_streak')
      .eq('user_id', userId)
      .maybeSingle(),
    supabaseAdmin.from('referrals').select('status').eq('referrer_id', userId),
    supabaseAdmin.from('submission_contests').select('id').eq('user_id', userId),
  ])

  const partList = parts ?? []
  const subList = (subs ?? []) as Record<string, any>[]
  const subIds = subList.map((s) => s.id as string)

  // AI feedback scores + reports, keyed by submission id.
  const [{ data: feedbacks }, { data: reports }] = await Promise.all([
    subIds.length
      ? supabaseAdmin
          .from('submission_feedbacks')
          .select('submission_id, content')
          .in('submission_id', subIds)
      : Promise.resolve({ data: [] as Record<string, any>[] }),
    subIds.length
      ? supabaseAdmin.from('submission_reports').select('submission_id').in('submission_id', subIds)
      : Promise.resolve({ data: [] as Record<string, any>[] }),
  ])

  const scoreBySub = new Map<string, number>()
  for (const f of feedbacks ?? []) {
    const sc = scoreFromContent(f.content)
    if (sc !== null && f.submission_id) scoreBySub.set(f.submission_id, sc)
  }
  const reportsBySub = new Map<string, number>()
  for (const r of reports ?? []) {
    if (r.submission_id) reportsBySub.set(r.submission_id, (reportsBySub.get(r.submission_id) ?? 0) + 1)
  }
  const joinedByPart = new Map<string, string>()
  for (const p of partList) if (p.id && p.joined_at) joinedByPart.set(p.id, p.joined_at)

  // Participations by status.
  const pTotal = partList.length
  const pSubmitted = partList.filter((p) => p.status === 'submitted').length
  const pActive = partList.filter((p) => p.status === 'active').length
  const pExpired = partList.filter((p) => p.status === 'expired').length

  // Validations breakdown.
  const val = { approved: 0, rejected: 0, pending: 0, onHold: 0, byAI: 0, byAdmin: 0 }
  let likesReceived = 0
  let commentsReceived = 0
  let submissionsPublished = 0
  let submissionsDrafts = 0

  const submissions: UserSubmissionStat[] = subList.map((s) => {
    const status = s.validation_status as string | null
    if (status === 'approved') val.approved++
    else if (status === 'rejected') val.rejected++
    else if (status === 'on_hold') val.onHold++
    else if (status === 'pending') val.pending++

    const decided = status === 'approved' || status === 'rejected'
    const byAI = decided && !s.validated_by
    const byAdmin = decided && !!s.validated_by
    if (byAI) val.byAI++
    if (byAdmin) val.byAdmin++

    if (s.is_draft) submissionsDrafts++
    else submissionsPublished++

    likesReceived += s.total_likes ?? 0
    commentsReceived += s.comments_count ?? 0

    const joined = s.participation_id ? joinedByPart.get(s.participation_id) : undefined
    const hoursToSubmit =
      joined && s.created_at
        ? Math.max(0, (+new Date(s.created_at) - +new Date(joined)) / 36e5)
        : null

    return {
      id: s.id,
      title: s.title ?? null,
      cover_url: s.cover_url ?? null,
      challengeTitle: s.challenges?.title ?? null,
      validationStatus: status,
      validatedByAI: byAI,
      validatedByAdmin: byAdmin,
      isDraft: !!s.is_draft,
      likes: s.total_likes ?? 0,
      comments: s.comments_count ?? 0,
      xpEarned: s.xp_earned ?? 0,
      aiScore: scoreBySub.get(s.id) ?? null,
      createdAt: s.created_at,
      hoursToSubmit,
      reports: reportsBySub.get(s.id) ?? 0,
    }
  })

  const scored = submissions.map((s) => s.aiScore).filter((x): x is number => x !== null)
  const avgAiScore = scored.length ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : null

  const referrals = referralRows ?? []
  const reportsReceived = [...reportsBySub.values()].reduce((a, b) => a + b, 0)

  // Rank & top% within the user's league, scoped by specialty (single source of truth).
  let rank: number | null = null
  let topPercent: number | null = null
  if (profile.league && profile.specialty_id) {
    const { data: leagueRow } = await supabaseAdmin
      .from('leagues')
      .select('id')
      .eq('name', profile.league)
      .maybeSingle()
    if (leagueRow?.id) {
      const scores = await getScopedLeagueScores(leagueRow.id, profile.specialty_id)
      const entries = Object.entries(scores).sort((a, b) => b[1] - a[1])
      const total = entries.length
      const idx = entries.findIndex(([uid]) => uid === userId)
      if (idx >= 0 && total > 0) {
        rank = idx + 1
        topPercent = Math.min(100, Math.max(1, Math.ceil((rank / total) * 100)))
      }
    }
  }

  return {
    participations: { total: pTotal, active: pActive, submitted: pSubmitted, expired: pExpired },
    completionRate: pTotal ? pSubmitted / pTotal : null,
    abandonRate: pTotal ? pExpired / pTotal : null,
    submissionsPublished,
    submissionsDrafts,
    validations: val,
    avgAiScore,
    aiScoredCount: scored.length,
    likesReceived,
    commentsReceived,
    commentsGiven: commentsGiven ?? 0,
    reportsReceived,
    contestsFiled: (contestRows ?? []).length,
    streak: streakRow
      ? { current: streakRow.current_streak ?? 0, longest: streakRow.longest_streak ?? 0 }
      : null,
    referrals: {
      total: referrals.length,
      completed: referrals.filter((r) => r.status === 'completed').length,
    },
    rank,
    topPercent,
    submissions,
  }
}
