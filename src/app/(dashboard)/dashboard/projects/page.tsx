import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SUBMISSION_KIND_PORTFOLIO } from '@/lib/utils/submission-constants'
import { MyProjectsClient } from '@/components/features/portfolio/MyProjectsClient'
import type { MyProject } from '@/components/features/portfolio/MyProjectsClient'
import { getDict, getLang } from '@/lib/i18n/lang'

export default async function MyProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Explicit columns only — never select('*') (security-audit rule: an
  // accidental `*` already leaked columns on this project once).
  const { data: rows } = await supabase
    .from('submissions')
    .select('id, cover_url, title, is_draft, is_visible, reported_at, created_at')
    .eq('user_id', user.id)
    .eq('kind', SUBMISSION_KIND_PORTFOLIO)
    .order('created_at', { ascending: false })

  const projects: MyProject[] = (rows ?? []).map((r) => ({
    id: r.id,
    cover_url: r.cover_url,
    title: r.title,
    is_draft: !!r.is_draft,
    // Moderation take-down: is_visible=false WITH reported_at set (the exact
    // pair written by the report threshold and by the admin "hide" action).
    // Without surfacing it, a hidden project sits in this list looking
    // identical to a live one and its author has no way to know why it
    // vanished from /discover.
    hidden_by_moderation: r.is_visible === false && !!r.reported_at,
    created_at: r.created_at ?? new Date().toISOString(),
  }))

  const dict = await getDict()
  const lang = await getLang()
  const t = dict.myProjectsPage
  const dateLocale = lang === 'en' ? 'en-US' : lang === 'ar' ? 'ar' : 'fr-FR'

  return (
    <div className="max-w-[1140px] mx-auto px-6 py-8 pb-24">
      <MyProjectsClient projects={projects} dateLocale={dateLocale} t={t} />
    </div>
  )
}
