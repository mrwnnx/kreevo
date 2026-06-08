export const BADGE_DEFINITIONS: Record<string, { icon: string; label: string; description: string }> = {
  // Badges challenge (legacy — non attribués, awardBadge retiré PHASE 7)
  champion_month:   { icon: '🥇', label: 'Champion du mois',  description: '#1 du classement mensuel' },
  podium:           { icon: '🥈', label: 'Podium',            description: 'Top 3 d\'un challenge mensuel' },
  top_10:           { icon: '🏅', label: 'Top 10',            description: 'Top 10 d\'un challenge mensuel' },
  completed:        { icon: '✅', label: 'Challenge complété', description: 'A soumis un challenge mensuel' },
  // League milestones (8 ligues)
  reached_bronze:   { icon: '🟫', label: 'Bronze atteint',   description: 'Atteint la ligue Bronze' },
  reached_silver:   { icon: '⚪', label: 'Silver atteint',   description: 'Atteint la ligue Silver' },
  reached_gold:     { icon: '🟡', label: 'Gold atteint',     description: 'Atteint la ligue Gold' },
  reached_platinum: { icon: '🔷', label: 'Platinum atteint', description: 'Atteint la ligue Platinum' },
  reached_diamond:  { icon: '💎', label: 'Diamond atteint',  description: 'Atteint la ligue Diamond' },
  reached_master:   { icon: '👑', label: 'Master atteint',   description: 'Atteint la ligue Master' },
  reached_legend:   { icon: '🔥', label: 'Legend atteint',   description: 'Atteint la ligue Legend' },
}

export type BadgeType = keyof typeof BADGE_DEFINITIONS
