'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { getLeagueLabel, getLeagueColor } from '@/lib/utils/xp'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types/database.types'
import { CheckCircle, Loader2, Shield, Zap } from 'lucide-react'
import { tx } from '@/lib/i18n/tx'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'
import { translateAuthError } from '@/lib/auth-errors'
import { GLASS_SURFACE, GLASS_GRADIENT } from '@/components/layout/GlassShell'

type SettingsT = Dictionary['settings']
type AuthErrorsT = Dictionary['auth']['errors']

export function SettingsClient({
  profile,
  email,
  t,
  tErrors,
}: {
  profile: Profile
  email: string
  t: SettingsT
  tErrors: AuthErrorsT
}) {
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const league = profile.league ?? 'Stone'
  const leagueColor = getLeagueColor(league)

  async function handlePasswordChange() {
    setError(null)
    setSuccess(null)
    if (newPassword !== confirmPassword) { setError(t.account.passwordsDontMatch); return }
    if (newPassword.length < 8) { setError(t.account.passwordTooShort); return }
    startTransition(async () => {
      const supabase = createClient()
      const { error: err } = await supabase.auth.updateUser({ password: newPassword })
      if (err) { setError(translateAuthError(err, tErrors)); return }
      setSuccess(t.account.passwordSuccess)
      setNewPassword('')
      setConfirmPassword('')
    })
  }

  return (
    <div className="space-y-8">

      {/* Plan & League */}
      <section className={`${GLASS_SURFACE} overflow-hidden rounded-[24px]`} style={GLASS_GRADIENT}>
        <div className="px-5 py-4 border-b border-[#dcdce8]">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">{t.plan.sectionTitle}</h2>
          </div>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t.plan.currentPlan}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {profile.plan === 'free' ? t.plan.freeDescription : t.plan.proDescription}
              </p>
            </div>
            <span className={cn(
              'text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full text-white bg-gradient-to-r',
              profile.plan === 'pro' ? 'from-violet-600 to-purple-500' : 'from-slate-500 to-slate-400'
            )}>
              {profile.plan ?? 'free'}
            </span>
          </div>

          {profile.plan === 'free' && (
            <Button size="sm" className="w-full">
              {t.plan.upgradeCta}
            </Button>
          )}

          <div className="pt-2 border-t border-[#dcdce8] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{t.plan.currentLeague}</span>
              <span
                className="text-xs font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: leagueColor }}
              >
                {getLeagueLabel(league)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {tx(t.plan.total, { n: (profile.xp ?? 0).toLocaleString() })}
            </p>
          </div>
        </div>
      </section>

      {/* Account */}
      <section className={`${GLASS_SURFACE} overflow-hidden rounded-[24px]`} style={GLASS_GRADIENT}>
        <div className="px-5 py-4 border-b border-[#dcdce8]">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">{t.account.sectionTitle}</h2>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{t.account.email}</Label>
            <p className="text-sm font-medium">{email}</p>
          </div>

          <div className="pt-3 border-t border-[#dcdce8] space-y-4">
            <p className="text-sm font-medium">{t.account.changePassword}</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="newPw" className="text-xs">{t.account.newPassword}</Label>
                <Input
                  id="newPw"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder={t.account.newPasswordPlaceholder}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPw" className="text-xs">{t.account.confirmPassword}</Label>
                <Input
                  id="confirmPw"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder={t.account.confirmPasswordPlaceholder}
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && (
              <p className="flex items-center gap-1.5 text-sm text-green-600">
                <CheckCircle className="size-4" /> {success}
              </p>
            )}

            <Button onClick={handlePasswordChange} disabled={isPending || !newPassword} size="sm">
              {isPending ? <Loader2 className="size-4 animate-spin" /> : t.account.updatePassword}
            </Button>
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-xl border border-destructive/30 overflow-hidden">
        <div className="px-5 py-4 border-b border-destructive/30 bg-destructive/5">
          <h2 className="text-sm font-semibold text-destructive">{t.danger.sectionTitle}</h2>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{t.danger.deleteAccount}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t.danger.deleteAccountBody}</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm(t.danger.confirmDelete)) {
                  alert(t.danger.contactSupport)
                }
              }}
            >
              {t.danger.deleteAccount}
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
