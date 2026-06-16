'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { LeagueIcon } from '@/components/features/league/LeagueIcon'
import { tx } from '@/lib/i18n/tx'
import { markPromotionSeen } from './promotion-actions'

export type PromotionData = {
  id: string
  oldLeague: string
  newLeague: string
  newLeagueIcon: string
}

/**
 * Festive league-promotion modal. Mounted on the dashboard with `promo` resolved
 * server-side from the latest UNSEEN `league_up` notification — so it covers every
 * path (auto-validated AND admin-validated Gold+). Promotion itself is untouched;
 * this is celebration only. The CTA just navigates to the leagues page.
 *
 * Fires once: on mount we mark the notification seen immediately (a refresh won't
 * re-trigger). Confetti is loaded via dynamic import to keep it out of SSR.
 */
export function LeaguePromotionCelebration({
  promo,
  t,
}: {
  promo: PromotionData | null
  t: { title: string; subtitle: string; cta: string }
}) {
  const router = useRouter()
  const [open, setOpen] = useState(!!promo)

  useEffect(() => {
    if (!promo) return
    // One-shot: never re-trigger on refresh.
    markPromotionSeen(promo.id)

    let cancelled = false
    import('canvas-confetti')
      .then(({ default: confetti }) => {
        if (cancelled) return
        const base = { startVelocity: 45, particleCount: 80, spread: 70, origin: { y: 0.6 } }
        confetti(base)
        setTimeout(() => confetti({ ...base, particleCount: 50, angle: 60, origin: { x: 0, y: 0.65 } }), 150)
        setTimeout(() => confetti({ ...base, particleCount: 50, angle: 120, origin: { x: 1, y: 0.65 } }), 300)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [promo])

  if (!promo) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm text-center">
        <div className="flex flex-col items-center gap-4 pt-2">
          <div className="size-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <LeagueIcon icon={promo.newLeagueIcon} size="xl" />
          </div>
          <DialogTitle className="text-2xl">
            {tx(t.title, { league: promo.newLeague })}
          </DialogTitle>
          <DialogDescription className="text-sm">{t.subtitle}</DialogDescription>
          <Button
            className="w-full mt-2"
            onClick={() => {
              setOpen(false)
              router.push('/dashboard/leaderboard')
            }}
          >
            {t.cta}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
