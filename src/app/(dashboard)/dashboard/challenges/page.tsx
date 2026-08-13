import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { GLASS_SURFACE, GLASS_GRADIENT } from '@/components/layout/GlassShell'
import Link from 'next/link'
import { Lock, Clock, ArrowRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getLeagueThreshold, getScopedLeagueScores } from '@/lib/utils/leagues'
import { cooldownRemainingMs, isInCooldown } from '@/lib/utils/participation-cooldown'
import { LeagueIcon } from '@/components/features/league/LeagueIcon'
import { Avatar, AvatarImage, AvatarFallback, AvatarGroup } from '@/components/ui/avatar'
import { getDict, getLang, tx } from '@/lib/i18n/lang'
import { localizeChallenges } from '@/lib/challenges/i18n'
import { getTaxonomyMaps, localizeType, localizeIndustry, type TaxonomyMaps } from '@/lib/challenges/refs'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

// ── Pastel palette — each card a different hue, all at a uniform 95% lightness ──
// Top block: hsl(H, S%, 95%) in light / hsl(H, 40%, 13%) in dark. Pills slightly darker.
const PASTELS: { top: string; pill: string; xp: string }[] = [
  { top: 'bg-[hsl(217,91%,95%)] dark:bg-[hsl(217,40%,13%)]', pill: 'bg-[hsl(217,75%,86%)] text-[hsl(217,55%,30%)] dark:bg-[hsl(217,40%,24%)] dark:text-[hsl(217,70%,82%)]', xp: 'bg-gradient-to-br from-[hsl(205,95%,50%)] to-[hsl(270,88%,52%)] text-white' },
  { top: 'bg-[hsl(25,95%,95%)] dark:bg-[hsl(25,40%,13%)]',   pill: 'bg-[hsl(25,80%,86%)] text-[hsl(25,60%,32%)] dark:bg-[hsl(25,40%,24%)] dark:text-[hsl(25,75%,82%)]',   xp: 'bg-gradient-to-br from-[hsl(38,98%,52%)] to-[hsl(338,90%,52%)] text-white' },
  { top: 'bg-[hsl(263,85%,95%)] dark:bg-[hsl(263,40%,13%)]', pill: 'bg-[hsl(263,70%,86%)] text-[hsl(263,50%,32%)] dark:bg-[hsl(263,40%,24%)] dark:text-[hsl(263,65%,82%)]', xp: 'bg-gradient-to-br from-[hsl(255,88%,56%)] to-[hsl(318,82%,50%)] text-white' },
  { top: 'bg-[hsl(152,60%,95%)] dark:bg-[hsl(152,35%,13%)]', pill: 'bg-[hsl(152,50%,84%)] text-[hsl(152,45%,28%)] dark:bg-[hsl(152,35%,24%)] dark:text-[hsl(152,55%,80%)]', xp: 'bg-gradient-to-br from-[hsl(145,80%,38%)] to-[hsl(192,90%,40%)] text-white' },
  { top: 'bg-[hsl(350,89%,95%)] dark:bg-[hsl(350,40%,13%)]', pill: 'bg-[hsl(350,75%,86%)] text-[hsl(350,55%,34%)] dark:bg-[hsl(350,40%,24%)] dark:text-[hsl(350,70%,82%)]', xp: 'bg-gradient-to-br from-[hsl(338,90%,56%)] to-[hsl(28,95%,54%)] text-white' },
  { top: 'bg-[hsl(190,80%,95%)] dark:bg-[hsl(190,40%,13%)]', pill: 'bg-[hsl(190,65%,84%)] text-[hsl(190,55%,28%)] dark:bg-[hsl(190,40%,24%)] dark:text-[hsl(190,65%,80%)]', xp: 'bg-gradient-to-br from-[hsl(185,92%,42%)] to-[hsl(232,90%,52%)] text-white' },
  { top: 'bg-[hsl(43,96%,95%)] dark:bg-[hsl(43,40%,13%)]',   pill: 'bg-[hsl(43,85%,84%)] text-[hsl(43,70%,30%)] dark:bg-[hsl(43,40%,24%)] dark:text-[hsl(43,80%,80%)]',   xp: 'bg-gradient-to-br from-[hsl(52,98%,54%)] to-[hsl(18,95%,52%)] text-[hsl(28,90%,13%)]' },
  { top: 'bg-[hsl(290,80%,95%)] dark:bg-[hsl(290,40%,13%)]', pill: 'bg-[hsl(290,65%,86%)] text-[hsl(290,50%,34%)] dark:bg-[hsl(290,40%,24%)] dark:text-[hsl(290,65%,82%)]', xp: 'bg-gradient-to-br from-[hsl(278,82%,54%)] to-[hsl(335,85%,54%)] text-white' },
]

// ── Types ─────────────────────────────────────────────────────────────────────
interface LeagueRow {
  id: string; name: string; icon: string; color: string
  order_index: number; access: string; min_challenges: number; is_active: boolean
}

interface ChallengeRow {
  id: string; title: string; brief: string
  specialty: string | null; specialty_id: string | null; challenge_type_id: string | null; industry_id: string | null
  emoji: string | null
  xp_reward: number | null; deadline_days: number | null
  league_id: string | null; is_published: boolean
  leagues: LeagueRow | null
}

type ChallengeStatus = 'available' | 'active' | 'locked' | 'completed' | 'blocked' | 'cooldown' | 'reopened'

// ── ChallengeCard ─────────────────────────────────────────────────────────────
function ChallengeCard({
  challenge, status, cooldownHoursLeft, participantCount, participants, colorIndex = 0, t, typeLabel, industryLabel,
}: {
  challenge: ChallengeRow
  status: ChallengeStatus
  cooldownHoursLeft?: number
  participantCount?: number
  participants?: Array<{ username: string; avatar_url: string | null }>
  colorIndex?: number
  t: Dictionary['challengesPage']
  typeLabel?: string
  industryLabel?: string
}) {
  const isClickable =
    status === 'available' ||
    status === 'active' ||
    status === 'completed' ||
    status === 'cooldown' ||
    status === 'reopened'
  const style = PASTELS[colorIndex % PASTELS.length]
  const emoji =
    challenge.emoji ||
    (challenge.specialty === 'UX Designer' ? '📱'
    : challenge.specialty === 'UI Designer' ? '🎨'
    : challenge.specialty === 'Graphic Designer' ? '✏️'
    : '🎯')
  const tags = [challenge.specialty, typeLabel, industryLabel].filter(Boolean) as string[]

  const card = (
    <div className={cn(
      'group relative block overflow-hidden rounded-[28px] border-[1.973px] border-white p-2 shadow-[0px_3.945px_44.385px_0px_rgba(0,0,0,0.1)] backdrop-blur-[59.18px] transition-[translate,scale,box-shadow] duration-[1100ms] ease-[cubic-bezier(0,0,0,0.99)] hover:-translate-y-[9px] hover:scale-[1.006] hover:shadow-[0px_18px_60px_0px_rgba(0,0,0,0.14)] motion-reduce:transition-none motion-reduce:hover:translate-y-0',
      // 'available' : on garde l'anneau blanc du verre, pas de bordure neutre.
      status === 'active'    && 'border-green-400 dark:border-green-600 shadow-sm shadow-green-500/10',
      status === 'completed' && 'opacity-90',
      status === 'locked'    && 'cursor-default opacity-50',
      status === 'blocked'   && 'cursor-default opacity-60',
      status === 'cooldown'  && 'border-amber-300 dark:border-amber-700 shadow-sm shadow-amber-500/10',
      status === 'reopened'  && 'border-emerald-400 dark:border-emerald-600 shadow-sm shadow-emerald-500/10 hover:shadow-lg',
    )} style={GLASS_GRADIENT}>

      {status === 'blocked' && (
        <div className="absolute inset-0 bg-card/85 backdrop-blur-[2px] flex items-center justify-center z-10 p-4">
          <p className="text-xs text-center text-muted-foreground font-medium leading-relaxed">
            {t.blockedOverlay}
          </p>
        </div>
      )}

      {/* Pastel inner frame — 24px gap between title+desc / tags / xp+deadline */}
      <div className={cn('rounded-[20px] p-4 flex flex-col gap-6', style.top)}>
        {/* Title + description grouped (same auto-layout) */}
        <div>
          <div className="text-3xl mb-6 leading-none">{emoji}</div>
          <h3 className="text-2xl font-semibold text-foreground leading-tight">
            {challenge.title}
          </h3>
          <p className="mt-1 text-sm text-foreground/70 leading-snug">
            {challenge.brief}
          </p>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className={cn('rounded-lg px-3 py-1 text-sm font-medium', style.pill)}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* XP + deadline — XP emphasized pill, deadline muted */}
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {challenge.xp_reward != null && challenge.xp_reward > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-bold text-zinc-900 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/xp-flash.svg" alt="" className="size-4" />
              {challenge.xp_reward} {t.xp}
            </span>
          )}
          {challenge.deadline_days != null && (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Clock className="size-4" />
              <strong className="font-semibold text-foreground">{challenge.deadline_days}</strong>{t.daysSuffix}
            </span>
          )}
        </div>
      </div>

      {/* White footer: meta + round arrow button */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {status === 'active' ? (
            <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
              <span className="size-1.5 rounded-full bg-green-500 animate-pulse" /> {t.inProgress}
            </span>
          ) : status === 'cooldown' ? (
            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
              <Clock className="size-3" />
              {tx(t.cooldownBadge, { h: cooldownHoursLeft ?? 0 })}
            </span>
          ) : status === 'reopened' ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
              <span className="size-1.5 rounded-full bg-emerald-500" /> {t.reopenedBadge}
            </span>
          ) : participants && participants.length > 0 && (
            <div className="flex items-center gap-2 ps-1">
              <AvatarGroup data-size="sm">
                {participants.slice(0, 3).map((p) => (
                  <Avatar key={p.username} size="sm">
                    {p.avatar_url && <AvatarImage src={p.avatar_url} alt={p.username} />}
                    <AvatarFallback>{p.username?.[0]?.toUpperCase() ?? '?'}</AvatarFallback>
                  </Avatar>
                ))}
              </AvatarGroup>
              <strong className="font-semibold text-foreground">{participantCount ?? participants.length}</strong>
            </div>
          )}
        </div>

        <span className={cn(
          'size-9 rounded-full border flex items-center justify-center shrink-0 transition-colors',
          status === 'completed' && 'border-green-400 text-green-600 dark:text-green-400',
          status === 'locked'    && 'border-border text-muted-foreground',
          status === 'cooldown'  && 'border-amber-300 text-amber-600 dark:text-amber-400',
          status === 'reopened'  && 'border-emerald-400 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500',
          (status === 'available' || status === 'active') && 'border-border text-foreground group-hover:bg-foreground group-hover:text-background',
        )}>
          {status === 'completed' ? <Check className="size-4" />
            : status === 'locked' ? <Lock className="size-4" />
            : status === 'cooldown' ? <Clock className="size-4" />
            : <ArrowRight className="size-4" />}
        </span>
      </div>
    </div>
  )

  if (!isClickable) return card
  return <Link href={`/dashboard/challenges/${challenge.id}`}>{card}</Link>
}

// ── Page ──────────────────────────────────────────────────────────────────────
type Filter = 'todo' | 'done'

export default async function ChallengesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const sp = await searchParams
  const filter: Filter = sp.filter === 'done' ? 'done' : 'todo'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Parallel data fetches
  const [
    { data: profileData },
    { data: allLeagues },
    { data: allChallenges },
    { data: activePartRows },
    { data: expiredPartRows },
    { data: userSubmissions },
    { data: allPartRows },
  ] = await Promise.all([
    supabase.from('profiles').select('league, plan, xp, specialty, specialty_id').eq('id', user.id).single(),
    (supabaseAdmin as any)
      .from('leagues')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true }),
    (supabaseAdmin as any)
      .from('challenges')
      .select('*, leagues(id, name, icon, color, order_index, access, min_challenges, is_active)')
      .eq('is_published', true)
      .order('created_at', { ascending: false }),
    (supabase as any)
      .from('participations')
      .select('id, challenge_id, personal_deadline')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('personal_deadline', new Date().toISOString())
      .limit(1),
    // Expired participations — surface cooldown / "can reparticipate" state on the list.
    (supabase as any)
      .from('participations')
      .select('challenge_id, personal_deadline')
      .eq('user_id', user.id)
      .eq('status', 'expired'),
    supabase.from('submissions').select('challenge_id').eq('user_id', user.id),
    (supabaseAdmin as any)
      .from('participations')
      .select('challenge_id, user_id'),
  ])

  const profile = profileData as any
  const lang = await getLang()
  const taxoMaps: TaxonomyMaps = await getTaxonomyMaps()
  const leagues: LeagueRow[] = allLeagues ?? []
  const challenges: ChallengeRow[] = localizeChallenges((allChallenges ?? []) as ChallengeRow[], lang)
  const activeParticipation = ((activePartRows as any[]) ?? [])[0] ?? null
  const submittedIds = new Set((userSubmissions ?? []).map((s: any) => s.challenge_id))

  // Map challenge_id → personal_deadline (ISO) for expired participations.
  // UNIQUE(challenge_id, user_id) guarantees at most one row per challenge.
  const expiredDeadlineByChallenge = new Map<string, string>()
  for (const p of ((expiredPartRows as any[]) ?? [])) {
    if (p.challenge_id && p.personal_deadline) {
      expiredDeadlineByChallenge.set(p.challenge_id, p.personal_deadline)
    }
  }

  // Participation counts per challenge
  const partCounts: Record<string, number> = {}
  for (const p of (allPartRows ?? []) as any[]) {
    partCounts[p.challenge_id] = (partCounts[p.challenge_id] ?? 0) + 1
  }

  // Participants (with avatars) per challenge — fetch profiles for unique user_ids
  const uniqueUserIds = [...new Set(((allPartRows ?? []) as any[]).map((p) => p.user_id))]
  const { data: participantProfiles } = uniqueUserIds.length > 0
    ? await (supabaseAdmin as any)
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', uniqueUserIds)
    : { data: [] }
  const profileById = new Map<string, { username: string; avatar_url: string | null }>(
    ((participantProfiles ?? []) as any[]).map((p) => [p.id, { username: p.username, avatar_url: p.avatar_url }])
  )
  const participantsByChallenge: Record<string, Array<{ username: string; avatar_url: string | null }>> = {}
  for (const p of (allPartRows ?? []) as any[]) {
    const prof = profileById.get(p.user_id)
    if (!prof) continue
    if (!participantsByChallenge[p.challenge_id]) participantsByChallenge[p.challenge_id] = []
    participantsByChallenge[p.challenge_id].push(prof)
  }

  // Find user's current league in new table
  const userLeagueName = (profile?.league ?? '') as string
  const userLeagueRow = leagues.find(l => l.name.toLowerCase() === userLeagueName.toLowerCase()) ?? null
  const userLeagueIndex = userLeagueRow?.order_index ?? 0

  // PHASE 2/4 — spécialité du user (FK), source unique pour le seuil ET le filtrage.
  const profileSpecialtyId = (profile?.specialty_id ?? null) as string | null

  // XP threshold + leagueXp + completed count for current league
  let leagueXpThreshold = 0
  let leagueChallengesCompleted = 0
  let leagueXp = 0

  if (userLeagueRow && profileSpecialtyId) {
    // L'affichage reflète EXACTEMENT la logique de promotion (checkAndUpdateLeague) :
    // seuil scopé + leagueXp (XP gagné dans la ligue courante) via la MÊME source
    // getScopedLeagueScores. La barre = leagueXp / seuil, pas profiles.xp (= total).
    leagueXpThreshold = await getLeagueThreshold(userLeagueRow.id, profileSpecialtyId)
    const scores = await getScopedLeagueScores(userLeagueRow.id, profileSpecialtyId)
    leagueXp = scores[user.id] ?? 0

    const leagueChallengeIds = challenges
      .filter(c => c.league_id === userLeagueRow.id && c.specialty_id === profileSpecialtyId)
      .map(c => c.id)

    leagueChallengesCompleted = leagueChallengeIds.filter(id => submittedIds.has(id)).length
  }

  // PHASE 4 — filtrage par FK specialty_id (remplace l'heuristique regex texte).
  // Un user ne voit que les challenges de SA spé. NULL spé → aucun (liste vide + CTA).
  function matchesUserSpecialty(c: ChallengeRow): boolean {
    if (!profileSpecialtyId) return false
    return c.specialty_id === profileSpecialtyId
  }

  // My league challenges (sorted: active first)
  const myLeagueChallenges = challenges.filter(c => {
    if (!c.league_id) return false
    const cl = c.leagues
    if (!cl) return false
    if (!matchesUserSpecialty(c)) return false
    if (!userLeagueRow) return cl.order_index === 1
    return cl.order_index === userLeagueIndex
  })

  const activeChallId = activeParticipation?.challenge_id ?? null
  const sortedMyLeague = [...myLeagueChallenges].sort((a, b) => {
    if (a.id === activeChallId) return -1
    if (b.id === activeChallId) return 1
    return 0
  })

  // Pro gate: user is free but current league is pro_only
  const isPro = profile?.plan === 'pro' || profile?.plan === 'studio'
  const isProGated = (userLeagueRow?.access === 'pro_only') && !isPro

  // Progress percentages
  const minCh = userLeagueRow?.min_challenges ?? 3
  // Barre de promotion : leagueXp courant (pas profiles.xp, qui est le total carrière).
  const userXp = leagueXp

  const dict = await getDict()
  const t = dict.challengesPage

  return (
    <div className="mx-auto max-w-[1140px] space-y-8 p-6 pb-16">

      {/* ── Header card (profile-card style) with floating league avatars ── */}
      <div
        className={`${GLASS_SURFACE} relative flex items-start justify-center overflow-clip rounded-[32px]`}
        style={GLASS_GRADIENT}
      >
        {/* Halos internes (Figma 489:2947 / 489:2949) */}
        <span aria-hidden className="pointer-events-none absolute -end-[137px] top-1/2 size-[369px] -translate-y-1/2 rounded-full bg-[#f3cbc7] opacity-[0.42] blur-[165.751px]" />
        <span aria-hidden className="pointer-events-none absolute -start-[197px] top-1/2 size-[369px] -translate-y-1/2 rounded-full bg-[#c6dbe9] opacity-50 blur-[149.29px]" />

        {/* Illustration cible (Figma 489:2951) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/illu-challenges.png"
          alt=""
          aria-hidden
          className="pointer-events-none absolute -end-[180px] top-1/2 hidden h-[560px] w-[587px] max-w-none -translate-y-1/2 object-cover opacity-40 sm:block"
        />

        <div className="relative flex min-w-px flex-[1_0_0] flex-col items-start rounded-[32px] border-[0.986px] border-[#dcdce8] p-[24px]">
          <div className="flex flex-col items-start gap-[16px]">
            <div className="flex flex-col items-start gap-[8px]">
              <h1 className="text-[48px] font-semibold leading-[1.1] text-[#2b2c36]">{t.title}</h1>
              <p className="text-[16px] font-normal leading-[1.2] text-[#484848]">{t.motivation}</p>
            </div>

            {userLeagueRow && (
              <div
                className={`${GLASS_SURFACE} flex items-center justify-center rounded-[7.891px] shadow-[0px_2px_14px_0px_rgba(0,0,0,0.1)]`}
                style={GLASS_GRADIENT}
              >
                <div className="flex flex-col items-start rounded-[7.891px] border-[0.986px] border-[#dcdce8] p-[7.891px]">
                  <div className="flex items-center gap-[16px]">
                    <span className="flex items-center gap-[4px] text-[14px] font-semibold leading-[1.2] text-[#080808]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/brand/icon-star-xp.png" alt="" aria-hidden className="h-[15px] w-[16px] object-contain" />
                      {userXp.toLocaleString()} / {leagueXpThreshold.toLocaleString()} {t.xp}
                    </span>
                    <span aria-hidden className="h-4 w-px bg-[#dcdce8]" />
                    <span className="flex items-center gap-[4px] text-[14px] font-semibold leading-[1.2] text-[#080808]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/brand/icon-trophy.png" alt="" aria-hidden className="size-[16px] object-contain" />
                      {leagueChallengesCompleted} / {minCh} {t.challengesCompleted}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Pro upgrade gate ── */}
      {isProGated && (
        <div className="rounded-2xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-900/10 p-5 flex items-center justify-between gap-4">
          <p className="text-sm font-medium text-purple-700 dark:text-purple-400">
            {tx(t.proGate, { icon: userLeagueRow?.icon ?? '', league: userLeagueRow?.name ?? '' })}
          </p>
          <Link
            href="/dashboard/settings"
            className="shrink-0 inline-flex items-center gap-1.5 bg-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
          >
            {t.upgradeCta}
          </Link>
        </div>
      )}

      {/* ── Section 1 : Mes challenges ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {userLeagueRow && <LeagueIcon icon={userLeagueRow.icon} size="lg" />}
          <h3 className="text-base font-semibold">
            {userLeagueRow ? tx(t.leaguePrefix, { name: userLeagueRow.name }) : t.fallbackTitle}
          </h3>
          <span className="text-sm text-muted-foreground">({sortedMyLeague.length})</span>
        </div>

        {/* Filter tabs */}
        {(() => {
          const todoCount = sortedMyLeague.filter(c => !submittedIds.has(c.id)).length
          const doneCount = sortedMyLeague.filter(c => submittedIds.has(c.id)).length
          const tabs: Array<{ key: Filter; label: string; count: number }> = [
            { key: 'todo', label: t.tabs.todo, count: todoCount },
            { key: 'done', label: t.tabs.done, count: doneCount },
          ]
          return (
            <div className="inline-flex p-1 bg-muted/60 rounded-full w-fit">
              {tabs.map(t => {
                const active = filter === t.key
                const href = t.key === 'todo' ? '/dashboard/challenges' : `/dashboard/challenges?filter=${t.key}`
                return (
                  <Link
                    key={t.key}
                    href={href}
                    className={cn(
                      'inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                      active
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {t.label}
                    <span className={cn(
                      'text-[11px] font-semibold tabular-nums tracking-tight',
                      active ? 'text-muted-foreground' : 'text-muted-foreground/60',
                    )}>
                      {t.count}
                    </span>
                  </Link>
                )
              })}
            </div>
          )
        })()}

        {activeParticipation && (
          <div className="rounded-xl border border-green-200 bg-green-50/50 dark:border-green-900/40 dark:bg-green-900/10 px-4 py-3 text-sm text-green-700 dark:text-green-400">
            {t.activeWarning}
          </div>
        )}

        {(() => {
          // PHASE 4 — pas de spécialité → aucun challenge participable : CTA dédié.
          if (!profileSpecialtyId) {
            return (
              <div className="space-y-3 rounded-[24px] border border-dashed border-[#dcdce8] bg-white/40 p-12 text-center backdrop-blur-[59.18px]">
                <p className="text-sm font-medium">{t.noSpecialtyTitle}</p>
                <Link
                  href="/dashboard/settings"
                  className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-full hover:opacity-85 transition-opacity"
                >
                  {t.noSpecialtyCta}
                </Link>
              </div>
            )
          }

          const visible = sortedMyLeague.filter(c =>
            filter === 'done' ? submittedIds.has(c.id) : !submittedIds.has(c.id),
          )

          if (visible.length === 0) {
            return (
              <div className="rounded-[24px] border border-dashed border-[#dcdce8] bg-white/40 p-12 text-center text-sm text-[#484848] backdrop-blur-[59.18px]">
                {filter === 'done' ? t.empty.done : t.empty.todo}
              </div>
            )
          }

          return (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map((c, i) => {
                let status: ChallengeStatus = 'available'
                let cooldownHoursLeft: number | undefined
                const expiredAt = expiredDeadlineByChallenge.get(c.id)
                if (submittedIds.has(c.id))            status = 'completed'
                else if (activeChallId === c.id)        status = 'active'
                else if (activeParticipation)           status = 'blocked'
                else if (expiredAt) {
                  if (isInCooldown(expiredAt)) {
                    status = 'cooldown'
                    cooldownHoursLeft = Math.ceil(cooldownRemainingMs(expiredAt) / 3600000)
                  } else {
                    status = 'reopened'
                  }
                }
                else if (isProGated)                    status = 'locked'

                return (
                  <ChallengeCard
                    key={c.id}
                    challenge={c}
                    status={status}
                    typeLabel={localizeType(c, lang, taxoMaps)}
                    industryLabel={localizeIndustry(c, lang, taxoMaps)}
                    cooldownHoursLeft={cooldownHoursLeft}
                    participantCount={partCounts[c.id]}
                    participants={participantsByChallenge[c.id]}
                    colorIndex={i}
                    t={t}
                  />
                )
              })}
            </div>
          )
        })()}
      </div>

    </div>
  )
}
