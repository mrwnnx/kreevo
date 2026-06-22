import { MovingGradientBackground } from '@/components/marketing/MovingGradientBackground'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-x-clip">
      {/* Fond à gradient animé — identique à la page d'accueil */}
      <MovingGradientBackground />
      <div className="relative z-10">{children}</div>
    </div>
  )
}
