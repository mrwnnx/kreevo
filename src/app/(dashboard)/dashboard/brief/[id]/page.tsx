import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { BriefWorkspaceClient } from './BriefWorkspaceClient'

interface Props { params: Promise<{ id: string }> }

export default async function BriefWorkspacePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: brief } = await (supabase as any)
    .from('random_briefs')
    .select('id, status, prompt, brief_text, started_at, deadline_at, cover_url, figma_url, description')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!brief) notFound()

  return (
    <div className="pb-10">
      <div className="px-6 pt-6 max-w-[920px] mx-auto">
        <Link
          href="/dashboard/brief"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ChevronLeft className="size-3.5" />
          Mes briefs
        </Link>
      </div>
      <BriefWorkspaceClient brief={brief} />
    </div>
  )
}
