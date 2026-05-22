import { ForgotPasswordForm } from '@/components/features/auth/ForgotPasswordForm'
import { getDict } from '@/lib/i18n/lang'

export default async function ForgotPasswordPage() {
  const dict = await getDict()
  const t = dict.auth.forgotPassword
  const tc = dict.auth.common

  return (
    <div className="card-sharp rounded-xl p-4 space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-xs text-muted-foreground font-mono">{t.subtitle}</p>
      </div>
      <ForgotPasswordForm t={t} tc={tc} />
    </div>
  )
}
