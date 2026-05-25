import type { Metadata } from 'next'
import { Separator } from '@/components/ui/separator'
import { LoginForm } from '@/components/features/auth/LoginForm'
import { OAuthButtons } from '@/components/features/auth/OAuthButtons'
import { getDict } from '@/lib/i18n/lang'

export async function generateMetadata(): Promise<Metadata> {
  const dict = await getDict()
  return {
    title: `${dict.auth.login.title} — Kreevo`,
    robots: { index: false, follow: true },
  }
}

export default async function LoginPage() {
  const dict = await getDict()
  const t = dict.auth.login
  const tc = dict.auth.common

  return (
    <div className="card-sharp rounded-xl p-4 space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-xs text-muted-foreground font-mono">{t.subtitle}</p>
      </div>
      <OAuthButtons />
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{tc.orDivider}</span>
        <Separator className="flex-1" />
      </div>
      <LoginForm t={t} tc={tc} />
    </div>
  )
}
