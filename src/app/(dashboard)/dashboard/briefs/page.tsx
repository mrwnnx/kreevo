import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getDict, getLang } from '@/lib/i18n/lang'
import { isBriefClosed } from '@/components/features/brief/validate'
import { BriefCard, type BriefCardData } from '@/components/features/brief/BriefCard'

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDict()
  return {
    title: `${dict.briefsPage.title} — Kreevo`,
    robots: { index: false, follow: true },
  }
}

interface BriefListRow {
  id: string
  title: string | null
  deadline_at: string | null
  max_responses: number | null
  target_league_ids: string[]
  company_id: string
  specialties: { name_fr: string | null; name_en: string | null; name_ar: string | null } | null
}

/**
 * Onglet Brief côté designer (`/dashboard/briefs`) — réservé aux comptes
 * `plan='pro'` (lot 07). Les 94 comptes actuels sont tous 'pro' via la promo
 * d'inscription (jusqu'au 2026-12-31) : le gate ne bloque personne
 * aujourd'hui, assumé — il mordra quand la promo tombera.
 *
 * La RLS ne rend déjà lisible qu'un brief `published`+`public`, mais on ne
 * s'y fie pas seule : `status`/`visibility` sont filtrés explicitement ici
 * aussi. Le ciblage par ligue (`target_league_ids` vide = toutes) est fait
 * côté serveur en JS après lecture — la table ne contient aujourd'hui aucune
 * ligne, et une poignée de briefs publiés ne justifie pas un filtre `.or()`
 * sur colonne tableau.
 *
 * Nom/logo de l'entreprise : lus via `companies_public` (vue, lot 017), pas
 * via l'embed PostgREST `companies(...)`. La RLS de la table `companies` ne
 * rend plus visible que la propre fiche du lecteur — un embed suivrait cette
 * même RLS et rendrait `null` pour toute entreprise autre que celle du
 * designer connecté (qui n'en a pas). D'où un second aller, groupé par
 * `company_id`, vers la vue qui n'expose que les colonnes publiques.
 *
 * « Fermé, pas caché » : un brief dont l'échéance est passée ou dont le
 * plafond de réponses est atteint reste dans la liste, marqué fermé. Le
 * nombre de réponses n'existe pas encore (spec 2) — traité comme 0 partout.
 */
export default async function BriefsPage() {
  const [dict, lang, supabase] = await Promise.all([getDict(), getLang(), createClient()])
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, league')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/login')

  const t = dict.briefsPage

  // Le filtre exact demandé par la spec : plan === 'pro', pas "!= 'free'".
  if (profile.plan !== 'pro') {
    return (
      <div className="mx-auto max-w-[1140px] p-6 pb-16">
        <h1 className="mb-4 text-2xl font-semibold text-foreground">{t.title}</h1>
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-purple-200 bg-purple-50/50 p-5 dark:border-purple-900/40 dark:bg-purple-900/10">
          <p className="text-sm font-medium text-purple-700 dark:text-purple-400">{t.proGateBody}</p>
          <Link
            href="/dashboard/settings"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {t.proGateCta}
          </Link>
        </div>
      </div>
    )
  }

  const [{ data: leagues }, { data: briefsData }] = await Promise.all([
    supabase.from('leagues').select('id, name').eq('is_active', true),
    supabase
      .from('briefs')
      .select(
        'id, title, deadline_at, max_responses, target_league_ids, company_id, specialties(name_fr, name_en, name_ar)',
      )
      .eq('status', 'published')
      .eq('visibility', 'public')
      .order('published_at', { ascending: false }),
  ])

  const userLeagueId =
    (leagues ?? []).find((l) => l.name.toLowerCase() === (profile.league ?? '').toLowerCase())?.id ?? null

  const localizeSpecialty = (s: BriefListRow['specialties']): string => {
    if (!s) return ''
    return (lang === 'ar' ? s.name_ar : lang === 'en' ? s.name_en : s.name_fr) || ''
  }

  const rows = (briefsData ?? []) as unknown as BriefListRow[]

  const targetedRows = rows.filter(
    (b) => b.target_league_ids.length === 0 || (userLeagueId != null && b.target_league_ids.includes(userLeagueId)),
  )

  const companyIds = [...new Set(targetedRows.map((b) => b.company_id))]
  const { data: companiesData } = companyIds.length
    ? await supabase.from('companies_public').select('id, name, logo_url').in('id', companyIds)
    : { data: [] as { id: string; name: string; logo_url: string }[] }
  const companyById = new Map((companiesData ?? []).map((c) => [c.id, c]))

  const visibleBriefs: BriefCardData[] = targetedRows
    .map((b) => ({ ...b, company: companyById.get(b.company_id) }))
    .filter((b) => b.company != null)
    .map((b) => ({
      id: b.id,
      title: b.title,
      deadlineAt: b.deadline_at,
      maxResponses: b.max_responses,
      // Le nombre de réponses n'existe pas encore (spec 2) — toujours 0 ici,
      // volontairement, plutôt qu'un compteur inventé.
      closed: isBriefClosed({ deadlineAt: b.deadline_at, maxResponses: b.max_responses, responseCount: 0 }),
      companyName: b.company!.name,
      companyLogoUrl: b.company!.logo_url,
      specialtyLabel: localizeSpecialty(b.specialties),
    }))

  return (
    <div className="mx-auto max-w-[1140px] space-y-6 p-6 pb-16">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{t.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.motivation}</p>
      </div>

      {visibleBriefs.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-[#dcdce8] bg-white/40 p-12 text-center text-sm text-muted-foreground backdrop-blur-[59.18px]">
          {t.empty}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleBriefs.map((brief) => (
            <BriefCard key={brief.id} brief={brief} lang={lang} t={t} />
          ))}
        </div>
      )}
    </div>
  )
}
