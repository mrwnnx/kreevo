import { MarketingStatCard } from './MarketingStatCard'

/**
 * StatsSection — rangée de stat cards façon « Ipsum » : largeurs inégales, fonds
 * variés (tokens DS uniquement), grand chiffre + label court + sous-texte.
 * Réutilise MarketingStatCard (recette DS du StatCard, non modifié).
 */

/* ── Chiffres éditables ici (placeholders copy — valeurs Kreevo réelles) ── */
const STATS = [
  { variant: 'card',   label: 'Designers',          value: '73',              sub: 'designers qui pratiquent', span: 'lg:col-span-2', imageSrc: '/marketing/designers.avif' },
  { variant: 'muted',  label: 'Challenges relevés', value: '74',              sub: 'briefs réels à relever',   span: 'lg:col-span-1' },
  { variant: 'dark',   label: 'Ligues à débloquer', value: '8',               sub: 'de Stone à Legend',        span: 'lg:col-span-1' },
  { variant: 'accent', label: 'Specialties',        value: 'UX·UI + Graphic', sub: 'deux parcours', span: 'lg:col-span-2', valueClass: 'text-2xl sm:text-3xl' },
] as const

export function StatsSection() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {STATS.map((s) => (
          <MarketingStatCard
            key={s.label}
            variant={s.variant}
            label={s.label}
            value={s.value}
            sub={s.sub}
            valueClass={'valueClass' in s ? s.valueClass : undefined}
            imageSrc={'imageSrc' in s ? s.imageSrc : undefined}
            className={s.span}
          />
        ))}
      </div>
    </section>
  )
}

export default StatsSection
