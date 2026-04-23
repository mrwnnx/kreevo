import { cn } from '@/lib/utils'

function isSrc(icon: string) {
  return icon.startsWith('http') || icon.startsWith('data:') || icon.startsWith('/')
}

export function LeagueIcon({
  icon,
  size = 'md',
  className,
}: {
  icon: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const sizes = {
    sm:  { img: 'size-4',  text: 'text-sm'  },
    md:  { img: 'size-5',  text: 'text-lg'  },
    lg:  { img: 'size-6',  text: 'text-xl'  },
    xl:  { img: 'size-8',  text: 'text-2xl' },
  }

  const s = sizes[size]

  if (isSrc(icon)) {
    return (
      <img
        src={icon}
        alt=""
        className={cn(s.img, 'object-contain shrink-0', className)}
      />
    )
  }

  return (
    <span className={cn(s.text, 'leading-none shrink-0', className)} role="img">
      {icon}
    </span>
  )
}
