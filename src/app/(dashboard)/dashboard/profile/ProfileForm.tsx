'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Plus, Search, X, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AvatarUpload } from '@/components/features/dashboard/AvatarUpload'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types/database.types'

import { TOOLS_BY_SPECIALTY, type Specialty, type ExperienceLevel, type Objective } from '@/components/onboarding/types'
import {
  SOCIAL_DEFS,
  SUGGESTED_BY_SPECIALTY,
  defForKey,
  slugifyPlatform,
} from '@/components/onboarding/socials'
import { SocialLogo } from '@/components/onboarding/SocialLogo'
import { ALL_COUNTRIES, MENA_SUGGESTED } from '@/components/onboarding/countries'

const SPECIALTY_OPTIONS: Array<{ value: 'ux_ui' | 'graphic'; icon: string; label: string; description: string }> = [
  { value: 'ux_ui',   icon: '✏️', label: 'UX/UI Designer',   description: 'Design digital experiences and interfaces' },
  { value: 'graphic', icon: '🎨', label: 'Graphic Designer', description: 'Create visual identities and brand assets' },
]

const LEVELS: Array<{ value: ExperienceLevel; label: string }> = [
  { value: 'entry',  label: 'Entry Level' },
  { value: 'junior', label: 'Junior' },
  { value: 'senior', label: 'Senior' },
]

const OBJECTIVES_OPTIONS: Array<{ value: Objective; icon: string; title: string; subtitle: string }> = [
  { value: 'getting_hired',     icon: '💼', title: 'Getting hired',     subtitle: 'Land your first design job' },
  { value: 'improving_skills',  icon: '📈', title: 'Improving my skills', subtitle: 'Level up through challenges' },
]

const isValidUrl = (v: string) => v.length === 0 || v.trim().toLowerCase().startsWith('https://')

function detectSpecialty(raw: string | null | undefined): Specialty {
  if (!raw) return ''
  if (raw === 'ux_ui' || raw === 'graphic') return raw
  return /graphic|illustration|brand|3d/i.test(raw) ? 'graphic' : 'ux_ui'
}

function detectExperience(raw: string | null | undefined): ExperienceLevel {
  if (!raw) return ''
  const v = raw.toLowerCase()
  if (v === 'entry' || v === 'junior' || v === 'senior') return v
  return ''
}

const inputClass =
  'h-8 w-full min-w-0 rounded-[var(--radius-input)] border border-input bg-transparent px-2.5 py-1 text-base md:text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface ProfileFormProps {
  profile: Profile
}

export function ProfileForm({ profile }: ProfileFormProps) {
  // Onboarding-aligned fields
  const [avatar, setAvatar] = useState<string | null>(profile.avatar_url ?? null)
  const [firstName, setFirstName] = useState(profile.first_name ?? profile.full_name?.split(' ')[0] ?? '')
  const [lastName, setLastName] = useState(profile.last_name ?? profile.full_name?.split(' ').slice(1).join(' ') ?? '')
  const [username, setUsername] = useState(profile.username ?? '')
  const [country, setCountry] = useState(profile.country ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [specialty, setSpecialty] = useState<Specialty>(detectSpecialty(profile.specialty))
  const specialtyLocked = Boolean(detectSpecialty(profile.specialty))
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(detectExperience(profile.experience_level))
  const [tools, setTools] = useState<string[]>((profile.tools as string[]) ?? [])
  const [objectives, setObjectives] = useState<Objective[]>(
    Array.isArray(profile.objectives)
      ? (profile.objectives.filter((o): o is Objective => o === 'getting_hired' || o === 'improving_skills'))
      : []
  )

  const initialLinks = (profile.links as Record<string, string>) ?? {}
  const [activeKeys, setActiveKeys] = useState<string[]>(Object.keys(initialLinks))
  const [linkValues, setLinkValues] = useState<Record<string, string>>({ ...initialLinks })
  const [linkErrors, setLinkErrors] = useState<Record<string, string>>({})
  const [showCustom, setShowCustom] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customUrl, setCustomUrl] = useState('')
  const [customError, setCustomError] = useState<string | null>(null)

  // Save status
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Tools dropdown
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

  const availableTools = useMemo(
    () => (specialty ? TOOLS_BY_SPECIALTY[specialty as 'ux_ui' | 'graphic'] : []),
    [specialty]
  )
  const filteredTools = useMemo(() => {
    const q = toolsQuery.trim().toLowerCase()
    if (!q) return availableTools
    return availableTools.filter((t) => t.toLowerCase().includes(q))
  }, [toolsQuery, availableTools])

  // Drop tools that don't belong to the new specialty
  useEffect(() => {
    setTools((prev) => prev.filter((t) => availableTools.includes(t)))
  }, [availableTools])

  function toggleTool(t: string) {
    setTools((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }
  function removeTool(t: string) {
    setTools((prev) => prev.filter((x) => x !== t))
  }

  function toggleObjective(o: Objective) {
    setObjectives((prev) => (prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]))
  }

  // Country dropdown
  const [countryOpen, setCountryOpen] = useState(false)
  const [countryQuery, setCountryQuery] = useState('')
  const countryWrapRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (countryWrapRef.current && !countryWrapRef.current.contains(e.target as Node)) {
        setCountryOpen(false)
        setCountryQuery('')
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase()
    const others = ALL_COUNTRIES.filter((c) => !MENA_SUGGESTED.includes(c))
    if (!q) return { suggested: MENA_SUGGESTED, others }
    return {
      suggested: MENA_SUGGESTED.filter((c) => c.toLowerCase().includes(q)),
      others: others.filter((c) => c.toLowerCase().includes(q)),
    }
  }, [countryQuery])

  // Social links helpers
  const suggestedSocialKeys = useMemo(() => {
    const list = specialty
      ? SUGGESTED_BY_SPECIALTY[specialty as 'ux_ui' | 'graphic']
      : Object.keys(SOCIAL_DEFS)
    return list.filter((k) => !activeKeys.includes(k))
  }, [specialty, activeKeys])

  function addNetwork(key: string) {
    setActiveKeys((prev) => (prev.includes(key) ? prev : [...prev, key]))
    setLinkValues((prev) => ({ ...prev, [key]: prev[key] ?? '' }))
  }
  function removeNetwork(key: string) {
    setActiveKeys((prev) => prev.filter((k) => k !== key))
    setLinkValues((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setLinkErrors((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }
  function updateLinkUrl(key: string, url: string) {
    setLinkValues((prev) => ({ ...prev, [key]: url }))
    if (linkErrors[key]) {
      setLinkErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }
  function submitCustomPlatform() {
    setCustomError(null)
    const name = customName.trim()
    if (!name) return setCustomError('Give it a name')
    if (!isValidUrl(customUrl)) return setCustomError('URL must start with https://')
    const key = slugifyPlatform(name)
    if (!key) return setCustomError('Invalid name')
    if (!SOCIAL_DEFS[key]) {
      SOCIAL_DEFS[key] = {
        key,
        name,
        placeholder: 'https://...',
        iconText: name.slice(0, 2),
        iconBg: '#71717A',
      }
    }
    addNetwork(key)
    setLinkValues((prev) => ({ ...prev, [key]: customUrl.trim() }))
    setCustomName('')
    setCustomUrl('')
    setShowCustom(false)
  }

  // ── Auto-save (debounced) ──
  const isFirstRender = useRef(true)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cleanedLinks = useMemo(() => {
    const out: Record<string, string> = {}
    for (const key of activeKeys) {
      const v = (linkValues[key] ?? '').trim()
      if (v && isValidUrl(v)) out[key] = v
    }
    return out
  }, [activeKeys, linkValues])

  useEffect(() => {
    // Skip the initial run (don't auto-save mounted defaults)
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    // Local URL validation — block save until all link URLs are valid
    const newLinkErrors: Record<string, string> = {}
    for (const key of activeKeys) {
      const v = (linkValues[key] ?? '').trim()
      if (v && !isValidUrl(v)) newLinkErrors[key] = 'URL must start with https://'
    }
    if (Object.keys(newLinkErrors).length > 0) {
      setLinkErrors(newLinkErrors)
      return
    }

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setStatus('saving')
      setErrorMsg(null)
      try {
        const res = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            avatar_url: avatar,
            first_name: firstName.trim() || null,
            last_name: lastName.trim() || null,
            specialty: specialty || null,
            experience_level: experienceLevel || null,
            tools,
            objectives,
            links: cleanedLinks,
            country: country || null,
            username: username.trim(),
            bio: bio.trim() || null,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setStatus('error')
          setErrorMsg(data?.error ?? 'Could not save')
          return
        }
        setStatus('saved')
        if (savedTimer.current) clearTimeout(savedTimer.current)
        savedTimer.current = setTimeout(() => setStatus('idle'), 2000)
      } catch {
        setStatus('error')
        setErrorMsg('Network error')
      }
    }, 700)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    avatar,
    firstName,
    lastName,
    username,
    country,
    bio,
    specialty,
    experienceLevel,
    tools,
    objectives,
    cleanedLinks,
  ])

  return (
    <div className="space-y-10 relative">
      {/* Save status — sticky top */}
      <div className="sticky top-16 z-10 -mt-4 mb-2 flex justify-end pointer-events-none h-6">
        {status === 'saving' && (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-background/80 backdrop-blur px-2 py-1 rounded-full">
            <Loader2 className="size-3 animate-spin" /> Saving…
          </span>
        )}
        {status === 'saved' && (
          <span className="inline-flex items-center gap-1.5 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full transition-opacity">
            <CheckCircle className="size-3" /> Saved
          </span>
        )}
        {status === 'error' && errorMsg && (
          <span className="inline-flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded-full">
            ✕ {errorMsg}
          </span>
        )}
      </div>

      {/* Avatar */}
      <section>
        <Label className="text-sm font-semibold mb-3 block">Profile photo</Label>
        <div className="flex flex-col items-center">
          <AvatarUpload
            userId={profile.id}
            value={avatar}
            name={`${firstName} ${lastName}`.trim() || username}
            league={profile.league ?? '7ajra'}
            onChange={(url) => setAvatar(url)}
          />
        </div>
      </section>

      {/* Basic info — one input per row */}
      <section className="space-y-4">
        <Label className="text-sm font-semibold block">Basic info</Label>

        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="your_username" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <div ref={countryWrapRef} className="relative">
            <button
              id="country"
              type="button"
              onClick={() => setCountryOpen((v) => !v)}
              className={cn(inputClass, 'flex items-center justify-between text-left')}
              aria-expanded={countryOpen}
            >
              <span className={country ? 'text-foreground' : 'text-muted-foreground'}>
                {country || 'Select your country…'}
              </span>
              <ChevronDown className={cn('size-3.5 text-muted-foreground transition-transform', countryOpen && 'rotate-180')} />
            </button>

            {countryOpen && (
              <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 rounded-[var(--radius-popover)] border border-border bg-popover shadow-lg flex flex-col">
                <div className="relative p-2 border-b border-border">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <input
                    autoFocus
                    type="text"
                    value={countryQuery}
                    onChange={(e) => setCountryQuery(e.target.value)}
                    placeholder="Search country…"
                    className="w-full h-8 pl-8 pr-3 text-sm rounded-[var(--radius-input)] bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-muted"
                  />
                </div>
                <div className="max-h-64 overflow-auto p-1">
                  {filteredCountries.suggested.length === 0 && filteredCountries.others.length === 0 && (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">No country matches</p>
                  )}
                  {filteredCountries.suggested.length > 0 && (
                    <>
                      <p className="px-3 pt-2 pb-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        Suggested
                      </p>
                      {filteredCountries.suggested.map((c) => {
                        const active = country === c
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setCountry(c)
                              setCountryOpen(false)
                              setCountryQuery('')
                            }}
                            className={cn(
                              'w-full text-left px-3 py-2 text-sm rounded-[calc(var(--radius-popover)-4px)] flex items-center justify-between transition-colors',
                              active ? 'bg-primary/10 text-primary' : 'hover:bg-accent/40 text-foreground',
                            )}
                          >
                            <span>{c}</span>
                            {active && <Check className="size-4 text-primary" />}
                          </button>
                        )
                      })}
                      {filteredCountries.others.length > 0 && (
                        <p className="px-3 pt-3 pb-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                          All countries
                        </p>
                      )}
                    </>
                  )}
                  {filteredCountries.others.map((c) => {
                    const active = country === c
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setCountry(c)
                          setCountryOpen(false)
                          setCountryQuery('')
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2 text-sm rounded-[calc(var(--radius-popover)-4px)] flex items-center justify-between transition-colors',
                          active ? 'bg-primary/10 text-primary' : 'hover:bg-accent/40 text-foreground',
                        )}
                      >
                        <span>{c}</span>
                        {active && <Check className="size-4 text-primary" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">
            Bio <span className="text-muted-foreground font-normal">({bio.length}/160)</span>
          </Label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 160))}
            rows={3}
            placeholder="Tell the community about yourself..."
            className="w-full rounded-[var(--radius-input)] border border-input bg-transparent px-2.5 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-3 focus:ring-ring/30 focus:border-ring resize-none dark:bg-input/30"
          />
        </div>
      </section>

      {/* Specialty */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold block">Specialty</Label>
          {specialtyLocked && (
            <span className="text-xs text-muted-foreground">Locked — picked at signup</span>
          )}
        </div>
        <div className="space-y-3">
          {SPECIALTY_OPTIONS.map((s) => {
            const selected = specialty === s.value
            const disabled = specialtyLocked && !selected
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => !specialtyLocked && setSpecialty(s.value)}
                disabled={disabled}
                aria-disabled={disabled}
                className={cn(
                  'relative w-full text-left rounded-[var(--radius-card)] border p-5 transition-all',
                  selected
                    ? 'border-2 border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-accent/30',
                  disabled && 'opacity-40 cursor-not-allowed hover:border-border hover:bg-card',
                  specialtyLocked && selected && 'cursor-default',
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{s.icon}</div>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-foreground">{s.label}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{s.description}</p>
                  </div>
                  {selected && (
                    <div className="size-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="size-3.5 text-primary-foreground" strokeWidth={3} />
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        <div className="pt-2">
          <Label className="text-sm font-semibold mb-3 block">Experience level</Label>
          <div className="grid grid-cols-3 gap-2">
            {LEVELS.map((l) => {
              const active = experienceLevel === l.value
              return (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setExperienceLevel(l.value)}
                  className={cn(
                    'h-10 rounded-[var(--radius-input)] border text-sm font-medium transition-colors',
                    active
                      ? 'border-2 border-primary bg-primary/5 text-foreground'
                      : 'border-input bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
                  )}
                >
                  {l.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section className="space-y-3">
        <Label className="text-sm font-semibold block">Tools you use</Label>
        <div ref={toolsWrapRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setToolsOpen((v) => !v)}
              disabled={!specialty}
              className={cn(inputClass, 'flex items-center justify-between text-left disabled:opacity-50')}
            >
              <span className={tools.length === 0 ? 'text-muted-foreground' : 'text-foreground'}>
                {!specialty
                  ? 'Pick a specialty first'
                  : tools.length === 0
                    ? 'Select your tools…'
                    : `${tools.length} tool${tools.length > 1 ? 's' : ''} selected`}
              </span>
              <ChevronDown className={cn('size-3.5 text-muted-foreground transition-transform', toolsOpen && 'rotate-180')} />
            </button>

            {toolsOpen && (
              <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 rounded-[var(--radius-popover)] border border-border bg-popover shadow-lg flex flex-col">
                <div className="relative p-2 border-b border-border">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <input
                    autoFocus
                    type="text"
                    value={toolsQuery}
                    onChange={(e) => setToolsQuery(e.target.value)}
                    placeholder="Search tools…"
                    className="w-full h-8 pl-8 pr-3 text-sm rounded-[var(--radius-input)] bg-muted/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-muted"
                  />
                </div>
                <div className="max-h-64 overflow-auto p-1">
                  {filteredTools.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">No tools match</p>
                  ) : (
                    filteredTools.map((tool) => {
                      const active = tools.includes(tool)
                      return (
                        <button
                          key={tool}
                          type="button"
                          onClick={() => toggleTool(tool)}
                          className={cn(
                            'w-full text-left px-3 py-2 text-sm rounded-[calc(var(--radius-popover)-4px)] flex items-center justify-between transition-colors',
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
                    aria-label={`Remove ${tool}`}
                    className="hover:opacity-70"
                  >
                    <X className="size-3" strokeWidth={2.5} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Objectives */}
      <section className="space-y-3">
        <Label className="text-sm font-semibold block">Goals</Label>
        <div className="space-y-3">
          {OBJECTIVES_OPTIONS.map((opt) => {
            const active = objectives.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleObjective(opt.value)}
                className={cn(
                  'relative w-full text-left rounded-[var(--radius-card)] border p-5 transition-all',
                  active
                    ? 'border-2 border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-accent/30',
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="text-3xl">{opt.icon}</div>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-foreground">{opt.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{opt.subtitle}</p>
                  </div>
                  {active && (
                    <div className="size-6 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="size-3.5 text-primary-foreground" strokeWidth={3} />
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      {/* Social links */}
      <section className="space-y-3">
        <Label className="text-sm font-semibold block">Portfolio &amp; social links</Label>

        {activeKeys.length > 0 && (
          <div className="space-y-3">
            {activeKeys.map((key) => {
              const def = defForKey(key)
              const err = linkErrors[key]
              return (
                <div key={key}>
                  <div className="flex items-center gap-2">
                    <SocialLogo def={def} />
                    <input
                      type="url"
                      value={linkValues[key] ?? ''}
                      onChange={(e) => updateLinkUrl(key, e.target.value)}
                      placeholder={def.placeholder}
                      className={cn(
                        inputClass,
                        'flex-1',
                        err && 'border-destructive focus-visible:ring-destructive/20',
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => removeNetwork(key)}
                      aria-label={`Remove ${def.name}`}
                      className="size-8 inline-flex items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                  {err ? (
                    <p className="text-xs text-destructive mt-1.5 ml-11">{err}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1.5 ml-11">{def.name}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {suggestedSocialKeys.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              {activeKeys.length === 0 ? 'Where can people find you?' : 'Add another network'}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedSocialKeys.map((key) => {
                const def = defForKey(key)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => addNetwork(key)}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card text-sm text-foreground px-3 py-1.5 hover:border-primary/40 hover:bg-accent/30 transition-colors"
                  >
                    <SocialLogo def={def} size="sm" />
                    {def.name}
                    <Plus className="size-3 text-muted-foreground" strokeWidth={2.5} />
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div>
          {showCustom ? (
            <div className="rounded-[var(--radius-card)] border border-border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Add a custom platform</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowCustom(false)
                    setCustomError(null)
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Platform name"
                  className={inputClass}
                />
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>
              {customError && <p className="text-xs text-destructive">{customError}</p>}
              <Button type="button" onClick={submitCustomPlatform} size="sm">
                Add platform
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCustom(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80"
            >
              <Plus className="size-3.5" strokeWidth={2.5} />
              Add a custom platform
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
