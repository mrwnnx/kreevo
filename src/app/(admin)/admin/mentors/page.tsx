import Link from 'next/link'
import { Plus, Sparkles } from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { AiMentor } from '@/lib/ai-mentors/types'

export const dynamic = 'force-dynamic'

export default async function AdminMentorsPage() {
  const { data } = await (supabaseAdmin as any)
    .from('ai_mentors')
    .select('*')
    .order('created_at', { ascending: false })
  const mentors: AiMentor[] = data ?? []

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold inline-flex items-center gap-2">
          <Sparkles className="size-5 text-primary" /> AI Mentors
        </h1>
        <Link
          href="/admin/mentors/new"
          className="inline-flex items-center gap-1.5 rounded-[var(--radius-button)] bg-primary text-primary-foreground text-sm font-medium px-4 h-9 hover:opacity-85"
        >
          <Plus className="size-4" /> Nouveau mentor
        </Link>
      </div>

      {mentors.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun mentor. Crée le premier.</p>
      ) : (
        <div className="space-y-2">
          {mentors.map((m) => (
            <Link
              key={m.id}
              href={`/admin/mentors/${m.id}`}
              className="flex items-center gap-4 rounded-[var(--radius-card)] border border-border p-3 hover:bg-accent/30 transition-colors"
            >
              <div className="size-11 rounded-full bg-muted overflow-hidden shrink-0 flex items-center justify-center text-sm font-medium text-muted-foreground">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {m.avatar_url ? <img src={m.avatar_url} alt={m.name} className="w-full h-full object-cover" /> : m.name[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{m.name}</p>
                <p className="text-xs text-muted-foreground truncate">{m.title}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                <span className="rounded-full bg-muted px-2 py-0.5">{m.specialty}</span>
                <span className="rounded-full bg-muted px-2 py-0.5">{m.tone}</span>
                <span>{m.comments_count} 💬</span>
                <span className={m.is_active ? 'text-green-600' : 'text-muted-foreground'}>
                  {m.is_active ? '● actif' : '○ inactif'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
