'use client'

import { useState } from 'react'
import { AnalysisResultModal } from '@/components/features/challenge/MultiStepSubmitForm'
import { cn } from '@/lib/utils'

type Mode = 'success' | 'warning' | 'blocking'

const MOCKS: Record<Mode, {
  images: { index: number; is_cover: boolean; valid: boolean; reason: string | null }[]
  description_bonus_eligible: boolean
  description_bonus_reason: string | null
}> = {
  success: {
    images: [
      { index: 0, is_cover: true, valid: true, reason: null },
      { index: 1, is_cover: false, valid: true, reason: null },
      { index: 2, is_cover: false, valid: true, reason: null },
    ],
    description_bonus_eligible: true,
    description_bonus_reason: 'Description claire, structurée, qui détaille le process et les choix design — match les visuels.',
  },
  warning: {
    images: [
      { index: 0, is_cover: true, valid: true, reason: null },
      { index: 1, is_cover: false, valid: false, reason: 'Image hors brief : photo de paysage sans lien avec le challenge UX dashboard.' },
      { index: 2, is_cover: false, valid: true, reason: null },
    ],
    description_bonus_eligible: false,
    description_bonus_reason: null,
  },
  blocking: {
    images: [
      { index: 0, is_cover: true, valid: false, reason: 'Photo random sans rapport avec le brief.' },
      { index: 1, is_cover: false, valid: false, reason: 'Screenshot d\'app inconnue, hors-sujet.' },
      { index: 2, is_cover: false, valid: true, reason: null },
      { index: 3, is_cover: false, valid: false, reason: 'Image vide / placeholder.' },
    ],
    description_bonus_eligible: false,
    description_bonus_reason: null,
  },
}

const MODAL_T = {
  successTitle: 'Toutes les images ont été acceptées',
  warningTitle: 'Une image semble hors brief',
  blockingTitle: 'Plusieurs images ne correspondent pas au brief',
  coverLabel: 'Cover',
  validBadge: '✓ OK',
  rejectedBadge: '✗ Hors brief',
  editImages: 'Modifier les images',
  submitAnyway: 'Soumettre quand même',
  bonusTitle: 'Bonus +20% XP — description pertinente ✨',
  attemptsBeforeHumanReview: 'Encore {n} tentative{n, plural, =1{} other{s}} avant de pouvoir demander une review humaine.',
}

export default function AnalyzeModalsPreview() {
  const [mode, setMode] = useState<Mode | null>(null)
  const [rejectionCount, setRejectionCount] = useState(0)

  return (
    <div className="max-w-[720px] mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Preview — Modals d'analyse IA</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Aperçu des 3 modals (case A succès / case B warning / case C blocking) sans appeler l'IA.
        </p>
      </div>

      {/* Mode picker */}
      <div className="flex gap-2 flex-wrap">
        {(['success', 'warning', 'blocking'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors',
              'bg-muted hover:bg-muted/70 text-foreground',
            )}
          >
            {m === 'success' ? '✓ Case A — Succès' : m === 'warning' ? '⚠ Case B — Warning (1 rejet)' : '✗ Case C — Blocking (2+ rejets)'}
          </button>
        ))}
      </div>

      {/* Rejection count picker — only matters for blocking mode */}
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          ai_rejection_count actuel : {rejectionCount} / 3
        </label>
        <div className="flex gap-1">
          {[0, 1, 2].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRejectionCount(n)}
              className={cn(
                'size-8 rounded-md text-xs font-mono',
                rejectionCount === n ? 'bg-foreground text-background' : 'bg-muted hover:bg-muted/70',
              )}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">
          (En case C blocking, le hint affiche "encore N tentatives avant review humaine" basé sur ce compteur.)
        </p>
      </div>

      {mode && (
        <AnalysisResultModal
          mode={mode}
          result={MOCKS[mode]}
          rejectionCount={rejectionCount}
          humanReviewThreshold={3}
          onEditImages={() => setMode(null)}
          onSubmitAnyway={() => setMode(null)}
          onConfirmSubmit={() => setMode(null)}
          t={MODAL_T}
          publishLabel="Publier"
        />
      )}
    </div>
  )
}
