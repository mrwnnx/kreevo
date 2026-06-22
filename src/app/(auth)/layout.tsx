import { Logo } from '@/components/ui/Logo'
import { MovingGradientBackground } from '@/components/marketing/MovingGradientBackground'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fond à gradient animé — identique à la page d'accueil */}
      <MovingGradientBackground />
      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo className="h-6" />
        </div>
        {children}
      </div>
    </div>
  )
}
