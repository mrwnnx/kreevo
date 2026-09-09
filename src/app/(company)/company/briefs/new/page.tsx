import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getDict, getLang } from '@/lib/i18n/lang'
import { createClient } from '@/lib/supabase/server'
import { GlassHeader } from '@/components/layout/GlassHeader'
import { GLASS_VEIL } from '@/components/layout/GlassShell'
import { BriefWizard } from '@/components/features/brief/BriefWizard'
import { loadBriefTaxonomy } from '@/components/features/brief/taxonomy'

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDict()
  return {
    title: `${dict.company.briefForm.newTitle} — Kreevo`,
    robots: { index: false, follow: true },
  }
}

/**
 * Rédaction guidée d'un nouveau brief (maquette Figma `579:475`). Le wizard
 * crée un BROUILLON puis redirige vers `/company/briefs/[id]/edit`, où vivent
 * les réglages de diffusion. Le layout (company) garantit déjà l'auth + le
 * rôle b2b, et pose le fond animé — cette page n'ajoute que le voile de verre
 * et l'en-tête que montre la maquette.
 */
export default async function NewBriefPage() {
  const [dict, lang, supabase] = await Promise.all([getDict(), getLang(), createClient()])
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies')
    .select('id, name, description, website_url')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!company) redirect('/company/onboarding')

  const { projectTypes } = await loadBriefTaxonomy(supabase, lang)

  return (
    <>
      <div aria-hidden className={GLASS_VEIL} />
      <div className="relative z-10">
        <GlassHeader />
        <BriefWizard
          t={dict.company.briefWizard}
          lang={lang}
          company={{
            name: company.name,
            description: company.description,
            websiteUrl: company.website_url,
          }}
          projectTypes={projectTypes}
        />
      </div>
    </>
  )
}
