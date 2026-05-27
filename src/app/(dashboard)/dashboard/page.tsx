import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { DashboardProfileHeader } from '@/components/dashboard/DashboardProfileHeader'
import { getDict, getLang, tx } from '@/lib/i18n/lang'
import { StatCards } from '@/components/dashboard/StatCards'
import { LeagueSection, LeagueCountdownCard } from '@/components/dashboard/LeagueSection'
import { WhatToDoNow } from '@/components/dashboard/WhatToDoNow'
import { ContextualLeaderboard } from '@/components/dashboard/ContextualLeaderboard'
import { InviteFriends } from '@/components/dashboard/InviteFriends'
import { CompleteProfile } from '@/components/dashboard/CompleteProfile'
import { Analytics } from '@/components/dashboard/Analytics'

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
    (supabase as any).from('profiles').select('*').eq('id', user.id).single(),

    (supabase as any)
      .from('participations')
      .select('*, challenges(id, title, xp_reward, deadline_days, specialty, challenge_type)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('personal_deadline', new Date().toISOString())
      .order('personal_deadline', { ascending: true })
      .limit(1)
      .maybeSingle(),

    (supabase as any).from('streaks').select('*').eq('user_id', user.id).maybeSingle(),

    (supabase as any)
      .from('referrals')
      .select('*, referred:profiles!referred_id(username, avatar_url)')
      .eq('referrer_id', user.id),

    (supabaseAdmin as any).from('leagues').select('*').order('order_index'),

    (supabase as any)
      .from('participations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'submitted'),

    (supabase as any)
      .from('participations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'submitted')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),

    (supabase as any)
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
      (supabaseAdmin as any)
        .from('participations')
        .select('id', { count: 'exact', head: true })
        .eq('challenge_id', participation.challenge_id),
      (supabaseAdmin as any)
        .from('participations')
        .select('user_id')
        .eq('challenge_id', participation.challenge_id)
        .limit(5),
    ])
    participantsCount = count ?? 0
    const ids = (parts ?? []).map((p: any) => p.user_id)
    if (ids.length) {
      const { data: profs } = await (supabaseAdmin as any)
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', ids)
      participantAvatars = profs ?? []
    }
  }

  const streak = streakResult.data
  const referrals: any[] = referralsResult.data ?? []
  const allLeagues: any[] = leagueResult.data ?? []
  const totalCompleted = completedResult.count ?? 0
  const completedThisWeek = thisWeekResult.count ?? 0
  const lastSubmissionDate = lastSubResult.data?.created_at
    ? new Date(lastSubResult.data.created_at)
    : null

  const userLeagueName = profile?.league || 'Stone'
  const userLeague = allLeagues.find(
    (l: any) => l.name.toLowerCase() === userLeagueName.toLowerCase(),
  ) || allLeagues.find((l: any) => l.name === 'Stone') || allLeagues[0]
  const leagueIndex = userLeague?.order_index || 1
  const nextLeague = allLeagues.find((l: any) => l.order_index === leagueIndex + 1)

  // XP threshold for current league
  const { data: leagueChallenges } = await (supabaseAdmin as any)
    .from('challenges')
    .select('xp_reward')
    .eq('league_id', userLeague?.id)
    .eq('is_published', true)

  const totalLeagueXP =
    (leagueChallenges as any[] | null)?.reduce(
      (s: number, c: any) => s + (c.xp_reward || 0),
      0,
    ) || 1000
  const thresholdPercent = userLeague?.xp_threshold_percent ?? 60
  const threshold = Math.floor((totalLeagueXP * thresholdPercent) / 100)
  const currentXP = profile?.xp || 0
  const xpPercent = threshold > 0 ? Math.min((currentXP / threshold) * 100, 100) : 0
  const xpGap = Math.max(0, threshold - currentXP)

  // User rank in league
  const { count: rankCount } = await (supabaseAdmin as any)
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('league', userLeagueName)
    .gt('xp', currentXP)
  const userRank = (rankCount || 0) + 1

  const { count: totalInLeague } = await (supabaseAdmin as any)
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('league', userLeagueName)

  // Suggested challenge
  const { data: suggestedChallenge } = await (supabaseAdmin as any)
    .from('challenges')
    .select('*')
    .eq('league_id', userLeague?.id)
    .eq('is_published', true)
    .order('xp_reward', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Completed challenges in current league (for 2nd progress bar)
  const { data: leagueChallengeIds } = await (supabaseAdmin as any)
    .from('challenges')
    .select('id')
    .eq('league_id', userLeague?.id)
    .eq('is_published', true)
  const challengeIdList = (leagueChallengeIds ?? []).map((c: any) => c.id)
  let completedInLeague = 0
  if (challengeIdList.length > 0) {
    const { count } = await (supabase as any)
      .from('participations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'submitted')
      .in('challenge_id', challengeIdList)
    completedInLeague = count ?? 0
  }
  const minChallenges = userLeague?.min_challenges ?? 3
  const minChallengesEnabled = userLeague?.min_challenges_enabled ?? true

  // XP earned today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { data: todaySubmissions } = await (supabase as any)
    .from('submissions')
    .select('xp_earned')
    .eq('user_id', user.id)
    .gte('created_at', today.toISOString())

  const xpToday =
    (todaySubmissions as any[] | null)?.reduce(
      (s: number, sub: any) => s + (sub.xp_earned || 0),
      0,
    ) || 0

  // Completed today (submitted participations updated today)
  const { count: completedTodayCount } = await (supabase as any)
    .from('participations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'submitted')
    .gte('updated_at', today.toISOString())

  // Contextual leaderboard — neighbors around current user
  const startRange = Math.max(0, userRank - 3)
  const endRange = userRank + 1
  const { data: leaderboardNeighbors } = await (supabaseAdmin as any)
    .from('profiles')
    .select('id, username, full_name, avatar_url, xp')
    .eq('league', userLeagueName)
    .order('xp', { ascending: false })
    .range(startRange, endRange)

  const neighborUsers = (leaderboardNeighbors ?? []).map((u: any, i: number) => ({
    rank: startRange + 1 + i,
    username: u.username,
    full_name: u.full_name,
    avatar_url: u.avatar_url,
    xp: u.xp || 0,
    isCurrentUser: u.id === user.id,
  }))

  // XP gap to top 10
  const { data: top10User } = await (supabaseAdmin as any)
    .from('profiles')
    .select('xp')
    .eq('league', userLeagueName)
    .order('xp', { ascending: false })
    .range(9, 9)
    .maybeSingle()
  const xpToTop10 = userRank > 10 ? Math.max(0, (top10User?.xp || 0) - currentXP) : 0

  // Analytics — last 7 days (actual data)
  const since = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
  since.setHours(0, 0, 0, 0)

  const [{ data: subsLast7 }, { data: partsLast7 }] = await Promise.all([
    (supabase as any)
      .from('submissions')
      .select('xp_earned, created_at')
      .eq('user_id', user.id)
      .gte('created_at', since.toISOString()),
    (supabase as any)
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
    const xp = ((subsLast7 as any[]) || [])
      .filter((s: any) => (s.created_at || '').startsWith(dayKey))
      .reduce((acc: number, s: any) => acc + (s.xp_earned || 0), 0)
    return {
      day: d.toLocaleDateString('en', { weekday: 'short' }),
      xp,
    }
  })

  const challengeData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(since)
    d.setDate(since.getDate() + i)
    const dayKey = d.toISOString().split('T')[0]
    const count = ((partsLast7 as any[]) || []).filter((p: any) =>
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
          suggestedChallenge={suggestedChallenge}
          completedInLeague={completedInLeague}
          minChallenges={minChallenges}
          minChallengesEnabled={minChallengesEnabled}
          t={dict.dashboard.leagueSection}
        />

        <LeagueCountdownCard
          participation={participation}
          suggestedChallenge={suggestedChallenge}
          participantsCount={participantsCount}
          participantAvatars={participantAvatars}
          t={dict.dashboard.countdownCard}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <WhatToDoNow
          suggestedChallenge={suggestedChallenge}
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
