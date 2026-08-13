/**
 * /discover — vitrine publique : toutes les réalisations validées et tous les
 * designers, toutes ligues et spécialités confondues.
 *
 * Deux vues (`?view=projects|people`), tri (`?sort=recent|relevant`) et quatre
 * filtres (`specialty`, `league`, `country`, `tool`) — tout dans l'URL, donc
 * rendu serveur, partageable et indexable.
 *
 * Accès anonyme : lecture via `supabaseAdmin` (même chemin que /designers), et
 * seules les soumissions publiées, validées ET marquées visibles par leur auteur
 * sont exposées.
 */

import Link from 'next/link'
import type { Metadata } from 'next'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { GlassShell } from '@/components/layout/GlassShell'
import { GlassHeader } from '@/components/layout/GlassHeader'
import { getDict } from '@/lib/i18n/lang'
import { XpIcon } from '@/components/ui/XpIcon'
import { FilterBar, type FilterOption } from './FilterBar'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDict()
  return {
    title: `${dict.discover.title} — Kreevo`,
    description: dict.discover.subtitle,
    alternates: { canonical: '/discover' },
  }
}

type SP = Record<string, string | string[] | undefined>
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''

/**
 * Score de pertinence : un like vaut plus qu'un commentaire, qui vaut plus
 * qu'une vue. Divisé par l'âge (en jours, adouci) pour qu'une réalisation
 * récente et aimée passe devant une ancienne qui a simplement eu le temps
 * d'accumuler.
 */
function relevance(s: { total_likes: number | null; comments_count: number | null; views_count: number | null; created_at: string }) {
  const raw = (s.total_likes ?? 0) * 3 + (s.comments_count ?? 0) * 2 + (s.views_count ?? 0) * 0.1
  const ageDays = (Date.now() - new Date(s.created_at).getTime()) / 86_400_000
  return raw / Math.pow(ageDays + 2, 0.35)
}

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const dict = await getDict()

  // Le détail d'une soumission vit sous /dashboard (authentifié). Un visiteur
  // anonyme y serait renvoyé vers /login : on l'envoie plutôt vers le profil
  // public de l'auteur, qui montre le même travail.
  const supabase = await createClient()
  const { data: { user: viewer } } = await supabase.auth.getUser()
  const t = dict.discover

  const view: 'projects' | 'people' = one(sp.view) === 'people' ? 'people' : 'projects'
  const sort: 'recent' | 'relevant' = one(sp.sort) === 'relevant' ? 'relevant' : 'recent'
  const fSpecialty = one(sp.specialty)
  const fLeague = one(sp.league)
  const fCountry = one(sp.country)
  const fTool = one(sp.tool)
  const q = one(sp.q).trim().toLowerCase()

  // ── Référentiels (options de filtres) + profils, en parallèle ──────────────
  const [{ data: specialtyRows }, { data: leagueRows }, { data: profileRows }] = await Promise.all([
    (supabaseAdmin as any).from('specialties').select('id, name, slug').eq('is_active', true).order('order_index'),
    (supabaseAdmin as any).from('leagues').select('id, name, icon, color, order_index').eq('is_active', true).order('order_index'),
    (supabaseAdmin as any)
      .from('profiles')
      .select('id, username, full_name, avatar_url, job_title, league, xp, plan, specialty_id, country, city, tools')
      .eq('onboarding_completed', true)
      .eq('is_suspended', false),
  ])

  const specialties = (specialtyRows ?? []) as { id: string; name: string; slug: string }[]
  const leagues = (leagueRows ?? []) as { id: string; name: string; icon: string | null; color: string | null }[]
  const profiles = (profileRows ?? []) as {
    id: string; username: string; full_name: string | null; avatar_url: string | null
    job_title: string | null; league: string | null; xp: number | null; plan: string | null
    specialty_id: string | null; country: string | null; city: string | null; tools: string[] | null
  }[]

  // Options de filtre dérivées des profils réels — pas de liste figée.
  const countryOptions: FilterOption[] = [...new Set(profiles.map((p) => p.country).filter(Boolean) as string[])]
    .sort()
    .map((c) => ({ value: c, label: c }))
  const toolOptions: FilterOption[] = [...new Set(profiles.flatMap((p) => p.tools ?? []))]
    .sort()
    .map((x) => ({ value: x, label: x }))

  const matchesProfile = (p: (typeof profiles)[number]) =>
    (!fSpecialty || p.specialty_id === fSpecialty) &&
    (!fLeague || (p.league ?? '').toLowerCase() === fLeague.toLowerCase()) &&
    (!fCountry || p.country === fCountry) &&
    (!fTool || (p.tools ?? []).includes(fTool))

  const eligible = profiles.filter(matchesProfile)
  const eligibleIds = new Set(eligible.map((p) => p.id))
  const byId = new Map(eligible.map((p) => [p.id, p]))

  // ── Soumissions publiques : publiées + validées + rendues visibles ─────────
  const { data: subRows } = await (supabaseAdmin as any)
    .from('submissions')
    .select('id, user_id, title, cover_url, created_at, total_likes, comments_count, views_count')
    .eq('is_draft', false)
    .eq('is_visible', true)
    .eq('validation_status', 'approved')
    .not('cover_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(300)

  const submissions = ((subRows ?? []) as {
    id: string; user_id: string; title: string | null; cover_url: string | null
    created_at: string; total_likes: number | null; comments_count: number | null; views_count: number | null
  }[]).filter((s) => eligibleIds.has(s.user_id))

  const matchesQuery = (s: (typeof submissions)[number]) => {
    if (!q) return true
    const a = byId.get(s.user_id)
    return (
      (s.title ?? '').toLowerCase().includes(q) ||
      (a?.username ?? '').toLowerCase().includes(q) ||
      (a?.full_name ?? '').toLowerCase().includes(q)
    )
  }

  const projects = submissions.filter(matchesQuery).sort((a, b) =>
    sort === 'relevant' ? relevance(b) - relevance(a) : +new Date(b.created_at) - +new Date(a.created_at),
  )

  // Designers : ceux qui ont au moins une réalisation publique, les mieux dotés d'abord.
  const worksByUser = new Map<string, typeof submissions>()
  for (const s of submissions) {
    const list = worksByUser.get(s.user_id) ?? []
    list.push(s)
    worksByUser.set(s.user_id, list)
  }
  const designers = eligible
    .filter((p) => worksByUser.has(p.id))
    .filter((p) =>
      !q ||
      p.username.toLowerCase().includes(q) ||
      (p.full_name ?? '').toLowerCase().includes(q),
    )
    .sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0))

  const leagueByName = new Map(leagues.map((l) => [l.name.toLowerCase(), l]))

  return (
    <GlassShell>
      <GlassHeader />

      <div className="flex w-full flex-col gap-[32px] px-6 pb-16 pt-[32px] lg:px-[144px]">
        <div className="flex flex-col gap-[8px]">
          <h1 className="text-[40px] font-semibold leading-[1.2] text-[#2b2c36]">{t.title}</h1>
          <p className="text-[16px] font-normal leading-[1.2] text-[#484848]">{t.subtitle}</p>
        </div>

        <FilterBar
          view={view}
          sort={sort}
          specialties={specialties.map((s) => ({ value: s.id, label: s.name }))}
          leagues={leagues.map((l) => ({ value: l.name, label: l.name }))}
          countries={countryOptions}
          tools={toolOptions}
          t={t}
        />

        {/* ── Vue Réalisations ── */}
        {view === 'projects' &&
          (projects.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[#dcdce8] bg-white/40 p-12 text-center text-sm text-[#484848] backdrop-blur-[59.18px]">
              {t.emptyProjects}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-[8px] sm:grid-cols-2 lg:grid-cols-4">
              {projects.map((s) => {
                const author = byId.get(s.user_id)
                const href = viewer && author
                  ? `/dashboard/submissions/${s.id}`
                  : author ? `/u/${author.username}` : '/login'
                return (
                  <Link
                    key={s.id}
                    href={href}
                    className={`group relative block overflow-clip rounded-[24px] border border-[#dcdce8] bg-white transition-[translate,box-shadow] duration-[1100ms] ease-[cubic-bezier(0,0,0,0.99)] hover:-translate-y-[6px] hover:shadow-[0px_18px_60px_0px_rgba(0,0,0,0.14)] motion-reduce:transition-none motion-reduce:hover:translate-y-0`}
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={s.cover_url ?? ''} alt={s.title ?? ''} className="size-full object-cover" />

                      {/* Auteur ET titre regroupés en bas, révélés ensemble au survol. */}
                      <span className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-start gap-[8px] bg-gradient-to-t from-black/75 to-transparent p-[12px] pt-[48px] opacity-0 transition-opacity duration-[600ms] ease-[cubic-bezier(0,0,0,0.99)] group-hover:opacity-100 motion-reduce:transition-none">
                        {author && (
                          <span className="flex items-center gap-[6px] rounded-full border border-white/40 bg-white/25 py-[3px] pe-[10px] ps-[3px] shadow-[0px_2px_10px_0px_rgba(0,0,0,0.10)] backdrop-blur-[10px]">
                            {author.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={author.avatar_url} alt="" aria-hidden className="size-[20px] rounded-full object-cover" />
                            ) : (
                              <span className="size-[20px] rounded-full bg-secondary" />
                            )}
                            <span className="text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">@{author.username}</span>
                          </span>
                        )}
                        <span className="flex w-full items-end justify-between gap-2">
                          <span className="min-w-0 truncate text-[13px] font-semibold text-white">{s.title}</span>
                          <span className="shrink-0 text-[11px] text-white/80">♥ {s.total_likes ?? 0}</span>
                        </span>
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          ))}

        {/* ── Vue Designers ── */}
        {view === 'people' &&
          (designers.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[#dcdce8] bg-white/40 p-12 text-center text-sm text-[#484848] backdrop-blur-[59.18px]">
              {t.emptyPeople}
            </div>
          ) : (
            <div className="flex flex-col gap-[8px]">
              {designers.map((p) => {
                const works = (worksByUser.get(p.id) ?? []).slice(0, 4)
                const lg = leagueByName.get((p.league ?? '').toLowerCase())
                return (
                  <div key={p.id} className="overflow-clip rounded-[24px] border border-[#dcdce8] bg-white">
                    <div className="flex flex-wrap items-center justify-between gap-[12px] p-[16px]">
                      <Link href={`/u/${p.username}`} className="flex items-center gap-[12px]">
                        {p.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.avatar_url} alt="" aria-hidden className="size-[44px] rounded-full object-cover" />
                        ) : (
                          <span className="size-[44px] rounded-full bg-secondary" />
                        )}
                        <span className="flex flex-col">
                          <span className="text-[16px] font-semibold leading-[1.2] text-[#2b2c36]">
                            {p.full_name?.trim() || `@${p.username}`}
                          </span>
                          <span className="text-[12px] leading-[1.2] text-[#71717a]">
                            {(worksByUser.get(p.id) ?? []).length} {t.works}
                          </span>
                        </span>
                      </Link>

                      <div className="flex items-center gap-[8px]">
                        {lg && (
                          <span
                            className="flex items-center justify-center rounded-[4px] px-[6px] py-[4px] text-[10px] font-extrabold leading-none"
                            style={{ background: `${lg.color ?? '#d4e1eb'}29`, color: lg.color ?? '#044473' }}
                          >
                            {lg.name.toUpperCase()}
                          </span>
                        )}
                        <span className="flex items-center gap-[4px] text-[13px] font-semibold text-[#080808]">
                          <XpIcon className="size-4" />
                          {(p.xp ?? 0).toLocaleString()}
                        </span>
                        <Link
                          href={`/u/${p.username}`}
                          className="rounded-full border border-[#dcdce8] bg-white/55 px-4 py-2 text-[12px] font-semibold text-[#556971] transition-colors hover:bg-white/80"
                        >
                          {t.viewProfile}
                        </Link>
                      </div>
                    </div>

                    {works.length > 0 && (
                      <div className="grid grid-cols-2 gap-[2px] sm:grid-cols-4">
                        {works.map((w) => (
                          <Link
                            key={w.id}
                            href={viewer ? `/dashboard/submissions/${w.id}` : `/u/${p.username}`}
                            className="relative aspect-[4/3] overflow-hidden"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={w.cover_url ?? ''} alt={w.title ?? ''} className="size-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0,0,0,0.99)] hover:scale-105" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
      </div>
    </GlassShell>
  )
}
