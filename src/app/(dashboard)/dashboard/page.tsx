import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { DashboardProfileHeader } from '@/components/dashboard/DashboardProfileHeader'
import { getDict, getLang, tx } from '@/lib/i18n/lang'
import { localizeChallenge } from '@/lib/challenges/i18n'
import { getTaxonomyMaps, localizeType } from '@/lib/challenges/refs'
import { StatCards } from '@/components/dashboard/StatCards'
import { LeagueSection, LeagueCountdownCard } from '@/components/dashboard/LeagueSection'
import { WhatToDoNow } from '@/components/dashboard/WhatToDoNow'
import { ContextualLeaderboard } from '@/components/dashboard/ContextualLeaderboard'
import { InviteFriends } from '@/components/dashboard/InviteFriends'
import { CompleteProfile } from '@/components/dashboard/CompleteProfile'
import { Analytics } from '@/components/dashboard/Analytics'
import { getLeagueThreshold, getScopedLeagueScores } from '@/lib/utils/leagues'

interface PageProps {
  searchParams: Promise<{ submitted?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const justSubmitted = sp?.submitted === 'true'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    profileResult,
    participationResult,
    streakResult,
    referralsResult,
    leagueResult,
    completedResult,
    thisWeekResult,
    lastSubResult,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),

    supabase
      .from('participations')
      .select('*, challenges(*, challenge_types(name_fr))')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('personal_deadline', new Date().toISOString())
      .order('personal_deadline', { ascending: true })
      .limit(1)
      .maybeSingle(),

    supabase.from('streaks').select('*').eq('user_id', user.id).maybeSingle(),

    supabase
      .from('referrals')
      .select('*, referred:profiles!referred_id(username, avatar_url)')
      .eq('referrer_id', user.id),

    supabaseAdmin.from('leagues').select('*').order('order_index'),

    supabase
      .from('participations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'submitted'),

    supabase
      .from('participations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'submitted')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

    supabase
      .from('submissions')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const profile = profileResult.data
  if (!profile) redirect('/login')

  const participation = participationResult.data

  // Participants for the active challenge (RLS-restricted → admin client)
  let participantsCount = 0
  let participantAvatars: { id: string; username: string; avatar_url: string | null }[] = []
  if (participation?.challenge_id) {
    const [{ count }, { data: parts }] = await Promise.all([
      supabaseAdmin
        .from('participations')
        .select('id', { count: 'exact', head: true })
        .eq('challenge_id', participation.challenge_id),
      supabaseAdmin
        .from('participations')
        .select('user_id')
        .eq('challenge_id', participation.challenge_id)
        .limit(5),
    ])
    participantsCount = count ?? 0
    const ids = (parts ?? []).map((p) => p.user_id).filter((id): id is string => !!id)
    if (ids.length) {
      const { data: profs } = await supabaseAdmin
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', ids)
      participantAvatars = profs ?? []
    }
  }

  const streak = streakResult.data
  const referrals = referralsResult.data ?? []
  const allLeagues = leagueResult.data ?? []
  const totalCompleted = completedResult.count ?? 0
  const completedThisWeek = thisWeekResult.count ?? 0
  const lastSubmissionDate = lastSubResult.data?.created_at
    ? new Date(lastSubResult.data.created_at)
    : null

  const userLeagueName = profile?.league || 'Stone'
  const userLeague = allLeagues.find(
    (l) => l.name.toLowerCase() === userLeagueName.toLowerCase(),
  ) || allLeagues.find((l) => l.name === 'Stone') || allLeagues[0]
  const leagueIndex = userLeague?.order_index || 1
  const nextLeague = allLeagues.find((l) => l.order_index === leagueIndex + 1)

  // PHASE 2/3 — seuil scopé par spécialité (source unique getLeagueThreshold).
  // Plus de calcul inline dupliqué.
  const userSpecialtyId = (profile?.specialty_id ?? null) as string | null
  const threshold = userLeague?.id && userSpecialtyId
    ? await getLeagueThreshold(userLeague.id, userSpecialtyId)
    : 0
  // ⚠️ currentXP vient de profiles.xp, ENCORE GLOBAL (toutes spés). Comparé à un
  // seuil scopé → incohérence temporaire ASSUMÉE (isolation XP = phase ultérieure).
  const currentXP = profile?.xp || 0
  const xpPercent = threshold > 0 ? Math.min((currentXP / threshold) * 100, 100) : 0
  const xpGap = Math.max(0, threshold - currentXP)

  // PHASE 3 — classement scopé leagueXp (MÊME modèle que le leaderboard).
  // Rang/total/voisins/top10 basés sur le score leagueXp scopé, plus sur
  // profiles.xp global. specialty_id NULL → aucun classement (rang neutre).
  let userRank = 1
  let totalInLeague = 0
  let neighborUsers: {
    rank: number
    username: string
    full_name: string | null
    avatar_url: string | null
    xp: number
    isCurrentUser: boolean
  }[] = []
  let xpToTop10 = 0

  if (userLeague?.id && userSpecialtyId) {
    const [scoreByUser, { data: leagueUsers }] = await Promise.all([
      getScopedLeagueScores(userLeague.id, userSpecialtyId),
      supabaseAdmin
        .from('profiles')
        .select('id, username, full_name, avatar_url, xp')
        .ilike('league', userLeagueName)
        .eq('specialty_id', userSpecialtyId),
    ])
    const ranked = [...((leagueUsers ?? []) as any[])].sort((a, b) => {
      const diff = (scoreByUser[b.id] ?? 0) - (scoreByUser[a.id] ?? 0)
      return diff !== 0 ? diff : (b.xp ?? 0) - (a.xp ?? 0)
    })
    totalInLeague = ranked.length
    const myIdx = ranked.findIndex((u) => u.id === user.id)
    userRank = myIdx >= 0 ? myIdx + 1 : ranked.length + 1

    // Voisins autour de l'user (leagueXp scopé pour l'affichage, pas profiles.xp).
    const start = Math.max(0, userRank - 3)
    neighborUsers = ranked.slice(start, userRank + 1).map((u, i) => ({
      rank: start + 1 + i,
      username: u.username,
      full_name: u.full_name,
      avatar_url: u.avatar_url,
      xp: scoreByUser[u.id] ?? 0,
      isCurrentUser: u.id === user.id,
    }))

    // Écart leagueXp jusqu'au top 10 (en score scopé).
    const myScore = scoreByUser[user.id] ?? 0
    const tenth = ranked[9]
    xpToTop10 = userRank > 10 && tenth ? Math.max(0, (scoreByUser[tenth.id] ?? 0) - myScore) : 0
  }

  // Suggested challenge
  const { data: suggestedChallenge } = await supabaseAdmin
    .from('challenges')
    .select('*')
    .eq('league_id', userLeague?.id)
    .eq('is_published', true)
    .order('xp_reward', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Completed challenges in current league+specialty (2nd progress bar).
  // PHASE 3 — scopé par specialty_id pour rester cohérent avec le comptage
  // min_challenges de checkAndUpdateLeague (PHASE 2).
  let completedInLeague = 0
  if (userLeague?.id && userSpecialtyId) {
    const { data: leagueChallengeIds } = await supabaseAdmin
      .from('challenges')
      .select('id')
      .eq('league_id', userLeague.id)
      .eq('is_published', true)
      .eq('specialty_id', userSpecialtyId)
    const challengeIdList = (leagueChallengeIds ?? []).map((c) => c.id)
    if (challengeIdList.length > 0) {
      const { count } = await supabase
        .from('participations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'submitted')
        .in('challenge_id', challengeIdList)
      completedInLeague = count ?? 0
    }
  }
  const minChallenges = userLeague?.min_challenges ?? 3
  const minChallengesEnabled = userLeague?.min_challenges_enabled ?? true

  // XP earned today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { data: todaySubmissions } = await supabase
    .from('submissions')
    .select('xp_earned')
    .eq('user_id', user.id)
    .gte('created_at', today.toISOString())

  const xpToday =
    todaySubmissions?.reduce((s, sub) => s + (sub.xp_earned || 0), 0) || 0

  // Completed today (submitted participations updated today)
  const { count: completedTodayCount } = await supabase
    .from('participations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'submitted')
    .gte('updated_at', today.toISOString())

  // (Classement scopé — userRank / totalInLeague / neighborUsers / xpToTop10 —
  // calculé plus haut via getScopedLeagueScores.)

  // Analytics — last 7 days (actual data)
  const since = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
  since.setHours(0, 0, 0, 0)

  const [{ data: subsLast7 }, { data: partsLast7 }] = await Promise.all([
    supabase
      .from('submissions')
      .select('xp_earned, created_at')
      .eq('user_id', user.id)
      .gte('created_at', since.toISOString()),
    supabase
      .from('participations')
      .select('created_at')
      .eq('user_id', user.id)
      .eq('status', 'submitted')
      .gte('created_at', since.toISOString()),
  ])

  const xpData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(since)
    d.setDate(since.getDate() + i)
    const dayKey = d.toISOString().split('T')[0]
    const xp = (subsLast7 ?? [])
      .filter((s) => (s.created_at || '').startsWith(dayKey))
      .reduce((acc, s) => acc + (s.xp_earned || 0), 0)
    return {
      day: d.toLocaleDateString('en', { weekday: 'short' }),
      xp,
    }
  })

  const challengeData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(since)
    d.setDate(since.getDate() + i)
    const dayKey = d.toISOString().split('T')[0]
    const count = (partsLast7 ?? []).filter((p) =>
      (p.created_at || '').startsWith(dayKey),
    ).length
    return {
      day: d.toLocaleDateString('en', { weekday: 'short' }),
      count,
    }
  })

  const firstName =
    profile?.first_name ||
    profile?.full_name?.split(' ')[0] ||
    profile?.username ||
    'Designer'

  const [dict, lang] = await Promise.all([getDict(), getLang()])
  const taxoMaps = await getTaxonomyMaps()
  const suggestedChallengeL = suggestedChallenge ? localizeChallenge(suggestedChallenge as any, lang) : null
  const suggestedType = suggestedChallenge ? localizeType(suggestedChallenge as any, lang, taxoMaps) : undefined
  // Localize the active challenge embedded on the participation (countdown card title).
  if (participation?.challenges) {
    ;(participation as any).challenges = localizeChallenge((participation as any).challenges, lang)
  }

  return (
    <div className="max-w-[1140px] mx-auto px-4 py-6 pb-28 sm:px-6 sm:py-8 sm:pb-8 space-y-4">

      <DashboardProfileHeader profile={profile} t={dict.dashboard.profileHeader} />

      <StatCards
        profile={profile}
        userRank={userRank}
        totalInLeague={totalInLeague || 1}
        completedTotal={totalCompleted}
        completedThisWeek={completedThisWeek}
        xpToday={xpToday}
        leagueIndex={leagueIndex}
        userLeague={userLeague}
        t={dict.dashboard.statCards}
      />

      <div className="grid lg:grid-cols-2 gap-4">
        <LeagueSection
          profile={profile}
          league={userLeague}
          nextLeague={nextLeague}
          userRank={userRank}
          totalInLeague={totalInLeague || 50}
          currentXP={currentXP}
          threshold={threshold}
          suggestedChallenge={suggestedChallengeL}
          completedInLeague={completedInLeague}
          minChallenges={minChallenges}
          minChallengesEnabled={minChallengesEnabled}
          t={dict.dashboard.leagueSection}
        />

        <LeagueCountdownCard
          participation={participation}
          suggestedChallenge={suggestedChallengeL}
          participantsCount={participantsCount}
          participantAvatars={participantAvatars}
          t={dict.dashboard.countdownCard}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <WhatToDoNow
          suggestedChallenge={suggestedChallengeL}
          suggestedType={suggestedType}
          referralsCount={referrals.length}
          profile={profile}
          t={dict.dashboard.whatToDoNow}
        />
        <ContextualLeaderboard
          users={neighborUsers}
          userRank={userRank || 1}
          totalInLeague={totalInLeague || 50}
          league={userLeagueName}
          xpToTop10={xpToTop10}
          t={dict.dashboard.contextualLeaderboard}
        />
      </div>

      <div id="invite">
        <InviteFriends profile={profile} referrals={referrals} t={dict.dashboard.inviteFriends} />
      </div>

      <CompleteProfile profile={profile} t={dict.dashboard.completeProfile} />

      <Analytics
        profile={profile}
        xpData={xpData}
        challengeData={challengeData}
        streak={streak}
        totalCompleted={totalCompleted}
        firstName={firstName}
        t={dict.dashboard.analytics}
      />

      <p className="text-center text-xs text-muted-foreground pb-8">
        {tx(dict.dashboard.keepGoing, { name: firstName })}
      </p>
    </div>
  )
}
