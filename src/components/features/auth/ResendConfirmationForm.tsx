'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { resendConfirmation } from '@/app/(auth)/actions'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

type AuthT = Dictionary['auth']

interface Props {
  t: AuthT['login']
  tc: AuthT['common']
}

// Affiché sur /login quand le lien d'activation a expiré : renvoie un nouveau lien.
export function ResendConfirmationForm({ t, tc }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await resendConfirmation(formData)
      if (result?.error) setError(result.error)
      else if (result?.success) setSuccess(result.success)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-2">
      <p className="text-sm text-destructive">{t.linkExpired}</p>
      <div className="flex gap-2">
        <Input name="email" type="email" required placeholder={tc.emailPlaceholder} disabled={isPending || !!success} />
        <Button type="submit" variant="outline" disabled={isPending || !!success}>{t.resendCta}</Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}
    </form>
  )
}
