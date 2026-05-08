// Date helpers (inlined — pas de dépendance date-fns)
import { tx } from '@/lib/i18n/lang'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'
import type { Lang } from '@/lib/i18n/lang'

function diffHours(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / 3600000)
}
function diffDays(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / 86400000)
}

export type DashboardState =
  | 'urgent'
  | 'streak_danger'
  | 'inactive'
  | 'just_submitted'
  | 'close_promotion'
  | 'active'
  | 'no_challenge'
  | 'new_user'

export function getDashboardState({
  participation,
  profile,
  streak,
  xpPercent,
  justSubmitted,
  lastSubmissionDate,
}: {
  participation: any | null
  profile: any
  streak: any | null
  xpPercent: number
  justSubmitted: boolean
  lastSubmissionDate: Date | null
}): DashboardState {
  // 1. Défi urgent < 24h
  if (participation?.personal_deadline) {
    const hoursLeft = diffHours(new Date(participation.personal_deadline), new Date())
    if (hoursLeft >= 0 && hoursLeft < 24) return 'urgent'
  }

  // 2. Streak en danger
  if (
    streak?.current_streak > 0 &&
    streak?.last_activity_date !== new Date().toISOString().split('T')[0]
  ) {
    return 'streak_danger'
  }

  // 3. Inactif > 7j
  if (lastSubmissionDate) {
    const daysInactive = diffDays(new Date(), lastSubmissionDate)
    if (daysInactive > 7) return 'inactive'
  }

  // 4. Vient de soumettre
  if (justSubmitted) return 'just_submitted'

  // 5. Proche de monter (XP >= 80%)
  if (xpPercent >= 80 && !participation) return 'close_promotion'

  // 6. Défi actif confortable
  if (participation) return 'active'

  // 7. Nouveau user
  if ((profile?.xp || 0) === 0) return 'new_user'

  // 8. Sans défi actif
  return 'no_challenge'
}

/** @deprecated — i18n strings now live in `dictionaries/{fr,en}.ts` under `dashboard.heroBanner.tips`. */
export const CHALLENGE_TIPS: Record<string, string> = {
  'User Flow': 'Commence par le happy path — ajoute les edge cases ensuite.',
  'UX Research': 'Structure : Problème → Terrain → Insights → Recommandations',
  'Wireframes': 'Les annotations = 50% de la valeur du wireframe.',
  'UI Screen': 'Vérifie la hiérarchie visuelle en mode NB.',
  'Design System': 'Commence par les tokens couleur et typographie.',
  Logo: 'Teste ton logo en NB et à 16px avant de soumettre.',
  'Brand Identity': "L'identité doit fonctionner à 16px et à 500px.",
  Affiche: 'Teste ta typo à distance — lisible à 5 mètres ?',
  Packaging: 'Pense à la vue 360° du packaging.',
  'Social Media Kit': 'Vérifie la cohérence entre posts et stories.',
  Prototype: 'Teste sur un vrai device avant de soumettre.',
  'UX Case Study': 'Structure : Problème → Recherche → Solution → Impact.',
  'UI Kit': 'Documente chaque composant avec ses variantes et états.',
  Redesign: 'Montre le before/after avec une justification claire.',
  Motion: 'Check la fluidité à 24fps, 30fps et 60fps.',
}

export type HeroConfig = {
  gradient: string
  badge: string | null
  title: string
  subtitle: string
  body: string
  cta1: { label: string; href: string } | null
  cta2: { label: string; href: string } | null
}

type HeroParams = {
  firstName: string
  participation: any
  xpGap: number
  nextLeague: string
  streak: any
  xpToday: number
  suggestedChallenge: any
  completedTotal: number
  lang: Lang
  t: Dictionary['dashboard']['heroBanner']
}

export function getHeroConfig(
  state: DashboardState,
  {
    firstName,
    participation,
    xpGap,
    nextLeague,
    streak,
    xpToday,
    suggestedChallenge,
    completedTotal,
    lang,
    t,
  }: HeroParams,
): HeroConfig {
  const s = t.states
  const dateLocale = lang === 'en' ? 'en-US' : 'fr-FR'

  const configs: Record<DashboardState, HeroConfig> = {
    new_user: {
      gradient: 'from-violet-600 via-violet-600 to-indigo-700',
      badge: s.newUser.badge,
      title: tx(s.newUser.title, { name: firstName }),
      subtitle: s.newUser.subtitle,
      body: s.newUser.body,
      cta1: { label: s.newUser.cta1, href: '/dashboard/challenges' },
      cta2: null,
    },
    no_challenge: {
      gradient: 'from-violet-600 via-violet-600 to-indigo-700',
      badge: null,
      title: tx(s.noChallenge.title, { name: firstName }),
      subtitle: suggestedChallenge
        ? tx(s.noChallenge.subtitleWithChallenge, {
            title: suggestedChallenge.title,
            xp: suggestedChallenge.xp_reward,
          })
        : tx(s.noChallenge.subtitleWithoutChallenge, {
            gap: xpGap.toLocaleString(),
            next: nextLeague,
          }),
      body: tx(s.noChallenge.body, { completedTotal }),
      cta1: { label: s.noChallenge.cta1, href: '/dashboard/challenges' },
      cta2: null,
    },
    active: {
      gradient: 'from-violet-600 via-violet-600 to-indigo-700',
      badge: s.active.badge,
      title: participation?.challenges?.title || s.active.fallbackTitle,
      subtitle: s.active.subtitle,
      body: participation?.personal_deadline
        ? tx(s.active.deadline, {
            date: new Date(participation.personal_deadline).toLocaleDateString(dateLocale),
          })
        : '',
      cta1: {
        label: s.active.cta1,
        href: `/dashboard/challenges/${participation?.challenge_id}`,
      },
      cta2: null,
    },
    urgent: {
      gradient: 'from-orange-500 via-red-500 to-rose-600',
      badge: s.urgent.badge,
      title: s.urgent.title,
      subtitle: participation?.challenges?.title || '',
      body: s.urgent.body,
      cta1: {
        label: s.urgent.cta1,
        href: `/dashboard/challenges/${participation?.challenge_id}/submit`,
      },
      cta2: null,
    },
    just_submitted: {
      gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
      badge: null,
      title: tx(s.justSubmitted.title, { xp: xpToday, name: firstName }),
      subtitle: s.justSubmitted.subtitle,
      body: s.justSubmitted.body,
      cta1: { label: s.justSubmitted.cta1, href: '/dashboard/challenges' },
      cta2: null,
    },
    close_promotion: {
      gradient: 'from-amber-500 via-orange-500 to-yellow-500',
      badge: s.closePromotion.badge,
      title: tx(s.closePromotion.title, { gap: xpGap, next: nextLeague }),
      subtitle: s.closePromotion.subtitle,
      body: s.closePromotion.body,
      cta1: { label: s.closePromotion.cta1, href: '/dashboard/challenges' },
      cta2: null,
    },
    streak_danger: {
      gradient: 'from-orange-400 via-orange-500 to-amber-600',
      badge: s.streakDanger.badge,
      title: tx(s.streakDanger.title, { days: streak?.current_streak || 0 }),
      subtitle: s.streakDanger.subtitle,
      body: s.streakDanger.body,
      cta1: { label: s.streakDanger.cta1, href: '/dashboard/challenges' },
      cta2: { label: s.streakDanger.cta2, href: '/dashboard/challenges' },
    },
    inactive: {
      gradient: 'from-slate-500 via-slate-600 to-zinc-700',
      badge: null,
      title: tx(s.inactive.title, { name: firstName }),
      subtitle: s.inactive.subtitle,
      body: s.inactive.body,
      cta1: { label: s.inactive.cta1, href: '/dashboard/challenges' },
      cta2: null,
    },
  }

  return configs[state]
}
