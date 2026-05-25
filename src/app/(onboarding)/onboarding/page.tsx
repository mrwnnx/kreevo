import type { Metadata } from 'next'
import { getDict, getLang } from '@/lib/i18n/lang'
import { OnboardingClient } from './OnboardingClient'

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLang()
  const title = lang === 'en' ? 'Set up your profile — Kreevo' : 'Configure ton profil — Kreevo'
  return {
    title,
    robots: { index: false, follow: true },
  }
}

export default async function OnboardingPage() {
  const dict = await getDict()
  return <OnboardingClient t={dict.onboarding} />
}
