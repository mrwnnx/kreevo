import { Sparkles } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import type { AiMentorComment as AiMentorCommentType } from '@/lib/ai-mentors/types'

interface Props {
  comment: AiMentorCommentType
  t: { badge: string; highlight: string; focus: string }
}

export function AiMentorComment({ comment, t }: Props) {
  const m = comment.mentor
  return (
    <div className="rounded-[12px] border border-primary p-4 dark:border-blue-400">
      <div className="flex items-center gap-2.5">
        <Avatar size="default">
          {m?.avatar_url && <AvatarImage src={m.avatar_url} alt={m?.name ?? ''} />}
          <AvatarFallback>{m?.name?.[0]?.toUpperCase() ?? 'M'}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{m?.name}</p>
          <p className="text-xs text-muted-foreground truncate">{m?.title}</p>
        </div>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium px-2 py-0.5">
          <Sparkles className="size-3" /> {t.badge}
        </span>
      </div>

      <p className="mt-3 text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>

      {comment.highlight && (
        <p className="mt-2 text-xs">
          <span className="font-semibold text-foreground">{t.highlight} :</span>{' '}
          <span className="text-muted-foreground">{comment.highlight}</span>
        </p>
      )}
      {comment.improvement_focus && (
        <p className="mt-1 text-xs">
          <span className="font-semibold text-foreground">{t.focus} :</span>{' '}
          <span className="text-muted-foreground">{comment.improvement_focus}</span>
        </p>
      )}
    </div>
  )
}
