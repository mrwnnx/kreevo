import { createClient } from '@/lib/supabase/server'

import { SettingsClient } from './SettingsClient'
import type { Profile } from '@/types/database.types'
import { getDict, getLang } from '@/lib/i18n/lang'
import { LangSwitcher } from '@/components/i18n/LangSwitcher'
import { Globe } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const [lang, dict] = await Promise.all([getLang(), getDict()])

  return (
    <div className="pb-10">

      <div className="max-w-[960px] mx-auto px-6 py-8 space-y-8">

        {/* Language section */}
        <section className="rounded-[24px] border border-border bg-card p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
              <Globe className="size-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold">{dict.language.label}</h2>
              <p className="text-xs text-muted-foreground">{dict.language.description}</p>
            </div>
          </div>
          <LangSwitcher current={lang} variant="radio" />
        </section>

        <SettingsClient profile={profile as Profile} email={user?.email ?? ''} t={dict.settings} tErrors={dict.auth.errors} />
      </div>
    </div>
  )
}
