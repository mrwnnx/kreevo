interface StepHeaderProps {
  title: string
  subtitle: string
}

export function StepHeader({ title, subtitle }: StepHeaderProps) {
  return (
    <div className="text-center mb-8">
      <h1 className="text-[28px] sm:text-3xl font-bold tracking-tight text-zinc-900 mb-2">
        {title}
      </h1>
      <p className="text-zinc-500 text-sm sm:text-base">{subtitle}</p>
    </div>
  )
}
