import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getDict } from '@/lib/i18n/lang'
import { GLASS_SURFACE, GLASS_GRADIENT } from '@/components/layout/GlassShell'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDict()
  return {
    title: `${dict.briefDetail.comingSoon.title} — Kreevo`,
    robots: { index: false, follow: true },
  }
}

/**
 * Destination du bouton « Réaliser cet exercice » — écran « bientôt
 * disponible », couture assumée avec la spec 2 (réponses aux briefs) qui
 * n'existe pas encore. Revalide `plan='pro'` et `status='published'` +
 * `visibility='public'`, comme la fiche du brief : cette route n'a pas de
 * raison d'être plus permissive que la page qui y mène.
 */
export default async function BriefStartPage({ params }: Props) {
  const { id } = await params
  const [dict, supabase] = await Promise.all([getDict(), createClient()])
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()
  if (!profile || profile.plan !== 'pro') redirect('/dashboard/briefs')

  const { data: brief } = await supabase
    .from('briefs')
    .select('id')
    .eq('id', id)
    .eq('status', 'published')
    .eq('visibility', 'public')
    .maybeSingle()
  if (!brief) notFound()

  const t = dict.briefDetail.comingSoon

  return (
    <div className="mx-auto max-w-[560px] p-6 pb-16">
      <div className="mb-6">
        <Link
          href={`/dashboard/briefs/${id}`}
          className="flex w-fit items-center gap-[2px] text-[#71717a] transition-colors hover:text-[#2b2c36]"
        >
          <ChevronLeft className="size-[15.781px]" />
          <span className="text-[14px] font-bold leading-[1.2]">{t.back}</span>
        </Link>
      </div>

      <div className={`${GLASS_SURFACE} space-y-2 rounded-[24px] p-10 text-center`} style={GLASS_GRADIENT}>
        <p className="text-3xl">🚧</p>
        <h1 className="text-xl font-semibold text-foreground">{t.title}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{t.body}</p>
      </div>
    </div>
  )
}
