import Link from 'next/link'
import { ProBadge } from '@/components/ui/ProBadge'

interface DashboardProfileHeaderProps {
  profile: {
    username: string
    full_name: string | null
    avatar_url: string | null
    plan: string | null
    country: string | null
    specialty: string | null
    experience_level: string | null
    league: string
    links: Record<string, string> | null
  }
}

function getCountryFlag(country: string | null): string {
  if (!country) return ''
  const flags: Record<string, string> = {
    Tunisia: '🇹🇳',
    Morocco: '🇲🇦',
    Algeria: '🇩🇿',
    Egypt: '🇪🇬',
    France: '🇫🇷',
    'Saudi Arabia': '🇸🇦',
    'United Arab Emirates': '🇦🇪',
    UAE: '🇦🇪',
    Libya: '🇱🇾',
    Jordan: '🇯🇴',
    Lebanon: '🇱🇧',
    Germany: '🇩🇪',
    Spain: '🇪🇸',
    Italy: '🇮🇹',
    'United States': '🇺🇸',
    'United Kingdom': '🇬🇧',
    Canada: '🇨🇦',
    Australia: '🇦🇺',
    Brazil: '🇧🇷',
    India: '🇮🇳',
    Pakistan: '🇵🇰',
    Turkey: '🇹🇷',
  }
  return flags[country] || '🌍'
}

function getJobTitle(
  specialty: string | null,
  level: string | null,
): string {
  const levelLabel: Record<string, string> = {
    entry: 'Entry Level',
    junior: 'Junior',
    senior: 'Senior',
  }
  const specialtyLabel: Record<string, string> = {
    ux_ui: 'UX/UI Designer',
    graphic: 'Graphic Designer',
    'UX Designer': 'UX Designer',
    'UI Designer': 'UI Designer',
    'Graphic Designer': 'Graphic Designer',
  }
  const spec = specialtyLabel[specialty || ''] || 'Designer'
  const lvl = levelLabel[level || ''] || ''
  return lvl ? `${lvl} ${spec}` : spec
}

const SOCIAL_ICONS: Record<
  string,
  { label: string; bg: string; color: string; svg: React.ReactNode }
> = {
  behance: {
    label: 'Behance',
    bg: '#EEF2FF',
    color: '#3B5BDB',
    svg: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M22 7h-7V5h7v2zm1.726 10c-.442 1.297-2.029 3-5.101 3-3.074 0-5.564-1.729-5.564-5.675 0-3.91 2.325-5.92 5.466-5.92 3.082 0 4.964 1.782 5.375 4.426.078.506.109 1.188.095 2.14H15.97c.13 1.202.715 1.99 1.771 1.99.427 0 .72-.102.996-.29L23.726 17zm-5.27-7c-.31-.31-.773-.477-1.259-.477-.513 0-.977.19-1.313.542-.298.317-.484.773-.567 1.356h3.756c-.059-.621-.28-1.1-.617-1.42z" />
      </svg>
    ),
  },
  linkedin: {
    label: 'LinkedIn',
    bg: '#EFF8FF',
    color: '#0A66C2',
    svg: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  dribbble: {
    label: 'Dribbble',
    bg: '#FFF0F6',
    color: '#E64980',
    svg: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.35 3.92 2.165 6.29 2.165 1.42 0 2.77-.29 4-.814zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.18zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-1.81-1.61-4.19-2.586-6.795-2.586-.825 0-1.63.1-2.4.285zm10.335 3.483c-.218.29-1.935 2.493-5.724 4.04.24.49.47.985.68 1.486.08.18.15.36.22.53 3.41-.43 6.8.26 7.14.33-.02-2.42-.88-4.64-2.31-6.38z" />
      </svg>
    ),
  },
  twitter: {
    label: 'X',
    bg: '#F8F9FA',
    color: '#111111',
    svg: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
      </svg>
    ),
  },
  instagram: {
    label: 'Instagram',
    bg: '#FFF0F6',
    color: '#C13584',
    svg: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.058-1.281.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  website: {
    label: 'Website',
    bg: '#F0FDF4',
    color: '#16A34A',
    svg: (
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
  },
}

export function DashboardProfileHeader({
  profile,
}: DashboardProfileHeaderProps) {
  const flag = getCountryFlag(profile.country)
  const jobTitle = getJobTitle(profile.specialty, profile.experience_level)
  const links = profile.links || {}

  const socialLinks = Object.entries(SOCIAL_ICONS)
    .filter(([key]) => {
      const v = links[key]
      return typeof v === 'string' && v.trim().length > 0
    })
    .map(([key, config]) => ({
      key,
      href: links[key] as string,
      ...config,
    }))

  const initials =
    profile.full_name
      ?.split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .join('')
      .toUpperCase()
      .slice(0, 2) ||
    profile.username?.slice(0, 2).toUpperCase() ||
    'U'

  return (
    <div className="bg-card rounded-[24px] border border-border px-4 py-4 sm:px-6 flex items-start gap-3 sm:gap-4">
      {/* Avatar + league badge overlay */}
      <div className="relative flex-shrink-0">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={profile.full_name || profile.username || ''}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-2 ring-border"
          />
        ) : (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold">
            {initials}
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        {/* Ligne 1 — nom + badges */}
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-bold text-lg sm:text-xl text-foreground leading-tight truncate">
            {profile.full_name || profile.username}
          </span>

          <ProBadge plan={profile.plan} size={20} />

          {flag && (
            <span
              className="text-lg sm:text-xl leading-none"
              title={profile.country || ''}
            >
              {flag}
            </span>
          )}
        </div>

        {/* Ligne 2 — job title */}
        {jobTitle && (
          <div className="text-xs sm:text-sm text-muted-foreground">{jobTitle}</div>
        )}

        {/* Ligne 3 — réseaux sociaux (scroll horizontal si trop nombreux) */}
        {socialLinks.length > 0 && (
          <div className="flex items-center gap-1.5 mt-2 -mx-1 px-1 overflow-x-auto scrollbar-hide">
            {socialLinks.map((social) => (
              <a
                key={social.key}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                title={social.label}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-150 hover:scale-110 hover:shadow-sm flex-shrink-0"
                style={{
                  backgroundColor: social.bg,
                  color: social.color,
                }}
              >
                {social.svg}
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Edit profile — texte caché sur mobile, juste icône */}
      <Link
        href="/dashboard/profile"
        aria-label="Edit profile"
        className="flex-shrink-0 inline-flex items-center justify-center text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-800 px-3 py-2 sm:px-4 rounded-full transition-colors duration-150 whitespace-nowrap dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 dark:hover:text-zinc-100"
      >
        <span className="hidden sm:inline">Edit profile →</span>
        <span className="sm:hidden text-base leading-none">✏️</span>
      </Link>
    </div>
  )
}
