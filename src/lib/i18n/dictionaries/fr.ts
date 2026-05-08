/**
 * French dictionary (default language for Kreevo).
 * This is the **canonical source** — every key here must be in `en.ts` too.
 * Use the `tx()` helper from `@/lib/i18n/lang` for `{var}` interpolation.
 */

export const fr = {
  common: {
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    loading: 'Chargement…',
    yes: 'Oui',
    no: 'Non',
    back: 'Retour',
    next: 'Suivant',
    confirm: 'Confirmer',
    close: 'Fermer',
    error: 'Erreur',
    success: 'Succès',
  },

  language: {
    label: 'Langue',
    description: 'Choisis la langue de l\'interface.',
    fr: 'Français',
    en: 'English',
    saved: 'Langue enregistrée',
  },

  header: {
    nav: {
      dashboard: 'Dashboard',
      challenges: 'Challenges',
      leagues: 'Leagues',
    },
    menu: {
      publicProfile: 'Profil public',
      editProfile: 'Modifier le profil',
      settings: 'Paramètres',
      notifications: 'Notifications',
      appearance: 'Apparence',
      signOut: 'Se déconnecter',
      planSuffix: 'plan',
    },
  },

  dashboard: {
    keepGoing: 'Continue, {name}. Demain est un autre jour XP. 🌟',
    profileHeader: {
      editProfile: 'Modifier le profil →',
      jobTitles: {
        entry: 'Entry Level',
        junior: 'Junior',
        senior: 'Senior',
        ux_ui: 'UX/UI Designer',
        graphic: 'Graphic Designer',
        designer: 'Designer',
      },
    },
    statCards: {
      league: 'LEAGUE',
      totalXp: 'XP TOTAL',
      streak: 'STREAK',
      challenges: 'DÉFIS',
      tierOf: 'Niveau {n} sur 8',
      xpToday: '+{n} XP aujourd\'hui',
      keepGoing: 'Continue !',
      personalBest: 'Record personnel 🏆',
      best: 'Record : {n}j',
      thisWeek: '+{n} cette semaine',
      completeFirst: 'Complète ton premier !',
    },
    leagueSection: {
      yourLeague: 'TA LIGUE',
      leagueSuffix: 'League',
      xpProgress: '⚡ Progression XP',
      challengesProgress: '🎯 Défis complétés',
      rank: 'Rang #{rank} sur {total}',
      pushToTop: 'Pousser vers le top 10 🔥',
    },
    countdownCard: {
      leagueEndsSoon: '⏰ La ligue se termine bientôt',
      highStakes: '🔺 Forts enjeux',
      dontLose: 'Ne perds pas ta place.',
      stayActive: 'Reste actif pour rester en {league}. Top 20 restent. Les autres descendent en {next}.',
      days: 'JOURS',
      hours: 'HEURES',
      min: 'MIN',
      sec: 'SEC',
      completeChallenge: '⚡ Compléter un défi',
    },
    whatToDoNow: {
      title: '🎯 Que faire maintenant',
      subtitle: 'Actions classées par XP à gagner',
      complete: 'Compléter « {title} »',
      completeAny: 'Compléter un défi',
      bestAction: 'Meilleure action pour monter',
      commentSubmissions: 'Commenter 3 soumissions',
      commentDetail: '5 min · booste ton streak',
      inviteFriend: 'Inviter un ami',
      shareProfile: 'Partager ton profil',
      shareDetail: 'Instantané · partage ton lien',
      daysType: '{days} jours · {type}',
      xp: '+{n} XP',
    },
    contextualLeaderboard: {
      yourRank: 'Ton rang en {league}',
      countLine: '#{rank} sur {total} designers',
      seeAll: 'Voir tout →',
      onlyXpToTop10: '🔥 Plus que <strong>{n} XP</strong> avant le top 10 !',
      you: 'Toi',
      xpSuffix: 'XP',
    },
  },

  settings: {
    title: 'Paramètres',
    sections: {
      language: 'Langue',
      account: 'Compte',
      billing: 'Facturation',
      notifications: 'Notifications',
    },
  },
} as const

type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>
}

/** Plain-string mirror of `fr`'s shape — required for `en.ts` to provide its own values. */
export type Dictionary = DeepStringify<typeof fr>
