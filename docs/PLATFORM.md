# Kreevo — Platform Spec & Dev Handoff

Last updated: 2026-05-01 · Repo: <https://github.com/mrwnnx/kreevo> · Prod: <https://kreevo-tau.vercel.app>

This document is the single source of truth for new engineers joining the team. It explains **what Kreevo does** for the user, then the **technical architecture, data model, and operational details** required to ship features confidently.

---

## 1. Executive summary

Kreevo is a **SaaS platform for designers** that turns skill-building into a structured, gamified competition. Users join short design briefs ("challenges"), submit their work, get validated (AI for early leagues / human admin for higher leagues), earn XP, climb through 8 leagues, and build a public portfolio.

- **Target users**: design students (UX/UI or Graphic) and junior-to-mid designers who want to grow a portfolio and get hired.
- **Differentiator vs Behance/Dribbble**: structured progression (briefs + leagues + XP), validation feedback, and a competitive leaderboard rather than a passive gallery.
- **Business model**: freemium. Free plan = Stone + Bronze leagues. Pro plan = all 8 leagues + extended attempts (Paddle integration not yet wired).

---

## 2. Functional overview

### 2.1 Primary user journey

```
Signup (email / Google / LinkedIn)
  ↓
/onboarding — 7 steps (name, specialty, level, tools, goals, socials, photo, country)
  ↓
/dashboard — adaptive (5 hero states based on participation + progression)
  ↓
/dashboard/challenges → pick one (filtered by league + specialty)
  ↓
"I participate" → confirmation dialog → personal_deadline = now + N days
  ↓
/dashboard/challenges/[id]/submit — full-screen 2-step form (cover + details)
  ↓
Validation:
  • Stone / Bronze / Silver → AI (claude-sonnet-4-6 vision) auto-validates
  • Gold / Platinum / Diamond / Master / Legend → admin review (48h SLA)
  ↓
Approved → +XP, league check (auto-promote if XP threshold + min_challenges met)
Rejected → 24h contestation window (1 max)
  ↓
Submission goes public on /u/[username] + gallery + leaderboard
```

### 2.2 Feature inventory

| Domain | Feature | Status |
|--------|---------|--------|
| **Auth** | Email/password (Supabase) | ✅ |
| | Google OAuth | ✅ |
| | LinkedIn OAuth (`linkedin_oidc`) | ✅ |
| | OAuth profile pre-fill (avatar, name, LinkedIn URL) | ✅ |
| **Onboarding** | 7-step flow with progress bar | ✅ |
| | Gate middleware (`onboarding_completed=false` → `/onboarding`) | ✅ |
| **Dashboard** | Adaptive HeroBanner (5 states) | ✅ partial (`justSubmitted` always false) |
| | Stat cards (League / XP / Streak / Challenges) | ✅ |
| | League card with per-tier color identity (8 colors light + dark) | ✅ |
| | Suggested challenge or "League ends soon" countdown | ✅ partial (countdown is fictional) |
| | Invite friends (referral link) | ✅ UI only — referral capture not wired |
| | Complete profile checklist (5 fields × 20%) | ✅ |
| | Analytics (Recharts: XP gained 7d + Challenges/day) | ✅ partial (TIME SPENT + deltas hardcoded) |
| **Challenges** | Browse list filtered by user league + specialty | ✅ |
| | Locked higher-league cards | ✅ |
| | Challenge detail: preview vs full mode | ✅ |
| | Participate dialog + personal deadline countdown | ✅ |
| | Cancel participation (refund +50 XP) | ✅ |
| | AI generation (admin) — Claude sonnet 4.6 | ✅ |
| **Submissions** | Full-screen 2-step submit form | ✅ |
| | Cover + 3 additional images + collaborators | ✅ |
| | Draft vs Publish | ✅ |
| | AI vision validation (Stone–Silver) | ✅ |
| | Admin review (Gold+) with feedback textarea | ✅ |
| | 24h contestation window | ✅ |
| | Community report (3 = on_hold) | ✅ |
| | Comments threaded 1-level + claps (max 10/user/submission) | ✅ |
| | Free plan limited to 5 reviews/day | ✅ |
| **Leagues** | 8 tiers: Stone → Bronze → Silver → Gold → Platinum → Diamond → Master → Legend | ✅ |
| | Configurable XP threshold % per league | ✅ |
| | Min challenges per league (default 3) | ✅ |
| | Auto-promote on threshold + min_challenges | ✅ |
| | Demote on inactivity (cron) | ✅ |
| **Profile** | Edit form aligned 1:1 with onboarding | ✅ |
| | Auto-save (debounce 700ms + green Saved status) | ✅ |
| | Public profile `/u/[username]` | ✅ |
| **Leaderboard** | Per-league ranking (Uxcel-inspired) | ✅ |
| | Free top 3 visible / Pro full | ✅ |
| **Admin** | CRUD challenges + AI generation | ✅ |
| | CRUD leagues + XP threshold tuning | ✅ |
| | Submissions moderation (validate / reject / resolve report / resolve contest) | ✅ |
| | Users management (plan, league, XP, suspend, delete) | ✅ |
| | Design tokens editor (`/admin`) | ✅ |
| | Settings (XP rewards, league thresholds, attempts) | ✅ |
| **Streaks** | Daily activity tracking + best streak | ✅ |
| | Reset cron at 1h UTC if missed a day | ✅ |
| **Referrals** | Code generation (8 chars hex per user) | ✅ |
| | UI: Share / Copy link | ✅ |
| | Capture `?ref=` on signup + XP+50 on first challenge complete | ❌ TODO |
| **Notifications** | 11 types (joined / approved / rejected / contested / reported / etc.) | ✅ |
| **Payments** | Paddle webhooks + plan upgrade | ❌ TODO |
| **Emails** | Resend transactional (welcome, validation result, etc.) | ❌ TODO |

---

## 3. Tech stack

| Layer | Tech | Notes |
|-------|------|-------|
| Framework | **Next.js 16.2.4** (App Router) | ⚠️ See `AGENTS.md` — APIs differ from Next 15 |
| Language | TypeScript 5 | |
| Styling | Tailwind CSS v4 (`@tailwindcss/postcss`) | |
| Components | shadcn/ui on top of **Base UI** (`@base-ui/react`) | **Not Radix** — never use `asChild` |
| Charts | Recharts 3.x | |
| Toasts | Sonner | |
| Database | Supabase Postgres + RLS | Project ref `ndflytgtduuvacjmdobc` |
| Auth | Supabase Auth (email + Google + LinkedIn `linkedin_oidc`) | |
| Storage | Supabase Storage — buckets `avatars` (2MB), `submissions` (5MB) | |
| AI | Anthropic SDK — `claude-sonnet-4-6` | Used for challenge generation + submission vision validation |
| Emails | Resend (configured, not used yet) | `RESEND_API_KEY` env |
| Payments | Paddle (planned) | Not wired |
| Hosting | Vercel | Auto-deploy on push to `main` |
| Cron | Vercel Crons (`vercel.json`) | 3 jobs: reveal, inactivity, streak-reset |
| DB DDL | Supabase Management API | PAT bearer — endpoint `/v1/projects/{ref}/database/query` (no Supabase CLI) |

**Key dependencies** (`package.json` excerpt):
```json
"next": "16.2.4",
"@supabase/ssr": "^0.x",
"@supabase/supabase-js": "^2.x",
"@anthropic-ai/sdk": "^0.x",
"@base-ui/react": "^1.x",
"recharts": "^3.8.1",
"sonner": "^2.0.7",
"tailwindcss": "^4",
"lucide-react": "...",
"resend": "..."
```

---

## 4. Repository structure

```
kreevo/
├── docs/
│   └── PLATFORM.md          ← this file
├── public/                  ← static assets
├── scripts/
│   ├── seed-challenges.ts   ← 32 challenges seed
│   └── migrate-leagues.ts   ← legacy migration (executed)
├── src/
│   ├── app/
│   │   ├── layout.tsx              ← root, force-dynamic, design tokens injection
│   │   ├── page.tsx                ← landing
│   │   ├── (auth)/                 ← /login, /signup
│   │   ├── (onboarding)/onboarding/  ← 7-step flow
│   │   ├── (dashboard)/dashboard/  ← user dashboard + challenges + profile + settings
│   │   ├── (admin)/admin/          ← admin panel (gated by profile.role='admin')
│   │   ├── (public)/               ← /u/[username] public profile
│   │   ├── api/                    ← 38 route handlers
│   │   └── auth/callback/route.ts  ← OAuth callback
│   ├── components/
│   │   ├── ui/                     ← shadcn primitives (Base UI)
│   │   ├── layout/                 ← FloatingNav, DashboardNav
│   │   ├── admin/                  ← admin-specific components
│   │   ├── dashboard/              ← v3 cards (Hero, Stats, League, etc.)
│   │   ├── features/
│   │   │   ├── challenge/          ← Submit, Participate, Lightbox, Gallery, …
│   │   │   ├── league/             ← LeagueIcon
│   │   │   ├── submissions/        ← CommentSection, ReviewModal, CommentCard
│   │   │   └── dashboard/          ← legacy v1/v2 (HeroProfile, GettingStarted, …)
│   │   └── onboarding/             ← Step1-7 + countries + socials + types
│   ├── lib/
│   │   ├── anthropic/client.ts
│   │   ├── supabase/
│   │   │   ├── server.ts           ← createClient (SSR + cookies)
│   │   │   ├── admin.ts            ← supabaseAdmin (service role, bypass RLS)
│   │   │   ├── client.ts           ← browser client
│   │   │   └── middleware.ts       ← gate / redirect logic
│   │   ├── utils/
│   │   │   ├── leagues.ts          ← getLeagueThreshold, checkAndUpdateLeague
│   │   │   ├── league-style.ts     ← per-tier colors / emoji / accent
│   │   │   ├── streaks.ts          ← updateStreak()
│   │   │   ├── submissions.ts      ← validate / approve / reject helpers
│   │   │   ├── notifications.ts    ← notify, notifyAllAdmins
│   │   │   ├── badges.ts           ← BADGE_DEFINITIONS, awardBadge
│   │   │   ├── xp.ts               ← XP_REWARDS, leagueLabel, leagueColor
│   │   │   └── design-tokens.ts    ← buildDesignCSS, normalizeTokens
│   │   └── design-tokens.server.ts ← getDesignTokens() (fetched, no cache)
│   ├── proxy.ts                    ← Next.js 16 middleware (replaces middleware.ts)
│   └── types/database.types.ts     ← Generated Supabase types
├── vercel.json                     ← cron schedule
└── AGENTS.md                       ← reminders for AI agents (Next 16 caveats)
```

### 4.1 Route groups

- `(auth)` — `/login`, `/signup` (no nav)
- `(onboarding)` — `/onboarding` (custom layout, dedicated header with logo + progress bar + sign-in)
- `(dashboard)` — protected, `FloatingNav` rendered + `<Toaster>`
- `(admin)` — protected by `profile.role='admin'`, `<AdminSidebar>`
- `(public)` — `/u/[username]` (public)

### 4.2 Routing model — Next.js 16

- Middleware lives at `src/proxy.ts` (NOT `middleware.ts`). Required by Next 16.
- Server Components by default, `'use client'` only when needed (forms, modals, charts).
- Server Actions in `actions.ts` files (`'use server'`) — used for `submitChallenge`.
- API route handlers under `src/app/api/.../route.ts`.

---

## 5. Database schema

All tables in Supabase project `ndflytgtduuvacjmdobc`. Schema documented from `src/types/database.types.ts`.

### 5.1 `profiles`
```
id              UUID PK (FK auth.users)
username        TEXT UNIQUE
full_name       TEXT
first_name      TEXT
last_name       TEXT
avatar_url      TEXT
bio             TEXT (160 chars enforced UI side)
country         TEXT
city            TEXT
specialty       TEXT
experience_level TEXT (entry/junior/senior)
objective       TEXT (legacy, single)
objectives      TEXT[]
tools           TEXT[]
links           JSONB ({behance, dribbble, linkedin, …})
behance_url     TEXT (legacy compat)
linkedin_url    TEXT (legacy compat)
plan            free | pro | studio
xp              INTEGER
league          TEXT NOT NULL DEFAULT '7ajra'  ← see legacy alias note
role            user | admin
is_suspended    BOOLEAN
notification_prefs JSONB
referral_code   TEXT UNIQUE (8 chars hex)
referred_by     UUID FK profiles
onboarding_completed BOOLEAN DEFAULT false
created_at, updated_at
```

CHECK constraint on `league` allows `7ajra | Bronze | Silver | Gold | Platinum | Diamond | Master | Legend`.

### 5.2 `leagues`
```
id, name, icon, color, order_index, min_challenges,
xp_threshold_percent (NOT NULL DEFAULT 60, CHECK 0-100),
access ('all' | 'pro_only'), is_active, specialty
```

8 rows seeded. Stone is officially named `Stone` in `leagues.name` even though `profiles.league` keeps the legacy `7ajra` value.

### 5.3 `challenges`
```
id, title, brief, context, deliverable, constraints, criteria,
xp_reward, deadline_days,
league_id FK leagues,
specialty, challenge_type, industry,
is_published, created_by, created_at
```

Legacy columns dropped 2026-04-25: `month, year, track, difficulty, status, reveal_at, closes_at, level`.

### 5.4 `participations`
```
id, challenge_id FK, user_id FK,
joined_at, personal_deadline (= joined_at + deadline_days),
status (active | submitted | expired)
UNIQUE(challenge_id, user_id)
```

RLS restrictive — public reads of others' participations require `supabaseAdmin`.

### 5.5 `submissions`
```
id, challenge_id, user_id, participation_id,
cover_url, title, description, files JSONB,
attempt_number, is_visible, is_draft DEFAULT false,
xp_earned, likes_count, comments_count,
total_claps INTEGER DEFAULT 0,
validation_status (pending | approved | rejected | on_hold) DEFAULT 'pending',
xp_attributed BOOLEAN DEFAULT false,
rejection_reason TEXT,
reports_count INTEGER DEFAULT 0,
reported_at, validated_at, validated_by FK profiles,
is_reported, created_at, updated_at
```

`files` JSONB shape:
```json
{ "figma": "...", "link": "...", "images": ["..."], "collaborators": ["uuid"] }
```

### 5.6 `submission_contests`
```
id, submission_id (FK CASCADE), user_id, message,
status (pending | approved | rejected),
admin_response, created_at, resolved_at, resolved_by
```

### 5.7 `submission_reports`
```
id, submission_id (FK CASCADE), user_id, reason, created_at
UNIQUE(submission_id, user_id)
```

### 5.8 `comments` & related
```
comments: id, submission_id, user_id, content, title,
          parent_id (1-level nesting), claps_given, likes_count,
          rating (legacy 1-5), is_reported, created_at

comment_likes: id, comment_id, user_id, UNIQUE(comment_id, user_id)
submission_claps: id, submission_id, user_id, claps_count (≤10), UNIQUE
```

### 5.9 `streaks`
```
id, user_id (UNIQUE FK profiles),
current_streak, longest_streak,
last_activity_date DATE,
created_at, updated_at
```

Triggered by `updateStreak()` in `src/lib/utils/streaks.ts`, called from:
- `POST /api/participations` (after insert)
- `submitChallenge` server action (after publish, not on draft)
- `POST /api/submissions/[id]/comments` (after insert)

Reset to 0 by cron `/api/cron/streak-reset` if `last_activity_date < yesterday`.

### 5.10 `referrals`
```
id, referrer_id FK, referred_id FK,
status TEXT DEFAULT 'pending',
xp_awarded BOOLEAN DEFAULT false,
created_at
```

⚠️ Capture flow on signup not implemented yet. Only the code generation + UI is done.

### 5.11 `notifications`
```
id, user_id, type, data JSONB, is_read, created_at
```

Types: `joined_challenge`, `submission_received`, `submission_approved`, `submission_rejected`, `submission_on_hold`, `submission_pending_review`, `submission_reported`, `submission_contested`, `contest_approved`, `contest_rejected`, `report_dismissed`, `report_confirmed`, `participation_cancelled`.

### 5.12 Other
- `random_briefs` — legacy table, code removed but table not dropped (decide before dropping).
- `settings` — k/v table for design tokens, XP rewards, thresholds, attempts.

### 5.13 Storage buckets
- `avatars` — public, 2MB max
- `submissions` — public, 5MB max

---

## 6. Key subsystems

### 6.1 Onboarding (`/onboarding`)

7 steps, state machine in `src/app/(onboarding)/onboarding/page.tsx`:

1. Basic info (first / last name)
2. Specialty (UX/UI vs Graphic) + experience level (Entry / Junior / Senior)
3. Tools (filtered by specialty, ~35 tools each — searchable dropdown + chips)
4. Goals (multi-select: getting_hired, improving_skills)
5. Social links (suggested by specialty + custom platform support)
6. Photo (drag/drop, compressed to ≤1200px JPEG q≤0.85)
7. Country (MENA suggested + ALL_COUNTRIES dropdown)

Each step: `PATCH /api/profile` → DB updated → next step. Final step sets `onboarding_completed = true`.

OAuth callback (`src/app/auth/callback/route.ts`) pre-fills first/last name, avatar, LinkedIn URL from `user_metadata`.

Gate middleware (`src/lib/supabase/middleware.ts`):
- `/dashboard*` not authed → `/login`
- `/dashboard*` + `onboarding_completed=false` → `/onboarding`
- `/onboarding` + `onboarding_completed=true` → `/dashboard`

### 6.2 League progression

```ts
// src/lib/utils/leagues.ts

getLeagueThreshold(leagueId)
  → Σ challenges.xp_reward (is_published=true) × leagues.xp_threshold_percent / 100

checkAndUpdateLeague(userId)
  → If user.xp ≥ threshold AND completedInLeague ≥ min_challenges
     → promote to next league + notify

demoteLeague(userId)
  → Called by cron /api/cron/inactivity
  → If inactive 14 days → demote one tier
```

`xp_threshold_percent` is configurable per league via `/admin/leagues/[id]` (input 0-100, step 5).

### 6.3 Submission validation flow

`src/components/features/challenge/actions.ts` — `submitChallenge` server action:

1. Insert/update `submissions` row (idempotent by challenge+user)
2. If draft → return early (no XP, no status change)
3. Update participation status `submitted`
4. Apply AI verdict from client OR run server-side validation flow
5. `triggerValidationFlow(submissionId)` decides:

```ts
// src/lib/utils/submissions.ts

shouldAutoValidate(leagueName: string): boolean
  → true iff Stone | 7ajra | Bronze | Silver

If auto-validate:
  validateSubmissionWithAI(submission, challenge)
    → Anthropic claude-sonnet-4-6 with cover URL + brief prompt
    → returns { valid, reason? }
  If valid → approveSubmission(id) — set status, attribute XP, checkAndUpdateLeague
  Else → rejectSubmission(id, reason) — open 24h contest window

Else (Gold+):
  → submission stays pending
  → notify user "submission_received" (48h SLA)
  → notify all admins "submission_pending_review"
```

### 6.4 Reports & contests

- **Reports** (community): 24h window after submission, 1 per user (UNIQUE), 3 reports → status `on_hold` + revoke XP. API: `POST /api/submissions/[id]/report`.
- **Contests** (user disputing reject): 24h window after `validated_at`, 1 max per submission. API: `POST /api/submissions/[id]/contest`.
- **Admin resolution**:
  - `PATCH /api/admin/submissions/[id]/validate` body `{action, feedback?}`
  - `PATCH /api/admin/submissions/[id]/resolve-report` body `{action, feedback?}`
  - `PATCH /api/admin/contests/[id]/resolve` body `{action, response}`

### 6.5 Reviews & claps

- 1 review = title (≤80 chars) + content (10–500 chars) + claps (1–10 stars).
- Each user has a pool of 10 claps **per submission** — splittable across multiple reviews/replies.
- Total claps on a submission = sum of `claps_given` on top-level comments (replies = 0 claps).
- Free plan limited to 5 reviews/day.
- Replies are 1-level deep (force `parent_id = parent.parent_id ?? parentId`).
- `submissions.total_claps` denormalized for leaderboard sorting.

### 6.6 Streaks

Daily activity counter. Bump conditions:
- Submit a participation
- Publish a submission
- Post a comment

If `last_activity_date === today` → no-op. Else if `last_activity_date === yesterday` → `current_streak += 1`. Else → `current_streak = 1`. Always update `longest_streak = max(current, longest)`.

Cron `/api/cron/streak-reset` (1h UTC daily): set `current_streak = 0` for users where `last_activity_date < yesterday` AND `current_streak > 0`. Auth: `Authorization: Bearer ${CRON_SECRET}`.

---

## 7. APIs (38 route handlers)

### 7.1 User APIs
- `GET /api/me/profile` — current user profile (used by onboarding for OAuth pre-fill)
- `PATCH /api/profile` — update profile, accepts ~17 fields, recomposes `full_name` from first/last
- `GET /api/users/search?q=` — collaborator autocomplete (by username/full_name, debounced 250ms client-side)

### 7.2 Challenges & participations
- `POST /api/participations` body `{challenge_id}` — join (5 access checks: auth, published, plan, league, no active participation, not already participated)
- `DELETE /api/participations?challenge_id=` — cancel + refund 50 XP (only if not submitted)
- `GET /api/participations` — list user participations

### 7.3 Submissions (server action + community APIs)
- Submit: server action `submitChallenge` (no REST endpoint)
- `POST /api/submissions/[id]/clap` body `{count}`
- `GET/POST /api/submissions/[id]/comments` body `{title, content, claps}`
- `DELETE /api/comments/[id]` (refund claps + decrement counts)
- `POST /api/comments/[id]/replies`
- `POST /api/comments/[id]/like`
- `POST /api/comments/[id]/report`
- `POST /api/submissions/[id]/contest` body `{message}`
- `GET/POST /api/submissions/[id]/report` body `{reason}`

### 7.4 XP & notifications
- `POST /api/xp` body `{action}` — apply XP_REWARDS delta
- `GET /api/notifications` — list with pagination

### 7.5 Admin APIs (gated by `profile.role='admin'`)
- `GET/POST /api/admin/challenges` — CRUD
- `GET/PATCH/DELETE /api/admin/challenges/[id]`
- `POST /api/admin/challenges/generate` — AI-generate brief from `{specialty, type, industry, league, deadline}` (Claude sonnet 4.6, returns structured JSON)
- `POST /api/admin/challenges/[id]/reveal` — toggle `is_published`
- `GET/POST /api/admin/leagues`
- `GET/PATCH/DELETE /api/admin/leagues/[id]`
- `GET /api/admin/leagues/[id]/stats`
- `PATCH /api/admin/submissions/[id]/validate` body `{action: 'approve'|'reject', feedback?}` (feedback required on reject)
- `PATCH /api/admin/submissions/[id]/resolve-report` body `{action, feedback?}`
- `PATCH /api/admin/contests/[id]/resolve` body `{action, response}` (response required on reject)
- `GET /api/admin/users` + `GET/PATCH /api/admin/users/[id]`
- `GET/POST /api/admin/design` — design tokens CRUD
- `GET /api/admin/feedbacks` + `[id]`
- `GET/PATCH /api/admin/moderation` + `[id]`
- `GET/PATCH /api/admin/settings`
- `GET/POST /api/admin/emails`

### 7.6 Cron jobs (Vercel)

```json
// vercel.json
{
  "crons": [
    { "path": "/api/cron/reveal",        "schedule": "0 0 * * *" },
    { "path": "/api/cron/inactivity",    "schedule": "0 2 * * *" },
    { "path": "/api/cron/streak-reset",  "schedule": "0 1 * * *" }
  ]
}
```

- `reveal` (00h UTC): publish scheduled challenges (legacy `reveal_at` removed but route kept).
- `inactivity` (02h UTC): expire participations past deadline + demote inactive users' leagues.
- `streak-reset` (01h UTC): reset `streaks.current_streak` to 0 if user missed a day.

All cron routes check `Authorization: Bearer ${CRON_SECRET}`.

### 7.7 AI route
- `POST /api/ai/validate-submission` body `{submissionId}` — manual trigger of AI validation (used by client during upload to get verdict before submit, so the form can show the right success/reject UI immediately).

---

## 8. Admin panel (`/admin`)

Gated by `profile.role='admin'`. Sidebar nav:

- **Dashboard** — KPIs + recent submissions
- **Challenges** — list + create (4-step ChallengeForm: Specialty → Type → Industry → Details + AI-generate button)
- **Leagues** — CRUD with `xp_threshold_percent` slider
- **Submissions** — tabs: all / pending / reported / rejected / contested. Detail page has `<AdminSubmissionActions>` (textarea + approve/reject/resolve buttons).
- **Users** — plan, league, XP, suspend, admin role, delete
- **Settings** — XP rewards, league thresholds, attempts (free/pro), maintenance mode
- **Design** (`/admin`) — design tokens editor (colors, radius per component, font)
- **Emails** — Resend dashboard / templates (planned)
- **Moderation** — comment / submission moderation queue
- **Feedbacks** — user feedback inbox

---

## 9. Design system

### 9.1 Tokens (CSS variables)

Defined in `src/app/globals.css`:

```css
--radius:          0.5rem
--radius-sm:       calc(var(--radius) * 0.6)   ← 0.3rem
--radius-md:       calc(var(--radius) * 0.8)   ← 0.4rem
--radius-lg:       var(--radius)               ← 0.5rem (8px)
--radius-xl:       calc(var(--radius) * 1.4)   ← 0.7rem
--radius-2xl:      calc(var(--radius) * 1.8)   ← 0.9rem

--radius-button:   9999px      ← pill
--radius-card:     0.75rem
--radius-input:    0.5rem
--radius-badge:    9999px
--radius-popover:  0.75rem
```

Dashboard cards currently use `rounded-[24px]` arbitrary value (the project's `--radius-lg` = 8px doesn't match the desired 24px corner).

### 9.2 Components

- **shadcn/ui on Base UI** — never use `asChild` (Base UI doesn't support it). Forms, dialogs, sheets, tabs, dropdowns all use Base UI primitives.
- **Custom**: `<LeagueIcon>` (handles emoji / URL / data URL / SVG src), `<ProBadge>`, `<AvatarUpload>`, `<ImageLightbox>`, `<SocialLogo>` (Simple Icons SVG paths).

### 9.3 Theming

- Three modes: light / dark / system (toggle in `<FloatingNav>` avatar dropdown).
- Class-based dark via `.dark` on `<html>`.
- Anti-FOUC script in `<head>` of root layout reads localStorage before hydration.
- Dark background: `#141516`.

### 9.4 League visual identity

Centralized in `src/lib/utils/league-style.ts`:

```ts
LEAGUE_STYLES: Record<string, LeagueStyle> = {
  Stone:    { bg light #FEF3C6 / dark #322801, accent amber-500, … },
  Bronze:   { bg light #FDECD5 / dark #311D02, accent orange-500, … },
  Silver:   { bg light #F0F0F5 / dark #14141F, accent slate-500, … },
  Gold:     { bg light #FEF7DC / dark #322802, accent yellow-500, … },
  Platinum: { bg light #EFF6FF / dark #001D33, accent sky-500, … },
  Diamond:  { bg light #ECFEFF / dark #003033, accent cyan-500, … },
  Master:   { bg light #F5F0FF / dark #110033, accent violet-500, … },
  Legend:   { bg light #FFF1F2 / dark #330003, accent rose-500, … },
}

getLeagueStyle(name): LeagueStyle  // fallback Stone, alias '7ajra' → Stone
ALL_LEAGUE_STYLES: LeagueStyle[]
```

Dark backgrounds = same hue/saturation as light, lightness reduced to 10%. Reference page `/dashboard/leagues-preview` shows all 8 cards.

### 9.5 Typography

- **Font**: Plus Jakarta Sans (variable CSS `--font-space-grotesk` — name kept for compat after Space Mono was removed). `font-mono` is rebound to Plus Jakarta Sans.

### 9.6 Card spec (current)

All dashboard cards: `rounded-[24px] p-4` (16px padding, 24px radius). Inner pills/rows: `rounded-lg` (8px).

---

## 10. Security & RLS

### 10.1 RLS posture

- `participations` is restrictive — `supabaseAdmin` (service role, no cookies) is used to read others' participations for stats / leaderboards / suggested challenges.
- `submissions` has `validation_status='approved' AND is_draft=false` filters in public queries.
- Storage buckets are public for direct rendering.

### 10.2 Authorization layers

1. **Middleware gate** (`src/proxy.ts` + `src/lib/supabase/middleware.ts`) — auth + onboarding redirect.
2. **Layout guard** — `(admin)/layout.tsx` redirects if `profile.role !== 'admin'`.
3. **Route handler check** — every API route checks `supabase.auth.getUser()` first.
4. **Server-side data filtering** — admin queries via `supabaseAdmin`, user queries via `supabase` with cookies.

### 10.3 Cron auth
- All cron routes validate `Authorization: Bearer ${CRON_SECRET}` (Vercel injects this header).

### 10.4 Known pitfalls

- `createAdminClient` from `@supabase/ssr` does **NOT** bypass RLS — it inherits the user session. Always use `supabaseAdmin` from `src/lib/supabase/admin.ts` (built with `createClient` from `@supabase/supabase-js` + service role key, no cookies).
- TypeScript `never` type on `.from('table')` chains → wrap in `(supabase as any)`.
- Cookies must be awaited in Server Components (Next 16): `const cookieStore = await cookies()`.

---

## 11. Deployment & ops

### 11.1 Vercel
- Project linked to GitHub `mrwnnx/kreevo`
- Auto-deploy on every push to `main`
- Preview deploy per PR
- Prod URL: <https://kreevo-tau.vercel.app>

### 11.2 Env vars (Vercel + `.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://ndflytgtduuvacjmdobc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000   # https://kreevo-tau.vercel.app in prod
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
CRON_SECRET=kreevo_cron_secret_2026
```

Supabase Management API (used for DDL — no Supabase CLI installed):
```bash
SUPABASE_PROJECT_REF=ndflytgtduuvacjmdobc
SUPABASE_ACCESS_TOKEN=sbp_...   # Personal Access Token
```

### 11.3 Local dev

```bash
git clone https://github.com/mrwnnx/kreevo.git
cd kreevo
npm install
cp .env.local.example .env.local   # fill in the keys above
npm run dev   # → http://localhost:3000
```

Run a one-off script with env loaded:
```bash
npx tsx --env-file=.env.local scripts/<name>.ts
```

### 11.4 DB migrations

No Supabase CLI. Apply DDL via Management API:
```bash
curl -X POST "https://api.supabase.com/v1/projects/ndflytgtduuvacjmdobc/database/query" \
  -H "Authorization: Bearer $SUPABASE_PAT" \
  -H "Content-Type: application/json" \
  -d '{"query": "ALTER TABLE … ADD COLUMN …;"}'
```

This is the standard, reproducible way. Consider replacing with a migrations folder + a runner script when the team grows.

### 11.5 Build & deploy

```bash
npm run build   # next build (force-dynamic on root layout)
git push        # → Vercel deploys
```

---

## 12. Conventions & pitfalls (read before shipping)

### 12.1 Conventions
- **Server-first**: render data on the server, hydrate only forms/interactive bits.
- **Always-dynamic**: root layout has `export const dynamic = 'force-dynamic'` because design tokens are fetched live.
- **Promise.all** all top-level data fetches in pages.
- **`supabaseAdmin`** for admin reads + RLS bypass; `createClient` (server.ts) with cookies for user-scoped reads.
- **Absolute imports**: `@/` maps to `src/`.
- **No `asChild`** anywhere (Base UI).
- **Inline status only** (Saving / Saved / Error) — never block the user with full-screen spinners on form auto-saves.
- **Keep CSS variables** for tokens. When 24px radius is needed and `rounded-lg` resolves to 8px, use `rounded-[24px]` arbitrary value rather than redefining the token.

### 12.2 Pitfalls / past incidents
- `seed-challenges.ts` must include `level: 'rookie'` and `closes_at` (legacy NOT NULL columns).
- Elementor PHP injection via API does not regenerate Elementor CSS — workaround: inline `<style>` then re-save in editor.
- AIOS firewall on production WP sites can block REST writes — disable temporarily, ship, re-enable. (Note: not relevant to Kreevo, but documented in `~/.claude/projects/-Users-macbook/memory/reference_wordpress_tricks.md` if needed for cross-project work.)
- Stone league is named `7ajra` historically in `profiles.league` column. `getLeagueStyle()` and `getLeagueLabel()` map `'7ajra'` → `'Stone'`. Use `'Stone'` in any new seed/write.

---

## 13. Roadmap / TODO

| Item | Priority | Notes |
|------|----------|-------|
| Paddle webhooks (subscription lifecycle) | High | Plan upgrade flow blocked |
| Resend transactional emails | Medium | Welcome / validation result / contest decision |
| Capture `?ref=` on signup + create `referrals` row + +50 XP on referred's first challenge complete | Medium | UI is done, backend is not |
| Fix `justSubmitted` HeroBanner state — currently `false` always | Low | Pass from query param after submit redirect |
| Replace Analytics hardcoded values: `betterThan` (68%), `TIME SPENT`, deltas | Low | Compute from real data |
| Connect LeagueSection countdown to a real season end date | Low | Currently fictional 2d 14h 11m 32s |
| Track filter on leaderboard | Low | UX/UI vs Graphic split |
| Featured work Pro gate on public profile | Low | Filter by `is_visible AND validation_status='approved'` |
| `POST /api/ai/feedback` (detailed AI feedback per submission) | Low | Currently AI just returns valid/invalid + reason |
| Drop legacy `random_briefs` table | Low | Code already removed |
| Replace Management API DDL with proper migrations folder | Low | When team > 1 dev |

---

## 14. Onboarding for a new dev

1. Read this document end-to-end.
2. Clone repo, set up `.env.local`, run `npm run dev`.
3. Sign up locally and walk through `/onboarding` — note the 7 steps and the gate behavior.
4. Sign in to admin (`UPDATE profiles SET role='admin' WHERE id=...` on your account).
5. Create a challenge via `/admin/challenges/new` — try the AI generation button.
6. Participate in the challenge as the user, submit a draft, then publish — observe the AI auto-validation flow (Stone league = auto-approved).
7. Check `/dashboard/leagues-preview` to see the visual identity of all 8 leagues.
8. Browse `src/lib/utils/` — `leagues.ts`, `submissions.ts`, `league-style.ts`, `streaks.ts`, `notifications.ts` are the brain of the platform.
9. When in doubt about Next.js 16 specifics, read the relevant guide in `node_modules/next/dist/docs/` (per `AGENTS.md`).

---

**Maintainer**: Marwen — <marwen@etikks.com>
**Repo**: <https://github.com/mrwnnx/kreevo>
**Production**: <https://kreevo-tau.vercel.app>
