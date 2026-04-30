import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardNav } from '@/components/layout/DashboardNav'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from 'sonner'

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
        <DashboardNav profile={profile} />
        <div className="h-16" />
        {children}
        <Toaster position="bottom-right" />
      </div>
    </TooltipProvider>
  )
}
