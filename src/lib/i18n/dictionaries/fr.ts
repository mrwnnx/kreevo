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
