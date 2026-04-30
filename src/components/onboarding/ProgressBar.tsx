interface ProgressBarProps {
  currentStep: number
  totalSteps: number
  className?: string
}

export function ProgressBar({ currentStep, totalSteps, className }: ProgressBarProps) {
  return (
    <div className={`w-full max-w-[280px] ${className ?? ''}`}>
      <div className="flex items-center justify-between gap-1.5 mb-1.5">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const filled = i < currentStep
          return (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                filled ? 'bg-violet-600' : 'bg-zinc-200'
              }`}
            />
          )
        })}
      </div>
      <p className="text-center text-[11px] text-zinc-500 font-medium">
        Step {currentStep} of {totalSteps}
      </p>
    </div>
  )
}
