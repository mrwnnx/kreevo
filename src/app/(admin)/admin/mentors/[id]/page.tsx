import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { MentorForm } from '@/components/admin/MentorForm'
import type { AiMentor } from '@/lib/ai-mentors/types'

export const dynamic = 'force-dynamic'

export default async function EditMentorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { data } = await (supabaseAdmin as any).from('ai_mentors').select('*').eq('id', id).single()
  if (!data) notFound()
  return <MentorForm mentor={data as AiMentor} />
}
