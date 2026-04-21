import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Clock, Users } from 'lucide-react'
import type { Profile, Challenge } from '@/types/database.types'

const LEVEL_COLOR: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-blue-100 text-blue-700',
  advanced: 'bg-orange-100 text-orange-700',
  expert: 'bg-red-100 text-red-700',
}

const TRACK_ICON: Record<string, string> = {
  'Mobile UI': '📱',
  'Web Design': '🌐',
  'Design Systems': '🧩',
  'Branding': '✨',
  'UX Research': '🔍',
  'Motion': '🎬',
}

function daysLeft(closesAt: string) {
  const diff = new Date(closesAt).getTime() - Date.now()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days < 0) return 'Closed'
  if (days === 0) return 'Closes today'
  return `${days}d left`
}

function ChallengeCard({ challenge, hasSubmitted }: { challenge: Challenge; hasSubmitted: boolean }) {
  return (
    <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{TRACK_ICON[challenge.track] ?? '🎨'}</span>
            <div>
              <CardTitle className="text-sm font-semibold leading-snug group-hover:text-violet-600 transition-colors">
                {challenge.title}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{challenge.track}</p>
            </div>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 capitalize ${LEVEL_COLOR[challenge.level] ?? 'bg-muted text-muted-foreground'}`}>
            {challenge.level}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground line-clamp-2">{challenge.brief}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3" /> {daysLeft(challenge.closes_at)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {hasSubmitted && (
              <Badge variant="secondary" className="text-xs">Submitted</Badge>
            )}
            <Link
              href={`/dashboard/challenges/${challenge.id}`}
              className="inline-flex items-center justify-center rounded-full bg-violet-600 text-white px-3 h-7 text-xs font-medium hover:opacity-85 transition-opacity"
            >
              {hasSubmitted ? 'View' : 'Enter'}
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function ChallengesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: active }, { data: past }, { data: userSubmissions }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('challenges').select('*').eq('status', 'active').order('closes_at', { ascending: true }),
    supabase.from('challenges').select('*').in('status', ['closed', 'archived']).order('closes_at', { ascending: false }).limit(12),
    supabase.from('submissions').select('challenge_id').eq('user_id', user.id),
  ])

  if (!profile) redirect('/login')

  const submittedIds = new Set((userSubmissions ?? []).map((s: any) => s.challenge_id))

  return (
    <div className="pb-10">
      
      <div className="p-6 max-w-4xl mx-auto space-y-6">

        <div>
          <h2 className="text-2xl font-bold mb-1">Design Challenges</h2>
          <p className="text-sm text-muted-foreground">Pick a challenge, submit your work, earn XP and climb the league.</p>
        </div>

        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active ({active?.length ?? 0})</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {active && active.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(active as Challenge[]).map(c => (
                  <ChallengeCard key={c.id} challenge={c} hasSubmitted={submittedIds.has(c.id)} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-16 text-center text-sm text-muted-foreground">
                No active challenges right now. New challenges drop every month.
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            {past && past.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(past as Challenge[]).map(c => (
                  <ChallengeCard key={c.id} challenge={c} hasSubmitted={submittedIds.has(c.id)} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-16 text-center text-sm text-muted-foreground">
                No past challenges yet.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
