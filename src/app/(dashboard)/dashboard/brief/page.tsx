import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

import { BriefClient } from './BriefClient'
import type { Profile } from '@/types/database.types'

export default async function BriefPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase as any)
    .from('profiles').select('*').eq('id', user.id).single()

  return (
    <div className="pb-10">
      
      <BriefClient />
    </div>
  )
}
