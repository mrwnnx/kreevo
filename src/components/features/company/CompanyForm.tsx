'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { saveCompany } from './actions'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

type T = Dictionary['company']['form']

interface CompanyFormProps {
  t: T
  initial?: {
    name: string
    logoUrl: string
    description: string | null
    websiteUrl: string | null
    location: string | null
  } | null
}

const ERROR_KEY: Record<string, keyof T> = {
  name_required: 'errorName',
  logo_required: 'errorLogo',
  not_authenticated: 'errorAuth',
  save_failed: 'errorGeneric',
}

export function CompanyForm({ t, initial }: CompanyFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [logoUrl, setLogoUrl] = useState<string | null>(initial?.logoUrl ?? null)

  async function handleSubmit(formData: FormData) {
    setError(null)
    if (!logoUrl) {
      setError(t.errorLogo)
      return
    }
    formData.set('logoUrl', logoUrl)
    startTransition(async () => {
      const result = await saveCompany(formData)
      if (!result.ok) {
        setError(t[ERROR_KEY[result.error] ?? 'errorGeneric'])
        return
      }
      router.push('/company')
      router.refresh()
    })
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label>{t.logoLabel} *</Label>
        <ImageUpload
          bucket="companies"
          value={logoUrl}
          onChange={setLogoUrl}
          maxSizeMB={2}
          accept="image/jpeg,image/png,image/webp"
          className="aspect-[16/9] max-w-xs"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">{t.nameLabel} *</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={initial?.name ?? ''}
          placeholder={t.namePlaceholder}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t.descriptionLabel}</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={initial?.description ?? ''}
          placeholder={t.descriptionPlaceholder}
          className="w-full rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 px-3 py-2 text-base md:text-sm placeholder:text-muted-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 resize-none transition-colors"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="websiteUrl">{t.websiteLabel}</Label>
        <Input
          id="websiteUrl"
          name="websiteUrl"
          type="url"
          defaultValue={initial?.websiteUrl ?? ''}
          placeholder={t.websitePlaceholder}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">{t.locationLabel}</Label>
        <Input
          id="location"
          name="location"
          defaultValue={initial?.location ?? ''}
          placeholder={t.locationPlaceholder}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={isPending || !logoUrl}>
        {isPending ? t.submitting : t.submit}
      </Button>
    </form>
  )
}
