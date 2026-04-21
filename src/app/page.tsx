import Link from 'next/link'
import { ArrowRight, Trophy, Zap, Star, TrendingUp } from 'lucide-react'

const LEAGUES = [
  { name: 'Rookie',   cls: 'league-rookie',   bg: 'league-bg-rookie',   icon: '○' },
  { name: 'Bronze',   cls: 'league-bronze',   bg: 'league-bg-bronze',   icon: '◐' },
  { name: 'Silver',   cls: 'league-silver',   bg: 'league-bg-silver',   icon: '◑' },
  { name: 'Gold',     cls: 'league-gold',     bg: 'league-bg-gold',     icon: '◕' },
  { name: 'Platinum', cls: 'league-platinum', bg: 'league-bg-platinum', icon: '●' },
  { name: 'Diamond',  cls: 'league-diamond',  bg: 'league-bg-diamond',  icon: '◆' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-border/50">
        <span className="text-base font-bold tracking-tight">kreevo</span>
        <div className="flex items-center gap-6">
          <Link href="/dashboard/challenges" className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono uppercase tracking-wider">
            Challenges
          </Link>
          <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 rounded-md hover:opacity-90 transition-opacity glow-primary"
          >
            Get started <ArrowRight className="size-3" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative px-8 pt-24 pb-20 max-w-5xl mx-auto overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 border border-primary/20 bg-primary/8 text-primary text-xs font-mono px-3 py-1.5 rounded-full mb-8 tracking-wide">
            <span className="size-1.5 rounded-full bg-primary animate-pulse inline-block" />
            April 2026 challenges are live
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-[0.9] mb-6 text-foreground">
            Design.<br />
            <span className="text-primary">Compete.</span><br />
            Level up.
          </h1>

          <p className="text-base text-muted-foreground max-w-lg mb-10 leading-relaxed">
            Weekly real-world design challenges, AI feedback on every submission,
            and a league system that ranks your progress from Rookie to Diamond.
          </p>

          <div className="flex items-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-6 py-3 rounded-md hover:opacity-90 transition-opacity glow-primary"
            >
              Start for free <ArrowRight className="size-4" />
            </Link>
            <span className="text-xs text-muted-foreground font-mono">No credit card required</span>
          </div>
        </div>
      </section>

      {/* ── League system ───────────────────────────────────── */}
      <section className="px-8 py-16 border-y border-border/50">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-8">
            League System
          </p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {LEAGUES.map((l) => (
              <div
                key={l.name}
                className={`${l.bg} border border-border/50 rounded-lg px-4 py-4 text-center space-y-2 hover:border-current/30 transition-colors`}
              >
                <span className={`text-2xl font-mono ${l.cls}`}>{l.icon}</span>
                <p className={`text-xs font-mono font-bold uppercase tracking-wider ${l.cls}`}>
                  {l.name}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4 font-mono">
            Earn XP on every submission → climb from Rookie to Diamond
          </p>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────── */}
      <section className="px-8 py-20 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: Trophy,
              tag: 'Monthly',
              title: 'Real Design Challenges',
              desc: 'Briefs across Mobile UI, Web Design, Branding, Design Systems, Motion. Graded by AI + community.',
              accent: 'text-league-gold',
            },
            {
              icon: Zap,
              tag: 'On-demand',
              title: 'Random Brief Generator',
              desc: 'AI generates custom briefs tailored to your level and track. Practice anytime, earn XP.',
              accent: 'text-primary',
            },
            {
              icon: TrendingUp,
              tag: 'Always-on',
              title: 'Progress & Feedback',
              desc: 'AI analyzes every submission — visual quality, UX thinking, creativity. See exactly where to improve.',
              accent: 'text-league-platinum',
            },
          ].map(({ icon: Icon, tag, title, desc, accent }) => (
            <div key={title} className="card-sharp rounded-lg p-6 space-y-4 hover:border-primary/30 transition-colors group">
              <div className="flex items-center justify-between">
                <Icon className={`size-5 ${accent}`} />
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest border border-border px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1.5">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="px-8 pb-24 max-w-5xl mx-auto">
        <div className="relative rounded-xl border border-primary/20 bg-primary/5 px-10 py-12 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <p className="text-xs font-mono text-primary uppercase tracking-widest mb-4">Ready?</p>
          <h2 className="text-3xl font-bold tracking-tight mb-3">Join the arena</h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">
            Free to start. No credit card. Your first challenge is waiting.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold text-sm px-8 py-3 rounded-md hover:opacity-90 transition-opacity glow-primary"
          >
            Create free account <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="border-t border-border/50 px-8 py-6 flex items-center justify-between">
        <span className="text-xs font-bold tracking-tight">kreevo</span>
        <p className="text-xs font-mono text-muted-foreground">© 2026</p>
      </footer>
    </div>
  )
}
