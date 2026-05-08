import { Separator } from '@/components/ui/separator'
import { SignupForm } from '@/components/features/auth/SignupForm'
import { OAuthButtons } from '@/components/features/auth/OAuthButtons'
import { getDict } from '@/lib/i18n/lang'

const REF_CODE_PATTERN = /^[a-z0-9]{4,16}$/i

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const sp = await searchParams
  const ref = sp.ref?.trim()
  const hasValidRef = !!ref && REF_CODE_PATTERN.test(ref)
  const dict = await getDict()
  const t = dict.auth.signup
  const tc = dict.auth.common

  return (
    <div className="card-sharp rounded-xl p-4 space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-xs text-muted-foreground font-mono">{t.subtitle}</p>
        {hasValidRef && (
          <p className="text-[11px] text-violet-600 dark:text-violet-400 font-medium">
            {t.invitedByFriend}
          </p>
        )}
      </div>
      <OAuthButtons />
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{tc.orDivider}</span>
        <Separator className="flex-1" />
      </div>
      <SignupForm t={t} tc={tc} />
    </div>
  )
}
