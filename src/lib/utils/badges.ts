export const BADGE_DEFINITIONS: Record<string, { icon: string; label: string; description: string }> = {
  // Monthly challenges
  champion_month:   { icon: '🥇', label: 'Champion du mois',  description: '#1 du classement mensuel' },
  podium:           { icon: '🥈', label: 'Podium',            description: 'Top 3 d\'un challenge mensuel' },
  top_10:           { icon: '🏅', label: 'Top 10',            description: 'Top 10 d\'un challenge mensuel' },
  completed:        { icon: '✅', label: 'Challenge complété', description: 'A soumis un challenge mensuel' },
  // Random briefs
  first_draft:      { icon: '✏️', label: 'First Draft',       description: 'Premier brief aléatoire complété' },
  consistent:       { icon: '🔥', label: 'Consistent',        description: '5 briefs complétés' },
  machine:          { icon: '⚡', label: 'Machine',           description: '20 briefs complétés' },
  obsessed:         { icon: '💀', label: 'Obsessed',          description: '50 briefs complétés' },
  speed_runner:     { icon: '⚡', label: 'Speed Runner',      description: 'Brief complété en moins de 30 min' },
  on_a_streak:      { icon: '🔥', label: 'On a Streak',       description: '7 jours consécutifs d\'activité' },
  // League milestones
  reached_rising:   { icon: '⬆️', label: 'Rising atteint',   description: 'Atteint la ligue Rising' },
  reached_pro:      { icon: '⭐', label: 'Pro atteint',       description: 'Atteint la ligue Pro' },
  reached_elite:    { icon: '💎', label: 'Elite atteint',     description: 'Atteint la ligue Elite' },
  reached_legend:   { icon: '👑', label: 'Legend atteint',    description: 'Atteint la ligue Legend' },
}

export type BadgeType = keyof typeof BADGE_DEFINITIONS

export async function awardBadge(
  userId: string,
  badgeType: BadgeType,
  metadata: Record<string, unknown> = {},
  supabase: any,
): Promise<boolean> {
  const { data: existing } = await supabase
    .from('badges')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_type', badgeType)
    .single()

  if (existing) return false

  await supabase.from('badges').insert({
    user_id: userId,
    badge_type: badgeType,
    metadata,
  })

  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      type: 'badge',
      data: { badge_type: badgeType, ...BADGE_DEFINITIONS[badgeType] },
    })
  } catch {
    // notifications table may not exist yet
  }

  return true
}
