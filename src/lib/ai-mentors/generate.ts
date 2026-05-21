import type Anthropic from '@anthropic-ai/sdk'
import { anthropic } from '@/lib/anthropic/client'
import type {
  AiMentor,
  MentorCommentOutput,
  MentorProfileOutput,
  MentorSpecialty,
  MentorTone,
} from './types'

const MODEL = 'claude-sonnet-4-6'

function parseJson<T>(text: string): T {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in model output')
  return JSON.parse(match[0]) as T
}

/** Generate a mentor's comment for a submission (vision: cover image + brief). */
export async function generateMentorComment(args: {
  mentor: AiMentor
  coverUrl: string | null
  challengeTitle: string
  brief: string | null
  submissionTitle: string | null
  submissionDescription: string | null
}): Promise<{ output: MentorCommentOutput; durationMs: number; tokens: number }> {
  const { mentor, coverUrl, challengeTitle, brief, submissionTitle, submissionDescription } = args
  const start = Date.now()

  const content: Anthropic.ContentBlockParam[] = []
  if (coverUrl) {
    content.push({ type: 'image', source: { type: 'url', url: coverUrl } })
  }
  content.push({
    type: 'text',
    text:
      `Challenge: ${challengeTitle}\n` +
      (brief ? `Brief: ${brief}\n` : '') +
      (submissionTitle ? `Titre de la soumission: ${submissionTitle}\n` : '') +
      (submissionDescription ? `Description de l'auteur: ${submissionDescription}\n` : '') +
      `\nDonne ton retour sur ce design selon ta personnalité.`,
  })

  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 600,
    system: mentor.system_prompt,
    messages: [{ role: 'user', content }],
  })
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
  const output = parseJson<MentorCommentOutput>(text)
  return {
    output,
    durationMs: Date.now() - start,
    tokens: (res.usage?.input_tokens ?? 0) + (res.usage?.output_tokens ?? 0),
  }
}

/** Admin assistant: generate a full mentor profile from coarse inputs. */
export async function generateMentorProfile(args: {
  specialty: MentorSpecialty
  tone: MentorTone
  obsessions: string[]
  traits: string[]
  experienceYears: number
  language?: string
}): Promise<MentorProfileOutput> {
  const { specialty, tone, obsessions, traits, experienceYears, language = 'fr' } = args
  const res = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system:
      `Tu génères le profil d'un mentor designer virtuel pour la plateforme Kreevo (MENA). ` +
      `Le mentor doit être crédible et incarné. Réponds en JSON valide uniquement.`,
    messages: [
      {
        role: 'user',
        content:
          `Crée un mentor avec ces paramètres:\n` +
          `- Spécialité: ${specialty}\n- Ton: ${tone}\n` +
          `- Obsessions: ${obsessions.join(', ') || '—'}\n` +
          `- Traits: ${traits.join(', ') || '—'}\n` +
          `- Années d'expérience: ${experienceYears}\n- Langue: ${language}\n\n` +
          `Génère un nom plausible (mix MENA + international), un titre cohérent, ` +
          `une bio courte (1 phrase), une bio longue (3-5 phrases), et un system_prompt complet ` +
          `qui définit son identité ET impose une sortie JSON {"content","highlight","improvement_focus"} ` +
          `de 2-4 phrases en ${language}.\n\n` +
          `Réponds en JSON: {"name","title","bio_short","bio_long","system_prompt"}`,
      },
    ],
  })
  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
  return parseJson<MentorProfileOutput>(text)
}
