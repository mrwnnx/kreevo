import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getDict, tx } from '@/lib/i18n/lang'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDict()
  return {
    title: `${dict.company.space.title} — Kreevo`,
    robots: { index: false, follow: true },
  }
}

/**
 * L'espace entreprise : sa fiche, ses briefs (à venir — lot 03). Tant qu'aucune
 * fiche n'existe, on renvoie vers l'écran de fiche — c'est ce qui évite les
 * comptes fantômes. Le layout (company) garantit déjà l'auth + le rôle b2b.
 */
export default async function CompanySpacePage() {
  const [dict, supabase] = await Promise.all([getDict(), createClient()])
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies')
    .select('id, name, logo_url, description, website_url, location')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!company) redirect('/company/onboarding')

  const { count: briefsCount } = await supabase
    .from('briefs')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', company.id)

  const t = dict.company.space

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-16">
      <div className="flex items-center gap-4">
        <img
          src={company.logo_url}
          alt=""
          className="size-16 shrink-0 rounded-xl border border-border object-cover"
        />
        <div className="min-w-0">
          <h1 className="truncate font-heading text-2xl font-semibold tracking-tight text-foreground">
            {company.name}
          </h1>
          {company.location && (
            <p className="truncate text-sm text-muted-foreground">{company.location}</p>
          )}
        </div>
        <Link
          href="/company/onboarding"
          className="ms-auto shrink-0 text-sm font-medium text-foreground hover:underline"
        >
          {t.editProfile}
        </Link>
      </div>

      {company.description && (
        <p className="text-sm leading-relaxed text-muted-foreground">{company.description}</p>
      )}

      <Link
        href="/company/briefs"
        className="block rounded-[24px] border border-border bg-card p-10 text-center transition-colors hover:bg-muted"
      >
        <span className="text-sm text-muted-foreground">
          {briefsCount ? tx(t.briefsCount, { count: briefsCount }) : t.briefsEmpty}
        </span>
      </Link>
    </div>
  )
}
