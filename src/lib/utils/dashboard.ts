// Date helpers (inlined — pas de dépendance date-fns)
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
  }: {
    firstName: string
    participation: any
    xpGap: number
    nextLeague: string
    streak: any
    xpToday: number
    suggestedChallenge: any
    completedTotal: number
  },
): HeroConfig {
  const configs: Record<DashboardState, HeroConfig> = {
    new_user: {
      gradient: 'from-violet-600 via-violet-600 to-indigo-700',
      badge: '🎉 Bienvenue sur Kreevo !',
      title: `Prêt à commencer, ${firstName} ?`,
      subtitle: 'Ton premier défi te rapporte +200 XP. Lance-toi !',
      body: 'Les designers qui commencent dans les 24h progressent 3x plus vite.',
      cta1: { label: '🚀 Commencer mon 1er défi →', href: '/dashboard/challenges' },
      cta2: null,
    },
    no_challenge: {
      gradient: 'from-violet-600 via-violet-600 to-indigo-700',
      badge: null,
      title: `Choisis ton prochain défi, ${firstName} 💪`,
      subtitle: suggestedChallenge
        ? `"${suggestedChallenge.title}" te rapporte +${suggestedChallenge.xp_reward} XP`
        : `Il te manque ${xpGap.toLocaleString()} XP pour passer ${nextLeague}`,
      body: `Tu as déjà ${completedTotal} défis complétés. Continue sur ta lancée !`,
      cta1: { label: '▶ Choisir un défi →', href: '/dashboard/challenges' },
      cta2: null,
    },
    active: {
      gradient: 'from-violet-600 via-violet-600 to-indigo-700',
      badge: '⏱ Défi en cours',
      title: participation?.challenges?.title || 'Défi en cours',
      subtitle: 'Tu es sur la bonne voie ! Livre ton meilleur travail.',
      body: participation?.personal_deadline
        ? `Deadline : ${new Date(participation.personal_deadline).toLocaleDateString('fr-FR')}`
        : '',
      cta1: {
        label: '▶ Continuer mon défi →',
        href: `/dashboard/challenges/${participation?.challenge_id}`,
      },
      cta2: null,
    },
    urgent: {
      gradient: 'from-orange-500 via-red-500 to-rose-600',
      badge: '🚨 Deadline dans moins de 24h !',
      title: 'Soumet maintenant — tu peux le faire !',
      subtitle: participation?.challenges?.title || '',
      body: "Même un travail imparfait soumis vaut mieux que rien. Le feedback t'aidera à progresser.",
      cta1: {
        label: '⚡ Soumettre maintenant →',
        href: `/dashboard/challenges/${participation?.challenge_id}/submit`,
      },
      cta2: null,
    },
    just_submitted: {
      gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
      badge: null,
      title: `🎉 +${xpToday} XP ! Excellent travail, ${firstName} !`,
      subtitle: 'Ton travail est en cours de validation.',
      body: 'Pendant que tu attends, pourquoi ne pas commencer un autre défi ?',
      cta1: { label: 'Voir un autre défi →', href: '/dashboard/challenges' },
      cta2: null,
    },
    close_promotion: {
      gradient: 'from-amber-500 via-orange-500 to-yellow-500',
      badge: '🏆 Promotion proche !',
      title: `Tu es à ${xpGap} XP de la ligue ${nextLeague} !`,
      subtitle: 'Un seul défi te sépare du niveau supérieur.',
      body: 'Complète le défi le plus rentable pour franchir le cap.',
      cta1: { label: '🏆 Décrocher ma promotion →', href: '/dashboard/challenges' },
      cta2: null,
    },
    streak_danger: {
      gradient: 'from-orange-400 via-orange-500 to-amber-600',
      badge: '🔥 Streak en danger !',
      title: `Ton streak de ${streak?.current_streak || 0} jours est menacé !`,
      subtitle: "Fais une action aujourd'hui pour le garder.",
      body: 'Commenter 3 soumissions suffit — 5 minutes maximum.',
      cta1: { label: '💬 Commenter des soumissions →', href: '/dashboard/challenges' },
      cta2: { label: 'Voir mes défis', href: '/dashboard/challenges' },
    },
    inactive: {
      gradient: 'from-slate-500 via-slate-600 to-zinc-700',
      badge: null,
      title: `On t'a manqué, ${firstName} 👋`,
      subtitle: "Des nouveaux défis t'attendent dans ta ligue.",
      body: 'Reviens gagner tes XP — ta place est ici !',
      cta1: { label: "▶ Reprendre où je m'étais arrêté →", href: '/dashboard/challenges' },
      cta2: null,
    },
  }

  return configs[state]
}
