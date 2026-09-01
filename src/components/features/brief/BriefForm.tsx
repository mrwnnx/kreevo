'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveBrief } from './actions'
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
}

interface BriefFormProps {
  t: T
  initial?: BriefFormInitial | null
  specialties: TaxonomyOption[]
  industries: TaxonomyOption[]
  projectTypes: TaxonomyOption[]
}

const ERROR_KEY: Record<string, keyof T> = {
  not_authenticated: 'errorAuth',
  no_company: 'errorGeneric',
  not_found: 'errorNotFound',
  save_failed: 'errorGeneric',
}

const textareaClass =
  'w-full rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 px-3 py-2 text-base md:text-sm placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none transition-colors'

const selectClass =
  'h-10 w-full rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 px-3 text-base md:text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors'

export function BriefForm({ t, initial, specialties, industries, projectTypes }: BriefFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)
    if (initial?.id) formData.set('id', initial.id)
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
    <form action={handleSubmit} className="space-y-5">
      <p className="text-xs text-muted-foreground">{t.draftNotice}</p>

      <div className="space-y-2">
        <Label htmlFor="title">{t.titleLabel}</Label>
        <Input
          id="title"
          name="title"
          defaultValue={initial?.title ?? ''}
          placeholder={t.titlePlaceholder}
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
          rows={4}
          defaultValue={initial?.context ?? ''}
          placeholder={t.contextPlaceholder}
          className={textareaClass}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="brief">{t.briefLabel}</Label>
        <textarea
          id="brief"
          name="brief"
          rows={6}
          defaultValue={initial?.brief ?? ''}
          placeholder={t.briefPlaceholder}
          className={textareaClass}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="constraints">{t.constraintsLabel}</Label>
        <textarea
          id="constraints"
          name="constraints"
          rows={4}
          defaultValue={initial?.constraints ?? ''}
          className={textareaClass}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="criteria">{t.criteriaLabel}</Label>
        <textarea
          id="criteria"
          name="criteria"
          rows={4}
          defaultValue={initial?.criteria ?? ''}
          className={textareaClass}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="deliverable">{t.deliverableLabel}</Label>
        <textarea
          id="deliverable"
          name="deliverable"
          rows={3}
          defaultValue={initial?.deliverable ?? ''}
          className={textareaClass}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? t.submitting : t.submit}
      </Button>
    </form>
  )
}
