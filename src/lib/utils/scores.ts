export interface ScoreWeights {
  visual: number
  ux: number
  creativity: number
}

const DEFAULT_WEIGHTS: ScoreWeights = {
  visual: 0.4,
  ux: 0.35,
  creativity: 0.25,
}

export function computeScore(
  visual: number,
  ux: number,
  creativity: number,
  weights = DEFAULT_WEIGHTS
): number {
  return Math.round(
    visual * weights.visual +
    ux * weights.ux +
    creativity * weights.creativity
  )
}

export function scoreLabel(score: number): string {
  if (score >= 90) return 'Exceptional'
  if (score >= 75) return 'Strong'
  if (score >= 60) return 'Good'
  if (score >= 45) return 'Average'
  return 'Needs Work'
}

export function scoreColor(score: number): string {
  if (score >= 90) return 'text-emerald-500'
  if (score >= 75) return 'text-green-500'
  if (score >= 60) return 'text-yellow-500'
  if (score >= 45) return 'text-orange-500'
  return 'text-red-500'
}

export function rankFromScore(score: number, totalSubmissions: number, rank: number): string {
  const percentile = ((totalSubmissions - rank) / totalSubmissions) * 100
  if (percentile >= 95) return 'Top 5%'
  if (percentile >= 90) return 'Top 10%'
  if (percentile >= 75) return 'Top 25%'
  if (percentile >= 50) return 'Top 50%'
  return 'Participant'
}
