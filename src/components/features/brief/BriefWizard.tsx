'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Pencil } from 'lucide-react'
import { GLASS_GRADIENT } from '@/components/layout/GlassShell'
import { createBriefFromWizard } from './actions'
import type { TaxonomyOption } from './BriefForm'
import type { Lang } from '@/lib/i18n/tx'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

type T = Dictionary['company']['briefWizard']

/**
 * Couleurs de la maquette Figma `579:475`. Elles ne sont pas encore des tokens
 * du design system : ce parcours est le premier écran à les employer, et
 * inventer six variables globales pour un seul flux serait prématuré. Elles
 * vivent donc ici, en un seul endroit, prêtes à être promues le jour où un
 * deuxième écran les réclame.
 */
const INK = '#2b2c36'
const MUTED = '#484848'
const HAIRLINE = '#dcdce8'
const ACCENT = '#826eff'
const DOT_ON = '#d4cef2'
const DOT_OFF = '#ebebf8'

/** Même recette que `GLASS_GRADIENT`, teintée en mauve — carte sélectionnée. */
const SELECTED_GRADIENT =
  'linear-gradient(236.06deg, rgba(212,206,242,0.51) 23.035%, rgba(212,206,242,0.117) 119.63%)'

/** Nombre de types affichés avant « Besoin d'autre chose ? » (la maquette en montre 12). */
const TYPES_VISIBLE = 12

const STYLE_KEYS = [
  'styleMinimalist', 'styleBold', 'stylePlayful', 'styleElegant',
  'styleProfessional', 'styleModern', 'styleRetro', 'styleIllustrated',
  'styleThreeD', 'styleFlat', 'styleRealistic',
] as const satisfies readonly (keyof T)[]

const TIMELINE_KEYS = [
  { value: 'days', label: 'timelineDays' },
  { value: 'weeks', label: 'timelineWeeks' },
  { value: 'month', label: 'timelineMonth' },
  { value: 'unsure', label: 'timelineUnsure' },
] as const satisfies readonly { value: string; label: keyof T }[]

/** Les 7 questions, puis le récapitulatif — l'ordre de la maquette. */
const STEPS = ['type', 'style', 'timeline', 'budget', 'business', 'website', 'notes', 'review'] as const
type Step = (typeof STEPS)[number]

export interface BriefWizardCompany {
  name: string
  description: string | null
  websiteUrl: string | null
}

interface BriefWizardProps {
  t: T
  lang: Lang
  company: BriefWizardCompany
  projectTypes: TaxonomyOption[]
}

/** Carte d'option — le motif « verre » de la maquette, anneau mauve si choisie. */
function OptionCard({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{ backgroundImage: selected ? SELECTED_GRADIENT : GLASS_GRADIENT.backgroundImage }}
      className={`w-[172px] overflow-clip rounded-[32px] border-[1.973px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.1)] backdrop-blur-[59.18px] transition-colors ${
        selected ? 'border-[#d4cef2]' : 'border-white hover:border-[#d4cef2]'
      }`}
    >
      <span
        className="flex h-full w-full items-center justify-center rounded-[32px] border-[0.986px] p-[32px] text-center text-[14px] font-medium"
        style={{ borderColor: HAIRLINE, color: INK }}
      >
        {label}
      </span>
    </button>
  )
}

/** Surface « verre » des zones de saisie et de la carte de récapitulatif. */
function GlassPanel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      style={GLASS_GRADIENT}
      className={`overflow-clip rounded-[31.563px] border-[1.973px] border-white shadow-[0px_3.945px_44.385px_0px_rgba(0,0,0,0.1)] backdrop-blur-[59.18px] ${className ?? ''}`}
    >
      <div
        className="flex h-full w-full flex-col rounded-[31.563px] border-[0.986px] p-[31.563px]"
        style={{ borderColor: HAIRLINE }}
      >
        {children}
      </div>
    </div>
  )
}

function PillButton({
  children,
  onClick,
  variant = 'ghost',
  disabled,
  className,
}: {
  children: React.ReactNode
  onClick: () => void
  variant?: 'ghost' | 'primary'
  disabled?: boolean
  className?: string
}) {
  const primary = variant === 'primary'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        backgroundColor: primary ? ACCENT : '#ffffff',
        borderColor: primary ? ACCENT : HAIRLINE,
        color: primary ? '#edf2f7' : '#71717a',
      }}
      className={`flex min-h-[36px] items-center justify-center gap-[4px] rounded-full border px-[16px] py-[8px] text-[12px] font-semibold transition-opacity disabled:opacity-40 ${className ?? ''}`}
    >
      {children}
    </button>
  )
}

/**
 * BriefWizard — rédaction guidée d'un brief, maquette Figma `579:475`.
 *
 * Il produit un BROUILLON puis rend la main au formulaire complet
 * (`/company/briefs/[id]/edit`), seul endroit où se règlent visibilité,
 * ligues ciblées et plafond de réponses — la maquette n'en montre aucun.
 *
 * Deux étapes (activité, site web) sont pré-remplies depuis la fiche
 * entreprise plutôt que redemandées : `companies.description` et
 * `companies.website_url` existent déjà, les reposer à blanc donnerait à
 * l'entreprise le sentiment de ressaisir ce qu'elle a déjà donné.
 */
export function BriefWizard({ t, lang, company, projectTypes }: BriefWizardProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [index, setIndex] = useState(0)
  const [projectTypeId, setProjectTypeId] = useState<string | null>(null)
  const [showAllTypes, setShowAllTypes] = useState(false)
  const [styles, setStyles] = useState<string[]>([])
  const [timeline, setTimeline] = useState<string | null>(null)
  const [budget, setBudget] = useState('')
  const [business, setBusiness] = useState(company.description ?? '')
  const [website, setWebsite] = useState(company.websiteUrl ?? '')
  const [notes, setNotes] = useState('')

  const step: Step = STEPS[index]
  const typeName = useMemo(
    () => projectTypes.find((o) => o.id === projectTypeId)?.name ?? '',
    [projectTypes, projectTypeId],
  )
  const styleLabels = useMemo(
    () => styles.map((k) => t[k as keyof T] as string).filter(Boolean),
    [styles, t],
  )

  const title = typeName
    ? t.titlePattern.replace('{type}', typeName).replace('{company}', company.name)
    : ''

  const toggleStyle = (key: string) =>
    setStyles((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : prev.length >= 3 ? prev : [...prev, key],
    )

  const submit = () => {
    setError(null)
    const fd = new FormData()
    if (title) fd.set('title', title)
    if (projectTypeId) fd.set('projectTypeId', projectTypeId)
    if (timeline) fd.set('timeline', timeline)
    if (budget.trim()) fd.set('budget', budget.trim())
    if (styleLabels.length) {
      fd.set('constraints', t.constraintsPattern.replace('{styles}', styleLabels.join(', ')))
    }
    // Le site web rejoint le contexte : c'est le même paragraphe de présentation
    // pour le designer, et `briefs` n'a pas de colonne dédiée.
    const context = [business.trim(), website.trim()].filter(Boolean).join('\n\n')
    if (context) fd.set('context', context)
    if (notes.trim()) fd.set('brief', notes.trim())

    startTransition(async () => {
      const res = await createBriefFromWizard(fd)
      if (!res.ok) {
        setError(res.error === 'invalid_budget' ? t.errorBudget : t.errorGeneric)
        return
      }
      router.push(`/company/briefs/${res.id}/edit`)
    })
  }

  const heading: Record<Step, { title: string; subtitle: string }> = {
    type: { title: t.typeTitle, subtitle: t.typeSubtitle },
    style: { title: t.styleTitle, subtitle: t.styleSubtitle },
    timeline: { title: t.timelineTitle, subtitle: t.timelineSubtitle },
    budget: { title: t.budgetTitle, subtitle: t.budgetSubtitle },
    business: { title: t.businessTitle, subtitle: t.businessSubtitle },
    website: { title: t.websiteTitle, subtitle: t.websiteSubtitle },
    notes: { title: t.notesTitle, subtitle: t.notesSubtitle },
    review: { title: t.reviewTitle, subtitle: t.reviewSubtitle },
  }

  const visibleTypes = showAllTypes ? projectTypes : projectTypes.slice(0, TYPES_VISIBLE)
  const inputClass =
    'w-full bg-transparent text-[14px] outline-none placeholder:text-[#a1a1aa]'

  return (
    // 768 = les 736 px de colonne de la maquette + les 2×16 px de marge : c'est
    // le CONTENU qui doit faire 736, sinon la rangée de 4 cartes (4×172 + 3×16)
    // ne tient pas et les cartes retombent par 3.
    <div className="mx-auto flex w-full max-w-[768px] flex-col gap-[56px] px-4 pt-[88px] pb-24">
      <div className="flex w-full flex-col items-center justify-center gap-[32px]">
        <div className="flex w-full flex-col items-center gap-[16px] text-center leading-[1.2]">
          <h1 className="text-[32px] font-semibold" style={{ color: INK }}>
            {heading[step].title}
          </h1>
          <p className="text-[14px]" style={{ color: MUTED }}>
            {heading[step].subtitle}
          </p>
        </div>
        <div
          className="flex gap-[8px]"
          role="progressbar"
          aria-label={t.progressLabel}
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={index + 1}
        >
          {STEPS.map((s, i) => (
            <span
              key={s}
              className="h-[6px] w-[47.78px] rounded-[32px]"
              style={{ backgroundColor: i <= index ? DOT_ON : DOT_OFF }}
            />
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col items-center gap-[24px]">
        {step === 'type' && (
          <>
            <div className="flex w-full flex-wrap content-start gap-[16px]">
              {visibleTypes.map((o) => (
                <OptionCard
                  key={o.id}
                  label={o.name}
                  selected={projectTypeId === o.id}
                  onClick={() => setProjectTypeId(o.id)}
                />
              ))}
            </div>
            {!showAllTypes && projectTypes.length > TYPES_VISIBLE && (
              <button
                type="button"
                onClick={() => setShowAllTypes(true)}
                className="me-auto flex items-center gap-[2px] text-[14px] font-bold"
                style={{ color: '#71717a' }}
              >
                {t.typeMore}
                <ChevronDown className="size-[16px]" aria-hidden />
              </button>
            )}
          </>
        )}

        {step === 'style' && (
          <div className="flex w-full flex-wrap content-start gap-[16px]">
            {STYLE_KEYS.map((key) => (
              <OptionCard
                key={key}
                label={t[key] as string}
                selected={styles.includes(key)}
                onClick={() => toggleStyle(key)}
              />
            ))}
          </div>
        )}

        {step === 'timeline' && (
          <div className="flex w-full flex-wrap content-start gap-[16px]">
            {TIMELINE_KEYS.map((o) => (
              <OptionCard
                key={o.value}
                label={t[o.label] as string}
                selected={timeline === o.value}
                onClick={() => setTimeline(o.value)}
              />
            ))}
          </div>
        )}

        {step === 'budget' && (
          <GlassPanel className="w-[386px]">
            <input
              type="number"
              min={0}
              inputMode="decimal"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder={t.budgetPlaceholder}
              className={inputClass}
              style={{ color: INK }}
            />
          </GlassPanel>
        )}

        {step === 'business' && (
          <GlassPanel className="w-full">
            <textarea
              rows={5}
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
              placeholder={t.businessPlaceholder}
              className={`${inputClass} resize-none`}
              style={{ color: INK }}
            />
          </GlassPanel>
        )}

        {step === 'website' && (
          <GlassPanel className="w-[386px]">
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder={t.websitePlaceholder}
              className={inputClass}
              style={{ color: INK }}
            />
          </GlassPanel>
        )}

        {step === 'notes' && (
          <GlassPanel className="w-full">
            <textarea
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t.notesPlaceholder}
              className={`${inputClass} resize-none`}
              style={{ color: INK }}
            />
          </GlassPanel>
        )}

        {step === 'review' && (
          <GlassPanel className="w-[450px]">
            <div className="flex w-full flex-col gap-[24px]">
              <div className="flex w-full items-center justify-between gap-[16px]">
                <p className="text-[24px] font-semibold leading-none" style={{ color: INK }}>
                  {title || t.reviewUntitled}
                </p>
                <button
                  type="button"
                  onClick={() => setIndex(0)}
                  aria-label={t.reviewEdit}
                  style={GLASS_GRADIENT}
                  className="rounded-[7.891px] border-[1.973px] border-white p-[7.891px] shadow-[0px_3.945px_44.385px_0px_rgba(0,0,0,0.1)] backdrop-blur-[59.18px]"
                >
                  <Pencil className="size-[16px]" style={{ color: MUTED }} aria-hidden />
                </button>
              </div>

              <div className="flex w-full flex-col gap-[24px]">
                <ReviewBlock label={t.reviewCategory}>
                  <div className="flex w-full flex-wrap content-start gap-[8px]">
                    {[typeName, ...styleLabels].filter(Boolean).map((chip) => (
                      <span
                        key={chip}
                        style={GLASS_GRADIENT}
                        className="rounded-[7.891px] border-[1.973px] border-white px-[7.891px] py-[7.891px] text-[12px] shadow-[0px_3.945px_44.385px_0px_rgba(0,0,0,0.1)] backdrop-blur-[59.18px]"
                      >
                        <span style={{ color: MUTED }}>{chip}</span>
                      </span>
                    ))}
                    {!typeName && !styleLabels.length && <Empty t={t} />}
                  </div>
                </ReviewBlock>

                <ReviewBlock label={t.reviewDescription}>
                  {business.trim() || notes.trim() ? (
                    <p className="whitespace-pre-wrap text-[14px] leading-[1.2]" style={{ color: MUTED }}>
                      {[business.trim(), notes.trim()].filter(Boolean).join('\n\n')}
                    </p>
                  ) : (
                    <Empty t={t} />
                  )}
                </ReviewBlock>

                <div className="flex w-full gap-[24px]">
                  <div className="flex min-w-px flex-1 flex-col gap-[8px]">
                    <ReviewLabel>{t.reviewBudget}</ReviewLabel>
                    {budget.trim() ? (
                      <p className="text-[14px] leading-[1.2]" style={{ color: MUTED }}>
                        {Number(budget).toLocaleString(lang)}
                      </p>
                    ) : (
                      <Empty t={t} />
                    )}
                  </div>
                  <div className="flex min-w-px flex-1 flex-col gap-[8px]">
                    <ReviewLabel>{t.reviewTimeline}</ReviewLabel>
                    {timeline ? (
                      <p className="text-[14px] leading-[1.2]" style={{ color: MUTED }}>
                        {t[TIMELINE_KEYS.find((o) => o.value === timeline)!.label] as string}
                      </p>
                    ) : (
                      <Empty t={t} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </GlassPanel>
        )}

        {step === 'review' && (
          <p className="max-w-[450px] text-center text-[12px] leading-[1.4]" style={{ color: MUTED }}>
            {t.nextStepNotice}
          </p>
        )}

        {error && (
          <p className="text-center text-[12px] font-semibold text-destructive" role="alert">
            {error}
          </p>
        )}

        {step === 'review' ? (
          <div className="flex w-[386px] items-center gap-[8px]">
            <PillButton onClick={() => setIndex(STEPS.length - 2)}>{t.cancel}</PillButton>
            <PillButton variant="primary" onClick={submit} disabled={pending} className="flex-1">
              {pending ? t.creating : t.create}
            </PillButton>
          </div>
        ) : (
          <div className="flex w-full items-center justify-between">
            <PillButton onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
              {t.back}
            </PillButton>
            <div className="flex items-center gap-[8px]">
              {step !== 'type' && (
                <PillButton onClick={() => setIndex((i) => i + 1)}>
                  {step === 'website' ? t.websiteNone : t.skip}
                </PillButton>
              )}
              <PillButton
                variant="primary"
                onClick={() => setIndex((i) => i + 1)}
                disabled={step === 'type' && !projectTypeId}
              >
                {t.next}
              </PillButton>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ReviewLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[14px] font-semibold leading-[1.2]" style={{ color: '#080808' }}>
      {children}
    </p>
  )
}

function ReviewBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex w-full flex-col gap-[8px]">
      <ReviewLabel>{label}</ReviewLabel>
      {children}
    </div>
  )
}

function Empty({ t }: { t: T }) {
  return (
    <p className="text-[14px] leading-[1.2] italic" style={{ color: '#a1a1aa' }}>
      {t.reviewEmpty}
    </p>
  )
}

export default BriefWizard
