import { MarketingStatCard } from './MarketingStatCard'
import { FallingBadges } from './FallingBadges'

/**
 * StatsSection — rangée de stat cards façon « Ipsum » : 3 colonnes.
 *   col 1 → Designers (image en fond)
 *   col 2 → Challenges relevés
 *   col 3 → Ligues à débloquer + Specialties, empilées sur 2 lignes
 * Réutilise MarketingStatCard (recette DS du StatCard, non modifié). Tokens DS only.
 * Valeurs/copy éditables directement dans le JSX (placeholders).
 */
export function StatsSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      {/* keyframes des badges qui « tombent » (définies hors du <p> des cartes) */}
      <style>{`
        @keyframes kvDrop {
          0%   { transform: translateY(-260%); opacity: 0; }
          55%  { transform: translateY(10%);   opacity: 1; }
          75%  { transform: translateY(-5%); }
          100% { transform: translateY(0);     opacity: 1; }
        }
      `}</style>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Col 1 — Designers (photo) */}
        <MarketingStatCard
          variant="card"
          label={
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/logo_kreevo_white.svg" alt="Kreevo" className="h-4 w-auto" />
          }
          value="73"
          sub="designers qui pratiquent"
          imageSrc="/marketing/designers.avif"
        />

        {/* Col 2 — Challenges */}
        <MarketingStatCard
          variant="muted"
          label="Challenges relevés"
          value="74"
          sub="briefs réels à relever"
        />

        {/* Col 3 — Ligues + Specialties empilées (2 lignes) */}
        <div className="grid grid-rows-2 gap-4">
          <MarketingStatCard
            variant="dark"
            label="Ligues à débloquer"
            value="8"
            sub="de Stone à Legend"
          />
          <MarketingStatCard
            variant="glass"
            label="Specialties"
            value={<FallingBadges items={['UX', 'UI', 'Graphic']} />}
          />
        </div>
      </div>
    </section>
  )
}

export default StatsSection
