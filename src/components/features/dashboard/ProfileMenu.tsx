'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield, ScrollText } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { signOut } from '@/app/(auth)/actions'
import { LangSwitcher } from '@/components/i18n/LangSwitcher'
import { IconUser, IconBell, IconSettings, IconHelp, IconCommunity, IconDarkMode, IconLogout, IconEdit } from '@/components/features/dashboard/MenuIcons'
import type { Lang } from '@/lib/i18n/tx'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

/**
 * ProfileMenu — menu du header de l'accueil refondue (Figma 454:494).
 * Deux blocs verre superposés : en-tête profil (arrondi haut) et corps (arrondi
 * bas), séparés par la bordure. Réutilise le DropdownMenu du projet pour le
 * comportement (clic extérieur, Échap, focus) ; l'apparence est entièrement
 * surchargée via className.
 */

const GLASS_TOP =
  'linear-gradient(202.03deg, rgba(255,255,255,0.51) 23.035%, rgba(255,255,255,0.117) 119.63%)'
const GLASS_BODY =
  'linear-gradient(246.42deg, rgba(255,255,255,0.51) 23.035%, rgba(255,255,255,0.117) 119.63%)'
const GLASS_BUTTON =
  'linear-gradient(236.56deg, rgba(255,255,255,0.51) 23.035%, rgba(255,255,255,0.117) 119.63%)'

type Item = { href: string; Icon: (p: { className?: string }) => React.JSX.Element; label: string }

export function ProfileMenu({
  displayName,
  subtitle,
  avatarUrl,
  isAdmin,
  isPro,
  lang,
  t,
}: {
  displayName: string
  subtitle: string
  avatarUrl: string | null
  isAdmin: boolean
  isPro: boolean
  lang: Lang
  t: Dictionary['header']
}) {
  const pathname = usePathname()

  const ITEMS: Item[] = [
    { href: '/dashboard/profile', Icon: IconUser, label: t.menu.publicProfile },
    { href: '/dashboard/notifications', Icon: IconBell, label: t.menu.notifications },
    { href: '/dashboard/settings', Icon: IconSettings, label: t.menu.settings },
  ]

  return (
    <>
      <style>{`
        @keyframes kvMenuIn {
          from { opacity: 0; translate: 0 -10px; scale: 0.96; }
          to   { opacity: 1; translate: 0 0;     scale: 1; }
        }
        .kv-menu-in {
          transform-origin: top right;
          animation: kvMenuIn 320ms cubic-bezier(0, 0, 0, 0.99) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .kv-menu-in { animation: none; }
        }
      `}</style>
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-[8px] outline-none">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" aria-hidden className="size-[32px] rounded-full object-cover" />
        ) : (
          <span className="size-[32px] rounded-full bg-secondary" />
        )}
        <span className="whitespace-nowrap text-[14px] font-bold leading-[1.2] text-[#484848]">
          {displayName}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="kv-menu-in w-[270px] min-w-0 overflow-visible rounded-none bg-transparent p-0 shadow-none ring-0 drop-shadow-[0px_3.95px_22.19px_rgba(0,0,0,0.1)]"
      >
        {/* En-tête profil */}
        <div
          className="flex items-start justify-center overflow-clip rounded-t-[31.563px] border-[1.973px] border-white backdrop-blur-[59.18px]"
          style={{ backgroundImage: GLASS_TOP }}
        >
          <div className="flex min-w-px flex-[1_0_0] flex-col items-start rounded-t-[31.563px] border-[0.986px] border-[#dcdce8] px-[15.56px] py-[16px]">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-[10px]">
                <div className="relative shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" aria-hidden className="size-[40.134px] rounded-full object-cover" />
                  ) : (
                    <span className="block size-[40.134px] rounded-full bg-secondary" />
                  )}
                  <img
                    src="/brand/badge-verified.svg"
                    alt=""
                    aria-hidden
                    className="absolute bottom-[0.89%] end-[-0.44%] size-[12px]"
                  />
                </div>
                <div className="flex flex-col gap-[4px] whitespace-nowrap">
                  <p className="text-[16px] font-semibold leading-[1.1] text-[#2b2c36]">{displayName}</p>
                  <p className="text-[12px] font-normal leading-[1.2] text-[#484848]">{subtitle}</p>
                </div>
              </div>
              <Link
                href="/dashboard/profile"
                aria-label={t.menu.editProfile}
                className="rounded-[7.891px] border-[1.973px] border-white shadow-[0px_3.945px_44.385px_0px_rgba(0,0,0,0.1)] backdrop-blur-[59.18px]"
                style={{ backgroundImage: GLASS_BUTTON }}
              >
                <span className="flex flex-col items-start rounded-[7.891px] border-[0.986px] border-[#dcdce8] p-[7.891px]">
                  <IconEdit className="size-[13.809px] text-[#05060F]" />
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Corps */}
        <div
          className="flex items-start justify-center overflow-clip rounded-b-[32px] border-[1.973px] border-white backdrop-blur-[59.18px]"
          style={{ backgroundImage: GLASS_BODY }}
        >
          <div className="flex min-w-px flex-[1_0_0] flex-col items-start rounded-b-[32px] border-[0.986px] border-[#dcdce8] p-[8px]">
            <div className="flex w-full flex-col gap-[8px]">
              {!isPro && (
                <Link
                  href="/#pricing"
                  className="relative flex min-h-[36px] w-full items-center justify-between overflow-clip rounded-[24px] border border-[#dcdce8] bg-[#b073e0] p-[16px]"
                >
                  <span
                    aria-hidden
                    className="absolute start-[162.44px] top-1/2 size-[204px] -translate-y-1/2 rounded-full bg-[#ffeba6] opacity-80 blur-[28.445px]"
                  />
                  <span className="relative flex items-center gap-[6px]">
                    <img src="/brand/menu-upgrade-icon.png" alt="" aria-hidden className="h-[18px] w-[26px] object-contain" />
                    <span className="whitespace-nowrap text-[12px] font-semibold leading-[1.2] text-[#edf2f7]">
                      {t.menu.upgradeNow}
                    </span>
                  </span>
                  <span className="relative flex items-center justify-center rounded-[4px] bg-[#4b4b4b] px-[6px] py-[4px] text-[10px] font-extrabold leading-none text-white">
                    PRO
                  </span>
                </Link>
              )}

              {/* Navigation */}
              <div className="flex w-full flex-col gap-[8px] overflow-clip rounded-[24px] border border-[#dcdce8] bg-white p-[16px]">
                {ITEMS.map(({ href, Icon, label }) => {
                  const active = pathname === href
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={
                        active
                          ? 'flex w-full items-center rounded-[8px] border border-[#f3f3f4] bg-[#f9f9f9] px-[8px] py-[12px]'
                          : 'flex w-full items-center rounded-[8px] p-[8px] transition-colors hover:bg-[#f9f9f9]'
                      }
                    >
                      <span className="flex items-center gap-[6px]">
                        <Icon className="size-[13.809px] text-[#556971]" />
                        <span
                          className={`whitespace-nowrap text-[12px] font-semibold leading-[1.2] ${active ? 'text-[#020202]' : 'text-[#556971]'}`}
                        >
                          {label}
                        </span>
                      </span>
                    </Link>
                  )
                })}

                {/* Historique — absent de la maquette, mais la sidebar était son
                    seul point d'accès : sans lui la route devient inatteignable. */}
                <Link
                  href="/dashboard/history"
                  className="flex w-full items-center rounded-[8px] p-[8px] transition-colors hover:bg-[#f9f9f9]"
                >
                  <span className="flex items-center gap-[6px]">
                    <ScrollText className="size-[13.809px] text-[#556971]" strokeWidth={2} />
                    <span className="whitespace-nowrap text-[12px] font-semibold leading-[1.2] text-[#556971]">
                      {t.menu.history}
                    </span>
                  </span>
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex w-full items-center rounded-[8px] p-[8px] transition-colors hover:bg-[#f9f9f9]"
                  >
                    <span className="flex items-center gap-[6px]">
                      <Shield className="size-[13.809px] text-[#6040C0]" strokeWidth={2} />
                      <span className="whitespace-nowrap text-[12px] font-semibold leading-[1.2] text-[#6040C0]">
                        {t.menu.switchToAdmin}
                      </span>
                    </span>
                  </Link>
                )}
              </div>

              {/* Langue — items-start : le sélecteur épouse son contenu au lieu
                  d'être étiré par le flex-col parent. */}
              <div className="flex w-full flex-col items-start gap-[8px] overflow-clip rounded-[24px] border border-[#dcdce8] bg-white p-[16px]">
                <span className="px-[8px] text-[10px] font-semibold uppercase tracking-wider text-[#9aa3a8]">
                  {t.menu.language}
                </span>
                <LangSwitcher current={lang} variant="pill" />
              </div>

              {/* Help Center + Community — juste au-dessus de Logout. */}
              <div className="flex w-full flex-col gap-[8px] overflow-clip rounded-[24px] border border-[#dcdce8] bg-white p-[16px]">
                <Link
                  href="/help"
                  className="flex w-full items-center rounded-[8px] p-[8px] transition-colors hover:bg-[#f9f9f9]"
                >
                  <span className="flex items-center gap-[6px]">
                    <IconHelp className="size-[13.809px] text-[#556971]" />
                    <span className="whitespace-nowrap text-[12px] font-semibold leading-[1.2] text-[#556971]">
                      {t.menu.helpCenter}
                    </span>
                  </span>
                </Link>

                {/* Community — destination non arrêtée : affichée, non cliquable. */}
                <span className="flex w-full cursor-default items-center rounded-[8px] p-[8px] opacity-60">
                  <span className="flex items-center gap-[6px]">
                    <IconCommunity className="size-[13.809px] text-[#556971]" />
                    <span className="whitespace-nowrap text-[12px] font-semibold leading-[1.2] text-[#556971]">
                      {t.menu.community}
                    </span>
                    <span className="whitespace-nowrap text-[10px] font-semibold leading-[1.2] text-[#9aa3a8]">
                      {t.menu.comingSoon}
                    </span>
                  </span>
                </span>
              </div>

              {/* Dark Mode (désactivé) + Logout */}
              <div className="flex w-full flex-col">
                <div className="flex min-h-[36px] w-full flex-col items-start justify-center overflow-clip rounded-t-[24px] border border-[#dcdce8] bg-white p-[16px]">
                  <div className="flex w-full items-center justify-between px-[8px]">
                    <span className="flex items-center gap-[6px] opacity-50">
                      <IconDarkMode className="size-[13.809px] text-[#556971]" />
                      <span className="whitespace-nowrap text-[12px] font-semibold leading-[1.2] text-[#556971]">
                        {t.menu.darkMode}
                      </span>
                      <span className="whitespace-nowrap text-[10px] font-semibold leading-[1.2] text-[#9aa3a8]">
                        {t.menu.comingSoon}
                      </span>
                    </span>
                    <span
                      role="switch"
                      aria-checked={false}
                      aria-disabled
                      aria-label={`${t.menu.darkMode} — ${t.menu.comingSoon}`}
                      className="flex w-[21px] cursor-not-allowed items-center rounded-full bg-[#c4c4c4] p-px opacity-50"
                    >
                      <span className="size-[12px] rounded-full bg-white" />
                    </span>
                  </div>
                </div>

                <form action={signOut} className="w-full">
                  <button
                    type="submit"
                    className="flex min-h-[36px] w-full flex-col items-start justify-center overflow-clip rounded-b-[24px] border border-[#dcdce8] bg-white p-[16px] text-start transition-colors hover:bg-[#fff5f5]"
                  >
                    <span className="flex w-full items-center px-[8px]">
                      <span className="flex items-center gap-[6px]">
                        <IconLogout className="size-[13.809px] text-[#f44f44]" />
                        <span className="whitespace-nowrap text-[12px] font-semibold leading-[1.2] text-[#f44f44]">
                          {t.menu.signOut}
                        </span>
                      </span>
                    </span>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  )
}

export default ProfileMenu
