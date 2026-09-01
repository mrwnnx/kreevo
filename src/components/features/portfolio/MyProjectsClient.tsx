'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, buttonVariants } from '@/components/ui/button'
import { deleteProject, publishProject } from './actions'
import { GLASS_SURFACE, GLASS_GRADIENT } from '@/components/layout/GlassShell'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'

export type MyProject = {
  id: string
  cover_url: string | null
  title: string | null
  is_draft: boolean
  hidden_by_moderation: boolean
  created_at: string
}

type MyProjectsPageT = Dictionary['myProjectsPage']

interface Props {
  projects: MyProject[]
  dateLocale: string
  t: MyProjectsPageT
}

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
}

function ProjectCard({ project, dateLocale, t }: { project: MyProject; dateLocale: string; t: MyProjectsPageT }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function onDelete() {
    if (!confirm(t.confirmDelete)) return
    setError(null)
    startTransition(async () => {
      const res = await deleteProject(project.id)
      if (!res.ok) setError(t.errors.deleteFailed)
      else router.refresh()
    })
  }

  function onPublish() {
    setError(null)
    startTransition(async () => {
      const res = await publishProject(project.id)
      if (!res.ok) setError(res.error || t.errors.publishFailed)
      else router.refresh()
    })
  }

  return (
    <li>
      <div className={cn(GLASS_SURFACE, 'overflow-hidden rounded-[24px]')} style={GLASS_GRADIENT}>
        <Link href={`/dashboard/projects/${project.id}/edit`} className="group block">
          <div className="relative aspect-video bg-muted">
            {project.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={project.cover_url}
                alt={project.title ?? ''}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">—</div>
            )}
            {project.is_draft ? (
              <span className="absolute top-2 end-2 inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm text-amber-700 dark:text-amber-400">
                <span className="size-1.5 rounded-full bg-amber-500" />
                {t.draftBadge}
              </span>
            ) : project.hidden_by_moderation ? (
              <span className="absolute top-2 end-2 inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-full bg-background/90 backdrop-blur-sm text-red-700 dark:text-red-400">
                <span className="size-1.5 rounded-full bg-red-500" />
                {t.hiddenBadge}
              </span>
            ) : null}
          </div>
          <div className="p-3">
            <p className="text-sm font-semibold leading-tight truncate">
              {project.title ?? <span className="text-muted-foreground italic">{t.untitled}</span>}
            </p>
            <p className="text-[11px] font-mono text-muted-foreground/70 mt-1">
              {formatDate(project.created_at, dateLocale)}
            </p>
            {project.hidden_by_moderation && (
              <p className="text-[11px] text-red-700 dark:text-red-400 mt-1.5 leading-snug">
                {t.hiddenHint}
              </p>
            )}
          </div>
        </Link>

        <div className="flex items-center gap-2 px-3 pb-3">
          <Link
            href={`/dashboard/projects/${project.id}/edit`}
            className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), 'flex-1')}
          >
            {t.actions.edit}
          </Link>
          {project.is_draft && (
            <Button size="sm" onClick={onPublish} disabled={isPending} className="flex-1">
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {t.actions.publish}
            </Button>
          )}
          <Button size="sm" variant="destructive" onClick={onDelete} disabled={isPending}>
            {t.actions.delete}
          </Button>
        </div>
        {error && <p className="px-3 pb-3 text-xs text-destructive">{error}</p>}
      </div>
    </li>
  )
}

export function MyProjectsClient({ projects, dateLocale, t }: Props) {
  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        {projects.length > 0 && (
          <Link href="/dashboard/projects/new" className={buttonVariants()}>
            <Plus className="size-4" />
            {t.addCta}
          </Link>
        )}
      </header>

      {projects.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl mb-3">{t.empty.icon}</p>
          <p className="text-base font-semibold mb-1">{t.empty.title}</p>
          <p className="text-sm text-muted-foreground mb-5">{t.empty.subtitle}</p>
          <Link
            href="/dashboard/projects/new"
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-full hover:opacity-90 transition-opacity"
          >
            {t.empty.cta}
          </Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} dateLocale={dateLocale} t={t} />
          ))}
        </ul>
      )}
    </div>
  )
}
