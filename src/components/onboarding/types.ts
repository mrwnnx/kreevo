export type Specialty = 'ux_ui' | 'graphic' | ''
export type ExperienceLevel = 'entry' | 'junior' | 'senior' | ''
export type Objective = 'getting_hired' | 'improving_skills'

export interface OnboardingData {
  firstName: string
  lastName: string
  specialty: Specialty
  tools: string[]
  experienceLevel: ExperienceLevel
  objectives: Objective[]
  behanceUrl: string
  linkedinUrl: string
  avatarUrl: string
  country: string
}

export const TOTAL_STEPS = 7

export const TOOLS_BY_SPECIALTY: Record<'ux_ui' | 'graphic', string[]> = {
  ux_ui: ['Figma', 'Adobe XD', 'Maze', 'Notion', 'Claude'],
  graphic: ['Adobe Photoshop', 'Adobe Illustrator', 'Figma', 'Canva', 'Claude'],
}
