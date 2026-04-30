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
  links: Record<string, string>
  avatarUrl: string
  country: string
}

export const TOTAL_STEPS = 7

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
