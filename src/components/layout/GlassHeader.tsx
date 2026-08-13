import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { ProfileMenu } from '@/components/features/dashboard/ProfileMenu'
import { HeaderNav } from '@/components/layout/HeaderNav'
import { getLang, getDict } from '@/lib/i18n/lang'

/**
 * GlassHeader — barre du haut de la refonte (Figma 431:5277) : logo à gauche,
 * cloche + menu profil à droite. Récupère lui-même le profil pour que chaque
 * page migrée n'ait qu'à poser <GlassHeader /> sans rien lui passer.
 */
export async function GlassHeader() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Variante anonyme : les pages publiques (/discover) doivent garder un header.
  if (!user) {
    const dict = await getDict()
    return (
      <header className="relative flex items-center justify-between px-6 py-[16px] lg:px-[144px]">
        <Link href="/" aria-label="Kreevo">
          <img src="/brand/logo-kreevo-beta.svg" alt="Kreevo" className="h-[16px] w-[102.241px]" />
        </Link>
        <Link
          href="/login"
          className="rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-opacity hover:opacity-85"
        >
          {dict.landing.nav.signIn}
        </Link>
      </header>
    )
  }

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('full_name, username, avatar_url, specialty_id, role, plan')
    .eq('id', user.id)
    .single()
  if (!profile) return null

  const { data: specialtyRow } = profile.specialty_id
    ? await (supabaseAdmin as any)
        .from('specialties')
        .select('name')
        .eq('id', profile.specialty_id)
        .maybeSingle()
    : { data: null }

  const [lang, dict] = await Promise.all([getLang(), getDict()])
  const displayName = (profile.full_name as string)?.trim() || (profile.username as string) || ''

  return (
    <header className="relative flex items-center justify-between px-6 py-[16px] lg:px-[144px]">
      <Link href="/dashboard-v2" aria-label="Kreevo">
        <img src="/brand/logo-kreevo-beta.svg" alt="Kreevo" className="h-[16px] w-[102.241px]" />
      </Link>
      <HeaderNav isAdmin={profile.role === 'admin'} t={dict.header} />

      <div className="flex items-center gap-[24px]">
        <Link href="/dashboard/notifications" aria-label="Notifications" className="block size-[16px]">
          <img src="/brand/icon-bell.png" alt="" aria-hidden className="size-full object-contain" />
        </Link>
        <ProfileMenu
          displayName={displayName}
          subtitle={specialtyRow?.name ?? ''}
          avatarUrl={(profile.avatar_url as string) ?? null}
          isAdmin={profile.role === 'admin'}
          isPro={profile.plan !== 'free'}
          lang={lang}
          t={dict.header}
        />
      </div>
    </header>
  )
}

export default GlassHeader
