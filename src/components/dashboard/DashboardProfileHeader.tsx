import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProBadge } from '@/components/ui/ProBadge'
import { tx } from '@/lib/i18n/tx'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

interface DashboardProfileHeaderProps {
  profile: {
    username: string
    full_name: string | null
    avatar_url: string | null
    plan: string | null
    specialty: string | null
    experience_level: string | null
    job_title: string | null
  }
  t: Dictionary['dashboard']['profileHeader']
}

function getJobTitle(
  specialty: string | null,
  level: string | null,
  jt: Dictionary['dashboard']['profileHeader']['jobTitles'],
): string {
  const levelLabel: Record<string, string> = {
    entry: jt.entry,
    junior: jt.junior,
    senior: jt.senior,
  }
  const specialtyLabel: Record<string, string> = {
    ux_ui: jt.ux_ui,
    graphic: jt.graphic,
    'UX Designer': jt.ux_ui,
    'UI Designer': jt.ux_ui,
    'Graphic Designer': jt.graphic,
  }
  const spec = specialtyLabel[specialty || ''] || jt.designer
  const lvl = levelLabel[level || ''] || ''
  return lvl ? `${lvl} ${spec}` : spec
}

export function DashboardProfileHeader({
  profile,
  t,
}: DashboardProfileHeaderProps) {
  const jobTitle =
    profile.job_title?.trim() ||
    getJobTitle(profile.specialty, profile.experience_level, t.jobTitles)
  const firstName = profile.full_name?.trim().split(' ')[0] || profile.username

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
    <div className="relative overflow-hidden rounded-[24px] border border-border bg-gradient-to-br from-violet-50 via-card to-indigo-50 dark:from-violet-950/30 dark:via-card dark:to-indigo-950/20 px-5 py-6 sm:px-8 sm:py-7 flex items-center gap-4 sm:gap-6">
      {/* Large user image */}
      <div className="relative flex-shrink-0">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt={profile.full_name || profile.username || ''}
            className="w-20 h-20 sm:w-28 sm:h-28 rounded-full object-cover ring-2 ring-white/80 dark:ring-white/10 shadow-md"
          />
        ) : (
          <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-md">
            {initials}
          </div>
        )}
        {(profile.plan === 'pro' || profile.plan === 'studio') && (
          <span className="absolute -top-2 right-0 rounded-full overflow-hidden shadow-[0_0_0_3px_#fff]">
            <ProBadge plan={profile.plan} size={36} className="block scale-[1.32]" />
          </span>
        )}
      </div>

      {/* Welcome */}
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight flex items-center gap-2 flex-wrap">
          <span className="truncate">{tx(t.welcome, { name: firstName })}</span>
          <span
            className="inline-block origin-[70%_70%] [animation:wave_2.4s_ease-in-out_infinite]"
            aria-hidden
          >
            👋
          </span>
        </h1>
        {jobTitle && (
          <p className="text-sm sm:text-base text-muted-foreground mt-1.5">{jobTitle}</p>
        )}
      </div>

      {/* Edit profile */}
      <Link href="/dashboard/profile" aria-label="Edit profile" className="flex-shrink-0">
        <Button size="sm">
          <span className="hidden sm:inline">{t.editProfile}</span>
          <span className="sm:hidden text-base leading-none">✏️</span>
        </Button>
      </Link>
    </div>
  )
}
