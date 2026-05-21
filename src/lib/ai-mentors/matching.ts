import type { MentorSpecialty } from './types'

// challenge.specialty in the DB stores discipline LABELS ("UX Designer",
// "UI Designer", "Graphic Designer"). We also defensively accept the legacy
// code values ('ux_ui', 'graphic', 'ux', 'ui') used elsewhere in the app.
export type SubmissionSpecialty = string

/** Does a mentor's specialty match a submission's discipline? */
export function mentorMatchesSpecialty(
  mentorSpecialty: MentorSpecialty,
  submissionSpecialty: string | null | undefined,
): boolean {
  if (mentorSpecialty === 'general') return true

  const s = (submissionSpecialty ?? '').toLowerCase()
  if (!s) return false

  // Graphic / brand discipline
  if (s.includes('graphic') || s.includes('brand')) {
    return mentorSpecialty === 'graphic' || mentorSpecialty === 'brand'
  }

  // Legacy combined code → matches both ux and ui mentors
  if (s === 'ux_ui') {
    return mentorSpecialty === 'ux' || mentorSpecialty === 'ui'
  }

  const isUx = s.includes('ux')
  const isUi = s.includes('ui')
  if (isUx && !isUi) return mentorSpecialty === 'ux' // "UX Designer"
  if (isUi && !isUx) return mentorSpecialty === 'ui' // "UI Designer"
  if (isUx || isUi) return mentorSpecialty === 'ux' || mentorSpecialty === 'ui'

  return false
}
