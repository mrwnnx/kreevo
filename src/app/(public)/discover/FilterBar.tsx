'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

/**
 * FilterBar — bascule Réalisations/Designers, tri et filtres de /discover.
 * Tout l'état vit dans l'URL : la page reste rendue côté serveur, partageable
 * et indexable. Chaque contrôle est un <Link>, pas un onChange.
 */

export type FilterOption = { value: string; label: string }

function buildHref(pathname: string, params: URLSearchParams, key: string, value: string | null) {
  const next = new URLSearchParams(params.toString())
  if (value === null || value === '') next.delete(key)
  else next.set(key, value)
  const qs = next.toString()
  return qs ? `${pathname}?${qs}` : pathname
}

function Pill({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'true' : undefined}
      className={
        active
          ? 'whitespace-nowrap rounded-full border border-[#dcdce8] bg-[#f4f5f7] px-4 py-2 text-[13px] font-semibold text-[#2b2c36]'
          : 'whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-semibold text-[#556971] transition-colors hover:bg-white/60'
      }
    >
      {children}
    </Link>
  )
}

/** Sélecteur natif — un filtre à valeurs nombreuses (pays, outils) n'entre pas en pastilles. */
function Select({
  label,
  paramKey,
  value,
  options,
  pathname,
  params,
  includeEmpty = true,
}: {
  label: string
  paramKey: string
  value: string
  options: FilterOption[]
  pathname: string
  params: URLSearchParams
  /** Le tri a toujours une valeur : pas d'option « tous » en tête. */
  includeEmpty?: boolean
}) {
  return (
    <form action={pathname} className="contents">
      {[...params.entries()]
        .filter(([k]) => k !== paramKey)
        .map(([k, v]) => (
          <input key={`${k}-${v}`} type="hidden" name={k} value={v} />
        ))}
      <select
        name={paramKey}
        defaultValue={value}
        aria-label={label}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="cursor-pointer rounded-full border border-[#dcdce8] bg-white px-4 py-2 text-[13px] font-semibold text-[#556971] outline-none"
      >
        {includeEmpty && <option value="">{label}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </form>
  )
}

export function FilterBar({
  view,
  sort,
  specialties,
  leagues,
  countries,
  tools,
  t,
}: {
  view: 'projects' | 'people'
  sort: 'recent' | 'relevant'
  specialties: FilterOption[]
  leagues: FilterOption[]
  countries: FilterOption[]
  tools: FilterOption[]
  t: Dictionary['discover']
}) {
  const pathname = usePathname()
  const params = useSearchParams()
  const has = (k: string) => params.get(k) ?? ''
  const hasAnyFilter = ['specialty', 'league', 'country', 'tool', 'q'].some((k) => has(k))

  return (
    <div className="flex w-full flex-col gap-[16px]">
      {/* Recherche + bascule de vue sur une même ligne (modèle Contra).
          Form GET : la requête vit dans l'URL comme les filtres. */}
      <div className="flex flex-wrap items-center gap-[12px]">
        <form action={pathname} className="min-w-[260px] flex-1 sm:max-w-[520px]">
          {[...params.entries()]
            .filter(([k]) => k !== 'q')
            .map(([k, v]) => (
              <input key={`q-${k}-${v}`} type="hidden" name={k} value={v} />
            ))}
          <div
            className="flex items-center gap-[8px] rounded-full border border-[#dcdce8] bg-white px-[16px] py-[10px]"
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden className="size-[16px] shrink-0 text-[#71717a]">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              name="q"
              defaultValue={has('q')}
              placeholder={t.searchPlaceholder}
              aria-label={t.searchPlaceholder}
              className="w-full bg-transparent text-[14px] text-[#2b2c36] outline-none placeholder:text-[#9aa3a8]"
            />
          </div>
        </form>

        <div
          className="flex shrink-0 items-center gap-1 rounded-full border border-[#dcdce8] bg-white p-[4px]"
        >
          <Pill href={buildHref(pathname, params, 'view', null)} active={view === 'projects'}>
            {t.viewProjects}
          </Pill>
          <Pill href={buildHref(pathname, params, 'view', 'people')} active={view === 'people'}>
            {t.viewPeople}
          </Pill>
        </div>
      </div>

      {/* Tri + filtres */}
      <div className="flex flex-wrap items-center gap-[8px]">
        {view === 'projects' && (
          <>
            <Select
              label={t.sortRecent}
              paramKey="sort"
              value={sort}
              options={[
                { value: 'recent', label: t.sortRecent },
                { value: 'relevant', label: t.sortRelevant },
              ]}
              includeEmpty={false}
              pathname={pathname}
              params={params}
            />
            <span aria-hidden className="mx-1 h-5 w-px bg-[#dcdce8]" />
          </>
        )}

        <Select label={t.allSpecialties} paramKey="specialty" value={has('specialty')} options={specialties} pathname={pathname} params={params} />
        <Select label={t.allLeagues} paramKey="league" value={has('league')} options={leagues} pathname={pathname} params={params} />
        <Select label={t.allCountries} paramKey="country" value={has('country')} options={countries} pathname={pathname} params={params} />
        <Select label={t.allTools} paramKey="tool" value={has('tool')} options={tools} pathname={pathname} params={params} />

        {hasAnyFilter && (
          <Link
            href={view === 'people' ? `${pathname}?view=people` : pathname}
            className="whitespace-nowrap px-3 py-2 text-[13px] font-semibold text-[#71717a] underline-offset-4 transition-colors hover:text-[#2b2c36] hover:underline"
          >
            {t.clearFilters}
          </Link>
        )}
      </div>
    </div>
  )
}

export default FilterBar
