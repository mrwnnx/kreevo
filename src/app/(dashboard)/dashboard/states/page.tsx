'use client'

import { useState } from 'react'
import { CountdownTimer } from '@/components/features/challenge/CountdownTimer'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Lock, Sparkles, PartyPopper, ArrowRight, Rocket, Star, AlertTriangle, CheckCircle2 } from 'lucide-react'

// ── Mock data ────────────────────────────────────────────────────────────────

const mockProfile = {
  username: 'marwen',
  full_name: 'Marwen Essalah',
  avatar_url: null as string | null,
  specialty: 'ux_ui',
  league_ux_ui: 'Stone',
  league_graphic: 'Stone',
  xp_ux_ui: 320,
  xp_graphic: 0,
  plan: 'free',
}

const mockLeague = { name: 'Stone', icon: '🪨', color: '#8B8B8B', order_index: 1 }
const mockNextLeague = { name: 'Bronze', icon: '🟤', color: '#CD7F32' }

const mockChallenge = {
  title: 'Flow inscription app fintech',
  specialty: 'UX Designer',
  challenge_type: 'User Flow',
  industry: 'Fintech',
  xp_reward: 200,
  deadline_days: 5,
}

const now = Date.now()

const mockParticipation = {
  id: '1',
  challenge: mockChallenge,
  joined_at: new Date(now - 2 * 24 * 60 * 60 * 1000),
  personal_deadline: new Date(now + 3 * 24 * 60 * 60 * 1000 + 4 * 3600 * 1000 + 22 * 60 * 1000),
  status: 'active',
}

const mockUrgentParticipation = {
  ...mockParticipation,
  personal_deadline: new Date(now + 4 * 3600 * 1000 + 32 * 60 * 1000),
}

const mockChallenges = [
  { id: '1', title: 'Flow inscription app fintech', challenge_type: 'User Flow', industry: 'Fintech',  xp_reward: 200, deadline_days: 5 },
  { id: '2', title: 'Wireframes dashboard SaaS',     challenge_type: 'Wireframes', industry: 'SaaS',     xp_reward: 300, deadline_days: 7 },
  { id: '3', title: 'Prototype app santé',           challenge_type: 'Prototype',  industry: 'Santé',    xp_reward: 400, deadline_days: 10 },
]

const STATES = [
  { id: 1, label: 'Libre',         icon: '🎯' },
  { id: 2, label: 'En cours',      icon: '✏️' },
  { id: 3, label: 'Urgent',        icon: '⚠️' },
  { id: 4, label: 'Soumis',        icon: '✅' },
  { id: 5, label: 'Proche ligue',  icon: '🚀' },
] as const

// ── Reusable bits ────────────────────────────────────────────────────────────

function ChallengeCard({
  c,
  variant = 'default',
  recommended = false,
  small = false,
}: {
  c: typeof mockChallenges[number]
  variant?: 'default' | 'locked' | 'recommended'
  recommended?: boolean
  small?: boolean
}) {
  const isLocked = variant === 'locked'

  return (
    <div
      className={cn(
        'relative rounded-[var(--radius-card)] border bg-card p-5 transition-all',
        !isLocked && variant !== 'recommended' && 'hover:border-primary/40 hover:-translate-y-0.5',
        isLocked && 'opacity-50 grayscale',
        recommended && 'border-2 border-primary bg-primary/5',
        small && 'p-4',
      )}
    >
      {recommended && (
        <span className="absolute -top-3 left-4 inline-flex items-center gap-1 bg-primary text-primary-foreground text-[11px] font-semibold px-2.5 py-1 rounded-full">
          <Star className="size-3 fill-current" /> Recommandé
        </span>
      )}

      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border border-border bg-muted/40">
          {c.challenge_type}
        </span>
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          {c.industry}
        </span>
      </div>

      <h3 className={cn('font-semibold leading-snug mb-3', small ? 'text-sm' : 'text-base')}>{c.title}</h3>

      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
        <span className="font-mono">+{c.xp_reward} XP</span>
        <span>{c.deadline_days}j</span>
      </div>

      {variant === 'recommended' && (
        <p className="text-xs font-medium text-primary mb-3">+{c.xp_reward} XP → Tu passeras Bronze !</p>
      )}

      <button
        disabled={isLocked}
        className={cn(
          'w-full inline-flex items-center justify-center gap-1.5 text-sm font-semibold rounded-[var(--radius-button)] py-2 transition-opacity',
          isLocked
            ? 'bg-muted text-muted-foreground cursor-not-allowed'
            : 'bg-primary text-primary-foreground hover:opacity-85',
        )}
      >
        {isLocked ? <Lock className="size-3.5" /> : null}
        {isLocked ? 'Verrouillé' : 'Participer'}
        {!isLocked && <ArrowRight className="size-3.5" />}
      </button>

      {isLocked && (
        <p className="text-xs text-center text-muted-foreground mt-2 italic">
          Soumets d&apos;abord ton défi en cours
        </p>
      )}
    </div>
  )
}

function HeroFrame({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'urgent' | 'success' }) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border p-6 md:p-8',
        tone === 'default' && 'border-border bg-card',
        tone === 'urgent'  && 'border-red-300 dark:border-red-700 bg-gradient-to-br from-red-500/10 via-orange-500/10 to-red-500/10',
        tone === 'success' && 'border-green-300 dark:border-green-700 bg-gradient-to-br from-green-500/10 via-emerald-500/10 to-teal-500/10',
      )}
    >
      {children}
    </div>
  )
}

function XPBar({ value, total, animated = false, pulse = false }: { value: number; total: number; animated?: boolean; pulse?: boolean }) {
  const pct = Math.min(100, Math.round((value / total) * 100))
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-xs font-mono">
        <span className="text-muted-foreground">{value} / {total} XP</span>
        <span className="text-foreground font-semibold">{pct}%</span>
      </div>
      <div className={cn('relative h-2 w-full rounded-full bg-muted overflow-hidden', pulse && 'animate-pulse')}>
        <div
          className={cn(
            'absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 to-pink-500',
            animated && 'transition-[width] duration-[2s] ease-out',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function LeagueChip({ league, pulsing }: { league: { name: string; icon: string }; pulsing?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-sm font-semibold',
        pulsing && 'animate-pulse',
      )}
    >
      <span className="text-base">{league.icon}</span>
      <span>{league.name}</span>
    </span>
  )
}

// ── State 1 — Libre ──────────────────────────────────────────────────────────

function StateLibre() {
  return (
    <div className="space-y-8">
      <HeroFrame>
        <div className="flex items-center gap-4 mb-5">
          <Avatar className="size-14">
            <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">M</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">Bonjour Marwen 👋</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <LeagueChip league={mockLeague} />
              <span className="text-xs text-muted-foreground">Choisis ton prochain défi</span>
            </div>
          </div>
        </div>
        <XPBar value={320} total={720} />
      </HeroFrame>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Défis disponibles</h2>
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{mockLeague.name}</span>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {mockChallenges.map(c => <ChallengeCard key={c.id} c={c} />)}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Lock className="size-4" />
          <span><strong className="text-foreground">{mockNextLeague.icon} {mockNextLeague.name}</strong> — Complète {mockLeague.name} pour débloquer</span>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {mockChallenges.map(c => <ChallengeCard key={c.id} c={c} variant="locked" />)}
        </div>
      </section>
    </div>
  )
}

// ── State 2 — Confortable ────────────────────────────────────────────────────

function StateConfortable() {
  const total = mockChallenge.deadline_days * 24 * 60 * 60 * 1000
  const remaining = mockParticipation.personal_deadline.getTime() - Date.now()
  const elapsedPct = Math.max(0, Math.min(100, Math.round(((total - remaining) / total) * 100)))

  return (
    <div className="space-y-8">
      <HeroFrame>
        <p className="text-sm font-mono uppercase tracking-widest text-muted-foreground mb-2">Défi en cours ✏️</p>
        <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-6">{mockChallenge.title}</h1>

        <div className="mb-6">
          <CountdownTimer deadline={mockParticipation.personal_deadline.toISOString()} />
        </div>

        <div className="space-y-2 mb-6">
          <div className="flex justify-between text-xs font-mono text-muted-foreground">
            <span>Temps écoulé</span>
            <span>{elapsedPct}%</span>
          </div>
          <div className="relative h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${elapsedPct}%` }} />
          </div>
        </div>

        <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-[var(--radius-button)] hover:opacity-85">
          Continuer mon défi <ArrowRight className="size-4" />
        </button>
      </HeroFrame>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Autres défis disponibles</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {mockChallenges.slice(1).map(c => <ChallengeCard key={c.id} c={c} variant="locked" />)}
        </div>
      </section>
    </div>
  )
}

// ── State 3 — Urgent ─────────────────────────────────────────────────────────

function StateUrgent() {
  return (
    <div className="space-y-8">
      <HeroFrame tone="urgent">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold mb-4">
          <AlertTriangle className="size-5 animate-pulse" />
          <span>Plus que quelques heures !</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-2">{mockChallenge.title}</h1>
        <p className="text-sm text-muted-foreground mb-6">{mockChallenge.challenge_type} · {mockChallenge.industry}</p>

        <div className="mb-8">
          <CountdownTimer deadline={mockUrgentParticipation.personal_deadline.toISOString()} />
        </div>

        <button className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-base font-bold px-8 py-4 rounded-[var(--radius-button)] hover:opacity-90 shadow-lg shadow-red-500/25">
          Soumettre maintenant <ArrowRight className="size-5" />
        </button>

        <p className="text-xs text-red-600 dark:text-red-400 mt-3 font-medium">
          Sinon tu perdras −100 XP
        </p>
      </HeroFrame>
    </div>
  )
}

// ── State 4 — Soumis ─────────────────────────────────────────────────────────

function StateSoumis() {
  return (
    <div className="space-y-8">
      <HeroFrame tone="success">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-semibold mb-4">
          <PartyPopper className="size-5" />
          <span>Bravo !</span>
        </div>

        <p className="text-5xl md:text-6xl font-black bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent mb-2">
          +{mockChallenge.xp_reward} XP
        </p>
        <p className="text-lg font-semibold mb-6 flex items-center gap-2">
          <CheckCircle2 className="size-5 text-green-600" /> Ton travail est soumis
        </p>

        <XPBar value={520} total={720} animated />
      </HeroFrame>

      <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div>
          <h2 className="text-lg font-semibold">Choisis ton prochain défi</h2>
          <p className="text-sm text-muted-foreground">Tu peux maintenant choisir un nouveau défi</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {mockChallenges.map(c => <ChallengeCard key={c.id} c={c} />)}
        </div>
      </section>
    </div>
  )
}

// ── State 5 — Proche ligue ───────────────────────────────────────────────────

function StateProche() {
  const recommended = mockChallenges.reduce((max, c) => (c.xp_reward > max.xp_reward ? c : max), mockChallenges[0])
  const others = mockChallenges.filter(c => c.id !== recommended.id)

  return (
    <div className="space-y-8">
      <HeroFrame>
        <div className="flex items-center gap-3 mb-5">
          <span className="text-3xl animate-pulse">{mockLeague.icon}</span>
          <ArrowRight className="size-5 text-muted-foreground" />
          <span className="text-3xl">{mockNextLeague.icon}</span>
          <Rocket className="size-5 text-primary ml-1" />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-2">
          Il te manque <span className="text-primary">200 XP</span> pour passer {mockNextLeague.name} !
        </h1>
        <p className="text-sm text-muted-foreground mb-6">Tu y es presque — encore un défi.</p>

        <XPBar value={520} total={720} pulse />
      </HeroFrame>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="text-lg font-semibold">Défi recommandé</h2>
        </div>
        <ChallengeCard c={recommended} variant="recommended" recommended />
      </section>

      <section className="space-y-3">
        <p className="text-sm text-muted-foreground">Ou choisis un autre défi</p>
        <div className="grid md:grid-cols-2 gap-4">
          {others.map(c => <ChallengeCard key={c.id} c={c} small />)}
        </div>
      </section>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function StatesDemoPage() {
  const [active, setActive] = useState(1)

  return (
    <div className="min-h-screen pt-24 pb-32 px-4 md:px-8 max-w-6xl mx-auto">
      <header className="mb-8 space-y-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Demo</p>
          <h1 className="text-3xl font-bold">Dashboard — 5 états</h1>
          <p className="text-sm text-muted-foreground mt-1">Switch entre les états pour visualiser le design de chacun. Données mockées.</p>
        </div>

        <div className="flex flex-wrap gap-2 sticky top-4 z-10 bg-background/80 backdrop-blur-md py-2 rounded-full">
          {STATES.map(s => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={cn(
                'inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium border transition-all',
                active === s.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-transparent border-border text-foreground hover:border-primary/40',
              )}
            >
              <span>{s.icon}</span>
              <span className="hidden sm:inline">{s.id}. {s.label}</span>
              <span className="sm:hidden">{s.id}</span>
            </button>
          ))}
        </div>
      </header>

      <main key={active}>
        {active === 1 && <StateLibre />}
        {active === 2 && <StateConfortable />}
        {active === 3 && <StateUrgent />}
        {active === 4 && <StateSoumis />}
        {active === 5 && <StateProche />}
      </main>
    </div>
  )
}
