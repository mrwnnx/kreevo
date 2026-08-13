'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { GLASS_SURFACE, GLASS_GRADIENT } from '@/components/layout/GlassShell'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Loader2, ArrowRight } from 'lucide-react'
import { tx } from '@/lib/i18n/tx'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

export function ParticipateButton({
  challengeId,
  deadlineDays,
  t,
  ctaLabel,
  compact = false,
}: {
  challengeId: string
  deadlineDays: number
  t: Dictionary['challengeDetail']['participate']
  /** Optional override for the trigger button label (e.g. "Reparticiper" instead of "Je participe"). */
  ctaLabel?: string
  /** Pastille violette du design refondu (Figma 492:5078) au lieu du bouton pleine largeur. */
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleParticipate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/participations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: challengeId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? t.genericError)
        setLoading(false)
        return
      }
      setOpen(false)
      router.refresh()
    } catch {
      setError(t.genericError)
      setLoading(false)
    }
  }

  return (
    <>
      {compact ? (
        <Button onClick={() => setOpen(true)} className="gap-2">
          {ctaLabel ?? t.cta} <ArrowRight className="size-4" />
        </Button>
      ) : (
        <Button
          size="lg"
          onClick={() => setOpen(true)}
          className="w-full text-base h-12 gap-2"
        >
          {ctaLabel ?? t.cta} <ArrowRight className="size-4" />
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className={`${GLASS_SURFACE} gap-0 overflow-clip border-[1.973px] bg-white/80 p-0 rounded-[32px]`}
          style={GLASS_GRADIENT}
        >
          <div className="flex flex-col gap-[16px] rounded-[32px] border-[0.986px] border-[#dcdce8] p-[16px]">
            <DialogHeader>
              <DialogTitle className="text-[16px] font-semibold text-[#2b2c36]">
                {t.dialogTitle}
              </DialogTitle>
            </DialogHeader>

            {/* Corps sur verre teinté jaune, comme « Avant de participer ». */}
            <div
              className="flex items-start justify-center overflow-clip rounded-[16px] border-[1.973px] border-white shadow-[0px_3.945px_44.385px_0px_rgba(0,0,0,0.1)] backdrop-blur-[59.18px]"
              style={{
                backgroundImage:
                  'linear-gradient(191.43deg, rgba(254,237,170,0.51) 23.035%, rgba(254,237,170,0.117) 119.63%)',
              }}
            >
              <div className="flex min-w-px flex-[1_0_0] flex-col items-start gap-[8px] rounded-[16px] border-[0.986px] border-[#dcdce8] p-[16px]">
                <p
                  className="w-full text-[14px] font-normal leading-[1.2] text-[#484848]"
                  dangerouslySetInnerHTML={{ __html: tx(t.dialogBody, { days: deadlineDays }) }}
                />
                <p className="w-full text-[12px] font-normal leading-[1.2] text-[#71717a]">
                  {t.dialogNote}
                </p>
              </div>
            </div>

            {error && <p className="text-[13px] text-destructive">{error}</p>}

            <DialogFooter>
              <DialogClose render={<Button variant="outline" disabled={loading} />}>
                {t.cancel}
              </DialogClose>
              <Button onClick={handleParticipate} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                {t.confirm}
                <ArrowRight className="size-4" />
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
