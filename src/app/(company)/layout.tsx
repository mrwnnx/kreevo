import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MovingGradientBackground } from '@/components/marketing/MovingGradientBackground'

/**
 * Layout du groupe (company) — même garde-fou de rôle que (admin)/layout.tsx :
 * pas de session → /login, mauvais rôle → son propre espace. Aucune notion de
 * ligue/XP/spécialité ici, l'espace entreprise n'en a pas besoin.
 */
export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') redirect('/admin')
  if (profile?.role !== 'b2b') redirect('/dashboard')

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <MovingGradientBackground />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
