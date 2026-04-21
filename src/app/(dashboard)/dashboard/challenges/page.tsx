import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, Users } from 'lucide-react'
import type { Challenge } from '@/types/database.types'
import { cn } from '@/lib/utils'

// ── Track config ─────────────────────────────────────────────
const TRACK_CONFIG: Record<string, { icon: string; bg: string }> = {
  ux_ui:   { icon: '📱', bg: 'bg-violet-100' },
  graphic: { icon: '🎨', bg: 'bg-orange-100' },
  motion:  { icon: '✨', bg: 'bg-pink-100'   },
  '3d':    { icon: '🧊', bg: 'bg-green-100'  },
  branding:{ icon: '💎', bg: 'bg-yellow-100' },
  web:     { icon: '🌐', bg: 'bg-blue-100'   },
}

const DEFAULT_TRACK = { icon: '🎨', bg: 'bg-muted' }

// ── Level badge ───────────────────────────────────────────────
const LEVEL_STYLE: Record<string, string> = {
  rookie:        'bg-green-100 text-green-700',
  rising:        'bg-blue-100 text-blue-700',
  pro:           'bg-orange-100 text-orange-700',
  elite:         'bg-red-100 text-red-700',
  legend:        'bg-purple-100 text-purple-700',
  beginner:      'bg-green-100 text-green-700',
  intermediate:  'bg-orange-100 text-orange-700',
  advanced:      'bg-red-100 text-red-700',
}

// ── Deadline label ────────────────────────────────────────────
function deadlineLabel(closesAt: string) {
  const diff = new Date(closesAt).getTime() - Date.now()
  const days = Math.ceil(diff / 86400000)
  if (days < 0) return 'Terminé'
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Demain'
  return `${days}j restants`
}

// ── ChallengeCard ─────────────────────────────────────────────
function ChallengeCard({
  challenge,
  hasSubmitted,
  participantCount,
}: {
  challenge: Challenge
  hasSubmitted: boolean
  participantCount: number
}) {
  const track = TRACK_CONFIG[challenge.track] ?? DEFAULT_TRACK
  const levelStyle = LEVEL_STYLE[challenge.level] ?? 'bg-muted text-muted-foreground'
  const closed = new Date(challenge.closes_at) < new Date()

  return (
    <Link
      href={`/dashboard/challenges/${challenge.id}`}
      className="group flex flex-col bg-card border border-border rounded-2xl p-5 gap-4 hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    >
      {/* Top row: icon + badge */}
      <div className="flex items-start justify-between gap-3">
        {/* Track icon */}
        <div className={cn('size-12 rounded-xl flex items-center justify-center text-2xl shrink-0', track.bg)}>
          {track.icon}
        </div>
        {/* Level badge */}
        <span className={cn('text-[12px] font-medium px-3 py-1 rounded-full capitalize shrink-0', levelStyle)}>
          {challenge.level}
        </span>
      </div>

      {/* Title + description */}
      <div className="space-y-1 flex-1">
        <h3 className="text-base font-medium text-foreground leading-snug group-hover:text-primary transition-colors">
          {challenge.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {challenge.brief}
        </p>
      </div>

      {/* Separator */}
      <div className="border-t border-border/60" />

      {/* Footer: meta + button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <Calendar className="size-3.5 shrink-0" />
            {deadlineLabel(challenge.closes_at)}
          </span>
          {participantCount > 0 && (
            <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Users className="size-3.5 shrink-0" />
              {participantCount} designer{participantCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <span
          className={cn(
            'inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full border transition-all shrink-0',
            hasSubmitted
              ? 'border-border text-muted-foreground'
              : closed
                ? 'border-border text-muted-foreground'
                : 'border-primary/30 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary'
          )}
        >
          {hasSubmitted ? 'Soumis ✓' : closed ? 'Terminé' : 'Participer'}
        </span>
      </div>
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────
export default async function ChallengesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: active },
    { data: past },
    { data: userSubmissions },
    { data: participations },
  ] = await Promise.all([
    supabase.from('challenges').select('*').eq('status', 'active').order('closes_at', { ascending: true }),
    supabase.from('challenges').select('*').in('status', ['closed', 'archived']).order('closes_at', { ascending: false }).limit(12),
    supabase.from('submissions').select('challenge_id').eq('user_id', user.id),
    (supabase as any).from('participations').select('challenge_id'),
  ])

  const submittedIds = new Set((userSubmissions ?? []).map((s: any) => s.challenge_id))

  // Participation counts per challenge
  const partCounts: Record<string, number> = {}
  for (const p of (participations ?? []) as { challenge_id: string }[]) {
    partCounts[p.challenge_id] = (partCounts[p.challenge_id] ?? 0) + 1
  }

  const EmptyState = ({ msg }: { msg: string }) => (
    <div className="rounded-2xl border border-dashed p-16 text-center text-sm text-muted-foreground">
      {msg}
    </div>
  )

  return (
    <div className="p-6 max-w-4xl mx-auto pb-16 space-y-6">

      <div>
        <h2 className="text-2xl font-bold mb-1">Design Challenges</h2>
        <p className="text-sm text-muted-foreground">
          Rejoins un challenge, soumets ton travail, gagne des XP et grimpe dans les ligues.
        </p>
      </div>

      <Tabs defaultValue="active">
        {/* Pill-style tabs */}
        <TabsList className="bg-transparent p-0 gap-2 h-auto">
          <TabsTrigger
            value="active"
            className="px-4 py-2 h-auto rounded-full border border-border text-sm font-medium
              data-active:bg-foreground data-active:text-background data-active:border-foreground
              hover:border-foreground/40 transition-all"
          >
            Actifs ({active?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="px-4 py-2 h-auto rounded-full border border-border text-sm font-medium
              data-active:bg-foreground data-active:text-background data-active:border-foreground
              hover:border-foreground/40 transition-all"
          >
            Passés
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-6">
          {active && active.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(active as Challenge[]).map(c => (
                <ChallengeCard
                  key={c.id}
                  challenge={c}
                  hasSubmitted={submittedIds.has(c.id)}
                  participantCount={partCounts[c.id] ?? 0}
                />
              ))}
            </div>
          ) : (
            <EmptyState msg="Aucun challenge actif pour l'instant. Les nouveaux challenges arrivent chaque mois." />
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {past && past.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(past as Challenge[]).map(c => (
                <ChallengeCard
                  key={c.id}
                  challenge={c}
                  hasSubmitted={submittedIds.has(c.id)}
                  participantCount={partCounts[c.id] ?? 0}
                />
              ))}
            </div>
          ) : (
            <EmptyState msg="Aucun challenge passé pour l'instant." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
