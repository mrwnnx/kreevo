interface StepHeaderProps {
  title: string
  subtitle: string
}

export function StepHeader({ title, subtitle }: StepHeaderProps) {
  return (
    <div className="text-center mb-8">
      <h1 className="text-[28px] sm:text-3xl font-bold tracking-tight text-foreground mb-2">
        {title}
      </h1>
      <p className="text-muted-foreground text-sm sm:text-base">{subtitle}</p>
    </div>
  )
}
