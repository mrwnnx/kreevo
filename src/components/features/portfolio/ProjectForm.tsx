'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { saveProject } from './actions'
import { Check, ChevronDown, Search, X, Loader2, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { tx } from '@/lib/i18n/tx'
import type { Dictionary } from '@/lib/i18n/dictionaries/fr'
import { TOOLS_BY_SPECIALTY, type SpecialtyOption } from '@/components/onboarding/types'
import { GLASS_SURFACE, GLASS_GRADIENT } from '@/components/layout/GlassShell'

type ProjectFormT = Dictionary['projectForm']

interface TaxonomyOption {
  id: string
  name: string
}

export interface ProjectFormInitial {
  id: string
  coverUrl: string | null
  photos: { url: string; caption: string }[]
  title: string
  description: string
  link: string
  specialtyId: string
  industryId: string
  projectTypeId: string
  tools: string[]
  // A project already live when the edit page loads: the draft/publish
  // buttons are replaced by a single "save changes" action so a routine
  // edit can never silently flip it back to draft.
  isPublished: boolean
}

interface Props {
  specialties: SpecialtyOption[]
  industries: TaxonomyOption[]
  projectTypes: TaxonomyOption[]
  profileUsername: string | null
  t: ProjectFormT
  initial?: ProjectFormInitial
}

const inputClass =
  'h-10 w-full min-w-0 rounded-[var(--radius-input)] border border-input bg-transparent px-3 py-1 text-base md:text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

const MAX_PHOTOS = 7

export function ProjectForm({ specialties, industries, projectTypes, profileUsername, t, initial }: Props) {
  const router = useRouter()

  const [coverUrl, setCoverUrl] = useState<string | null>(initial?.coverUrl ?? null)
  const [photos, setPhotos] = useState<{ url: string; caption: string }[]>(initial?.photos ?? [])
  const [tempUploadKey, setTempUploadKey] = useState(0)
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [link, setLink] = useState(initial?.link ?? '')
  const [specialtyId, setSpecialtyId] = useState(initial?.specialtyId ?? '')
  const [industryId, setIndustryId] = useState(initial?.industryId ?? '')
  const [projectTypeId, setProjectTypeId] = useState(initial?.projectTypeId ?? '')
  const [tools, setTools] = useState<string[]>(initial?.tools ?? [])

  // Tracks the row created by the first save so a later click (draft → publish,
  // or draft → draft) updates the same submission instead of duplicating it.
  // Pre-set to the edited project's id so an edit always updates, never inserts.
  const [savedId, setSavedId] = useState<string | null>(initial?.id ?? null)

  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ draft: boolean } | null>(null)

  function addPhoto(url: string | null) {
    if (!url) return
    setPhotos((prev) => (prev.length >= MAX_PHOTOS ? prev : [...prev, { url, caption: '' }]))
  }
  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx))
  }
  function updateCaption(idx: number, caption: string) {
    setPhotos((prev) => prev.map((p, i) => (i === idx ? { ...p, caption } : p)))
  }

  // ── Tools multi-select, gated by the chosen specialty (falls back to the
  // full union for a specialty without a predefined tool set) ──
  const [toolsOpen, setToolsOpen] = useState(false)
  const [toolsQuery, setToolsQuery] = useState('')
  const toolsWrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (toolsWrapRef.current && !toolsWrapRef.current.contains(e.target as Node)) {
        setToolsOpen(false)
        setToolsQuery('')
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const selectedSlug = useMemo(
    () => specialties.find((s) => s.id === specialtyId)?.slug,
    [specialties, specialtyId],
  )
  const availableTools = useMemo(() => {
    if (!selectedSlug) return []
    const generic = Array.from(new Set([...TOOLS_BY_SPECIALTY.ux_ui, ...TOOLS_BY_SPECIALTY.graphic]))
    return TOOLS_BY_SPECIALTY[selectedSlug as 'ux_ui' | 'graphic'] ?? generic
  }, [selectedSlug])
  const filteredTools = useMemo(() => {
    const q = toolsQuery.trim().toLowerCase()
    if (!q) return availableTools
    return availableTools.filter((tool) => tool.toLowerCase().includes(q))
  }, [toolsQuery, availableTools])

  useEffect(() => {
    setTools((prev) => prev.filter((tool) => availableTools.includes(tool)))
  }, [availableTools])

  function toggleTool(tool: string) {
    setTools((prev) => (prev.includes(tool) ? prev.filter((x) => x !== tool) : [...prev, tool]))
  }
  function removeTool(tool: string) {
    setTools((prev) => prev.filter((x) => x !== tool))
  }

  // A draft only needs a cover (submissions.cover_url is NOT NULL — that's
  // the one thing that can never be missing). Title and taxonomy are
  // required to PUBLISH only, so someone can start a project and come back
  // to finish it later.
  function validate(publish: boolean): string | null {
    if (!coverUrl) return t.errors.coverRequired
    if (!publish) return null
    if (!title.trim()) return t.errors.titleRequired
    if (!specialtyId || !industryId || !projectTypeId || tools.length === 0) return t.errors.taxonomyRequired
    return null
  }

  function submit(publish: boolean) {
    const validationError = validate(publish)
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)

    const fd = new FormData()
    if (savedId) fd.set('id', savedId)
    fd.set('coverUrl', coverUrl!)
    fd.set('photos', JSON.stringify(photos))
    fd.set('title', title.trim())
    fd.set('description', description.trim())
    fd.set('link', link.trim())
    fd.set('specialtyId', specialtyId)
    fd.set('industryId', industryId)
    fd.set('projectTypeId', projectTypeId)
    fd.set('tools', JSON.stringify(tools))
    if (publish) fd.set('publish', '1')

    setIsPending(true)
    saveProject(fd).then((result) => {
      setIsPending(false)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setSavedId(result.id)
      setSuccess({ draft: !publish })
      if (publish) router.refresh()
    })
  }

  function addAnother() {
    setSavedId(null)
    setCoverUrl(null)
    setPhotos([])
    setTitle('')
    setDescription('')
    setLink('')
    setSpecialtyId('')
    setIndustryId('')
    setProjectTypeId('')
    setTools([])
    setSuccess(null)
    setError(null)
  }

  if (success) {
    // Editing an existing project is NOT a publication: showing "Projet publié 🎉"
    // and "Ajouter un autre" after fixing a typo reads as if a second project
    // had just been created. Three distinct outcomes: draft saved, project
    // published (creation), changes saved (edit).
    const isEdit = !!initial
    const isUpdate = !success.draft && isEdit
    const heading = success.draft
      ? t.success.draftTitle
      : isUpdate ? t.success.updatedTitle : t.success.publishedTitle
    const body = success.draft
      ? t.success.draftBody
      : isUpdate ? t.success.updatedBody : t.success.publishedBody

    return (
      <div className="max-w-[640px] mx-auto px-6 py-16 text-center space-y-4">
        <div className={cn(
          'size-16 rounded-full mx-auto flex items-center justify-center',
          success.draft ? 'bg-zinc-100 dark:bg-zinc-900/40' : 'bg-green-100 dark:bg-green-900/40',
        )}>
          <CheckCircle className={cn('size-8', success.draft ? 'text-zinc-500' : 'text-green-600 dark:text-green-400')} />
        </div>
        <h1 className="text-2xl font-bold">{heading}</h1>
        <p className="text-sm text-muted-foreground">{body}</p>
        <div className="flex flex-wrap gap-2 justify-center pt-2">
          {success.draft ? (
            <Button onClick={() => setSuccess(null)}>{t.saveDraft}</Button>
          ) : isUpdate ? (
            <>
              {savedId && (
                <Button onClick={() => router.push(`/p/${savedId}`)}>{t.success.viewProject}</Button>
              )}
              <Button variant="outline" onClick={() => router.push('/dashboard/projects')}>
                {t.success.myProjects}
              </Button>
            </>
          ) : (
            <>
              {profileUsername && (
                <Button onClick={() => router.push(`/u/${profileUsername}`)}>{t.success.viewProfile}</Button>
              )}
              <Button variant="outline" onClick={addAnother}>{t.success.addAnother}</Button>
            </>
          )}
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>{t.success.backToDashboard}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-10">
      <div className="max-w-[640px] mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">{initial ? t.editTitle : t.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{initial ? t.editSubtitle : t.subtitle}</p>
        </div>

        <section className={cn(GLASS_SURFACE, 'space-y-6 rounded-[24px] p-6')} style={GLASS_GRADIENT}>
          {/* Cover */}
          <div className="space-y-2">
            <Label className="text-sm">{t.coverLabel}</Label>
            <ImageUpload bucket="submissions" value={coverUrl} onChange={setCoverUrl} className="aspect-[16/10]" />
            <p className="text-xs text-muted-foreground">{t.coverHint}</p>
          </div>

          {/* Additional photos */}
          <div className="space-y-3">
            <Label className="text-sm">{t.photosLabel}</Label>
            <p className="text-xs text-muted-foreground">{t.photosHint}</p>

            {photos.map((photo, i) => (
              <div key={i} className="rounded-2xl border border-border p-3 space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt="" className="w-full max-h-[320px] object-contain bg-muted" />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-2 end-2 size-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                    aria-label={t.removeAlt}
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <Input
                  value={photo.caption}
                  onChange={(e) => updateCaption(i, e.target.value)}
                  placeholder={t.captionPlaceholder}
                  maxLength={200}
                />
              </div>
            ))}

            {photos.length < MAX_PHOTOS && (
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground font-normal">
                  {t.addPhotoLabel} ({tx(t.countLabel, { n: photos.length })})
                </Label>
                <ImageUpload
                  key={tempUploadKey}
                  bucket="submissions"
                  value={null}
                  onChange={(url) => { addPhoto(url); setTempUploadKey((k) => k + 1) }}
                  className="aspect-[16/10]"
                />
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm">{t.titleLabel}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.titlePlaceholder}
              maxLength={120}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm">{t.descriptionLabel}</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder={t.descriptionPlaceholder}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Link */}
          <div className="space-y-2">
            <Label htmlFor="link" className="text-sm">{t.linkLabel}</Label>
            <Input
              id="link"
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder={t.linkPlaceholder}
            />
          </div>

          {/* Taxonomy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="specialty" className="text-sm">{t.specialtyLabel}</Label>
              <select
                id="specialty"
                value={specialtyId}
                onChange={(e) => setSpecialtyId(e.target.value)}
                className={inputClass}
              >
                <option value="">{t.specialtyPlaceholder}</option>
                {specialties.map((s) => (
                  <option key={s.id} value={s.id}>{s.emoji ? `${s.emoji} ` : ''}{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry" className="text-sm">{t.industryLabel}</Label>
              <select
                id="industry"
                value={industryId}
                onChange={(e) => setIndustryId(e.target.value)}
                className={inputClass}
              >
                <option value="">{t.industryPlaceholder}</option>
                {industries.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="projectType" className="text-sm">{t.projectTypeLabel}</Label>
              <select
                id="projectType"
                value={projectTypeId}
                onChange={(e) => setProjectTypeId(e.target.value)}
                className={inputClass}
              >
                <option value="">{t.projectTypePlaceholder}</option>
                {projectTypes.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tools */}
          <div className="space-y-3">
            <Label className="text-sm">{t.toolsLabel}</Label>
            <div ref={toolsWrapRef}>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setToolsOpen((v) => !v)}
                  disabled={!specialtyId}
                  className={cn(inputClass, 'flex items-center justify-between text-start disabled:opacity-50')}
                >
                  <span className={tools.length === 0 ? 'text-muted-foreground' : 'text-foreground'}>
                    {!specialtyId
                      ? t.tools.pickSpecialtyFirst
                      : tools.length === 0
                        ? t.tools.selectTools
                        : tx(tools.length > 1 ? t.tools.selectedPlural : t.tools.selectedSingular, { n: tools.length })}
                  </span>
                  <ChevronDown className={cn('size-3.5 text-muted-foreground transition-transform', toolsOpen && 'rotate-180')} />
                </button>

                {toolsOpen && (
                  <div className="absolute start-0 end-0 top-[calc(100%+6px)] z-20 rounded-[var(--radius-popover)] border border-border bg-popover shadow-lg flex flex-col">
                    <div className="relative p-2 border-b border-border">
                      <Search className="absolute start-4 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                      <input
                        autoFocus
                        type="text"
                        value={toolsQuery}
                        onChange={(e) => setToolsQuery(e.target.value)}
                        placeholder={t.tools.search}
                        className="w-full h-8 ps-8 pe-3 text-sm rounded-[var(--radius-input)] bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-muted"
                      />
                    </div>
                    <div className="max-h-64 overflow-auto p-1">
                      {filteredTools.length === 0 ? (
                        <p className="px-3 py-6 text-center text-sm text-muted-foreground">{t.tools.noMatch}</p>
                      ) : (
                        filteredTools.map((tool) => {
                          const active = tools.includes(tool)
                          return (
                            <button
                              key={tool}
                              type="button"
                              onClick={() => toggleTool(tool)}
                              className={cn(
                                'w-full text-start px-3 py-2 text-sm rounded-[calc(var(--radius-popover)-4px)] flex items-center justify-between transition-colors',
                                active ? 'bg-primary/10 text-primary' : 'hover:bg-accent/40 text-foreground',
                              )}
                            >
                              <span>{tool}</span>
                              {active && <Check className="size-4 text-primary" />}
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {tools.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {tools.map((tool) => (
                    <span
                      key={tool}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm px-3 py-1"
                    >
                      {tool}
                      <button
                        type="button"
                        onClick={() => removeTool(tool)}
                        aria-label={tx(t.tools.removeAria, { tool })}
                        className="hover:opacity-70"
                      >
                        <X className="size-3" strokeWidth={2.5} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        <div className="flex items-center justify-end gap-2">
          {initial?.isPublished ? (
            // Already published: a single "save changes" action, always
            // wired to publish=true, so a routine edit can never flip the
            // project back to draft — that state change only ever happens
            // through the draft/publish buttons below (new or unpublished project).
            <Button onClick={() => submit(true)} disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              {t.saveChanges}
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => submit(false)} disabled={isPending}>
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {t.saveDraft}
              </Button>
              <Button onClick={() => submit(true)} disabled={isPending}>
                {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                {t.publish}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
