'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AvatarUpload } from '@/components/features/dashboard/AvatarUpload'
import { CheckCircle, Loader2 } from 'lucide-react'
import type { Profile } from '@/types/database.types'
import type { League } from '@/lib/utils/xp'

const SPECIALTY_OPTIONS = ['Graphic Design', 'UX/UI', 'Motion', 'Branding', 'Illustration', '3D', 'Web Design', 'Product Design']

const COUNTRIES: { code: string; name: string }[] = [
  { code: 'DZ', name: 'Algérie' },
  { code: 'BE', name: 'Belgique' },
  { code: 'BJ', name: 'Bénin' },
  { code: 'BF', name: 'Burkina Faso' },
  { code: 'CM', name: 'Cameroun' },
  { code: 'CA', name: 'Canada' },
  { code: 'CF', name: 'Centrafrique' },
  { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'EG', name: 'Égypte' },
  { code: 'FR', name: 'France' },
  { code: 'GA', name: 'Gabon' },
  { code: 'GN', name: 'Guinée' },
  { code: 'DE', name: 'Allemagne' },
  { code: 'GH', name: 'Ghana' },
  { code: 'KE', name: 'Kenya' },
  { code: 'LB', name: 'Liban' },
  { code: 'LY', name: 'Libye' },
  { code: 'ML', name: 'Mali' },
  { code: 'MA', name: 'Maroc' },
  { code: 'MR', name: 'Mauritanie' },
  { code: 'MU', name: 'Maurice' },
  { code: 'NL', name: 'Pays-Bas' },
  { code: 'NE', name: 'Niger' },
  { code: 'NG', name: 'Nigéria' },
  { code: 'CD', name: 'RD Congo' },
  { code: 'CG', name: 'Congo' },
  { code: 'RW', name: 'Rwanda' },
  { code: 'SN', name: 'Sénégal' },
  { code: 'CH', name: 'Suisse' },
  { code: 'TG', name: 'Togo' },
  { code: 'TN', name: 'Tunisie' },
  { code: 'GB', name: 'Royaume-Uni' },
  { code: 'US', name: 'États-Unis' },
  { code: 'ES', name: 'Espagne' },
  { code: 'IT', name: 'Italie' },
  { code: 'PT', name: 'Portugal' },
  { code: 'AE', name: 'Émirats Arabes Unis' },
  { code: 'SA', name: 'Arabie Saoudite' },
  { code: 'QA', name: 'Qatar' },
].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
const TOOLS_OPTIONS = ['Figma', 'Adobe XD', 'Illustrator', 'Photoshop', 'After Effects', 'Blender', 'Framer', 'Sketch', 'InVision', 'Procreate']
const OBJECTIVE_OPTIONS = ['Get hired', 'Build portfolio', 'Improve skills', 'Network', 'Freelance', 'Fun']

interface ProfileFormProps {
  profile: Profile
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [avatar, setAvatar] = useState<string | null>(profile.avatar_url ?? null)
  const [username, setUsername] = useState(profile.username ?? '')
  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [country, setCountry] = useState(profile.country ?? '')
  const [city, setCity] = useState(profile.city ?? '')
  const [specialty, setSpecialty] = useState(profile.specialty ?? '')
  const [objective, setObjective] = useState(profile.objective ?? '')
  const [tools, setTools] = useState<string[]>((profile.tools as string[]) ?? [])
  const [links, setLinks] = useState<Record<string, string>>((profile.links as Record<string, string>) ?? {})

  function toggleTool(t: string) {
    setTools(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  function handleSave() {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: avatar, username, full_name: fullName, bio, country, city, specialty, objective, tools, links }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    })
  }

  return (
    <div className="space-y-8">
      {/* Avatar */}
      <div className="flex flex-col items-center">
        <AvatarUpload
          userId={profile.id}
          value={avatar}
          name={fullName || username}
          league={(profile.league as League) ?? 'rookie'}
          onChange={url => setAvatar(url)}
        />
      </div>

      {/* Basic info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username *</Label>
          <Input id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="your_username" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Jane Doe" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">
          Bio <span className="text-muted-foreground font-normal">({bio.length}/160)</span>
        </Label>
        <textarea
          id="bio"
          value={bio}
          onChange={e => setBio(e.target.value.slice(0, 160))}
          rows={3}
          placeholder="Tell the community about yourself..."
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="country">Pays</Label>
          <select
            id="country"
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          >
            <option value="">— Sélectionner —</option>
            {COUNTRIES.map(c => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" value={city} onChange={e => setCity(e.target.value)} placeholder="Paris" />
        </div>
      </div>

      {/* Specialty */}
      <div className="space-y-2">
        <Label>Specialty</Label>
        <div className="flex flex-wrap gap-2">
          {SPECIALTY_OPTIONS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => setSpecialty(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                specialty === s
                  ? 'bg-primary text-white border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Objective */}
      <div className="space-y-2">
        <Label>Main Objective</Label>
        <div className="flex flex-wrap gap-2">
          {OBJECTIVE_OPTIONS.map(o => (
            <button
              key={o}
              type="button"
              onClick={() => setObjective(o)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                objective === o
                  ? 'bg-primary text-white border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      </div>

      {/* Tools */}
      <div className="space-y-2">
        <Label>Tools <span className="text-muted-foreground font-normal">(select all that apply)</span></Label>
        <div className="flex flex-wrap gap-2">
          {TOOLS_OPTIONS.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTool(t)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                tools.includes(t)
                  ? 'bg-primary text-white border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="space-y-3">
        <Label>Links</Label>
        <div className="grid grid-cols-2 gap-3">
          {['portfolio', 'dribbble', 'behance', 'linkedin', 'twitter', 'github'].map(key => (
            <div key={key} className="space-y-1">
              <p className="text-xs text-muted-foreground capitalize">{key}</p>
              <Input
                value={links[key] ?? ''}
                onChange={e => setLinks(prev => ({ ...prev, [key]: e.target.value }))}
                placeholder={`https://${key}.com/...`}
                className="text-xs"
              />
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={isPending} className="min-w-32">
          {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Save Changes'}
        </Button>
        {success && (
          <span className="flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle className="size-4" /> Saved!
          </span>
        )}
      </div>
    </div>
  )
}
