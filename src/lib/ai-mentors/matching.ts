import type { MentorSpecialty } from './types'

// challenge.specialty values used across the app
export type SubmissionSpecialty = 'ux_ui' | 'graphic'

/** Does a mentor's specialty match a submission's discipline? */
export function mentorMatchesSpecialty(
  mentorSpecialty: MentorSpecialty,
  submissionSpecialty: string | null | undefined,
): boolean {
  if (mentorSpecialty === 'general') return true
  if (submissionSpecialty === 'ux_ui') return mentorSpecialty === 'ux' || mentorSpecialty === 'ui'
  if (submissionSpecialty === 'graphic') return mentorSpecialty === 'graphic' || mentorSpecialty === 'brand'
  return false
}
