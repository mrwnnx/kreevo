import { Separator } from '@/components/ui/separator'
import { SignupForm } from '@/components/features/auth/SignupForm'
import { OAuthButtons } from '@/components/features/auth/OAuthButtons'

export default function SignupPage() {
  return (
    <div className="card-sharp rounded-xl p-4 space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight">Join the arena</h1>
        <p className="text-xs text-muted-foreground font-mono">Create your designer profile</p>
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
