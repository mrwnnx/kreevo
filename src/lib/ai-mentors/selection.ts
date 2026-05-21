import type { AiMentor } from './types'
import { mentorMatchesSpecialty } from './matching'

/** Random target count: 30% → 2, 40% → 3, 30% → 4. */
export function desiredMentorCount(rand: () => number = Math.random): 2 | 3 | 4 {
  const r = rand()
  if (r < 0.3) return 2
  if (r < 0.7) return 3
  return 4
}

/**
 * Select mentors for a submission.
 * - filters active mentors matching the discipline (or 'general')
 * - 0 eligible → []   · 1–3 eligible → all   · 4+ → pick desiredCount maximizing tone diversity
 */
export function selectMentors(
  mentors: AiMentor[],
  submissionSpecialty: string | null | undefined,
  rand: () => number = Math.random,
): AiMentor[] {
  const eligible = mentors.filter(
    (m) => m.is_active && mentorMatchesSpecialty(m.specialty, submissionSpecialty),
  )
  if (eligible.length <= 3) return eligible

  const target = desiredMentorCount(rand)
  // Greedy tone diversity: shuffle, then pick preferring unseen tones.
  const shuffled = [...eligible].sort(() => rand() - 0.5)
  const picked: AiMentor[] = []
  const seenTones = new Set<string>()
  for (const m of shuffled) {
    if (picked.length >= target) break
    if (!seenTones.has(m.tone)) {
      picked.push(m)
      seenTones.add(m.tone)
    }
  }
  // Top up if not enough distinct tones.
  for (const m of shuffled) {
    if (picked.length >= target) break
    if (!picked.includes(m)) picked.push(m)
  }
  return picked
}
