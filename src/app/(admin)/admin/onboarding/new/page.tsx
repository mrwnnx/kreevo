import { OnboardingStepForm } from '@/components/admin/OnboardingStepForm'
import { fr } from '@/lib/i18n/dictionaries/fr'
import { en } from '@/lib/i18n/dictionaries/en'
import { ar } from '@/lib/i18n/dictionaries/ar'

// Labels chrome des 3 langues pour le toggle de l'aperçu.
const chrome = { fr: fr.onboardingTour, en: en.onboardingTour, ar: ar.onboardingTour }

export default function NewOnboardingStep() {
  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouvelle étape</h1>
        <p className="text-sm text-muted-foreground">Ajoutée en fin de liste. Active = visible dans le tour.</p>
      </div>
      <OnboardingStepForm chrome={chrome} />
    </div>
  )
}
