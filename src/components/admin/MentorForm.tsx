'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { cn } from '@/lib/utils'
import type { AiMentor, MentorSpecialty, MentorTone } from '@/lib/ai-mentors/types'

const SPECIALTIES: MentorSpecialty[] = ['ux', 'ui', 'graphic', 'brand', 'general']
const TONES: MentorTone[] = ['kind', 'demanding', 'creative', 'pragmatic', 'analytical']
const OBSESSION_OPTIONS = [
  'accessibility', 'typography', 'grid_systems', 'usage_logic', 'edge_cases',
  'component_consistency', 'visual_singularity', 'storytelling', 'brand_personality',
  'tokens', 'systemic_spacing', 'component_states', 'scale', 'color_theory', 'motion',
]
const EXPERIENCE = [5, 8, 12, 15]

const inputClass =
  'h-10 w-full min-w-0 rounded-[var(--radius-input)] border border-input bg-transparent px-3 py-1 text-base md:text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'
const textareaClass =
  'w-full rounded-[var(--radius-input)] border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-3 focus:ring-ring/30 focus:border-ring dark:bg-input/30'

export function MentorForm({ mentor }: { mentor?: AiMentor }) {
  const router = useRouter()
  const editing = !!mentor

  const [name, setName] = useState(mentor?.name ?? '')
  const [title, setTitle] = useState(mentor?.title ?? '')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(mentor?.avatar_url ?? null)
  const [bioShort, setBioShort] = useState(mentor?.bio_short ?? '')
  const [bioLong, setBioLong] = useState(mentor?.bio_long ?? '')
  const [specialty, setSpecialty] = useState<MentorSpecialty>(mentor?.specialty ?? 'ux')
  const [tone, setTone] = useState<MentorTone>(mentor?.tone ?? 'pragmatic')
  const [obsessions, setObsessions] = useState<string[]>(mentor?.obsessions ?? [])
  const [systemPrompt, setSystemPrompt] = useState(mentor?.system_prompt ?? '')
  const [isActive, setIsActive] = useState(mentor?.is_active ?? true)
  const [language, setLanguage] = useState(mentor?.language ?? 'fr')

  // AI generator inputs
  const [traits, setTraits] = useState(['', '', ''])
  const [experienceYears, setExperienceYears] = useState(8)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleObsession = (o: string) =>
    setObsessions((prev) => (prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]))

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/mentors/generate-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialty, tone, obsessions,
          traits: traits.filter((t) => t.trim()),
          experienceYears, language,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? 'Generation failed')
      const p = json.profile
      setName(p.name ?? '')
      setTitle(p.title ?? '')
      setBioShort(p.bio_short ?? '')
      setBioLong(p.bio_long ?? '')
      setSystemPrompt(p.system_prompt ?? '')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        name, title, avatar_url: avatarUrl, bio_short: bioShort, bio_long: bioLong,
        specialty, tone, obsessions, system_prompt: systemPrompt, is_active: isActive, language,
      }
      const res = await fetch(editing ? `/api/admin/mentors/${mentor!.id}` : '/api/admin/mentors', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error ?? 'Save failed')
      router.push('/admin/mentors')
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{editing ? 'Modifier le mentor' : 'Nouveau mentor'}</h1>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Actif
        </label>
      </div>

      {/* Personality params */}
      <section className="space-y-4 rounded-[var(--radius-card)] border border-border p-4">
        <p className="text-sm font-semibold">Paramètres</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-xs mb-1.5 block">Spécialité</Label>
            <select value={specialty} onChange={(e) => setSpecialty(e.target.value as MentorSpecialty)} className={inputClass}>
              {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">Ton</Label>
            <select value={tone} onChange={(e) => setTone(e.target.value as MentorTone)} className={inputClass}>
              {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div>
          <Label className="text-xs mb-1.5 block">Obsessions</Label>
          <div className="flex flex-wrap gap-2">
            {OBSESSION_OPTIONS.map((o) => (
              <button key={o} type="button" onClick={() => toggleObsession(o)}
                className={cn('rounded-full border px-3 py-1 text-xs transition-colors',
                  obsessions.includes(o) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-accent/40')}>
                {o}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {traits.map((tr, i) => (
            <Input key={i} value={tr} placeholder={`Trait ${i + 1}`} className={inputClass}
              onChange={(e) => setTraits((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))} />
          ))}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label className="text-xs mb-1.5 block">Expérience</Label>
            <div className="flex gap-2">
              {EXPERIENCE.map((y) => (
                <button key={y} type="button" onClick={() => setExperienceYears(y)}
                  className={cn('flex-1 h-9 rounded-[var(--radius-input)] border text-sm transition-colors',
                    experienceYears === y ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>
                  {y === 15 ? '15+' : y} ans
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1.5 block">Langue</Label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className={cn(inputClass, 'w-24')}>
              <option value="fr">fr</option>
              <option value="en">en</option>
              <option value="ar">ar</option>
            </select>
          </div>
        </div>
        <Button type="button" onClick={handleGenerate} disabled={generating} variant="outline" className="w-full">
          {generating ? <><Loader2 className="size-4 animate-spin" /> Génération…</> : <><Sparkles className="size-4" /> Générer le profil avec IA</>}
        </Button>
      </section>

      {/* Editable generated fields */}
      <section className="space-y-4">
        <div className="flex items-start gap-4">
          <ImageUpload bucket="mentors" value={avatarUrl} onChange={setAvatarUrl} />
          <div className="flex-1 space-y-3">
            <div>
              <Label className="text-xs mb-1.5 block">Nom</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Titre</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>
        <div>
          <Label className="text-xs mb-1.5 block">Bio courte</Label>
          <Input value={bioShort} onChange={(e) => setBioShort(e.target.value)} className={inputClass} />
        </div>
        <div>
          <Label className="text-xs mb-1.5 block">Bio longue</Label>
          <textarea value={bioLong} onChange={(e) => setBioLong(e.target.value)} rows={3} className={textareaClass} />
        </div>
        <div>
          <Label className="text-xs mb-1.5 block">System prompt</Label>
          <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={10} className={cn(textareaClass, 'font-mono text-xs')} />
        </div>
      </section>

      {error && (
        <p className="text-sm text-destructive flex items-center gap-1.5"><X className="size-4" /> {error}</p>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => router.push('/admin/mentors')}>Annuler</Button>
        <Button type="button" onClick={handleSave} disabled={saving || !name || !systemPrompt} className="flex-1">
          {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer le mentor'}
        </Button>
      </div>
    </div>
  )
}
