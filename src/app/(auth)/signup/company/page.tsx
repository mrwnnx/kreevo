import type { Metadata } from 'next'
import { CompanySignupForm } from '@/components/features/auth/CompanySignupForm'
import { getDict } from '@/lib/i18n/lang'

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDict()
  return {
    title: `${dict.auth.signupCompany.title} — Kreevo`,
    robots: { index: false, follow: true },
  }
}

export default async function CompanySignupPage() {
  const dict = await getDict()
  const t = dict.auth.signupCompany

  return (
    <div className="card-sharp rounded-xl p-4 space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-xs text-muted-foreground font-mono">{t.subtitle}</p>
      </div>
      <CompanySignupForm t={t} tc={dict.auth.common} />
    </div>
  )
}
