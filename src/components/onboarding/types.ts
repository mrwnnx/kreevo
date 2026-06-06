export type Specialty = 'ux_ui' | 'graphic' | ''
export type ExperienceLevel = 'entry' | 'junior' | 'senior' | ''

// PHASE 5 — option de spécialité lue dynamiquement depuis la table specialties.
export interface SpecialtyOption {
  id: string
  slug: string
  name: string
  emoji: string | null
}
export type Objective = 'getting_hired' | 'improving_skills'

export interface OnboardingData {
  firstName: string
  lastName: string
  jobTitle: string
  specialty: Specialty
  tools: string[]
  experienceLevel: ExperienceLevel
  objectives: Objective[]
  links: Record<string, string>
  avatarUrl: string
  country: string
}

export const TOTAL_STEPS = 8

// Predefined job titles shared by onboarding and the profile form.
export const JOB_TITLES = [
  'Product Designer',
  'UX Designer',
  'UI Designer',
  'UX/UI Designer',
  'UX Researcher',
  'Graphic Designer',
  'Brand Designer',
  'Visual Designer',
  'Motion Designer',
  'Design Lead',
  'Art Director',
  'Design Student',
  'Freelance Designer',
] as const

export const TOOLS_BY_SPECIALTY: Record<'ux_ui' | 'graphic', string[]> = {
  ux_ui: [
    // Design
    'Figma',
    'Sketch',
    'Adobe XD',
    'Framer',
    'Penpot',
    'Webflow',
    // Whiteboarding
    'FigJam',
    'Miro',
    'Mural',
    'Whimsical',
    // Prototyping & motion
    'ProtoPie',
    'Principle',
    'Origami Studio',
    'Rive',
    'Lottie',
    'After Effects',
    // Research & testing
    'Maze',
    'UserTesting',
    'Hotjar',
    'Lookback',
    'Optimal Workshop',
    'Dovetail',
    // Handoff & versioning
    'Zeplin',
    'Abstract',
    // Productivity & collab
    'Notion',
    'Confluence',
    'Linear',
    'Jira',
    'Slack',
    // AI
    'Claude',
    'ChatGPT',
    'Galileo AI',
    'Uizard',
    'v0',
    'Cursor',
  ],
  graphic: [
    // Adobe
    'Adobe Photoshop',
    'Adobe Illustrator',
    'Adobe InDesign',
    'Adobe After Effects',
    'Adobe Premiere Pro',
    'Adobe Lightroom',
    'Adobe Firefly',
    'Adobe Fresco',
    // Affinity
    'Affinity Designer',
    'Affinity Photo',
    'Affinity Publisher',
    // Vector / raster alts
    'CorelDRAW',
    'Inkscape',
    'Krita',
    'Procreate',
    // 3D & motion
    'Blender',
    'Cinema 4D',
    'Spline',
    // Layout & web
    'Figma',
    'Canva',
    'Webflow',
    // Photo
    'Capture One',
    // Type
    'Glyphs',
    'FontLab',
    // AI
    'Midjourney',
    'DALL·E',
    'Stable Diffusion',
    'Runway',
    'Claude',
    'ChatGPT',
    // Mockups
    'Smartmockups',
    'Mockup World',
  ],
}
