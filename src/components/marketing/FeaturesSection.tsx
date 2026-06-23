import { supabaseAdmin } from '@/lib/supabase/admin'
import { getDict } from '@/lib/i18n/lang'
import { type ChallengePreview } from '@/components/features/challenge/ChallengePreviewCard'
import { FeedbackScore } from './FeedbackScore'
import { LeagueClimb } from './LeagueClimb'
import { PortfolioCard } from './PortfolioCard'
import { BriefStack } from './BriefStack'

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

export async function FeaturesSection() {
  // Vrais icônes de ligues (SVG base64 en DB) pour le mini-classement animé.
  const { data: leagueRows } = await supabaseAdmin.from('leagues').select('name, icon')
  const leagueIcons: Record<string, string> = Object.fromEntries(
    (leagueRows ?? []).map((l) => [String(l.name), String(l.icon ?? '')]),
  )

  const dict = await getDict()
  const f = dict.landing.features
  const COPY = {
    header: { title: f.headerTitle, body: f.headerBody },
    leagues: { title: f.leaguesTitle, sub: f.leaguesSub },
    feedback: { title: f.feedbackTitle, sub: f.feedbackSub },
    portfolio: { title: f.portfolioTitle, sub: f.portfolioSub },
    briefs: { title: f.briefsTitle, sub: f.briefsSub },
  }

  return (
    <section id="features" className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      {/* Shimmer « skeleton qui charge » des barres de la carte Feedback IA (reflet clair qui balaie) */}
      <style>{`
        @keyframes kvSkelSweep { 100% { transform: translateX(100%); } }
        .kv-skel { position: relative; overflow: hidden; }
        .kv-skel::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent 0%, color-mix(in oklch, white 60%, transparent) 50%, transparent 100%);
          transform: translateX(-100%);
          animation: kvSkelSweep 1.6s ease-in-out infinite;
          animation-delay: var(--kv-d, 0s);
        }
        @media (prefers-reduced-motion: reduce) { .kv-skel::after { animation: none; } }

        /* La carte Feedback IA « respire » : flottement en DÉBUT de cycle (0→30%) puis repos.
           Le mouvement est calé au tout début pour coïncider avec animationiteration (compteur). */
        @keyframes kvCardBob {
          0%, 30%, 100% { transform: translateY(0) rotate(0deg); }
          8%  { transform: translateY(-8px) rotate(-1.2deg); }
          16% { transform: translateY(-1px) rotate(0.4deg); }
          24% { transform: translateY(-4px) rotate(-0.6deg); }
        }
        .kv-card-bob { animation: kvCardBob 4s ease-in-out infinite; will-change: transform; }
        @media (prefers-reduced-motion: reduce) { .kv-card-bob { animation: none; } }

        /* Horloge 4s du score (même période/phase que le bob) — sert d'émetteur d'événements
           animationiteration, capté en JS pour relancer le décompte 0→92 à chaque cycle. */
        @keyframes kvScoreTick { 0%, 100% { opacity: 1; } }
        .kv-score { animation: kvScoreTick 4s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .kv-score { animation: none; } }

        /* Carte portfolio : flottement doux continu */
        @keyframes kvFloatSoft { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        .kv-float-soft { animation: kvFloatSoft 5s ease-in-out infinite; will-change: transform; }
        @media (prefers-reduced-motion: reduce) { .kv-float-soft { animation: none; } }
      `}</style>

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

        {/* 1 — SYSTÈME DE LIGUES : mini-classement animé (toi grimpes 3ᵉ→1ᵉ puis promotion) */}
        <FeatureCard title={COPY.leagues.title} sub={COPY.leagues.sub}>
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <LeagueClimb icons={leagueIcons} t={{ leaguePrefix: f.leaguePrefix, promoted: f.promoted, you: f.you }} />
          </div>
        </FeatureCard>

        {/* 2 — FEEDBACK IA : mini-carte feedback flottante (score + lignes), tokens only */}
        <FeatureCard title={COPY.feedback.title} sub={COPY.feedback.sub}>
          <div className="absolute inset-0 flex items-center justify-center">
            {/* carte fantôme derrière (profondeur) */}
            <div className="absolute w-[82%] max-w-[270px] rotate-0 rounded-[16px] border border-border bg-card opacity-60 shadow-lg blur-[1px] sm:rotate-6">
              <div className="h-28" />
            </div>
            {/* carte feedback nette — wrapper animé (bob) + carte inclinée à l'intérieur */}
            <div className="kv-card-bob relative w-[86%] max-w-[280px]">
            <div className="rotate-0 rounded-[16px] border border-border bg-card p-4 shadow-xl sm:-rotate-6">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/25">
                  <FeedbackScore to={92} className="kv-score text-lg font-bold text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">Feedback IA</p>
                  <p className="truncate text-xs text-muted-foreground">Score global / 100</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="kv-skel h-2 w-full rounded-full bg-muted" style={{ '--kv-d': '0s' } as React.CSSProperties} />
                <div className="kv-skel h-2 w-4/5 rounded-full bg-muted" style={{ '--kv-d': '0.2s' } as React.CSSProperties} />
                <div className="kv-skel h-2 w-3/5 rounded-full bg-muted" style={{ '--kv-d': '0.4s' } as React.CSSProperties} />
              </div>
            </div>
            </div>
          </div>
        </FeatureCard>

        {/* 3 — PORTFOLIO PUBLIC : carte profil (avatar Notion + XP + rang ligue + grille soumissions) */}
        <FeatureCard title={COPY.portfolio.title} sub={COPY.portfolio.sub}>
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <PortfolioCard leagueIcon={leagueIcons['Gold']} xpEarned={f.xpEarned} leagueLabel={`${f.leaguePrefix} Gold`} />
          </div>
        </FeatureCard>

        {/* 4 — DES BRIEFS RÉELS : pile de cartes challenge, la carte du dessus passe en bas (4s) */}
        <FeatureCard title={COPY.briefs.title} sub={COPY.briefs.sub}>
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <BriefStack items={SAMPLES} colors={[0, 4, 2, 6]} />
          </div>
        </FeatureCard>

      </div>
      </div>
    </section>
  )
}

export default FeaturesSection
