'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function RulesDialog({
  xpReward,
  deadlineDays,
}: {
  xpReward: number
  deadlineDays: number
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
      >
        📋 Voir les règles & XP à gagner
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <DialogHeader className="px-5 py-4 border-b border-border bg-zinc-50 dark:bg-zinc-900">
            <DialogTitle className="text-sm">📋 Les règles de ce défi</DialogTitle>
          </DialogHeader>

          <div className="divide-y divide-border max-h-[70vh] overflow-y-auto">
            <div className="flex items-start gap-3 px-5 py-4">
              <span className="text-lg">✅</span>
              <div>
                <p className="text-sm font-medium">En participant tu gagnes</p>
                <p className="text-sm text-muted-foreground">+50 XP dès que tu cliques sur &quot;Je participe&quot;</p>
              </div>
              <span className="ml-auto text-sm font-semibold text-green-600 shrink-0">+50 XP</span>
            </div>

            <div className="flex items-start gap-3 px-5 py-4">
              <span className="text-lg">🏆</span>
              <div>
                <p className="text-sm font-medium">En soumettant ton travail tu gagnes</p>
                <p className="text-sm text-muted-foreground">XP attribués si ton travail est validé</p>
              </div>
              <span className="ml-auto text-sm font-semibold text-green-600 shrink-0">+{xpReward} XP</span>
            </div>

            <div className="flex items-start gap-3 px-5 py-4">
              <span className="text-lg">⏱️</span>
              <div>
                <p className="text-sm font-medium">Tu as {deadlineDays} jours pour soumettre</p>
                <p className="text-sm text-muted-foreground">Le chrono démarre dès que tu cliques sur &quot;Je participe&quot;</p>
              </div>
            </div>

            <div className="flex items-start gap-3 px-5 py-4">
              <span className="text-lg">🔒</span>
              <div>
                <p className="text-sm font-medium">Un seul défi à la fois</p>
                <p className="text-sm text-muted-foreground">Tu ne pourras pas choisir un autre défi tant que tu n&apos;as pas soumis ce travail</p>
              </div>
            </div>

            <div className="flex items-start gap-3 px-5 py-4">
              <span className="text-lg">❌</span>
              <div>
                <p className="text-sm font-medium">Si tu ne soumets pas avant la deadline</p>
                <p className="text-sm text-muted-foreground">Tu perdras les 50 XP de participation + 50 XP de sanction</p>
              </div>
              <span className="ml-auto text-sm font-semibold text-red-500 shrink-0">-100 XP</span>
            </div>

            <div className="flex items-start gap-3 px-5 py-4">
              <span className="text-lg">👍</span>
              <div>
                <p className="text-sm font-medium">Chaque like reçu sur ta soumission</p>
                <p className="text-sm text-muted-foreground">La communauté peut voter après le reveal collectif</p>
              </div>
              <span className="ml-auto text-sm font-semibold text-green-600 shrink-0">+2 XP</span>
            </div>

            <div className="flex items-start gap-3 px-5 py-4">
              <span className="text-lg">💬</span>
              <div>
                <p className="text-sm font-medium">Chaque commentaire reçu sur ta soumission</p>
                <p className="text-sm text-muted-foreground">Plus tu reçois de feedback, plus tu gagnes d&apos;XP</p>
              </div>
              <span className="ml-auto text-sm font-semibold text-green-600 shrink-0">+5 XP</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
