import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getDict } from '@/lib/i18n/lang'
import { createClient } from '@/lib/supabase/server'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDict()
  return {
    title: `${dict.company.briefs.title} — Kreevo`,
    robots: { index: false, follow: true },
  }
}

const STATUS_KEY: Record<string, keyof Dictionary['company']['briefs']> = {
  draft: 'statusDraft',
  pending_review: 'statusPendingReview',
  published: 'statusPublished',
  closed: 'statusClosed',
  rejected: 'statusRejected',
}

/**
 * La liste des briefs de l'entreprise — brouillons et publiés ensemble, statut
 * lisible. Colonnes explicites, jamais `select('*')`. Le layout (company)
 * garantit déjà l'auth + le rôle b2b.
 */
export default async function CompanyBriefsPage() {
  const [dict, supabase] = await Promise.all([getDict(), createClient()])
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()
  if (!company) redirect('/company/onboarding')

  const { data: briefs } = await supabase
    .from('briefs')
    .select('id, title, status, created_at')
    .eq('company_id', company.id)
    .order('created_at', { ascending: false })

  const t = dict.company.briefs

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-16">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/company" className="text-sm font-medium text-muted-foreground hover:text-foreground">
            {t.back}
          </Link>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">{t.title}</h1>
        </div>
        <Link
          href="/company/briefs/new"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-85"
        >
          {t.newButton}
        </Link>
      </div>

      {!briefs || briefs.length === 0 ? (
        <div className="rounded-[24px] border border-border bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">{t.empty}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {briefs.map((b) => (
            <li key={b.id}>
              <Link
                href={`/company/briefs/${b.id}/edit`}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4 transition-colors hover:bg-muted"
              >
                <span className="truncate font-medium text-foreground">{b.title || t.untitled}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {t[STATUS_KEY[b.status] ?? 'statusDraft']}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
