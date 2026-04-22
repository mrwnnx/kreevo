'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { leagueLabel, LEAGUE_COLORS, getLeagueProgress, getXPForNextLeague, getNextLeague } from '@/lib/utils/xp'
import type { League } from '@/lib/utils/xp'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types/database.types'
import { CheckCircle, Loader2, Shield, CreditCard, Zap } from 'lucide-react'

export function SettingsClient({ profile, email }: { profile: Profile; email: string }) {
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const league = (profile.league ?? 'rookie') as League
  const progress = getLeagueProgress(profile.xp ?? 0)
  const xpLeft = getXPForNextLeague(profile.xp ?? 0)
  const nextLeague = getNextLeague(league)
  const gradient = LEAGUE_COLORS[league]

  async function handlePasswordChange() {
    setError(null)
    setSuccess(null)
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return }
    startTransition(async () => {
      const supabase = createClient()
      const { error: err } = await supabase.auth.updateUser({ password: newPassword })
      if (err) { setError(err.message); return }
      setSuccess('Password updated successfully')
      setNewPassword('')
      setConfirmPassword('')
    })
  }

  return (
    <div className="space-y-8">

      {/* Plan & League */}
      <section className="rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-white dark:bg-zinc-900/20">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Plan & League</h2>
          </div>
        </div>
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Current Plan</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {profile.plan === 'free' ? 'Free — limited to 3 AI briefs/month' : 'Pro — unlimited AI briefs & features'}
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
              Upgrade to Pro — Coming Soon
            </Button>
          )}

          <div className="pt-2 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">League</span>
              <span className={cn('text-xs font-mono font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full text-white bg-gradient-to-r', gradient)}>
                {leagueLabel(league)}
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-700', gradient)}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {nextLeague ? (
                <p className="text-xs text-muted-foreground">
                  {xpLeft} XP to reach {leagueLabel(nextLeague)} · Total: {profile.xp ?? 0} XP
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Legend — maximum league · {profile.xp ?? 0} XP</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Account */}
      <section className="rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-white dark:bg-zinc-900/20">
          <div className="flex items-center gap-2">
            <Shield className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">Account</h2>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <p className="text-sm font-medium">{email}</p>
          </div>

          <div className="pt-3 border-t border-border space-y-4">
            <p className="text-sm font-medium">Change Password</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="newPw" className="text-xs">New Password</Label>
                <Input
                  id="newPw"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPw" className="text-xs">Confirm Password</Label>
                <Input
                  id="confirmPw"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
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
              {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Update Password'}
            </Button>
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-xl border border-destructive/30 overflow-hidden">
        <div className="px-5 py-4 border-b border-destructive/30 bg-destructive/5">
          <h2 className="text-sm font-semibold text-destructive">Danger Zone</h2>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete Account</p>
              <p className="text-xs text-muted-foreground mt-0.5">Permanently delete your account and all data</p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm('Are you sure? This action cannot be undone.')) {
                  alert('Contact support@kreevo.io to delete your account.')
                }
              }}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
