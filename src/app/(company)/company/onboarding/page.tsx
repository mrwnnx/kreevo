import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getDict } from '@/lib/i18n/lang'
import { createClient } from '@/lib/supabase/server'
import { CompanyForm } from '@/components/features/company/CompanyForm'

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDict()
  return {
    title: `${dict.company.onboarding.title} — Kreevo`,
    robots: { index: false, follow: true },
  }
}

/**
 * L'écran de fiche entreprise : affiché juste après l'inscription (aucune fiche
 * encore), et réutilisé pour la modifier depuis l'espace (fiche existante →
 * formulaire pré-rempli). Le layout (company) garantit déjà l'auth + le rôle b2b.
 */
export default async function CompanyOnboardingPage() {
  const [dict, supabase] = await Promise.all([getDict(), createClient()])
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies')
    .select('name, logo_url, description, website_url, location')
    .eq('owner_id', user.id)
    .maybeSingle()

  const t = dict.company

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-16">
      <div className="card-sharp rounded-xl p-6 space-y-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight">{t.onboarding.title}</h1>
          <p className="text-xs text-muted-foreground font-mono">{t.onboarding.subtitle}</p>
        </div>
        <CompanyForm
          t={t.form}
          initial={
            company
              ? {
                  name: company.name,
                  logoUrl: company.logo_url,
                  description: company.description,
                  websiteUrl: company.website_url,
                  location: company.location,
                }
              : null
          }
        />
      </div>
    </div>
  )
}
