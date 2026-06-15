import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { HistorySubmissionsClient } from '@/components/features/history/HistorySubmissionsClient'
import type { HistorySubmission } from '@/components/features/history/HistorySubmissionsClient'
import { getDict, getLang } from '@/lib/i18n/lang'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rows } = await (supabaseAdmin as any)
    .from('submissions')
    .select(`
      id, cover_url, title, validation_status, is_draft, is_visible, created_at, challenge_id,
      challenges:challenge_id (title)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const submissions: HistorySubmission[] = (rows ?? []).map((r: any) => ({
    id: r.id,
    cover_url: r.cover_url ?? null,
    title: r.title ?? null,
    validation_status: r.validation_status ?? null,
    is_draft: !!r.is_draft,
    // "public par défaut" : null/undefined ⇒ visible (mirrors the submit form).
    is_visible: r.is_visible !== false,
    created_at: r.created_at,
    challenge_id: r.challenge_id ?? null,
    challenge_title: r.challenges?.title ?? null,
  }))

  const dict = await getDict()
  const lang = await getLang()
  const t = dict.historyPage
  const dateLocale = lang === 'en' ? 'en-US' : 'fr-FR'

  return (
    <div className="max-w-[1140px] mx-auto px-6 py-8 pb-24">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
      </header>

      <HistorySubmissionsClient
        submissions={submissions}
        dateLocale={dateLocale}
        t={t}
      />
    </div>
  )
}
