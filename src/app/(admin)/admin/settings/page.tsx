'use client'

import { useState, useEffect } from 'react'
import { Save, Loader2 } from 'lucide-react'

interface Settings {
  xp_rewards: Record<string, number>
  league_thresholds: Record<string, number>
  submission_attempts: { free: number; pro: number }
  maintenance_mode: boolean
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const res = await fetch('/api/admin/settings')
    const data = await res.json()
    setSettings(data.settings)
    setLoading(false)
  }

  async function save(key: string, value: unknown) {
    setSaving(true)
    setSaved(false)
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading || !settings) return <div className="p-6 text-sm text-muted-foreground">Chargement…</div>

  const set = (key: keyof Settings) => (val: unknown) =>
    setSettings(s => s ? ({ ...s, [key]: val }) : s)

  return (
    <div className="p-6 max-w-2xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Paramètres</h1>
          <p className="text-sm text-muted-foreground">Configuration globale de Kreevo</p>
        </div>
        {saved && <span className="text-sm text-green-600 font-mono">✓ Sauvegardé</span>}
      </div>

      {/* Maintenance mode */}
      <section className="rounded-xl border border-border bg-card p-4 space-y-4">
        <h2 className="text-sm font-semibold">Mode maintenance</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">Afficher une bannière de maintenance sur l'app</p>
            <p className="text-xs text-muted-foreground">Les users verront un message d'avertissement</p>
          </div>
          <button
            onClick={() => {
              const val = !settings.maintenance_mode
              set('maintenance_mode')(val)
              save('maintenance_mode', val)
            }}
            className={`relative w-12 h-6 rounded-full transition-colors ${settings.maintenance_mode ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`absolute top-1 size-4 rounded-full bg-white shadow transition-transform ${settings.maintenance_mode ? 'start-7' : 'start-1'}`} />
          </button>
        </div>
      </section>

      {/* XP Rewards */}
      <section className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Récompenses XP</h2>
          <SaveBtn saving={saving} onClick={() => save('xp_rewards', settings.xp_rewards)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(settings.xp_rewards).map(([key, val]) => (
            <div key={key} className="space-y-1">
              <label className="text-[10px] font-mono text-muted-foreground uppercase">{key.replace(/_/g, ' ')}</label>
              <input
                type="number"
                value={val}
                onChange={e => set('xp_rewards')({ ...settings.xp_rewards, [key]: parseInt(e.target.value) })}
                className="w-full h-10 rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 px-3 py-1 text-base md:text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors"
              />
            </div>
          ))}
        </div>
      </section>

      {/* League thresholds */}
      <section className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Seuils de ligue (XP)</h2>
          <SaveBtn saving={saving} onClick={() => save('league_thresholds', settings.league_thresholds)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(settings.league_thresholds).map(([league, xp]) => (
            <div key={league} className="space-y-1">
              <label className="text-[10px] font-mono text-muted-foreground uppercase">{league}</label>
              <input
                type="number"
                value={xp}
                onChange={e => set('league_thresholds')({ ...settings.league_thresholds, [league]: parseInt(e.target.value) })}
                className="w-full h-10 rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 px-3 py-1 text-base md:text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Submission attempts */}
      <section className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Tentatives soumission</h2>
          <SaveBtn saving={saving} onClick={() => save('submission_attempts', settings.submission_attempts)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(['free', 'pro'] as const).map(plan => (
            <div key={plan} className="space-y-1">
              <label className="text-[10px] font-mono text-muted-foreground capitalize">{plan}</label>
              <input
                type="number" value={settings.submission_attempts[plan]}
                onChange={e => set('submission_attempts')({ ...settings.submission_attempts, [plan]: parseInt(e.target.value) })}
                className="w-full h-10 rounded-[var(--radius-input)] border border-input bg-transparent dark:bg-input/30 px-3 py-1 text-base md:text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 transition-colors"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function SaveBtn({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={saving}
      className="flex items-center gap-1.5 text-xs font-mono border border-border px-3 py-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-60">
      {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
      Sauvegarder
    </button>
  )
}
