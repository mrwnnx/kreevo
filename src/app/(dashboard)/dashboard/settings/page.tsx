import { createClient } from '@/lib/supabase/server'

import { SettingsClient } from './SettingsClient'
import type { Profile } from '@/types/database.types'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  return (
    <div className="pb-10">
      
      <div className="max-w-[920px] mx-auto px-6 py-8">
        <SettingsClient profile={profile as Profile} email={user?.email ?? ''} />
      </div>
    </div>
  )
}
