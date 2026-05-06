import { Separator } from '@/components/ui/separator'
import { SignupForm } from '@/components/features/auth/SignupForm'
import { OAuthButtons } from '@/components/features/auth/OAuthButtons'

const REF_CODE_PATTERN = /^[a-z0-9]{4,16}$/i

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const sp = await searchParams
  const ref = sp.ref?.trim()
  const hasValidRef = !!ref && REF_CODE_PATTERN.test(ref)

  return (
    <div className="card-sharp rounded-xl p-4 space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight">Join the arena</h1>
        <p className="text-xs text-muted-foreground font-mono">Create your designer profile</p>
        {hasValidRef && (
          <p className="text-[11px] text-violet-600 dark:text-violet-400 font-medium">
            ✨ You were invited by a friend
          </p>
        )}
      </div>
      <OAuthButtons />
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">or</span>
        <Separator className="flex-1" />
      </div>
      <SignupForm />
    </div>
  )
}
