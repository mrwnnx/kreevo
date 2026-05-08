import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FloatingNav } from '@/components/layout/FloatingNav'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from 'sonner'
import type { Profile } from '@/types/database.types'
import { getDict, getLang } from '@/lib/i18n/lang'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase as any)
    .from('profiles').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const [lang, dict] = await Promise.all([getLang(), getDict()])

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <FloatingNav profile={profile as Profile} lang={lang} t={dict.header} />
        {children}
        <Toaster position="bottom-right" />
      </div>
    </TooltipProvider>
  )
}
