import { Sparkles, Zap, Upload, Trophy, BarChart3, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Structure NON traduisible du tour de bienvenue (6 étapes).
// Le texte (name/title/description) vient de l'i18n : dict.onboardingTour.steps[id].
// `image` : export Figma à déposer dans public/onboarding/ (null = placeholder gradient).
export type TourStepId =
  | 'welcome'
  | 'xp'
  | 'submit'
  | 'leagues'
  | 'leaderboard'
  | 'profile'

export interface TourStep {
  id: TourStepId
  icon: LucideIcon       // placeholder visuel tant qu'`image` est null
  image: string | null   // ex. '/onboarding/02-xp.png' une fois exporté de Figma
}

export const TOUR_STEPS: readonly TourStep[] = [
  { id: 'welcome',     icon: Sparkles,  image: null }, // étape 1 — placeholder
  { id: 'xp',          icon: Zap,       image: null }, // étape 2 — contenu RÉEL
  { id: 'submit',      icon: Upload,    image: null }, // étape 3 — placeholder
  { id: 'leagues',     icon: Trophy,    image: null }, // étape 4 — placeholder
  { id: 'leaderboard', icon: BarChart3, image: null }, // étape 5 — placeholder
  { id: 'profile',     icon: User,      image: null }, // étape 6 — placeholder
] as const
