import { getDict } from '@/lib/i18n/lang'
import { OnboardingClient } from './OnboardingClient'

export default async function OnboardingPage() {
  const dict = await getDict()
  return <OnboardingClient t={dict.onboarding} />
}
