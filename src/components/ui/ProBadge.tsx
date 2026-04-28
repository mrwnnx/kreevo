import { cn } from '@/lib/utils'

const PRO_PLANS = new Set(['pro', 'studio'])

export function ProBadge({
  plan,
  className,
  size = 14,
  title = 'Membre Pro',
}: {
  plan: string | null | undefined
  className?: string
  size?: number
  title?: string
}) {
  if (!plan || !PRO_PLANS.has(plan)) return null

  return (
    <svg
      role="img"
      aria-label={title}
      className={cn('inline-block shrink-0 align-[-0.125em]', className)}
      width={size}
      height={size}
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <path
        d="m121 512a400 400 0 1 0 800 0 400 400 0 1 0 -800 0z"
        fill="#2563EB"
      />
      <path
        d="m508.69 524.54-166.96-109.84c-20.32-13.37-47 3.03-44.26 27.2l22.86 201.19c3.07 27.04 25.95 47.46 53.16 47.46h301.9c27.21 0 50.09-20.43 53.16-47.46l22.86-201.19c2.75-24.16-23.94-40.56-44.26-27.2l-166.96 109.84a28.684 28.684 0 0 1 -31.52 0z"
        fill="#fff"
      />
      <path
        d="m494.03 323.08-123.25 198.89c-14.77 23.84 2.37 54.62 30.41 54.62h246.49c28.04 0 45.18-30.79 30.41-54.62l-123.25-198.89c-13.99-22.58-46.84-22.58-60.83 0z"
        fill="#fff"
      />
      <path
        d="m449.68 588h149.54q25.34 0 25.34 25.34v.01q0 25.34-25.34 25.34h-149.54q-25.34 0-25.34-25.34v-.01q0-25.34 25.34-25.34z"
        fill="#2563EB"
      />
    </svg>
  )
}
