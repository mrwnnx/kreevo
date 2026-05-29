'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { tx } from '@/lib/i18n/tx'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

export function RulesDialog({
  xpReward,
  deadlineDays,
  t,
}: {
  xpReward: number
  deadlineDays: number
  t: Dictionary['challengeDetail']['rules']
}) {
  const [open, setOpen] = useState(false)

  const rows = [
    { emoji: '✅', title: t.participating,    detail: t.participatingDetail,  badge: '+50 XP',         badgeClass: 'text-green-600' },
    { emoji: '🏆', title: t.submitting,       detail: t.submittingDetail,     badge: `+${xpReward} XP`, badgeClass: 'text-green-600' },
    { emoji: '⏱️', title: tx(t.timeLimit, { days: deadlineDays }), detail: t.timeLimitDetail, badge: '', badgeClass: '' },
    { emoji: '🔒', title: t.oneAtATime,       detail: t.oneAtATimeDetail,     badge: '', badgeClass: '' },
    { emoji: '❌', title: t.noShow,           detail: t.noShowDetail,         badge: '−100 XP', badgeClass: 'text-red-500' },
    { emoji: '👍', title: t.likeReceived,     detail: t.likeReceivedDetail,   badge: '+2 XP',  badgeClass: 'text-green-600' },
    { emoji: '💬', title: t.commentReceived,  detail: t.commentReceivedDetail, badge: '+5 XP', badgeClass: 'text-green-600' },
  ]

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
      >
        {t.seeRules}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <DialogHeader className="px-5 py-4 border-b border-border bg-zinc-50 dark:bg-zinc-900">
            <DialogTitle className="text-sm">{t.title}</DialogTitle>
          </DialogHeader>

          <div className="divide-y divide-border max-h-[70vh] overflow-y-auto">
            {rows.map((row, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-4">
                <span className="text-lg">{row.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{row.title}</p>
                  <p className="text-sm text-muted-foreground">{row.detail}</p>
                </div>
                {row.badge && (
                  <span className={`ms-auto text-sm font-semibold shrink-0 ${row.badgeClass}`}>
                    {row.badge}
                  </span>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
