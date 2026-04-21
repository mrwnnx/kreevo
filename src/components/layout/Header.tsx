import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/app/(auth)/actions'
import { NotificationBell } from '@/components/features/notifications/NotificationBell'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import type { Profile } from '@/types/database.types'
import Link from 'next/link'

export function Header({ profile, title }: { profile: Profile; title?: string }) {
  return (
    <header
      className="sticky top-0 z-40 flex items-center px-6 gap-4"
      style={{
        height: '56px',
        background: 'var(--nav-bg-scrolled)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--nav-border)',
      }}
    >
      {/* Title */}
      <div className="flex-1 min-w-0">
        {title ? (
          <h1 className="text-sm font-semibold tracking-tight text-foreground truncate">{title}</h1>
        ) : (
          <Link href="/dashboard" className="text-sm font-bold tracking-tight text-foreground">
            kreevo
            <span className="ml-1.5 text-[10px] font-mono text-muted-foreground uppercase tracking-widest align-middle">beta</span>
          </Link>
        )}
      </div>

      {/* Right: bell + avatar */}
      <div className="flex items-center gap-1">
        <NotificationBell userId={profile.id} />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 pl-2 pr-1 py-1.5 rounded-full hover:bg-muted/60 transition-colors outline-none ml-1">
            <Avatar className="size-7 rounded-full ring-2 ring-border">
              <AvatarImage src={profile.avatar_url ?? undefined} />
              <AvatarFallback className="rounded-full text-[11px] font-bold bg-primary/15 text-primary">
                {profile.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl">
            <div className="px-3 py-2 border-b border-border mb-1">
              <p className="text-xs font-semibold">@{profile.username}</p>
              <p className="text-[10px] text-muted-foreground capitalize font-mono">{profile.plan} plan</p>
            </div>
            <DropdownMenuItem>
              <Link href={`/u/${profile.username}`} className="w-full text-xs">Profil public</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/dashboard/profile" className="w-full text-xs">Modifier le profil</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/dashboard/settings" className="w-full text-xs">Paramètres</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/dashboard/notifications" className="w-full text-xs">Notifications</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <p className="text-xs text-muted-foreground mb-2">Apparence</p>
              <ThemeToggle />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">
              <form action={signOut} className="w-full">
                <button type="submit" className="w-full text-left text-xs">Se déconnecter</button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
