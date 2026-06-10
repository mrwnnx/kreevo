import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { OnboardingStepForm } from '@/components/admin/OnboardingStepForm'
import { fr } from '@/lib/i18n/dictionaries/fr'
import { en } from '@/lib/i18n/dictionaries/en'
import { ar } from '@/lib/i18n/dictionaries/ar'

const chrome = { fr: fr.onboardingTour, en: en.onboardingTour, ar: ar.onboardingTour }

interface Props { params: Promise<{ id: string }> }

export default async function EditOnboardingStep({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await (supabase as any)
    .from('onboarding_steps')
    .select('*')
    .eq('id', id)
    .single()

  if (!data) notFound()

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Modifier l&apos;étape</h1>
        <p className="text-sm text-muted-foreground">L&apos;ordre se gère via les flèches ▲▼ de la liste.</p>
      </div>
      <OnboardingStepForm
        id={id}
        chrome={chrome}
        initial={{
          image_url: data.image_url ?? null,
          name_fr: data.name_fr ?? '',
          name_en: data.name_en ?? '',
          name_ar: data.name_ar ?? '',
          title_fr: data.title_fr ?? '',
          title_en: data.title_en ?? '',
          title_ar: data.title_ar ?? '',
          description_fr: data.description_fr ?? '',
          description_en: data.description_en ?? '',
          description_ar: data.description_ar ?? '',
          is_active: data.is_active,
        }}
      />
    </div>
  )
}
