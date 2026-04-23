# Admin Leagues & Challenges Management — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full admin management system for leagues and challenges, with new DB fields, CRUD pages, league-filtered challenge list, and updated participation logic.

**Architecture:** New `leagues` table + columns on `challenges` (league_id, difficulty, xp_reward, deadline_days, is_published). Admin pages follow existing pattern: client components for list pages, server components for edit pages with `ChallengeForm`/`LeagueForm` shared components. API routes use `requireAdmin()` + `(admin!.supabase as any)` pattern.

**Tech Stack:** Next.js 16 App Router · TypeScript · Supabase (supabaseAdmin for RLS bypass) · Tailwind CSS · shadcn/ui Base UI

**Critical notes:**
- NEVER use `asChild` (Base UI doesn't support it)
- Use `(supabase as any)` for tables not in TypeScript types (leagues, new challenge columns)
- `supabaseAdmin` from `src/lib/supabase/admin.ts` bypasses RLS; `requireAdmin()` does NOT
- No git push — test on localhost:3000

---

## File Map

### Created
| File | Responsibility |
|------|---------------|
| `src/lib/utils/leagues.ts` | `getLeagueThreshold()` server utility |
| `src/app/api/admin/leagues/route.ts` | GET list + POST create league |
| `src/app/api/admin/leagues/[id]/route.ts` | PATCH update + DELETE league |
| `src/app/api/admin/leagues/[id]/stats/route.ts` | GET nb users, nb défis, XP seuil |
| `src/components/admin/LeagueForm.tsx` | Reusable create/edit league form |
| `src/app/(admin)/admin/leagues/page.tsx` | Leagues list page |
| `src/app/(admin)/admin/leagues/new/page.tsx` | New league page |
| `src/app/(admin)/admin/leagues/[id]/page.tsx` | Edit league page |

### Modified
| File | Change |
|------|--------|
| `src/components/admin/AdminSidebar.tsx` | Add Leagues nav item |
| `src/components/admin/ChallengeForm.tsx` | Add league_id, difficulty→XP auto, deadline_days, is_published |
| `src/app/api/admin/challenges/route.ts` | Handle new fields + league_id filter |
| `src/app/api/admin/challenges/[id]/route.ts` | Handle new fields in PATCH |
| `src/app/(admin)/admin/challenges/page.tsx` | League filter select + new columns |
| `src/app/(admin)/admin/challenges/[id]/page.tsx` | Pass new initial fields to ChallengeForm |
| `src/app/api/participations/route.ts` | One active at a time + access check + deadline_days |

---

## Task 1: SQL Migration (manual — Supabase SQL Editor)

**No code to write.** User must run this SQL in Supabase dashboard → SQL Editor.

- [ ] **Step 1: Open Supabase SQL Editor**

Go to https://supabase.com/dashboard/project/ndflytgtduuvacjmdobc/sql/new

- [ ] **Step 2: Run the migration**

```sql
-- Create leagues table
CREATE TABLE leagues (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  icon           TEXT NOT NULL,
  color          TEXT NOT NULL,
  order_index    INTEGER NOT NULL,
  min_challenges INTEGER DEFAULT 3,
  access         TEXT DEFAULT 'all',
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Add columns to challenges
ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS league_id      UUID REFERENCES leagues(id),
  ADD COLUMN IF NOT EXISTS difficulty     TEXT,
  ADD COLUMN IF NOT EXISTS xp_reward      INTEGER,
  ADD COLUMN IF NOT EXISTS deadline_days  INTEGER,
  ADD COLUMN IF NOT EXISTS is_published   BOOLEAN DEFAULT false;

-- RLS leagues
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "leagues_public_read" ON leagues FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "leagues_admin_write" ON leagues FOR ALL
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed 8 default leagues
INSERT INTO leagues (name, icon, color, order_index, access) VALUES
  ('Stone',    '🪨', '#8B8B8B', 1, 'all'),
  ('Bronze',   '🟤', '#CD7F32', 2, 'all'),
  ('Silver',   '⚪', '#C0C0C0', 3, 'pro_only'),
  ('Gold',     '🟡', '#FFD700', 4, 'pro_only'),
  ('Platinum', '🔵', '#E5E4E2', 5, 'pro_only'),
  ('Diamond',  '💎', '#B9F2FF', 6, 'pro_only'),
  ('Master',   '👑', '#7C3AED', 7, 'pro_only'),
  ('Legend',   '🔴', '#DC2626', 8, 'pro_only');
```

- [ ] **Step 3: Verify**

Run: `SELECT name, access FROM leagues ORDER BY order_index;`
Expected: 8 rows (Stone → Legend)

---

## Task 2: League Utility + API Routes

**Files:**
- Create: `src/lib/utils/leagues.ts`
- Create: `src/app/api/admin/leagues/route.ts`
- Create: `src/app/api/admin/leagues/[id]/route.ts`
- Create: `src/app/api/admin/leagues/[id]/stats/route.ts`

- [ ] **Step 1: Create `src/lib/utils/leagues.ts`**

```typescript
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function getLeagueThreshold(leagueId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from('challenges')
    .select('xp_reward')
    .eq('league_id', leagueId)
    .eq('is_published', true)

  const total = (data ?? []).reduce((sum: number, c: any) => sum + (c.xp_reward ?? 0), 0)
  return Math.floor(total * 0.6)
}
```

- [ ] **Step 2: Create `src/app/api/admin/leagues/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

export async function GET() {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { data } = await (admin!.supabase as any)
    .from('leagues')
    .select('*')
    .order('order_index', { ascending: true })

  return NextResponse.json({ leagues: data ?? [] })
}

export async function POST(request: Request) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { data, error: dbErr } = await (admin!.supabase as any)
    .from('leagues')
    .insert({
      name: body.name,
      icon: body.icon,
      color: body.color,
      order_index: body.order_index,
      min_challenges: body.min_challenges ?? 3,
      access: body.access ?? 'all',
      is_active: body.is_active ?? true,
    })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ league: data })
}
```

- [ ] **Step 3: Create `src/app/api/admin/leagues/[id]/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

interface Props { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Props) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()

  const update: Record<string, unknown> = {}
  if (body.name !== undefined)           update.name = body.name
  if (body.icon !== undefined)           update.icon = body.icon
  if (body.color !== undefined)          update.color = body.color
  if (body.order_index !== undefined)    update.order_index = body.order_index
  if (body.min_challenges !== undefined) update.min_challenges = body.min_challenges
  if (body.access !== undefined)         update.access = body.access
  if (body.is_active !== undefined)      update.is_active = body.is_active

  const { error: dbErr } = await (admin!.supabase as any)
    .from('leagues')
    .update(update)
    .eq('id', id)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, { params }: Props) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const { error: dbErr } = await (admin!.supabase as any)
    .from('leagues')
    .delete()
    .eq('id', id)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Create `src/app/api/admin/leagues/[id]/stats/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getLeagueThreshold } from '@/lib/utils/leagues'

interface Props { params: Promise<{ id: string }> }

export async function GET(_: Request, { params }: Props) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params

  const [challengeCount, xpThreshold] = await Promise.all([
    supabaseAdmin
      .from('challenges')
      .select('*', { count: 'exact', head: true })
      .eq('league_id', id)
      .eq('is_published', true)
      .then(r => r.count ?? 0),
    getLeagueThreshold(id),
  ])

  return NextResponse.json({ challengeCount, xpThreshold })
}
```

- [ ] **Step 5: Verify API routes compile**

```bash
cd /Users/macbook/kreevo && npx tsc --noEmit 2>&1 | head -30
```

---

## Task 3: AdminSidebar — Add Leagues

**Files:**
- Modify: `src/components/admin/AdminSidebar.tsx`

- [ ] **Step 1: Add Trophy import and Leagues nav item**

In `src/components/admin/AdminSidebar.tsx`, replace the NAV array:

```typescript
import {
  LayoutDashboard, Trophy, Users, ShieldAlert, MessageSquare,
  Mail, Settings, ArrowLeft, Palette, Medal,
} from 'lucide-react'

const NAV = [
  { href: '/admin/dashboard',    label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/admin/leagues',      label: 'Ligues',         icon: Medal },
  { href: '/admin/challenges',   label: 'Challenges',     icon: Trophy },
  { href: '/admin/users',        label: 'Users',          icon: Users },
  { href: '/admin/moderation',   label: 'Modération',     icon: ShieldAlert, badge: true },
  { href: '/admin/feedbacks',    label: 'Feedbacks Pro',  icon: MessageSquare },
  { href: '/admin/emails',       label: 'Emails',         icon: Mail },
  { href: '/admin/design',       label: 'Design System',  icon: Palette },
  { href: '/admin/settings',     label: 'Paramètres',     icon: Settings },
]
```

---

## Task 4: LeagueForm Component + Admin Leagues Pages

**Files:**
- Create: `src/components/admin/LeagueForm.tsx`
- Create: `src/app/(admin)/admin/leagues/page.tsx`
- Create: `src/app/(admin)/admin/leagues/new/page.tsx`
- Create: `src/app/(admin)/admin/leagues/[id]/page.tsx`

- [ ] **Step 1: Create `src/components/admin/LeagueForm.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2 } from 'lucide-react'

interface LeagueFormData {
  name: string
  icon: string
  color: string
  order_index: string
  min_challenges: string
  access: 'all' | 'pro_only'
  is_active: boolean
}

const EMPTY: LeagueFormData = {
  name: '',
  icon: '🏆',
  color: '#8B8B8B',
  order_index: '1',
  min_challenges: '3',
  access: 'all',
  is_active: true,
}

export function LeagueForm({ initial, id }: { initial?: Partial<LeagueFormData>; id?: string }) {
  const router = useRouter()
  const [form, setForm] = useState<LeagueFormData>({ ...EMPTY, ...initial })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof LeagueFormData) => (val: string | boolean) =>
    setForm(f => ({ ...f, [key]: val }))

  const labelClass = 'text-xs font-mono text-muted-foreground uppercase tracking-widest'
  const inputClass = 'w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring'

  async function handleSave() {
    setSaving(true)
    setError(null)
    const url = id ? `/api/admin/leagues/${id}` : '/api/admin/leagues'
    const method = id ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        order_index: parseInt(form.order_index),
        min_challenges: parseInt(form.min_challenges),
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Erreur'); setSaving(false); return }
    router.push('/admin/leagues')
    router.refresh()
  }

  return (
    <div className="space-y-5">
      <div className="grid md:grid-cols-2 gap-5">
        {/* Nom */}
        <div className="space-y-1.5">
          <label className={labelClass}>Nom</label>
          <input value={form.name} onChange={e => set('name')(e.target.value)} className={inputClass} placeholder="Stone" />
        </div>

        {/* Icône */}
        <div className="space-y-1.5">
          <label className={labelClass}>Icône (emoji)</label>
          <input value={form.icon} onChange={e => set('icon')(e.target.value)} className={inputClass} placeholder="🪨" />
        </div>

        {/* Couleur */}
        <div className="space-y-1.5">
          <label className={labelClass}>Couleur</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={form.color}
              onChange={e => set('color')(e.target.value)}
              className="size-9 rounded-md border border-border cursor-pointer bg-background p-0.5"
            />
            <input value={form.color} onChange={e => set('color')(e.target.value)} className={inputClass} placeholder="#8B8B8B" />
          </div>
        </div>

        {/* Ordre */}
        <div className="space-y-1.5">
          <label className={labelClass}>Ordre d'affichage</label>
          <input
            type="number"
            value={form.order_index}
            onChange={e => set('order_index')(e.target.value)}
            min={1}
            className={inputClass}
          />
        </div>

        {/* Min challenges */}
        <div className="space-y-1.5">
          <label className={labelClass}>Min challenges requis</label>
          <input
            type="number"
            value={form.min_challenges}
            onChange={e => set('min_challenges')(e.target.value)}
            min={1}
            className={inputClass}
          />
        </div>

        {/* Accès */}
        <div className="space-y-1.5">
          <label className={labelClass}>Accès</label>
          <select
            value={form.access}
            onChange={e => set('access')(e.target.value as 'all' | 'pro_only')}
            className={inputClass}
          >
            <option value="all">Tous (Free + Pro)</option>
            <option value="pro_only">Pro uniquement</option>
          </select>
        </div>
      </div>

      {/* Statut toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => set('is_active')(!form.is_active)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${form.is_active ? 'bg-primary' : 'bg-muted'}`}
        >
          <span className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
        <span className="text-sm font-medium">{form.is_active ? 'Active' : 'Inactive'}</span>
      </div>

      {error && (
        <p className="text-sm text-destructive font-mono bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-2">{error}</p>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-full hover:opacity-85 disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {id ? 'Enregistrer' : 'Créer la ligue'}
        </button>
        <button onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Annuler
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/app/(admin)/admin/leagues/page.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Pencil, Power } from 'lucide-react'
import { cn } from '@/lib/utils'

interface League {
  id: string
  name: string
  icon: string
  color: string
  order_index: number
  min_challenges: number
  access: 'all' | 'pro_only'
  is_active: boolean
}

interface LeagueStats {
  challengeCount: number
  xpThreshold: number
}

export default function AdminLeagues() {
  const [leagues, setLeagues] = useState<League[]>([])
  const [stats, setStats] = useState<Record<string, LeagueStats>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadLeagues() }, [])

  async function loadLeagues() {
    setLoading(true)
    const res = await fetch('/api/admin/leagues')
    const data = await res.json()
    const ls: League[] = data.leagues ?? []
    setLeagues(ls)
    setLoading(false)

    const statsEntries = await Promise.all(
      ls.map(async l => {
        const r = await fetch(`/api/admin/leagues/${l.id}/stats`)
        const s = await r.json()
        return [l.id, s] as [string, LeagueStats]
      })
    )
    setStats(Object.fromEntries(statsEntries))
  }

  async function toggleActive(league: League) {
    await fetch(`/api/admin/leagues/${league.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !league.is_active }),
    })
    loadLeagues()
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ligues</h1>
          <p className="text-sm text-muted-foreground">{leagues.length} ligues configurées</p>
        </div>
        <Link
          href="/admin/leagues/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-full hover:opacity-85 transition-opacity"
        >
          <Plus className="size-4" />
          Créer une ligue
        </Link>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white dark:bg-zinc-900/20 border-b border-border">
            <tr>
              {['Ligue', 'Ordre', 'Défis actifs', 'XP seuil', 'Accès', 'Statut', 'Actions'].map(h => (
                <th key={h} className="text-left text-xs font-mono text-muted-foreground uppercase tracking-widest px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">Chargement…</td></tr>
            ) : leagues.map(league => (
              <tr key={league.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{league.icon}</span>
                    <span className="font-medium">{league.name}</span>
                    <span
                      className="inline-block size-3 rounded-full shrink-0"
                      style={{ backgroundColor: league.color }}
                    />
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">#{league.order_index}</td>
                <td className="px-4 py-3 font-mono text-xs">
                  {stats[league.id] !== undefined ? stats[league.id].challengeCount : '…'}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {stats[league.id] !== undefined ? `${stats[league.id].xpThreshold} XP` : '…'}
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'text-[10px] font-mono px-2 py-0.5 rounded-full',
                    league.access === 'all'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-purple-100 text-purple-700'
                  )}>
                    {league.access === 'all' ? 'Free + Pro' : 'Pro only'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'text-[10px] font-mono px-2 py-0.5 rounded-full',
                    league.is_active ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                  )}>
                    {league.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/leagues/${league.id}`}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="Modifier"
                    >
                      <Pencil className="size-3.5" />
                    </Link>
                    <button
                      onClick={() => toggleActive(league)}
                      title={league.is_active ? 'Désactiver' : 'Activer'}
                      className={cn(
                        'p-1.5 rounded-md transition-colors',
                        league.is_active
                          ? 'hover:bg-orange-100 text-orange-500'
                          : 'hover:bg-green-100 text-green-600'
                      )}
                    >
                      <Power className="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `src/app/(admin)/admin/leagues/new/page.tsx`**

```typescript
import { LeagueForm } from '@/components/admin/LeagueForm'

export default function NewLeague() {
  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nouvelle ligue</h1>
        <p className="text-sm text-muted-foreground">Crée une nouvelle ligue de challenges.</p>
      </div>
      <LeagueForm />
    </div>
  )
}
```

- [ ] **Step 4: Create `src/app/(admin)/admin/leagues/[id]/page.tsx`**

```typescript
import { notFound } from 'next/navigation'
import { LeagueForm } from '@/components/admin/LeagueForm'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface Props { params: Promise<{ id: string }> }

export default async function EditLeague({ params }: Props) {
  const { id } = await params

  const { data } = await (supabaseAdmin as any)
    .from('leagues')
    .select('*')
    .eq('id', id)
    .single()

  if (!data) notFound()

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Modifier la ligue</h1>
        <p className="text-sm text-muted-foreground">{data.icon} {data.name}</p>
      </div>
      <LeagueForm
        id={id}
        initial={{
          name: data.name,
          icon: data.icon,
          color: data.color,
          order_index: String(data.order_index),
          min_challenges: String(data.min_challenges),
          access: data.access,
          is_active: data.is_active,
        }}
      />
    </div>
  )
}
```

---

## Task 5: Update ChallengeForm

**Files:**
- Modify: `src/components/admin/ChallengeForm.tsx`

Replace the entire file with the updated version that adds `league_id`, `difficulty` (with auto XP), `deadline_days`, and `is_published`.

- [ ] **Step 1: Replace `src/components/admin/ChallengeForm.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Save, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FormData {
  title: string
  brief: string
  context: string
  deliverable: string
  constraints: string
  criteria: string
  track: string
  level: string
  month: string
  year: string
  reveal_at: string
  closes_at: string
  status: string
  league_id: string
  difficulty: string
  xp_reward: string
  deadline_days: string
  is_published: boolean
}

const DIFFICULTY_XP: Record<string, number> = {
  easy: 150,
  medium: 250,
  hard: 400,
  expert: 600,
}

const EMPTY: FormData = {
  title: '', brief: '', context: '', deliverable: '',
  constraints: '', criteria: '',
  track: 'ux_ui', level: 'rising',
  month: String(new Date().getMonth() + 1),
  year: String(new Date().getFullYear()),
  reveal_at: '', closes_at: '',
  status: 'draft',
  league_id: '',
  difficulty: 'medium',
  xp_reward: '250',
  deadline_days: '7',
  is_published: false,
}

interface League { id: string; name: string; icon: string; order_index: number }

const labelClass = 'text-xs font-mono text-muted-foreground uppercase tracking-widest'
const inputClass = 'w-full text-sm bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-ring'

const field = (label: string, name: keyof FormData, value: string, onChange: (v: string) => void, type: 'input' | 'textarea' = 'input') => (
  <div key={name} className="space-y-1.5">
    <label className={labelClass}>{label}</label>
    {type === 'textarea' ? (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={3}
        className={cn(inputClass, 'resize-none')}
      />
    ) : (
      <input value={value} onChange={e => onChange(e.target.value)} className={inputClass} />
    )}
  </div>
)

const sel = (label: string, value: string, options: [string, string][], onChange: (v: string) => void) => (
  <div className="space-y-1.5">
    <label className={labelClass}>{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} className={inputClass}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  </div>
)

export function ChallengeForm({ initial, id }: { initial?: Partial<FormData>; id?: string }) {
  const router = useRouter()
  const [form, setForm] = useState<FormData>({ ...EMPTY, ...initial })
  const [leagues, setLeagues] = useState<League[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [aiDomain, setAiDomain] = useState('Web')
  const [aiType, setAiType] = useState('UI')

  useEffect(() => {
    fetch('/api/admin/leagues')
      .then(r => r.json())
      .then(d => setLeagues(d.leagues ?? []))
  }, [])

  const set = (key: keyof FormData) => (val: string | boolean) =>
    setForm(f => ({ ...f, [key]: val }))

  function handleDifficultyChange(difficulty: string) {
    setForm(f => ({
      ...f,
      difficulty,
      xp_reward: String(DIFFICULTY_XP[difficulty] ?? 250),
    }))
  }

  async function generateWithAI() {
    setAiLoading(true)
    const res = await fetch('/api/ai/brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: aiDomain, type: aiType, difficulty: form.level, duration: `${form.deadline_days} jours` }),
    })
    const data = await res.json()
    if (res.ok && data.brief) {
      const b = data.brief
      setForm(f => ({
        ...f,
        title: b.title ?? f.title,
        brief: b.objective ?? f.brief,
        context: b.context ?? f.context,
        deliverable: b.deliverable ?? f.deliverable,
        constraints: b.constraints ?? f.constraints,
        criteria: b.evaluation ?? f.criteria,
      }))
      setShowAI(false)
    }
    setAiLoading(false)
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    const url = id ? `/api/admin/challenges/${id}` : '/api/admin/challenges'
    const method = id ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        month: parseInt(form.month),
        year: parseInt(form.year),
        xp_reward: parseInt(form.xp_reward),
        deadline_days: parseInt(form.deadline_days),
        league_id: form.league_id || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Erreur'); setSaving(false); return }
    router.push('/admin/challenges')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* AI Generator */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <button
          onClick={() => setShowAI(s => !s)}
          className="flex items-center gap-2 text-sm font-semibold text-primary"
        >
          <Sparkles className="size-4" />
          Générer avec IA
        </button>
        {showAI && (
          <div className="mt-3 flex items-end gap-3 flex-wrap">
            <div className="space-y-1">
              <label className={labelClass}>Domaine</label>
              <select value={aiDomain} onChange={e => setAiDomain(e.target.value)}
                className="text-sm bg-background border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring">
                {['Web', 'Mobile', 'Dashboard', 'Landing Page', 'Branding'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Type</label>
              <select value={aiType} onChange={e => setAiType(e.target.value)}
                className="text-sm bg-background border border-border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-ring">
                {['UX', 'UI', 'Graphic', 'Motion'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <button
              onClick={generateWithAI}
              disabled={aiLoading}
              className="flex items-center gap-1.5 text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-full hover:opacity-85 disabled:opacity-60"
            >
              {aiLoading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              Générer
            </button>
          </div>
        )}
      </div>

      {/* Form fields */}
      <div className="grid md:grid-cols-2 gap-5">
        {field('Titre', 'title', form.title, v => set('title')(v))}

        {/* Ligue */}
        <div className="space-y-1.5">
          <label className={labelClass}>Ligue</label>
          <select value={form.league_id} onChange={e => set('league_id')(e.target.value)} className={inputClass}>
            <option value="">— Aucune ligue —</option>
            {leagues.map(l => (
              <option key={l.id} value={l.id}>{l.icon} {l.name}</option>
            ))}
          </select>
        </div>

        {/* Track + Niveau */}
        <div className="grid grid-cols-2 gap-3">
          {sel('Track', form.track, [['ux_ui', 'UX/UI'], ['graphic', 'Graphic']], v => set('track')(v))}
          {sel('Niveau', form.level, [['rookie', 'Rookie'], ['rising', 'Rising'], ['pro', 'Pro'], ['elite', 'Elite']], v => set('level')(v))}
        </div>

        {/* Difficulté + XP */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={labelClass}>Difficulté</label>
            <select value={form.difficulty} onChange={e => handleDifficultyChange(e.target.value)} className={inputClass}>
              <option value="easy">Facile — 150 XP</option>
              <option value="medium">Moyen — 250 XP</option>
              <option value="hard">Difficile — 400 XP</option>
              <option value="expert">Expert — 600 XP</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>XP reward</label>
            <input
              type="number"
              value={form.xp_reward}
              onChange={e => set('xp_reward')(e.target.value)}
              className={inputClass}
              min={0}
            />
          </div>
        </div>

        {/* Deadline */}
        {sel('Deadline (jours)', form.deadline_days,
          [['3','3 jours'],['5','5 jours'],['7','7 jours'],['10','10 jours'],['14','14 jours'],['21','21 jours']],
          v => set('deadline_days')(v)
        )}

        {/* Brief */}
        <div className="md:col-span-2">
          {field('Brief principal', 'brief', form.brief, v => set('brief')(v), 'textarea')}
        </div>
        {field('Contexte', 'context', form.context, v => set('context')(v), 'textarea')}
        {field('Livrable', 'deliverable', form.deliverable, v => set('deliverable')(v), 'textarea')}
        {field('Contraintes', 'constraints', form.constraints, v => set('constraints')(v), 'textarea')}
        {field("Critères d'évaluation", 'criteria', form.criteria, v => set('criteria')(v), 'textarea')}

        {/* Période */}
        <div className="grid grid-cols-2 gap-3">
          {sel('Mois', form.month,
            Array.from({ length: 12 }, (_, i) => [String(i + 1), new Date(0, i).toLocaleString('fr', { month: 'long' })] as [string, string]),
            v => set('month')(v))}
          {field('Année', 'year', form.year, v => set('year')(v))}
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className={labelClass}>Reveal at</label>
            <input type="datetime-local" value={form.reveal_at} onChange={e => set('reveal_at')(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Closes at</label>
            <input type="datetime-local" value={form.closes_at} onChange={e => set('closes_at')(e.target.value)} className={inputClass} />
          </div>
        </div>

        {sel('Statut', form.status, [['draft', 'Draft'], ['active', 'Active'], ['closed', 'Closed']], v => set('status')(v))}

        {/* Publié toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => set('is_published')(!form.is_published)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${form.is_published ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow transition-transform ${form.is_published ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <span className="text-sm font-medium">
            {form.is_published ? 'Publié' : 'Draft (non publié)'}
          </span>
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive font-mono bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-2">{error}</p>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2 rounded-full hover:opacity-85 disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {id ? 'Enregistrer' : 'Créer le challenge'}
        </button>
        <button onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Annuler
        </button>
      </div>
    </div>
  )
}
```

---

## Task 6: Update Challenge API Routes

**Files:**
- Modify: `src/app/api/admin/challenges/route.ts`
- Modify: `src/app/api/admin/challenges/[id]/route.ts`

- [ ] **Step 1: Update `src/app/api/admin/challenges/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

export async function GET(request: Request) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(request.url)
  const leagueId = searchParams.get('league_id')

  let query = (admin!.supabase as any)
    .from('challenges')
    .select('*, leagues(id, name, icon)')
    .order('created_at', { ascending: false })

  if (leagueId) query = query.eq('league_id', leagueId)

  const { data: challenges } = await query
  return NextResponse.json({ challenges: challenges ?? [] })
}

export async function POST(request: Request) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const body = await request.json()
  const { data, error: dbErr } = await (admin!.supabase as any)
    .from('challenges')
    .insert({
      title: body.title,
      brief: body.brief,
      context: body.context || null,
      deliverable: body.deliverable || null,
      constraints: body.constraints || null,
      criteria: body.criteria || null,
      track: body.track,
      level: body.level,
      month: body.month,
      year: body.year,
      reveal_at: body.reveal_at || null,
      closes_at: body.closes_at || null,
      status: body.status ?? 'draft',
      league_id: body.league_id || null,
      difficulty: body.difficulty || null,
      xp_reward: body.xp_reward || null,
      deadline_days: body.deadline_days || null,
      is_published: body.is_published ?? false,
    })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ challenge: data })
}
```

- [ ] **Step 2: Update `src/app/api/admin/challenges/[id]/route.ts`**

Add new fields to the PATCH handler:

```typescript
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'

interface Props { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Props) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const body = await request.json()

  const { error: dbErr } = await (admin!.supabase as any)
    .from('challenges')
    .update({
      ...(body.title !== undefined && { title: body.title }),
      ...(body.brief !== undefined && { brief: body.brief }),
      ...(body.context !== undefined && { context: body.context }),
      ...(body.deliverable !== undefined && { deliverable: body.deliverable }),
      ...(body.constraints !== undefined && { constraints: body.constraints }),
      ...(body.criteria !== undefined && { criteria: body.criteria }),
      ...(body.track !== undefined && { track: body.track }),
      ...(body.level !== undefined && { level: body.level }),
      ...(body.month !== undefined && { month: body.month }),
      ...(body.year !== undefined && { year: body.year }),
      ...(body.reveal_at !== undefined && { reveal_at: body.reveal_at }),
      ...(body.closes_at !== undefined && { closes_at: body.closes_at }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.league_id !== undefined && { league_id: body.league_id }),
      ...(body.difficulty !== undefined && { difficulty: body.difficulty }),
      ...(body.xp_reward !== undefined && { xp_reward: body.xp_reward }),
      ...(body.deadline_days !== undefined && { deadline_days: body.deadline_days }),
      ...(body.is_published !== undefined && { is_published: body.is_published }),
    })
    .eq('id', id)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, { params }: Props) {
  const { error, admin } = await requireAdmin()
  if (error) return error

  const { id } = await params
  const { error: dbErr } = await (admin!.supabase as any)
    .from('challenges')
    .delete()
    .eq('id', id)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
```

---

## Task 7: Update Challenges Admin Page — League Filter + New Columns

**Files:**
- Modify: `src/app/(admin)/admin/challenges/page.tsx`
- Modify: `src/app/(admin)/admin/challenges/[id]/page.tsx`

- [ ] **Step 1: Replace `src/app/(admin)/admin/challenges/page.tsx`**

```typescript
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Eye, Pencil, Trash2, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface League { id: string; name: string; icon: string }

interface Challenge {
  id: string
  title: string
  track: string
  level: string
  month: number
  year: number
  status: string
  reveal_at: string
  closes_at: string
  difficulty: string | null
  xp_reward: number | null
  deadline_days: number | null
  is_published: boolean
  league_id: string | null
  leagues: League | null
}

const STATUS_STYLE: Record<string, string> = {
  draft:    'bg-muted text-muted-foreground',
  active:   'bg-green-100 text-green-700',
  closed:   'bg-orange-100 text-orange-700',
  archived: 'bg-slate-100 text-slate-500',
}

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Facile', medium: 'Moyen', hard: 'Difficile', expert: 'Expert',
}

export default function AdminChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [leagues, setLeagues] = useState<League[]>([])
  const [selectedLeague, setSelectedLeague] = useState<string>('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/leagues')
      .then(r => r.json())
      .then(d => setLeagues(d.leagues ?? []))
  }, [])

  useEffect(() => { load() }, [selectedLeague])

  async function load() {
    setLoading(true)
    const url = selectedLeague
      ? `/api/admin/challenges?league_id=${selectedLeague}`
      : '/api/admin/challenges'
    const res = await fetch(url)
    const data = await res.json()
    setChallenges(data.challenges ?? [])
    setLoading(false)
  }

  async function publish(id: string) {
    await fetch(`/api/admin/challenges/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'active' }),
    })
    load()
  }

  async function reveal(id: string) {
    await fetch(`/api/admin/challenges/${id}/reveal`, { method: 'POST' })
    load()
  }

  async function del(id: string) {
    setDeleting(id)
    await fetch(`/api/admin/challenges/${id}`, { method: 'DELETE' })
    setConfirming(null)
    setDeleting(null)
    load()
  }

  const filtered = challenges.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.track.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Challenges</h1>
          <p className="text-sm text-muted-foreground">{challenges.length} challenges</p>
        </div>
        <Link
          href="/admin/challenges/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-full hover:opacity-85 transition-opacity"
        >
          <Plus className="size-4" />
          Nouveau challenge
        </Link>
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* League filter */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedLeague('')}
            className={cn(
              'shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-all',
              !selectedLeague
                ? 'bg-foreground text-background border-foreground'
                : 'border-border text-muted-foreground hover:border-foreground/40'
            )}
          >
            Toutes les ligues
          </button>
          {leagues.map(l => (
            <button
              key={l.id}
              onClick={() => setSelectedLeague(l.id)}
              className={cn(
                'shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-all',
                selectedLeague === l.id
                  ? 'bg-foreground text-background border-foreground'
                  : 'border-border text-muted-foreground hover:border-foreground/40'
              )}
            >
              {l.icon} {l.name}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher…"
            className="w-full pl-9 pr-4 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white dark:bg-zinc-900/20 border-b border-border">
            <tr>
              {['Titre', 'Ligue', 'Difficulté', 'XP', 'Deadline', 'Track', 'Status', 'Publié', 'Closes', 'Actions'].map(h => (
                <th key={h} className="text-left text-xs font-mono text-muted-foreground uppercase tracking-widest px-4 py-3 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={10} className="px-4 py-8 text-center text-muted-foreground text-sm">Chargement…</td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 font-medium max-w-[180px] truncate">{c.title}</td>
                <td className="px-4 py-3 text-xs">
                  {c.leagues ? (
                    <span className="flex items-center gap-1">
                      <span>{c.leagues.icon}</span>
                      <span className="text-muted-foreground">{c.leagues.name}</span>
                    </span>
                  ) : <span className="text-muted-foreground/40">—</span>}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {c.difficulty ? DIFFICULTY_LABEL[c.difficulty] ?? c.difficulty : '—'}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {c.xp_reward ? `${c.xp_reward} XP` : '—'}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {c.deadline_days ? `${c.deadline_days}j` : '—'}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{c.track}</td>
                <td className="px-4 py-3">
                  <span className={cn('text-[10px] font-mono px-2 py-0.5 rounded-full capitalize', STATUS_STYLE[c.status] ?? STATUS_STYLE.draft)}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'text-[10px] font-mono px-2 py-0.5 rounded-full',
                    c.is_published ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                  )}>
                    {c.is_published ? 'Publié' : 'Draft'}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                  {c.closes_at ? new Date(c.closes_at).toLocaleDateString('fr') : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {c.status === 'draft' && (
                      <button onClick={() => publish(c.id)} title="Publier" className="p-1.5 rounded-md hover:bg-green-100 text-green-600 transition-colors">
                        <CheckCircle className="size-3.5" />
                      </button>
                    )}
                    {c.status === 'active' && (
                      <button onClick={() => reveal(c.id)} title="Reveal" className="p-1.5 rounded-md hover:bg-blue-100 text-blue-600 transition-colors">
                        <Eye className="size-3.5" />
                      </button>
                    )}
                    <Link href={`/admin/challenges/${c.id}`} title="Éditer" className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="size-3.5" />
                    </Link>
                    {confirming === c.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => del(c.id)} disabled={!!deleting} className="text-[10px] font-mono bg-destructive text-destructive-foreground px-2 py-0.5 rounded">
                          {deleting === c.id ? '…' : 'Confirmer'}
                        </button>
                        <button onClick={() => setConfirming(null)} className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 rounded hover:bg-muted">Non</button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirming(c.id)} title="Supprimer" className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update `src/app/(admin)/admin/challenges/[id]/page.tsx`** — pass new initial fields to ChallengeForm

Find the `<ChallengeForm` usage in that file and replace it with:

```typescript
      <ChallengeForm
        id={id}
        initial={{
          title: data.title ?? '',
          brief: data.brief ?? '',
          context: data.context ?? '',
          deliverable: data.deliverable ?? '',
          constraints: data.constraints ?? '',
          criteria: data.criteria ?? '',
          track: data.track ?? 'ux_ui',
          level: data.level ?? 'rising',
          month: String(data.month ?? 1),
          year: String(data.year ?? new Date().getFullYear()),
          reveal_at: fmt(data.reveal_at),
          closes_at: fmt(data.closes_at),
          status: data.status ?? 'draft',
          league_id: data.league_id ?? '',
          difficulty: data.difficulty ?? 'medium',
          xp_reward: String(data.xp_reward ?? 250),
          deadline_days: String(data.deadline_days ?? 7),
          is_published: data.is_published ?? false,
        }}
      />
```

---

## Task 8: Update Participation Logic

**Files:**
- Modify: `src/app/api/participations/route.ts`

Add three checks:
1. No other active participation exists
2. Challenge league access matches user plan (free → only `access: 'all'` leagues)
3. Use `deadline_days` from challenge instead of hardcoded 3 days

- [ ] **Step 1: Replace POST handler in `src/app/api/participations/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { challenge_id } = await request.json()
  if (!challenge_id) return NextResponse.json({ error: 'Missing challenge_id' }, { status: 400 })

  // Fetch user profile for plan check
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  // Fetch challenge + league
  const { data: challenge } = await (supabaseAdmin as any)
    .from('challenges')
    .select('id, status, league_id, deadline_days, leagues(access)')
    .eq('id', challenge_id)
    .single()

  if (!challenge || challenge.status !== 'active') {
    return NextResponse.json({ error: 'Challenge not active' }, { status: 400 })
  }

  // Access check: free users can only access leagues with access = 'all'
  if (
    challenge.leagues &&
    challenge.leagues.access === 'pro_only' &&
    profile?.plan === 'free'
  ) {
    return NextResponse.json({ error: 'Ce challenge nécessite un plan Pro' }, { status: 403 })
  }

  // One active participation at a time
  const { data: activeParticipation } = await (supabaseAdmin as any)
    .from('participations')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  if (activeParticipation) {
    return NextResponse.json({ error: 'Tu as déjà une participation active en cours' }, { status: 409 })
  }

  // Check if already participated in this challenge
  const { data: existing } = await (supabaseAdmin as any)
    .from('participations')
    .select('id')
    .eq('challenge_id', challenge_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Already participating' }, { status: 409 })
  }

  const deadlineDays = challenge.deadline_days ?? 3
  const now = new Date()
  const personal_deadline = new Date(now.getTime() + deadlineDays * 24 * 60 * 60 * 1000)

  const { data: participation, error } = await (supabaseAdmin as any)
    .from('participations')
    .insert({
      challenge_id,
      user_id: user.id,
      joined_at: now.toISOString(),
      personal_deadline: personal_deadline.toISOString(),
      status: 'active',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try {
    await (supabaseAdmin as any).from('notifications').insert({
      user_id: user.id,
      type: 'joined_challenge',
      data: { challenge_id, deadline: personal_deadline.toISOString() },
    })
  } catch { /* ignore */ }

  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/xp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: request.headers.get('cookie') ?? '' },
      body: JSON.stringify({ action: 'joined_challenge' }),
    })
  } catch { /* ignore */ }

  return NextResponse.json({ participation })
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const challenge_id = searchParams.get('challenge_id')

  let query = (supabase as any)
    .from('participations')
    .select('*, challenges(id, title, closes_at, track)')
    .eq('user_id', user.id)

  if (challenge_id) query = query.eq('challenge_id', challenge_id)

  const { data } = await query.order('joined_at', { ascending: false })
  return NextResponse.json({ participations: data ?? [] })
}
```

---

## Verification Checklist

- [ ] `npm run dev` starts without errors
- [ ] `/admin/leagues` shows the 8 seeded leagues with stats
- [ ] `/admin/leagues/new` creates a new league
- [ ] `/admin/leagues/[id]` edits a league (toggle active/inactive)
- [ ] `/admin/challenges/new` shows league select loaded from DB + difficulty auto-fills XP
- [ ] `/admin/challenges` league filter pills filter the table correctly
- [ ] Participating in a Pro-only league challenge as free user returns 403
- [ ] Participating with an already-active participation returns 409 with proper message
