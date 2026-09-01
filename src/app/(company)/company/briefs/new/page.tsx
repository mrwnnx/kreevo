import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getDict, getLang } from '@/lib/i18n/lang'
import { createClient } from '@/lib/supabase/server'
import { BriefForm } from '@/components/features/brief/BriefForm'
import { loadBriefTaxonomy } from '@/components/features/brief/taxonomy'

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDict()
  return {
    title: `${dict.company.briefForm.newTitle} — Kreevo`,
    robots: { index: false, follow: true },
  }
}

/**
 * Rédaction d'un nouveau brief. Enregistrer laisse le brief en `status='draft'`
 * — rien n'est exigé pour un brouillon. Le layout (company) garantit déjà
 * l'auth + le rôle b2b.
 */
export default async function NewBriefPage() {
  const [dict, lang, supabase] = await Promise.all([getDict(), getLang(), createClient()])
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!company) redirect('/company/onboarding')

  const taxonomy = await loadBriefTaxonomy(supabase, lang)
  const t = dict.company

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-16">
      <Link href="/company/briefs" className="text-sm font-medium text-muted-foreground hover:text-foreground">
        {t.briefs.back}
      </Link>
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">{t.briefForm.newTitle}</h1>
      <BriefForm t={t.briefForm} initial={null} {...taxonomy} />
    </div>
  )
}
