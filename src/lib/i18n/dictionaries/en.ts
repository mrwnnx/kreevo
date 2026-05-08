/**
 * English dictionary.
 * Mirror of fr.ts — must keep the same shape (TypeScript enforces structural equality).
 * Missing keys silently fall back to French at runtime via `getDict()`.
 */

import type { Dictionary } from './fr'

export const en: Dictionary = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading…',
    yes: 'Yes',
    no: 'No',
    back: 'Back',
    next: 'Next',
    confirm: 'Confirm',
    close: 'Close',
    error: 'Error',
    success: 'Success',
  },

  language: {
    label: 'Language',
    description: 'Choose the interface language.',
    fr: 'Français',
    en: 'English',
    saved: 'Language saved',
  },

  header: {
    nav: {
      dashboard: 'Dashboard',
      challenges: 'Challenges',
      leagues: 'Leagues',
    },
    menu: {
      publicProfile: 'Public profile',
      editProfile: 'Edit profile',
      settings: 'Settings',
      notifications: 'Notifications',
      appearance: 'Appearance',
      signOut: 'Sign out',
      planSuffix: 'plan',
    },
  },

  dashboard: {
    keepGoing: 'Keep going, {name}. Tomorrow\'s another XP day. 🌟',
  },

  settings: {
    title: 'Settings',
    sections: {
      language: 'Language',
      account: 'Account',
      billing: 'Billing',
      notifications: 'Notifications',
    },
  },
}
