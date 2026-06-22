import { LeagueIcon } from '@/components/features/league/LeagueIcon'
import { XpIcon } from '@/components/ui/XpIcon'

/**
 * PortfolioCard — aperçu d'un profil public Kreevo (carte feature « Ton portfolio »).
 * Avatar Notion (notionists) + nom/@ + XP gagnés + rang dans une ligue.
 * Flottement doux (kv-float-soft). Statique, tokens DS, thème-safe.
 */

export function PortfolioCard({ leagueIcon }: { leagueIcon?: string }) {
  return (
    <div className="kv-float-soft w-full max-w-[320px] rounded-3xl border border-border bg-card p-6 shadow-sm">
      {/* En-tête profil */}
      <div className="flex items-center gap-4">
        <span className="relative size-16 shrink-0 overflow-hidden rounded-full bg-violet-500 ring-1 ring-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://api.dicebear.com/9.x/notionists/svg?seed=Lina%20Khaled&backgroundColor=transparent"
            alt="Lina Khaled"
            loading="lazy"
            className="size-full object-cover"
          />
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold text-foreground">Lina Khaled</p>
          <p className="truncate text-sm text-muted-foreground">@lina.kh</p>
        </div>
      </div>

      {/* Stats : XP gagnés + rang ligue */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-secondary px-4 py-3">
          <div className="flex items-center gap-1.5">
            <XpIcon className="size-4" />
            <span className="text-lg font-bold text-foreground">4 820</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">XP gagnés</p>
        </div>
        <div className="rounded-2xl bg-secondary px-4 py-3">
          <div className="flex items-center gap-1.5">
            {leagueIcon ? <LeagueIcon icon={leagueIcon} size="md" /> : null}
            <span className="text-lg font-bold text-foreground">#2</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Ligue Gold</p>
        </div>
      </div>
    </div>
  )
}

export default PortfolioCard
