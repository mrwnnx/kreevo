import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { Toaster } from 'sonner'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/dashboard')

  const [{ count: repComments }, { count: repSubs }] = await Promise.all([
    (supabase as any).from('comments').select('id', { count: 'exact', head: true }).eq('is_reported', true),
    (supabase as any).from('submissions').select('id', { count: 'exact', head: true }).eq('is_reported', true),
  ])
  const pendingMod = (repComments ?? 0) + (repSubs ?? 0)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar pendingMod={pendingMod} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
      <Toaster position="bottom-right" />
    </div>
  )
}
