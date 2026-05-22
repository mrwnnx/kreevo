'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetPassword } from '@/app/(auth)/actions'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

type AuthT = Dictionary['auth']

interface Props {
  t: AuthT['forgotPassword']
  tc: AuthT['common']
}

export function ForgotPasswordForm({ t, tc }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await resetPassword(formData)
      if (result?.error) setError(result.error)
      else if (result?.success) setSuccess(result.success)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">{tc.emailLabel}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder={tc.emailPlaceholder}
          required
          autoComplete="email"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}

      <Button type="submit" className="w-full" disabled={isPending || !!success}>
        {isPending ? t.submitting : t.submit}
      </Button>

      <p className="text-center">
        <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground">
          {t.backToLogin}
        </Link>
      </p>
    </form>
  )
}
