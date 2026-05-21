import { NextResponse } from 'next/server'
import { generateMentorProfile } from '@/lib/ai-mentors/generate'
import { requireAdmin } from '../route'

export const maxDuration = 30

export async function POST(request: Request) {
  const a = await requireAdmin()
  if (a.error) return a.error
  const body = await request.json()
  try {
    const profile = await generateMentorProfile({
      specialty: body.specialty,
      tone: body.tone,
      obsessions: body.obsessions ?? [],
      traits: body.traits ?? [],
      experienceYears: body.experienceYears ?? 8,
      language: body.language ?? 'fr',
    })
    return NextResponse.json({ profile })
  } catch (e: unknown) {
    return NextResponse.json({ error: String(e instanceof Error ? e.message : e) }, { status: 500 })
  }
}
