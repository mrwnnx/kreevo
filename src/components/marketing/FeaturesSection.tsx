import { cn } from '@/lib/utils'
import { LeagueIcon } from '@/components/features/league/LeagueIcon'
import { LEAGUE_ICONS } from '@/lib/utils/xp'
import { ChallengePreviewCard, type ChallengePreview } from '@/components/features/challenge/ChallengePreviewCard'

/**
 * FeaturesSection — grille 2×2 de « mini-cartes flottantes » (réf. visuelle Aeline,
 * structure seulement : zone déco flottante en haut + titre/sous-texte centrés en bas).
 *
 * REBUILD from scratch avec le design system Kreevo :
 *   - conteneur : rounded-[24px] (radius signature) bg-card + border + shadow
 *   - zone déco : aspect-[4/3] overflow-hidden, panneau bg-secondary, radius concentrique
 *     (24px ext − 12px padding ≈ 12px int)
 *   - éléments flottants : WRAPPERS (rotation/scale/blur/z) autour des PRIMITIVES réelles
 *     (LeagueIcon, ChallengePreviewCard) — primitives jamais modifiées.
 *   - mobile-first : rotations à 0 sur mobile (base) → inclinées à partir de `sm:`.
 *   - tokens uniquement, zéro hex, aucune nouvelle font.
 *
 * ⚠️ Titres/sous-textes = PLACEHOLDERS (copy FR/EN/AR final fourni plus tard → i18n).
 */

const COPY = {
  header:    { title: 'Tout pour progresser pour de vrai', body: 'Des briefs réels, un feedback IA, un système de ligues et un portfolio public — réunis pour faire décoller ta pratique.' },
  leagues:   { title: 'Monte les ligues',                  sub: 'De Stone à Legend — chaque ligue débloque des briefs plus exigeants.' },
  feedback:  { title: 'Un feedback qui te fait progresser', sub: 'L’IA note chaque soumission et te dit précisément où t’améliorer.' },
  portfolio: { title: 'Ton portfolio, partageable',         sub: 'Tes meilleurs travaux réunis sur une page publique à ton nom.' },
  reveal:    { title: 'Le grand reveal',                    sub: 'Les soumissions se dévoilent toutes à la fin du challenge.' },
}

/* Données échantillon — challenges Kreevo crédibles (UX/UI + graphic). */
const SAMPLES: ChallengePreview[] = [
  { emoji: '📱', title: 'Refonte app mobile néobanque', brief: 'Repense l’expérience d’une app bancaire mobile centrée sur l’épargne.', specialty: 'UX Designer', type: 'Redesign', xp: 1200, deadlineDays: 30 },
  { emoji: '✏️', title: 'Identité visuelle festival musique', brief: 'Crée l’identité complète d’un festival de musique indépendant.', specialty: 'Graphic Designer', type: 'Brand Identity', xp: 900, deadlineDays: 21 },
  { emoji: '🎨', title: 'Design system SaaS analytics', brief: 'Construis le design system d’un produit SaaS d’analytics B2B.', specialty: 'UI Designer', type: 'Design System', xp: 1500, deadlineDays: 45 },
  { emoji: '🎨', title: 'Landing page produit IA', brief: 'Conçois la landing d’un nouvel outil d’IA générative pour créatifs.', specialty: 'UI Designer', type: 'Landing', xp: 700, deadlineDays: 14 },
]

/* Carte feature : conteneur signature + panneau déco (haut) + texte centré (bas). */
function FeatureCard({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[24px] bg-card p-3">
      {/* Panneau déco — radius concentrique (24 − 12 = 12), clip des éléments flottants */}
      <div className="relative aspect-square overflow-hidden rounded-[12px] bg-secondary">
        {children}
      </div>
      <div className="px-3 pb-4 pt-5 text-center">
        <h3 className="font-heading text-2xl font-semibold leading-tight tracking-tight text-foreground">{title}</h3>
        <p className="mx-auto mt-2 max-w-[34ch] text-sm leading-relaxed text-muted-foreground">{sub}</p>
      </div>
    </div>
  )
}

/* Pastille de ligue flottante : LeagueIcon réel dans un disque teinté du token de ligue. */
function LeagueChip({ name, bg, ring, wrap }: { name: string; bg: string; ring: string; wrap: string }) {
  return (
    <div className={cn('rounded-full bg-card p-2 shadow-xl ring-1 ring-border', wrap)}>
      <div className={cn('flex size-12 items-center justify-center rounded-full ring-1 sm:size-14', bg, ring)}>
        <LeagueIcon icon={LEAGUE_ICONS[name]} size="xl" />
      </div>
    </div>
  )
}

/* Wrapper de carte flottante (rotation/scale/blur/z) autour d'une ChallengePreviewCard. */
function FloatCard({ className, children }: { className: string; children: React.ReactNode }) {
  return <div className={cn('absolute w-[200px] origin-center', className)}>{children}</div>
}

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      {/* Header de section — titre + body (placeholders, i18n plus tard) */}
      <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
        <h2 className="font-heading text-3xl font-bold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
          {COPY.header.title}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {COPY.header.body}
        </p>
      </div>

      {/* Frame unique gris clair regroupant les 4 cartes */}
      <div className="rounded-[28px] bg-secondary/50 p-2 backdrop-blur-xl">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">

        {/* 1 — SYSTÈME DE LIGUES : 3 LeagueIcon flottants inclinés + pill XP */}
        <FeatureCard title={COPY.leagues.title} sub={COPY.leagues.sub}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-end">
              <LeagueChip name="Gold"   bg="bg-league-gold/15"   ring="ring-league-gold/40"   wrap="z-10 translate-y-3 rotate-0 sm:-rotate-12" />
              <LeagueChip name="Master" bg="bg-league-master/15" ring="ring-league-master/40" wrap="z-20 -mx-2 sm:scale-110" />
              <LeagueChip name="Legend" bg="bg-league-legend/15" ring="ring-league-legend/40" wrap="z-10 translate-y-3 rotate-0 sm:rotate-12" />
            </div>
          </div>
          {/* pill XP (track bg-secondary / fill bg-primary, tokens only) */}
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 shadow-md sm:bottom-4">
            <span className="text-xs font-bold text-foreground">+1500</span>
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
              <div className="h-full w-2/3 rounded-full bg-primary" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground">XP</span>
          </div>
        </FeatureCard>

        {/* 2 — FEEDBACK IA : mini-carte feedback flottante (score + lignes), tokens only */}
        <FeatureCard title={COPY.feedback.title} sub={COPY.feedback.sub}>
          <div className="absolute inset-0 flex items-center justify-center">
            {/* carte fantôme derrière (profondeur) */}
            <div className="absolute w-[72%] max-w-[230px] rotate-0 rounded-[16px] border border-border bg-card opacity-60 shadow-lg blur-[1px] sm:rotate-6">
              <div className="h-28" />
            </div>
            {/* carte feedback nette */}
            <div className="relative w-[76%] max-w-[240px] rotate-0 rounded-[16px] border border-border bg-card p-4 shadow-xl sm:-rotate-6">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 ring-1 ring-primary/20">
                  <span className="text-lg font-bold text-foreground">92</span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">Feedback IA</p>
                  <p className="truncate text-xs text-muted-foreground">Score global / 100</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-2 w-full rounded-full bg-muted" />
                <div className="h-2 w-4/5 rounded-full bg-muted" />
                <div className="h-2 w-3/5 rounded-full bg-muted" />
              </div>
            </div>
          </div>
        </FeatureCard>

        {/* 3 — PORTFOLIO PUBLIC : 2 ChallengePreviewCard réelles, réduites + inclinées */}
        <FeatureCard title={COPY.portfolio.title} sub={COPY.portfolio.sub}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-[180px] w-[260px]">
              <FloatCard className="left-[2%] top-[10%] scale-[0.62] rotate-0 opacity-95 sm:-rotate-8">
                <ChallengePreviewCard colorIndex={4} {...SAMPLES[1]} />
              </FloatCard>
              <FloatCard className="left-[34%] top-[20%] z-10 scale-[0.66] rotate-0 sm:rotate-6">
                <ChallengePreviewCard colorIndex={0} {...SAMPLES[0]} />
              </FloatCard>
            </div>
          </div>
        </FeatureCard>

        {/* 4 — LE GRAND REVEAL (signature) : 3 cartes empilées, arrière floutées → avant nette */}
        <FeatureCard title={COPY.reveal.title} sub={COPY.reveal.sub}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-[190px] w-[260px]">
              {/* arrière — le plus flouté/petit/incliné/effacé */}
              <FloatCard className="left-1/2 top-[16%] -translate-x-1/2 scale-[0.56] rotate-0 opacity-55 blur-[5px] sm:-rotate-[14deg]">
                <ChallengePreviewCard colorIndex={2} {...SAMPLES[2]} />
              </FloatCard>
              {/* milieu — flou moyen */}
              <FloatCard className="left-1/2 top-[12%] -translate-x-1/2 scale-[0.6] rotate-0 opacity-80 blur-[2px] sm:rotate-[10deg]">
                <ChallengePreviewCard colorIndex={6} {...SAMPLES[3]} />
              </FloatCard>
              {/* avant — net, le plus grand, devant (le reveal) */}
              <FloatCard className="left-1/2 top-[8%] z-10 -translate-x-1/2 scale-[0.66] rotate-0 sm:-rotate-[3deg]">
                <ChallengePreviewCard colorIndex={0} {...SAMPLES[0]} />
              </FloatCard>
            </div>
          </div>
        </FeatureCard>

      </div>
      </div>
    </section>
  )
}

export default FeaturesSection
