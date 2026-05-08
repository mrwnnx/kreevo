import { createClient } from '@/lib/supabase/server'

import { ProfileForm } from './ProfileForm'
import type { Profile } from '@/types/database.types'
import { getDict } from '@/lib/i18n/lang'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  const dict = await getDict()

  return (
    <div className="pb-10">
      <div className="max-w-[520px] mx-auto px-6 py-8">
        <ProfileForm profile={profile as Profile} t={dict.profileForm} />
      </div>
    </div>
  )
}
