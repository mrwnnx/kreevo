import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { GlassShell } from '@/components/layout/GlassShell'
import { GlassCard, CardBadge } from '@/components/features/dashboard/GlassCard'
import { GlassHeader } from '@/components/layout/GlassHeader'
import { getScopedLeagueScores } from '@/lib/utils/leagues'
import { getDict } from '@/lib/i18n/lang'
import { tx } from '@/lib/i18n/tx'

export const metadata: Metadata = { title: 'Dashboard · Kreevo' }

// Dégradé du prénom et du titre « Solo Experience » (Figma 431:5291 / 444:444).
const NAME_GRADIENT =
  'linear-gradient(90deg, #6040C0 0%, #A050B0 25%, #F5B8F0 50%, #A050B0 75%, #6040C0 100%)'

export default async function DashboardV2Page() {
  const [supabase, dict] = await Promise.all([createClient(), getDict()])
  const t = dict.homeV2
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('first_name, full_name, username, avatar_url, xp, league, specialty_id, role, plan')
    .eq('id', user.id)
    .single()
  if (!profile) redirect('/login')

  const leagueName = (profile.league as string) ?? 'Stone'
  const specialtyId = (profile.specialty_id ?? null) as string | null

  const [{ data: leagueRow }, { data: specialtyRow }] = await Promise.all([
    (supabaseAdmin as any).from('leagues').select('id, name').ilike('name', leagueName).maybeSingle(),
    specialtyId
      ? (supabaseAdmin as any).from('specialties').select('name').eq('id', specialtyId).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  // Rang dans la ligue, scopé par spécialité — même source que /dashboard
  // (getScopedLeagueScores), pour que les deux pages ne divergent jamais.
  let rank = 1
  if (leagueRow?.id && specialtyId) {
    const scoreByUser = await getScopedLeagueScores(leagueRow.id, specialtyId)
    const { data: peers } = await (supabaseAdmin as any)
      .from('profiles')
      .select('id')
      .ilike('league', leagueName)
      .eq('specialty_id', specialtyId)
    const ranked = [...((peers ?? []) as { id: string }[])].sort(
      (a, b) => (scoreByUser[b.id] ?? 0) - (scoreByUser[a.id] ?? 0),
    )
    const idx = ranked.findIndex((u) => u.id === user.id)
    rank = idx >= 0 ? idx + 1 : ranked.length + 1
  }

  const firstName =
    (profile.first_name as string)?.trim() ||
    (profile.full_name as string)?.trim()?.split(' ')[0] ||
    (profile.username as string) ||
    ''
  const avatarUrl = (profile.avatar_url as string) ?? null
  const isAdmin = profile.role === 'admin'

  return (
    <GlassShell>
      <div>
        <GlassHeader />

        <div className="mx-auto flex w-full max-w-[736.008px] flex-col gap-[32px] px-6 pb-16 pt-[64px] lg:px-0">
          {/* Accroche (Figma 431:5332). */}
          <div className="flex w-full items-center gap-[16px]">
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" aria-hidden className="size-[62px] rounded-full object-cover" />
              ) : (
                <span className="block size-[62px] rounded-full bg-secondary" />
              )}
              <img
                src="/brand/badge-verified.svg"
                alt=""
                aria-hidden
                className="absolute bottom-[0.89%] end-[-0.44%] size-[19px]"
              />
            </div>
            <div className="flex flex-col gap-[8px] whitespace-nowrap">
              <p className="text-[24px] font-semibold leading-[1.1] text-[#2b2c36]">
                {tx(t.greeting, { name: '\u0000' })
                  .split('\u0000')
                  .flatMap((part, i) =>
                    i === 0
                      ? [part]
                      : [
                          <span key={i} className="bg-clip-text text-transparent" style={{ backgroundImage: NAME_GRADIENT }}>
                            {firstName}
                          </span>,
                          part,
                        ],
                  )}
              </p>
              <p className="text-[14px] font-normal leading-[1.2] text-[#484848]">
                {specialtyRow?.name ?? ''}
              </p>
            </div>
          </div>

          {/* Grille 2 colonnes (Figma 440:407). */}
          <div className="grid w-full grid-cols-1 gap-x-[16px] gap-y-[15px] sm:grid-cols-2">
            <GlassCard
              href="/dashboard/challenges"
              label={t.challenges}
              illustration="/brand/illu-challenges.png"
              illustrationClassName="bottom-[-260px] -end-[215px] h-[640px] w-[671px] object-cover"
              className="min-h-[353px]"
            >
              <p className="whitespace-nowrap text-[24px] font-semibold leading-none text-[#2b2c36]">
                {t.challenges}
              </p>
            </GlassCard>

            <GlassCard
              href="/dashboard/leaderboard"
              label={t.league}
              illustration="/brand/illu-league.png"
              illustrationClassName="bottom-[-218.8px] -end-[71.25px] h-[518.646px] w-[390.71px] object-cover"
              className="min-h-[353px]"
            >
              <div className="flex w-full flex-col gap-[7.891px]">
                <div className="flex items-end gap-[8px]">
                  <p className="whitespace-nowrap text-[24px] font-semibold leading-none text-[#2b2c36]">
                    {t.league}
                  </p>
                  <CardBadge label={leagueName.toUpperCase()} className="bg-[#d4e1eb] text-[#044473]" />
                </div>
                <p className="flex items-center gap-[4px] whitespace-nowrap text-[14px] leading-[1.2]">
                  <span className="font-normal text-[#484848]">{t.xp}</span>
                  <span className="font-semibold text-[#080808]">
                    {Number(profile.xp ?? 0).toLocaleString('en-US')}
                  </span>
                </p>
                <p className="flex items-center gap-[4px] whitespace-nowrap text-[14px] leading-[1.2]">
                  <span className="font-normal text-[#484848]">{t.ranking}</span>
                  <span className="font-semibold text-[#080808]">{rank}</span>
                </p>
              </div>
            </GlassCard>

            {/* Solo — WIP, réservé aux admins comme sur /dashboard/solo. */}
            {isAdmin && (
              <GlassCard
                href="/dashboard/solo"
                label={t.soloExperience}
                illustration="/brand/illu-solo.png"
                illustrationClassName="bottom-[-178.85px] -end-[18.78px] h-[356.928px] w-[371.801px] rotate-[7.99deg] object-cover"
                className="h-[209px] sm:col-span-2"
              >
                <div className="flex items-center gap-[8px]">
                  <p
                    className="whitespace-nowrap bg-clip-text text-[24px] font-semibold leading-[1.1] text-transparent"
                    style={{ backgroundImage: NAME_GRADIENT }}
                  >
                    {t.soloExperience}
                  </p>
                  <CardBadge label={t.pro} className="bg-[#4b4b4b] text-white" />
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </div>
    </GlassShell>
  )
}
