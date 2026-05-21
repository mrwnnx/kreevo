import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { generateMentorComment } from '@/lib/ai-mentors/generate'
import { notify } from '@/lib/utils/notifications'
import type { AiMentor } from '@/lib/ai-mentors/types'

export const maxDuration = 60 // batch of generations; Hobby caps at 10s — see plan note

export async function POST(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const sb = supabaseAdmin as any

  // Recover assignments stranded in 'processing' by a previous timed-out run
  // (Vercel Hobby caps functions at ~10s; a single generation already takes ~10s).
  await sb.from('ai_mentor_assignments').update({ status: 'pending' }).eq('status', 'processing')

  const { data: due } = await sb
    .from('ai_mentor_assignments')
    .select('id, submission_id, mentor_id, retry_count')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(20) // capped batches; remaining picked up next run

  if (!due?.length) return NextResponse.json({ processed: 0 })

  let processed = 0
  for (const a of due) {
    try {
      await sb.from('ai_mentor_assignments').update({ status: 'processing' }).eq('id', a.id)

      const [{ data: mentor }, { data: sub }] = await Promise.all([
        sb.from('ai_mentors').select('*').eq('id', a.mentor_id).single(),
        sb
          .from('submissions')
          .select('id, user_id, title, description, cover_url, challenges:challenge_id(title, brief)')
          .eq('id', a.submission_id)
          .single(),
      ])
      if (!mentor || !sub) throw new Error('mentor or submission missing')

      const { output, durationMs, tokens } = await generateMentorComment({
        mentor: mentor as AiMentor,
        coverUrl: sub.cover_url,
        challengeTitle: sub.challenges?.title ?? '',
        brief: sub.challenges?.brief ?? null,
        submissionTitle: sub.title ?? null,
        submissionDescription: sub.description ?? null,
      })

      await sb.from('ai_mentor_comments').upsert(
        {
          submission_id: a.submission_id,
          mentor_id: a.mentor_id,
          assignment_id: a.id,
          content: output.content,
          highlight: output.highlight,
          improvement_focus: output.improvement_focus,
          language: mentor.language ?? 'fr',
          generation_duration_ms: durationMs,
          tokens_used: tokens,
        },
        { onConflict: 'submission_id,mentor_id', ignoreDuplicates: true },
      )

      await sb
        .from('ai_mentor_assignments')
        .update({ status: 'completed', processed_at: new Date().toISOString() })
        .eq('id', a.id)
      await sb
        .from('ai_mentors')
        .update({ comments_count: (mentor.comments_count ?? 0) + 1, last_used_at: new Date().toISOString() })
        .eq('id', a.mentor_id)

      try {
        await notify(sub.user_id, 'ai_mentor_comment', {
          mentor_name: mentor.name,
          submission_id: a.submission_id,
        })
      } catch (e) {
        console.error('notify failed', e)
      }

      processed++
    } catch (e: unknown) {
      await sb
        .from('ai_mentor_assignments')
        .update({
          status: 'failed',
          error_message: String(e instanceof Error ? e.message : e),
          retry_count: (a.retry_count ?? 0) + 1,
        })
        .eq('id', a.id)
    }
  }
  return NextResponse.json({ processed })
}
