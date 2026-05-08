'use client'

import { UserPlus, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { tx } from '@/lib/i18n/tx'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

type Props = {
  profile: any
  referrals: any[]
  t: Dictionary['dashboard']['inviteFriends']
}

export function InviteFriends({ profile, referrals, t }: Props) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kreevo.app'
  const referralLink = `${baseUrl}/signup?ref=${profile?.referral_code ?? ''}`

  function copyLink() {
    navigator.clipboard.writeText(referralLink)
    toast.success(t.copiedToast)
  }

  function shareLink() {
    if (navigator.share) {
      navigator.share({
        title: t.shareTitle,
        text: t.shareText,
        url: referralLink,
      }).catch(() => {})
    } else {
      copyLink()
    }
  }

  return (
    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border border-teal-100 dark:border-teal-900/30 rounded-[24px] p-4 relative overflow-hidden">
      <div className="absolute right-4 top-4 text-5xl opacity-10 select-none">🚀</div>

      <h3 className="font-bold text-lg mb-1">{t.title}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {t.subtitle}
      </p>

      {referrals?.length > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <div className="flex -space-x-2">
            {referrals.slice(0, 5).map((ref: any, i: number) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-background bg-violet-100 overflow-hidden flex items-center justify-center text-xs font-medium text-violet-600"
              >
                {ref.referred?.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={ref.referred.avatar_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  ref.referred?.username?.[0]?.toUpperCase() ?? '?'
                )}
              </div>
            ))}
            {referrals.length > 5 && (
              <div className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                +{referrals.length - 5}
              </div>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {tx(referrals.length > 1 ? t.friendsJoinedPlural : t.friendsJoined, { n: referrals.length })}
          </span>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <Button onClick={shareLink} className="bg-teal-600 hover:bg-teal-700 text-white">
          <UserPlus className="w-4 h-4 mr-2" />
          {t.inviteCta}
        </Button>
        <Button variant="outline" onClick={copyLink}>
          <Copy className="w-4 h-4 mr-2" />
          {t.copyCta}
        </Button>
      </div>
    </div>
  )
}
