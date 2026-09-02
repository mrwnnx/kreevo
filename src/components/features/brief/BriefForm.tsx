'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveBrief } from './actions'
import { ImproveButton, type BriefField } from './ImproveButton'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

type T = Dictionary['company']['briefForm']

export interface TaxonomyOption {
  id: string
  name: string
}

export interface BriefFormInitial {
  id: string
  title: string | null
  context: string | null
  brief: string | null
  constraints: string | null
  criteria: string | null
  deliverable: string | null
  specialtyId: string | null
  industryId: string | null
  projectTypeId: string | null
  visibility: string
  targetLeagueIds: string[]
  deadlineAt: string | null
  maxResponses: number | null
}

interface BriefFormProps {
  t: T
  initial?: BriefFormInitial | null
  specialties: TaxonomyOption[]
  industries: TaxonomyOption[]
  projectTypes: TaxonomyOption[]
  leagues: TaxonomyOption[]
}

const ERROR_KEY: Record<string, keyof Omit<T, 'improve'>> = {
  not_authenticated: 'errorAuth',
  no_company: 'errorGeneric',
  not_found: 'errorNotFound',
  save_failed: 'errorGeneric',
  incomplete_for_publish: 'errorIncompleteForPublish',
  cannot_publish: 'errorCannotPublish',
  deadline_in_past: 'errorDeadlineInPast',
  invalid_max_responses: 'errorInvalidMaxResponses',
}

const textareaClass =
  'w-full rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 px-3 py-2 text-base md:text-sm placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none transition-colors'

const selectClass =
  'h-10 w-full rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 px-3 text-base md:text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors'

export function BriefForm({ t, initial, specialties, industries, projectTypes, leagues }: BriefFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [visibility, setVisibility] = useState<'public' | 'private'>(
    initial?.visibility === 'private' ? 'private' : 'public',
  )
  const [isPending, startTransition] = useTransition()

  // Amélioration IA par champ — cf. ImproveButton. `formRef` sert à lire les
  // AUTRES champs tels que tapés (pas leur defaultValue) au moment du clic,
  // via `new FormData(form)` : les six champs restent non contrôlés, aucun
  // changement à leur fonctionnement existant. `busyField` est partagé par
  // les six boutons pour qu'un seul appel soit en vol à la fois pour tout le
  // formulaire.
  const formRef = useRef<HTMLFormElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const contextRef = useRef<HTMLTextAreaElement>(null)
  const briefRef = useRef<HTMLTextAreaElement>(null)
  const constraintsRef = useRef<HTMLTextAreaElement>(null)
  const criteriaRef = useRef<HTMLTextAreaElement>(null)
  const deliverableRef = useRef<HTMLTextAreaElement>(null)
  const [busyField, setBusyField] = useState<BriefField | null>(null)

  function collectContext(exclude: BriefField): Record<string, string> {
    const fd = formRef.current ? new FormData(formRef.current) : null
    const fields: BriefField[] = ['title', 'context', 'brief', 'constraints', 'criteria', 'deliverable']
    const ctx: Record<string, string> = {}
    for (const f of fields) {
      if (f === exclude) continue
      const v = ((fd?.get(f) as string | null) ?? '').trim()
      if (v) ctx[f] = v
    }
    return ctx
  }

  // Toutes cochées par défaut : un brief neuf, ou un brief déjà enregistré
  // avec target_league_ids vide (= "toutes" en base), affiche toutes les
  // cases cochées.
  const checkedLeagueIds = new Set(
    initial?.targetLeagueIds && initial.targetLeagueIds.length > 0
      ? initial.targetLeagueIds
      : leagues.map((l) => l.id),
  )

  // Affordance client seulement — le serveur reste l'autorité (refus à la
  // publication si la date est passée, y compris pour quelqu'un qui posterait
  // directement sans passer par ce champ).
  const todayStr = new Date().toISOString().slice(0, 10)

  async function handleSubmit(formData: FormData) {
    setError(null)
    if (initial?.id) formData.set('id', initial.id)
    // Toutes les ligues cochées ⇒ n'envoyer aucune ligue : un tableau vide en
    // base signifie "toutes", sans figer la liste actuelle des ligues.
    if (visibility === 'public') {
      const checked = formData.getAll('targetLeagueIds')
      if (checked.length === leagues.length) formData.delete('targetLeagueIds')
    }
    startTransition(async () => {
      const result = await saveBrief(formData)
      if (!result.ok) {
        setError(t[ERROR_KEY[result.error] ?? 'errorGeneric'])
        return
      }
      router.push('/company/briefs')
      router.refresh()
    })
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-5">
      <p className="text-xs text-muted-foreground">{t.draftNotice}</p>

      <div className="space-y-2">
        <Label htmlFor="title">{t.titleLabel}</Label>
        <Input
          id="title"
          name="title"
          ref={titleRef}
          defaultValue={initial?.title ?? ''}
          placeholder={t.titlePlaceholder}
        />
        <ImproveButton
          field="title"
          getValue={() => titleRef.current?.value ?? ''}
          applyValue={(v) => { if (titleRef.current) titleRef.current.value = v }}
          getContext={() => collectContext('title')}
          busyField={busyField}
          setBusyField={setBusyField}
          t={t.improve}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="specialtyId">{t.specialtyLabel}</Label>
          <select
            id="specialtyId"
            name="specialtyId"
            defaultValue={initial?.specialtyId ?? ''}
            className={selectClass}
          >
            <option value="">{t.selectPlaceholder}</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="industryId">{t.industryLabel}</Label>
          <select
            id="industryId"
            name="industryId"
            defaultValue={initial?.industryId ?? ''}
            className={selectClass}
          >
            <option value="">{t.selectPlaceholder}</option>
            {industries.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectTypeId">{t.projectTypeLabel}</Label>
          <select
            id="projectTypeId"
            name="projectTypeId"
            defaultValue={initial?.projectTypeId ?? ''}
            className={selectClass}
          >
            <option value="">{t.selectPlaceholder}</option>
            {projectTypes.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="context">{t.contextLabel}</Label>
        <textarea
          id="context"
          name="context"
          ref={contextRef}
          rows={4}
          defaultValue={initial?.context ?? ''}
          placeholder={t.contextPlaceholder}
          className={textareaClass}
        />
        <ImproveButton
          field="context"
          getValue={() => contextRef.current?.value ?? ''}
          applyValue={(v) => { if (contextRef.current) contextRef.current.value = v }}
          getContext={() => collectContext('context')}
          busyField={busyField}
          setBusyField={setBusyField}
          t={t.improve}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="brief">{t.briefLabel}</Label>
        <textarea
          id="brief"
          name="brief"
          ref={briefRef}
          rows={6}
          defaultValue={initial?.brief ?? ''}
          placeholder={t.briefPlaceholder}
          className={textareaClass}
        />
        <ImproveButton
          field="brief"
          getValue={() => briefRef.current?.value ?? ''}
          applyValue={(v) => { if (briefRef.current) briefRef.current.value = v }}
          getContext={() => collectContext('brief')}
          busyField={busyField}
          setBusyField={setBusyField}
          t={t.improve}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="constraints">{t.constraintsLabel}</Label>
        <textarea
          id="constraints"
          name="constraints"
          ref={constraintsRef}
          rows={4}
          defaultValue={initial?.constraints ?? ''}
          className={textareaClass}
        />
        <ImproveButton
          field="constraints"
          getValue={() => constraintsRef.current?.value ?? ''}
          applyValue={(v) => { if (constraintsRef.current) constraintsRef.current.value = v }}
          getContext={() => collectContext('constraints')}
          busyField={busyField}
          setBusyField={setBusyField}
          t={t.improve}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="criteria">{t.criteriaLabel}</Label>
        <textarea
          id="criteria"
          name="criteria"
          ref={criteriaRef}
          rows={4}
          defaultValue={initial?.criteria ?? ''}
          className={textareaClass}
        />
        <ImproveButton
          field="criteria"
          getValue={() => criteriaRef.current?.value ?? ''}
          applyValue={(v) => { if (criteriaRef.current) criteriaRef.current.value = v }}
          getContext={() => collectContext('criteria')}
          busyField={busyField}
          setBusyField={setBusyField}
          t={t.improve}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="deliverable">{t.deliverableLabel}</Label>
        <textarea
          id="deliverable"
          name="deliverable"
          ref={deliverableRef}
          rows={3}
          defaultValue={initial?.deliverable ?? ''}
          className={textareaClass}
        />
        <ImproveButton
          field="deliverable"
          getValue={() => deliverableRef.current?.value ?? ''}
          applyValue={(v) => { if (deliverableRef.current) deliverableRef.current.value = v }}
          getContext={() => collectContext('deliverable')}
          busyField={busyField}
          setBusyField={setBusyField}
          t={t.improve}
        />
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4">
        <div className="space-y-2">
          <Label>{t.visibilityLabel}</Label>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={visibility === 'public'}
                onChange={() => setVisibility('public')}
              />
              {t.visibilityPublic}
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="radio"
                name="visibility"
                value="private"
                checked={visibility === 'private'}
                onChange={() => setVisibility('private')}
              />
              {t.visibilityPrivate}
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            {visibility === 'public' ? t.visibilityPublicHint : t.visibilityPrivateHint}
          </p>
        </div>

        {visibility === 'public' && (
          <div className="space-y-2">
            <Label>{t.leaguesLabel}</Label>
            <p className="text-xs text-muted-foreground">{t.leaguesHint}</p>
            <div className="flex flex-wrap gap-3">
              {leagues.map((league) => (
                <label key={league.id} className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    name="targetLeagueIds"
                    value={league.id}
                    defaultChecked={checkedLeagueIds.has(league.id)}
                  />
                  {league.name}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="deadlineAt">{t.deadlineLabel}</Label>
          <Input
            id="deadlineAt"
            name="deadlineAt"
            type="date"
            min={todayStr}
            defaultValue={initial?.deadlineAt ? initial.deadlineAt.slice(0, 10) : ''}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="maxResponses">{t.maxResponsesLabel}</Label>
          <Input
            id="maxResponses"
            name="maxResponses"
            type="number"
            min={1}
            step={1}
            placeholder={t.maxResponsesPlaceholder}
            defaultValue={initial?.maxResponses != null ? String(initial.maxResponses) : ''}
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" name="action" value="draft" variant="outline" className="flex-1" disabled={isPending}>
          {isPending ? t.submitting : t.submit}
        </Button>
        <Button type="submit" name="action" value="publish" className="flex-1" disabled={isPending}>
          {isPending ? t.submitting : t.publish}
        </Button>
      </div>
    </form>
  )
}
