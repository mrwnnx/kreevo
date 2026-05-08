'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signUpWithEmail } from '@/app/(auth)/actions'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

type AuthT = Dictionary['auth']

interface SignupFormProps {
  t: AuthT['signup']
  tc: AuthT['common']
}

export function SignupForm({ t, tc }: SignupFormProps) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await signUpWithEmail(formData)
      if (result?.error) setError(result.error)
      if (result?.success) setSuccess(result.success)
    })
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">{t.usernameLabel}</Label>
        <Input
          id="username"
          name="username"
          type="text"
          placeholder={t.usernamePlaceholder}
          required
          autoComplete="username"
          pattern="^[a-z0-9_]{3,20}$"
          title={t.usernameTitle}
        />
      </div>
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
      <div className="space-y-2">
        <Label htmlFor="password">{tc.passwordLabel}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder={tc.passwordPlaceholder}
          required
          autoComplete="new-password"
          minLength={8}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? t.submitting : t.submit}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t.hasAccount}{' '}
        <Link href="/login" className="font-medium text-foreground hover:underline">
          {t.loginCta}
        </Link>
      </p>
    </form>
  )
}
