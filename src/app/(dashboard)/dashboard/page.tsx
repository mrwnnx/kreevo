import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Trophy, Zap, Star, ArrowRight, Clock, Play } from 'lucide-react'
import { xpProgressInCurrentLevel, leagueColor, leagueLabel, levelFromXp } from '@/lib/utils/xp'
import { CountdownTimer } from '@/components/features/challenge/CountdownTimer'
import type { Profile, Challenge } from '@/types/database.types'

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
  ])

  if (!profile) redirect('/login')

  const p = profile as Profile
  const level = levelFromXp(p.xp)
  const xp = xpProgressInCurrentLevel(p.xp)

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto pb-10">

      {/* Welcome banner */}
      <div className="rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white">
        <p className="text-sm font-medium opacity-80 mb-1">Welcome back</p>
        <h2 className="text-2xl font-bold mb-4">@{p.username}</h2>
        <div className="flex items-center gap-6 text-sm flex-wrap">
          <div>
            <p className="opacity-70">League</p>
            <p className="font-semibold">{leagueLabel(p.league)}</p>
          </div>
          <div>
            <p className="opacity-70">Level</p>
            <p className="font-semibold">{level}</p>
          </div>
          <div>
            <p className="opacity-70">Total XP</p>
            <p className="font-semibold">{p.xp.toLocaleString()}</p>
          </div>
          <div>
            <p className="opacity-70">Plan</p>
            <p className="font-semibold capitalize">{p.plan}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Star className="size-4 text-yellow-500" /> XP Progress
            </div>
            <p className="text-xl font-bold">{xp.current} / {xp.required}</p>
            <Progress value={xp.percent} className="h-1.5" />
            <p className="text-xs text-muted-foreground">{xp.percent}% to level {level + 1}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Trophy className="size-4 text-violet-500" /> Submissions
            </div>
            <p className="text-xl font-bold">{submissions?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">Challenges attempted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 space-y-2">
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

      {/* Active Participations */}
      {activeParticipations && activeParticipations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-base font-semibold">Mes participations actives</h3>
            <span className="size-5 rounded-full bg-green-100 text-green-700 text-xs flex items-center justify-center font-bold">
              {activeParticipations.length}
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {(activeParticipations as any[]).map(part => (
              <div key={part.id} className="rounded-xl border border-green-200 bg-green-50/50 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-green-700 uppercase tracking-wide">{part.challenges?.track}</p>
                    <p className="text-sm font-semibold">{part.challenges?.title}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-green-600">
                    <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                    En cours
                  </span>
                </div>
                <CountdownTimer deadline={part.personal_deadline} label="Deadline personnelle" compact />
                <Link
                  href={`/dashboard/challenges/${part.challenges?.id}`}
                  className="inline-flex items-center justify-center w-full gap-2 rounded-lg border border-green-300 bg-white px-3 h-8 text-xs font-medium text-green-700 hover:bg-green-50 transition-colors"
                >
                  <Play className="size-3" fill="currentColor" />
                  Soumettre mon travail
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Briefs en cours */}
      {startedBriefs && startedBriefs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-base font-semibold">Mes briefs en cours</h3>
            <span className="size-5 rounded-full bg-amber-100 text-amber-700 text-xs flex items-center justify-center font-bold">
              {startedBriefs.length}
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
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
                    className="inline-flex items-center justify-center w-full gap-2 rounded-lg border border-amber-300 bg-white px-3 h-8 text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors"
                  >
                    <Play className="size-3" fill="currentColor" />
                    Soumettre mon travail
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Active Challenges */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold">Active Challenges</h3>
          <Link href="/dashboard/challenges" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            View all <ArrowRight className="size-3" />
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
                    className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-2.5 h-7 text-xs font-medium hover:bg-muted transition-colors"
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

      {/* Recent Submissions */}
      {submissions && submissions.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-4">Recent Submissions</h3>
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
