export type MentorSpecialty = 'ux' | 'ui' | 'graphic' | 'brand' | 'general'
export type MentorTone = 'kind' | 'demanding' | 'creative' | 'pragmatic' | 'analytical'

export interface AiMentor {
  id: string
  name: string
  title: string
  avatar_url: string | null
  bio_short: string
  bio_long: string | null
  specialty: MentorSpecialty
  tone: MentorTone
  obsessions: string[]
  system_prompt: string
  is_active: boolean
  language: string
  comments_count: number
  last_used_at: string | null
}

export interface AiMentorComment {
  id: string
  submission_id: string
  mentor_id: string
  content: string
  highlight: string | null
  improvement_focus: string | null
  language: string
  is_visible: boolean
  created_at: string
  mentor?: Pick<AiMentor, 'id' | 'name' | 'title' | 'avatar_url' | 'bio_short'>
}

// Shape Claude must return for a mentor comment
export interface MentorCommentOutput {
  content: string
  highlight: string
  improvement_focus: string
}

// Shape Claude must return for the admin profile generator
export interface MentorProfileOutput {
  name: string
  title: string
  bio_short: string
  bio_long: string
  system_prompt: string
}
