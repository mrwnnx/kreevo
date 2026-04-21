import { Separator } from '@/components/ui/separator'
import { LoginForm } from '@/components/features/auth/LoginForm'
import { OAuthButtons } from '@/components/features/auth/OAuthButtons'

export default function LoginPage() {
  return (
    <div className="card-sharp rounded-xl p-4 space-y-4">
      <div className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight">Welcome back</h1>
        <p className="text-xs text-muted-foreground font-mono">Sign in to your account</p>
      </div>
      <OAuthButtons />
      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">or</span>
        <Separator className="flex-1" />
      </div>
      <LoginForm />
    </div>
  )
}
