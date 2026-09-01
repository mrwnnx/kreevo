import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { Toaster } from 'sonner'
import { SUBMISSION_KIND_PORTFOLIO } from '@/lib/utils/submission-constants'

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

  // `submissions.is_reported` is dead (nothing sets it to true — see
  // admin/moderation/route.ts, which uses this same criterion). Read via
  // `supabaseAdmin`, not the session client: RLS only exposes a submission
  // to its own owner or when publicly visible, and an on_hold / hidden
  // submission is neither, for any admin session.
  const [{ count: repComments }, { count: repSubs }] = await Promise.all([
    (supabase as any).from('comments').select('id', { count: 'exact', head: true }).eq('is_reported', true),
    (supabaseAdmin as any)
      .from('submissions')
      .select('id', { count: 'exact', head: true })
      .or(`validation_status.eq.on_hold,and(kind.eq.${SUBMISSION_KIND_PORTFOLIO},is_visible.eq.false,reported_at.not.is.null)`),
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
