'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { cn } from '@/lib/utils'
import { tx } from '@/lib/i18n/tx'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

type Props = {
  profile: any
  xpData: { day: string; xp: number }[]
  challengeData: { day: string; count: number }[]
  streak: any
  totalCompleted: number
  firstName: string
  t: Dictionary['dashboard']['analytics']
}

export function Analytics({
  profile,
  xpData,
  challengeData,
  streak,
  totalCompleted,
  t,
}: Props) {
  const [period, setPeriod] = useState<'week' | 'month'>('week')

  const totalXP = profile?.xp || 0
  const betterThan = 68

  const stats = [
    {
      label: t.stats.totalXp,
      value: totalXP.toLocaleString(),
      delta: '+18%',
      positive: true,
    },
    {
      label: t.stats.timeSpent,
      value: '4h 12m',
      delta: '+22m',
      positive: true,
    },
    {
      label: t.stats.challenges,
      value: totalCompleted.toString(),
      delta: '+6',
      positive: true,
    },
    {
      label: t.stats.bestStreak,
      value: `${streak?.longest_streak || 0}d`,
      delta: streak?.longest_streak > 30 ? t.record : null,
      positive: true,
    },
  ]

  return (
    <div className="bg-card border border-border rounded-[24px] p-4">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h3 className="font-semibold">{t.title}</h3>
          <p
            className="text-xs text-muted-foreground mt-0.5"
            dangerouslySetInnerHTML={{ __html: tx(t.subtitle, { n: betterThan }) }}
          />
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden text-sm">
          {(['week', 'month'] as const).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={cn(
                'px-4 py-1.5',
                period === p
                  ? 'bg-muted font-medium'
                  : 'text-muted-foreground hover:bg-muted/60',
              )}
            >
              {p === 'week' ? t.week : t.month}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div>
          <p className="text-xs text-muted-foreground mb-3">{t.xpGained}</p>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={xpData}>
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="xp" stroke="#7C3AED" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-3">{t.challengesPerDay}</p>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={challengeData}>
              <XAxis
                dataKey="day"
                tick={{ fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {stats.map(stat => (
            <div
              key={stat.label}
              className="flex items-center justify-between pb-3 border-b border-border last:border-0 last:pb-0"
            >
              <div>
                <p className="text-xs text-muted-foreground tracking-widest">{stat.label}</p>
                <p className="text-xl font-bold mt-0.5">{stat.value}</p>
              </div>
              {stat.delta && (
                <span
                  className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded-full',
                    stat.positive
                      ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400'
                      : 'text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400',
                  )}
                >
                  {stat.positive && stat.delta !== 'record' ? '+' : ''}
                  {stat.delta}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
