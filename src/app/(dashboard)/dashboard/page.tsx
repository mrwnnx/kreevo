import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Trophy, Zap, Star, ArrowRight, Clock, Play } from 'lucide-react'
import { xpProgressInCurrentLevel, leagueColor, leagueLabel, levelFromXp } from '@/lib/utils/xp'
import { CountdownTimer } from '@/components/features/challenge/CountdownTimer'
import { GettingStarted } from '@/components/features/dashboard/GettingStarted'
import { StreakCard } from '@/components/features/dashboard/StreakCard'
import { LeagueCard } from '@/components/features/dashboard/LeagueCard'
import { HeroProfile } from '@/components/features/dashboard/HeroProfile'
import type { Profile, Challenge } from '@/types/database.types'
import type { League } from '@/lib/utils/xp'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: challenges },
    { data: submissions },
    { data: activeParticipations },
    { data: startedBriefs },
    { count: participationCount },
    { count: submissionCount },
    { count: briefCount },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('challenges').select('*').eq('status', 'active').order('closes_at', { ascending: true }).limit(3),
    supabase.from('submissions').select('*, challenges(title, track)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
    (supabase as any)
      .from('participations')
      .select('*, challenges(id, title, track, closes_at)')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('personal_deadline', { ascending: true }),
    (supabase as any)
      .from('random_briefs')
      .select('id, brief_text, prompt, deadline_at')
      .eq('user_id', user.id)
      .eq('status', 'started')
      .order('deadline_at', { ascending: true }),
    (supabase as any)
      .from('participations')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    (supabase as any)
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    (supabase as any)
      .from('random_briefs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    // Last 7 days activity for streak
    (supabase as any)
      .from('participations')
      .select('created_at')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
      .order('created_at', { ascending: false }),
  ])

  if (!profile) redirect('/login')

  const p = profile as Profile

  // Rank queries (need profile.xp first)
  const [{ count: usersAhead }, { count: totalUsers }] = await Promise.all([
    (supabase as any).from('profiles').select('id', { count: 'exact', head: true }).gt('xp', p.xp),
    (supabase as any).from('profiles').select('id', { count: 'exact', head: true }),
  ])
  const rank = usersAhead !== null ? usersAhead + 1 : null

  const level = levelFromXp(p.xp)
  const xp = xpProgressInCurrentLevel(p.xp)

  // ── Getting Started steps ──
  const gettingStartedSteps = [
    {
      id: 'profile',
      label: 'Compléter ton profil',
      done: !!(p.full_name && p.avatar_url),
      href: '/dashboard/profile',
    },
    {
      id: 'challenge',
      label: 'Rejoindre ton premier challenge',
      done: (participationCount ?? 0) > 0,
      href: '/dashboard/challenges',
    },
    {
      id: 'submission',
      label: 'Soumettre un travail',
      done: (submissionCount ?? 0) > 0,
      href: '/dashboard/challenges',
    },
    {
      id: 'brief',
      label: 'Générer un brief random',
      done: (briefCount ?? 0) > 0,
      href: '/dashboard/brief',
    },
    {
      id: 'like',
      label: 'Recevoir un like',
      done: (p.xp ?? 0) > 0,
      href: '/dashboard/leaderboard',
    },
  ]

  // ── Streak calculation ──
  const now = new Date()
  const todayIndex = (now.getDay() + 6) % 7 // 0=lundi

  const activeDays = Array(7).fill(false)
  if (recentActivity) {
    for (const item of recentActivity as any[]) {
      const d = new Date(item.created_at)
      const dayIndex = (d.getDay() + 6) % 7
      activeDays[dayIndex] = true
    }
  }

  // Simple streak: consecutive days from today backwards
  let streak = 0
  for (let i = todayIndex; i >= 0; i--) {
    if (activeDays[i]) streak++
    else break
  }

  return (
    <div className="p-6 max-w-4xl mx-auto pb-10 space-y-6">

      {/* ── Hero Profile ── */}
      <HeroProfile
        username={p.username}
        fullName={p.full_name}
        avatarUrl={p.avatar_url}
        specialty={p.specialty ?? null}
        bio={p.bio ?? null}
        country={p.country ?? null}
        league={p.league as League}
        xp={p.xp}
        submissionCount={submissionCount ?? 0}
        rank={rank}
        totalUsers={totalUsers ?? 0}
      />

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Star className="size-4 text-yellow-500" /> XP Progress
            </div>
            <p className="text-xl font-bold">{xp.current} / {xp.required}</p>
            <Progress value={xp.percent} className="h-1.5" />
            <p className="text-xs text-muted-foreground">{xp.percent}% to level {level + 1}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Trophy className="size-4 text-violet-500" /> Submissions
            </div>
            <p className="text-xl font-bold">{submissionCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">Challenges soumis</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap className="size-4 text-blue-500" /> League
            </div>
            <p className="text-xl font-bold" style={{ color: leagueColor(p.league) }}>
              {leagueLabel(p.league)}
            </p>
            <p className="text-xs text-muted-foreground">{p.xp} XP total</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Grid 2 colonnes : Getting Started + Participations | Streak + League ── */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* Colonne gauche */}
        <div className="space-y-6">
          <GettingStarted steps={gettingStartedSteps} />

          {/* Participations actives */}
          {activeParticipations && activeParticipations.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Participations actives</h3>
                <span className="size-5 rounded-full bg-green-100 text-green-700 text-xs flex items-center justify-center font-bold">
                  {activeParticipations.length}
                </span>
              </div>
              {(activeParticipations as any[]).map(part => (
                <div key={part.id} className="rounded-xl border border-green-200 bg-green-50/50 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium text-green-700 uppercase tracking-wide">{part.challenges?.track}</p>
                      <p className="text-sm font-semibold">{part.challenges?.title}</p>
                    </div>
                    <span className="flex items-center gap-1 text-xs text-green-600 shrink-0">
                      <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                      En cours
                    </span>
                  </div>
                  <CountdownTimer deadline={part.personal_deadline} label="Deadline personnelle" compact />
                  <Link
                    href={`/dashboard/challenges/${part.challenges?.id}`}
                    className="inline-flex items-center justify-center w-full gap-2 rounded-full border border-green-300 bg-white px-3 h-8 text-xs font-medium text-green-700 hover:bg-green-50 transition-colors"
                  >
                    <Play className="size-3" fill="currentColor" />
                    Soumettre mon travail
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Briefs en cours */}
          {startedBriefs && startedBriefs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">Briefs en cours</h3>
                <span className="size-5 rounded-full bg-amber-100 text-amber-700 text-xs flex items-center justify-center font-bold">
                  {startedBriefs.length}
                </span>
              </div>
              {(startedBriefs as any[]).map((brief: any) => {
                let title = 'Brief'
                try { title = JSON.parse(brief.brief_text)?.title ?? 'Brief' } catch { /* ignore */ }
                return (
                  <div key={brief.id} className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-medium text-amber-700 uppercase tracking-wide">
                          {brief.prompt?.domain} · {brief.prompt?.type}
                        </p>
                        <p className="text-sm font-semibold line-clamp-1">{title}</p>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-amber-600 shrink-0">
                        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                        En cours
                      </span>
                    </div>
                    <CountdownTimer deadline={brief.deadline_at} label="Deadline" compact />
                    <Link
                      href={`/dashboard/brief/${brief.id}`}
                      className="inline-flex items-center justify-center w-full gap-2 rounded-full border border-amber-300 bg-white px-3 h-8 text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors"
                    >
                      <Play className="size-3" fill="currentColor" />
                      Soumettre mon travail
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div className="space-y-6">
          <StreakCard
            streak={streak}
            activeDays={activeDays}
            todayIndex={todayIndex}
          />
          <LeagueCard
            league={p.league as League}
            xp={p.xp}
            plan={p.plan}
          />
        </div>
      </div>

      {/* ── Challenges actifs ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">Challenges actifs</h3>
          <Link href="/dashboard/challenges" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            Voir tout <ArrowRight className="size-3" />
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {(challenges as Challenge[])?.map(c => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-semibold leading-snug">{c.title}</CardTitle>
                  <Badge variant="secondary" className="text-xs shrink-0 capitalize">{c.level}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground line-clamp-2">{c.brief}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3" />
                    {new Date(c.closes_at).toLocaleDateString('fr', { month: 'short', day: 'numeric' })}
                  </span>
                  <Link
                    href={`/dashboard/challenges/${c.id}`}
                    className="inline-flex items-center justify-center rounded-full border border-border bg-background px-2.5 h-7 text-xs font-medium hover:bg-muted transition-colors"
                  >
                    Participer
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
          {(!challenges || challenges.length === 0) && (
            <div className="col-span-3 rounded-xl border border-dashed p-12 text-center text-sm text-muted-foreground">
              Aucun challenge actif pour l&apos;instant.
            </div>
          )}
        </div>
      </div>

      {/* ── Activité récente ── */}
      {submissions && submissions.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-4">Activité récente</h3>
          <div className="space-y-2">
            {(submissions as any[]).map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/40 transition-colors">
                <div>
                  <p className="text-sm font-medium">{s.challenges?.title ?? 'Challenge'}</p>
                  <p className="text-xs text-muted-foreground capitalize">{s.challenges?.track}</p>
                </div>
                <div className="flex items-center gap-2">
                  {s.xp_earned > 0 && <span className="text-xs font-semibold text-violet-600">+{s.xp_earned} XP</span>}
                  <Badge variant={s.is_visible ? 'default' : 'secondary'}>
                    {s.is_visible ? 'visible' : 'draft'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
