import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getDict, getLang } from '@/lib/i18n/lang'
import { createClient } from '@/lib/supabase/server'
import { BriefForm } from '@/components/features/brief/BriefForm'
import { loadBriefTaxonomy } from '@/components/features/brief/taxonomy'

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDict()
  return {
    title: `${dict.company.briefForm.editTitle} — Kreevo`,
    robots: { index: false, follow: true },
  }
}

interface Props {
  params: Promise<{ id: string }>
}

/**
 * Édition d'un brief existant, même formulaire pré-rempli. La propriété est
 * vérifiée côté serveur (company_id === la companies de l'appelant) : un brief
 * d'une autre entreprise rend 404, jamais 403 — un 403 confirmerait que
 * l'identifiant existe. Nécessaire même si la RLS bloque déjà l'écriture : un
 * brief publié PUBLIC reste lisible par RLS quelle que soit son entreprise.
 */
export default async function EditBriefPage({ params }: Props) {
  const { id } = await params
  const [dict, lang, supabase] = await Promise.all([getDict(), getLang(), createClient()])
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!company) redirect('/company/onboarding')

  const { data: brief } = await supabase
    .from('briefs')
    .select(
      'id, company_id, title, context, brief, constraints, criteria, deliverable, specialty_id, industry_id, project_type_id',
    )
    .eq('id', id)
    .maybeSingle()

  if (!brief || brief.company_id !== company.id) notFound()

  const taxonomy = await loadBriefTaxonomy(supabase, lang)
  const t = dict.company

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-16">
      <Link href="/company/briefs" className="text-sm font-medium text-muted-foreground hover:text-foreground">
        {t.briefs.back}
      </Link>
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">{t.briefForm.editTitle}</h1>
      <BriefForm
        t={t.briefForm}
        initial={{
          id: brief.id,
          title: brief.title,
          context: brief.context,
          brief: brief.brief,
          constraints: brief.constraints,
          criteria: brief.criteria,
          deliverable: brief.deliverable,
          specialtyId: brief.specialty_id,
          industryId: brief.industry_id,
          projectTypeId: brief.project_type_id,
        }}
        {...taxonomy}
      />
    </div>
  )
}
