import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Clock, ExternalLink } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getDict, getLang, tx } from '@/lib/i18n/lang'
import { GLASS_SURFACE, GLASS_GRADIENT } from '@/components/layout/GlassShell'
import { ChallengeBriefSections } from '@/components/features/challenge/ChallengeBriefSections'
import { isBriefClosed } from '@/components/features/brief/validate'
import { PrivateBriefStartButton } from '@/components/features/brief/PrivateBriefStartButton'
import { PoweredByFooter } from '@/components/layout/PoweredByFooter'
import { Logo } from '@/components/ui/Logo'

interface Props {
  params: Promise<{ token: string }>
}

interface PrivateBriefRow {
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

/**
 * Lit un brief par le jeton de son lien privé. La RLS (lot 01) ne rend un
 * brief lisible que `published` ET `visibility='public'` — un brief privé
 * en est exclu par construction, donc l'anon key n'y verrait jamais rien.
 * On lit ici par le service role pour compenser, et le filtre explicite
 * ci-dessous (access_token + visibility='private' + status='published') EST
 * le garde-fou : ce n'est plus la RLS qui protège au-delà de ce point, c'est
 * cette requête. Ne jamais la relâcher — en particulier le troisième filtre :
 * un brief privé en `pending_review` ne doit pas être lisible par son lien.
 */
async function getPrivateBrief(token: string): Promise<PrivateBriefRow | null> {
  const { data } = await supabaseAdmin
    .from('briefs')
    .select(
      'id, title, brief, context, constraints, criteria, deliverable, deadline_at, max_responses, companies(name, logo_url, description, website_url), specialties(name_fr, name_en, name_ar)',
    )
    .eq('access_token', token)
    .eq('visibility', 'private')
    .eq('status', 'published')
    .maybeSingle()

  const brief = data as unknown as PrivateBriefRow | null
  if (!brief || !brief.companies) return null
  return brief
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const [dict, brief] = await Promise.all([getDict(), getPrivateBrief(token)])
  return {
    title: brief?.title ? `${brief.title} | Kreevo` : dict.privateBriefPage.notFoundTitle,
    // Jamais indexé, jamais suivi — un jeton invalide se comporte comme un jeton
    // valide côté métadonnées, pour ne rien laisser deviner à un scanner.
    robots: { index: false, follow: false },
  }
}

/**
 * `/brief/<token>` — page publique d'un brief privé, atteinte par son lien
 * secret. S'ouvre SANS compte : le jeton est le secret (spec 1). Répondre
 * exige un compte (spec 2, pas construite) — le bouton révèle un écran
 * « bientôt », comme `/dashboard/briefs/[id]/start` (lot 07), sans requête
 * réseau ni navigation supplémentaire.
 */
export default async function PrivateBriefPage({ params }: Props) {
  const { token } = await params
  const [dict, lang, brief] = await Promise.all([getDict(), getLang(), getPrivateBrief(token)])
  if (!brief) notFound()

  const company = brief.companies!
  const t = dict.briefDetail
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
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/90 px-6 py-3 backdrop-blur-sm">
        <Link href="/" aria-label="Kreevo">
          <Logo className="h-4" />
        </Link>
        <Link
          href="/signup"
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Sign up
        </Link>
      </nav>

      <div className="mx-auto max-w-[1140px] p-6 pb-16">
        <div className="mb-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            {dict.privateBriefPage.badge}
          </span>
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
                <PrivateBriefStartButton startLabel={t.startCta} comingSoon={t.comingSoon} />
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

      <PoweredByFooter label={dict.publicProfile.poweredBy} />
    </div>
  )
}
