import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FloatingNav } from '@/components/layout/FloatingNav'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { Profile } from '@/types/database.types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase as any)
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <FloatingNav profile={profile as Profile} />
        {children}
      </div>
    </TooltipProvider>
  )
}
