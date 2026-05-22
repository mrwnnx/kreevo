'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updatePassword } from '@/app/(auth)/actions'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

type AuthT = Dictionary['auth']

interface Props {
  t: AuthT['updatePassword']
  tc: AuthT['common']
}

export function UpdatePasswordForm({ t, tc }: Props) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)
    const pw = formData.get('password') as string
    const confirm = formData.get('confirm') as string
    if (pw !== confirm) {
      setError(t.mismatch)
      return
    }
    startTransition(async () => {
      const result = await updatePassword(formData)
      if (result?.error) {
        setError(result.error)
      } else if (result?.success) {
        setSuccess(result.success)
        setTimeout(() => router.push('/dashboard'), 1200)
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">{t.newPasswordLabel}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder={tc.passwordPlaceholder}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">{t.confirmLabel}</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          placeholder={tc.passwordPlaceholder}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}

      <Button type="submit" className="w-full" disabled={isPending || !!success}>
        {isPending ? t.submitting : t.submit}
      </Button>
    </form>
  )
}
