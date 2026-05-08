import { Rocket, Trophy, Upload, User, CreditCard, Settings, type LucideIcon } from 'lucide-react'

export type HelpCategorySlug =
  | 'getting-started'
  | 'challenges'
  | 'submissions'
  | 'profile'
  | 'billing'
  | 'account'

export interface HelpCategory {
  slug: HelpCategorySlug
  icon: LucideIcon
  /** Hex tint kept for legacy/inline-style usage (e.g. admin chips). */
  iconBg: string
  /** Hex color for the icon stroke — readable in both light and dark modes. */
  iconColor: string
  /** Tailwind utility for the icon container background — dark-mode aware. */
  iconBgClass: string
  /** Tailwind utility for the icon text color — dark-mode aware. */
  iconColorClass: string
  label_fr: string
  label_en: string
  description_fr: string
  description_en: string
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    slug: 'getting-started',
    icon: Rocket,
    iconBg: '#EEF2FF',
    iconColor: '#4F46E5',
    iconBgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
    iconColorClass: 'text-indigo-600 dark:text-indigo-400',
    label_fr: 'Démarrer avec Kreevo',
    label_en: 'Get started with Kreevo',
    description_fr: 'Création de compte, profil designer et système de leagues.',
    description_en: 'Account creation, designer profile and league system.',
  },
  {
    slug: 'challenges',
    icon: Trophy,
    iconBg: '#FEF3C7',
    iconColor: '#D97706',
    iconBgClass: 'bg-amber-50 dark:bg-amber-950/40',
    iconColorClass: 'text-amber-600 dark:text-amber-400',
    label_fr: 'Challenges & Briefs',
    label_en: 'Challenges & Briefs',
    description_fr: 'Comment fonctionnent les défis, briefs IA et deadlines personnelles.',
    description_en: 'How challenges work, AI briefs, and personal deadlines.',
  },
  {
    slug: 'submissions',
    icon: Upload,
    iconBg: '#ECFDF5',
    iconColor: '#059669',
    iconBgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    iconColorClass: 'text-emerald-600 dark:text-emerald-400',
    label_fr: 'Soumissions & Votes',
    label_en: 'Submissions & Votes',
    description_fr: 'Soumettre ton travail, formats acceptés et système de score.',
    description_en: 'Submitting your work, accepted formats, and scoring system.',
  },
  {
    slug: 'profile',
    icon: User,
    iconBg: '#F5F3FF',
    iconColor: '#7C3AED',
    iconBgClass: 'bg-violet-50 dark:bg-violet-950/40',
    iconColorClass: 'text-violet-600 dark:text-violet-400',
    label_fr: 'Profil & Portfolio public',
    label_en: 'Profile & Public Portfolio',
    description_fr: 'Personnaliser ton URL, badges, XP et exporter ton portfolio.',
    description_en: 'Customize your URL, badges, XP, and export your portfolio.',
  },
  {
    slug: 'billing',
    icon: CreditCard,
    iconBg: '#FFF1F2',
    iconColor: '#E11D48',
    iconBgClass: 'bg-rose-50 dark:bg-rose-950/40',
    iconColorClass: 'text-rose-600 dark:text-rose-400',
    label_fr: 'Plans & Facturation',
    label_en: 'Plans & Billing',
    description_fr: 'Différences Free / Pro, paiement Paddle et gestion d\'abonnement.',
    description_en: 'Free / Pro differences, Paddle payments, and subscription management.',
  },
  {
    slug: 'account',
    icon: Settings,
    iconBg: '#F0F9FF',
    iconColor: '#0284C7',
    iconBgClass: 'bg-sky-50 dark:bg-sky-950/40',
    iconColorClass: 'text-sky-600 dark:text-sky-400',
    label_fr: 'Compte & Paramètres',
    label_en: 'Account & Settings',
    description_fr: 'Email, mot de passe, OAuth, notifications et suppression du compte.',
    description_en: 'Email, password, OAuth, notifications, and account deletion.',
  },
]

export function getCategoryBySlug(slug: string): HelpCategory | undefined {
  return HELP_CATEGORIES.find((c) => c.slug === slug)
}
