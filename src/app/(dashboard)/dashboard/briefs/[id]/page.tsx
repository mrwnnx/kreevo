import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Clock, ExternalLink } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getDict, getLang, tx } from '@/lib/i18n/lang'
import { GLASS_SURFACE, GLASS_GRADIENT } from '@/components/layout/GlassShell'
import { ChallengeBriefSections } from '@/components/features/challenge/ChallengeBriefSections'
import { isBriefClosed } from '@/components/features/brief/validate'

interface Props {
  params: Promise<{ id: string }>
}

interface BriefDetailRow {
  id: string
  title: string | null
  brief: string | null
  context: string | null
  constraints: string | null
  criteria: string | null
  deliverable: string | null
  deadline_at: string | null
  max_responses: number | null
  companies: {
    name: string
    logo_url: string
    description: string | null
    website_url: string | null
  } | null
  specialties: { name_fr: string | null; name_en: string | null; name_ar: string | null } | null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const [dict, supabase] = await Promise.all([getDict(), createClient()])
  const { data: brief } = await supabase
    .from('briefs')
    .select('title')
    .eq('id', id)
    .eq('status', 'published')
    .eq('visibility', 'public')
    .maybeSingle()
  return {
    title: `${brief?.title || dict.briefsPage.title} — Kreevo`,
    robots: { index: false, follow: true },
  }
}

/**
 * Fiche d'un brief côté designer. Même gate `plan='pro'` que la liste
 * (lot 07). `status`+`visibility` filtrés explicitement (comme la liste) —
 * un brief `pending_review`, `draft`, `rejected` ou privé rend 404, jamais un
 * contenu partiel. Pas de contrôle de ligue ici : le ciblage par ligue est
 * une règle d'affichage de la LISTE, pas un verrou d'accès au contenu — un
 * brief déjà public+publié n'a rien de confidentiel une fois son id connu.
 *
 * Le bouton « Réaliser cet exercice » mène à un écran « bientôt » — couture
 * assumée avec la spec 2 (réponses aux briefs), pas encore construite.
 */
export default async function BriefDetailPage({ params }: Props) {
  const { id } = await params
  const [dict, lang, supabase] = await Promise.all([getDict(), getLang(), createClient()])
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/login')

  const t = dict.briefDetail

  if (profile.plan !== 'pro') {
    return (
      <div className="mx-auto max-w-[720px] p-6 pb-16">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-purple-200 bg-purple-50/50 p-5 dark:border-purple-900/40 dark:bg-purple-900/10">
          <p className="text-sm font-medium text-purple-700 dark:text-purple-400">{dict.briefsPage.proGateBody}</p>
          <Link
            href="/dashboard/settings"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            {dict.briefsPage.proGateCta}
          </Link>
        </div>
      </div>
    )
  }

  const { data } = await supabase
    .from('briefs')
    .select(
      'id, title, brief, context, constraints, criteria, deliverable, deadline_at, max_responses, companies(name, logo_url, description, website_url), specialties(name_fr, name_en, name_ar)',
    )
    .eq('id', id)
    .eq('status', 'published')
    .eq('visibility', 'public')
    .maybeSingle()

  const brief = data as unknown as BriefDetailRow | null
  if (!brief || !brief.companies) notFound()

  const company = brief.companies
  const specialtyLabel = brief.specialties
    ? (lang === 'ar' ? brief.specialties.name_ar : lang === 'en' ? brief.specialties.name_en : brief.specialties.name_fr) || ''
    : ''

  // Le nombre de réponses n'existe pas encore (spec 2) — toujours 0, volontairement.
  const closed = isBriefClosed({ deadlineAt: brief.deadline_at, maxResponses: brief.max_responses, responseCount: 0 })

  const deadlineLabel = brief.deadline_at
    ? new Date(brief.deadline_at).toLocaleDateString(lang === 'ar' ? 'ar' : lang === 'en' ? 'en-US' : 'fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null

  return (
    <div className="mx-auto max-w-[1140px] p-6 pb-16">
      <div className="mb-6">
        <Link
          href="/dashboard/briefs"
          className="flex w-fit items-center gap-[2px] text-[#71717a] transition-colors hover:text-[#2b2c36]"
        >
          <ChevronLeft className="size-[15.781px]" />
          <span className="text-[14px] font-bold leading-[1.2]">{t.back}</span>
        </Link>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_280px]">
        {/* ── MAIN CONTENT ── */}
        <div className="min-w-0 space-y-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {specialtyLabel && (
                <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold text-muted-foreground">
                  {specialtyLabel}
                </span>
              )}
              <span
                className={
                  closed
                    ? 'rounded-full bg-muted px-3 py-1 text-sm font-semibold text-muted-foreground'
                    : 'rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400'
                }
              >
                {closed ? dict.briefsPage.statusClosed : dict.briefsPage.statusOpen}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={company.logo_url}
                alt=""
                className="size-8 shrink-0 rounded-lg border border-border object-cover"
              />
              <span className="text-sm font-medium text-muted-foreground">{company.name}</span>
            </div>

            <h1 className="text-[40px] font-semibold leading-[1.2] text-[#2b2c36]">{brief.title}</h1>

            {brief.brief && (
              <p className="text-base leading-relaxed text-muted-foreground">{brief.brief}</p>
            )}
          </div>

          <ChallengeBriefSections
            challenge={{
              context: brief.context,
              deliverable: brief.deliverable,
              constraints: brief.constraints,
              criteria: brief.criteria,
            }}
            t={dict.challengeDetail.sections}
          />
        </div>

        {/* ── SIDEBAR ── */}
        <div className="space-y-4 lg:sticky lg:top-6">
          <div className={`${GLASS_SURFACE} space-y-3 rounded-[16px] p-4`} style={GLASS_GRADIENT}>
            {deadlineLabel && (
              <div className="flex items-center justify-between text-sm">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="size-3.5" />
                  {t.deadlineLabel}
                </span>
                <span className="font-medium">{deadlineLabel}</span>
              </div>
            )}

            {closed ? (
              <p className="text-xs leading-relaxed text-muted-foreground">{t.closedBanner}</p>
            ) : (
              <Link
                href={`/dashboard/briefs/${brief.id}/start`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-85"
              >
                {t.startCta}
              </Link>
            )}
          </div>

          <div className={`${GLASS_SURFACE} space-y-3 rounded-[16px] p-4`} style={GLASS_GRADIENT}>
            <p className="text-sm font-semibold text-foreground">{tx(t.aboutCompany, { name: company.name })}</p>
            {company.description && (
              <p className="text-sm leading-relaxed text-muted-foreground">{company.description}</p>
            )}
            {company.website_url && (
              <a
                href={company.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                {t.visitWebsite}
                <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
