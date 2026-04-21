# Kreevo — Architecture & Features

> Dernière mise à jour : 2026-04-21

---

## Stack technique

| Couche       | Technologie                                         |
|--------------|-----------------------------------------------------|
| Framework    | Next.js 16.2.4 (App Router)                        |
| Language     | TypeScript                                          |
| Styling      | Tailwind CSS v4                                     |
| Composants   | shadcn/ui — Base UI (jamais Radix, jamais `asChild`) |
| BDD          | Supabase (PostgreSQL + RLS + Storage)               |
| Auth         | Supabase Auth (email + Google + LinkedIn OAuth)     |
| Paiements    | Paddle (configuré mais webhooks à finaliser)        |
| Emails       | Resend                                              |
| IA           | Anthropic Claude (`claude-sonnet-4-6`)              |
| Déploiement  | Vercel — `kreevo-tau.vercel.app`                   |
| Repo         | `github.com/mrwnnx/kreevo`                         |

---

## Design System

### Typographie
- **Body / Display** : Plus Jakarta Sans (variable CSS `--font-space-grotesk`)
- **Mono** : Space Mono (variable CSS `--font-space-mono`)

### Couleurs (oklch)
| Token         | Valeur light                    | Valeur dark                      |
|---------------|---------------------------------|----------------------------------|
| `--primary`   | `oklch(0.12 0.008 265)` (noir)  | `oklch(0.58 0.22 275)` (violet)  |
| `--background`| `oklch(0.98 0.002 265)`         | `oklch(0.08 0.008 265)`          |
| `--foreground`| `oklch(0.12 0.008 265)`         | `oklch(0.96 0.004 265)`          |
| `--card`      | `oklch(1 0 0)`                  | `oklch(0.11 0.008 265)`          |
| `--border`    | `oklch(0.88 0.004 265)`         | `oklch(1 0 0 / 8%)`              |

### Leagues (couleurs sémantiques)
| League  | Light                            | Dark                             |
|---------|----------------------------------|----------------------------------|
| Rookie  | `oklch(0.45 0.02 60)` (brun)    | `oklch(0.65 0.02 60)`            |
| Rising  | `oklch(0.45 0.01 265)` (gris)   | `oklch(0.70 0.01 265)`           |
| Pro     | `oklch(0.55 0.16 85)` (or)      | `oklch(0.78 0.16 85)`            |
| Elite   | `oklch(0.45 0.18 240)` (bleu)   | `oklch(0.65 0.18 240)`           |
| Legend  | `oklch(0.50 0.22 15)` (rouge)   | `oklch(0.68 0.22 15)`            |

### Buttons (standardisés)
- Forme : `rounded-full` (pill) sur tous les boutons du platform
- Default : `h-9 px-4 gap-1.5 hover:opacity-85`
- Variants : `default` (noir), `outline`, `ghost`, `destructive`, `secondary`
- Tailles : `sm`, `default`, `lg`, `icon`, `icon-sm`, `icon-xs`, `xs`

### Spacing
- Grille 4px stricte (`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64px`)
- Tokens CSS : `--space-1` → `--space-16`

---

## Base de données (Supabase / PostgreSQL)

### Tables principales

| Table           | Description                                               |
|-----------------|-----------------------------------------------------------|
| `profiles`      | username, full_name, avatar_url, bio, country (ISO 2), specialty, plan, xp, league, streak, last_active |
| `challenges`    | title, brief, track, level, status, closes_at, opens_at, xp_reward, brief_url |
| `participations`| user_id, challenge_id, created_at                        |
| `submissions`   | user_id, challenge_id, title, description, image_url, status, score, ai_feedback |
| `random_briefs` | user_id, prompt, status, expires_at, submission_id       |
| `badges`        | user_id, type, awarded_at                                 |
| `likes`         | user_id, submission_id                                    |
| `comments`      | user_id, submission_id, content, created_at              |
| `feedbacks`     | submission_id, type, content, created_at                 |
| `notifications` | user_id, type, message, read, created_at                 |
| `settings`      | user_id, email_notifications, public_profile             |

### RLS
- Toutes les tables ont Row Level Security activé
- Profils publics lisibles par tous, modifiables uniquement par le propriétaire
- Submissions visibles selon statut `revealed` du challenge
- Admin bypass via service role key côté API routes

### Storage
- Bucket `avatars` : `avatars/{userId}/avatar.jpg`
- Bucket `submissions` : images de soumissions
- Bucket `challenges` : assets challenges (brief_url)

---

## Architecture fichiers

```
kreevo/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    ← Plus Jakarta Sans + Space Mono, metadata
│   │   ├── globals.css                   ← Tokens oklch, leagues, XP gradient, utilities
│   │   ├── page.tsx                      ← Landing page publique
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── callback/route.ts         ← OAuth callback Supabase
│   │   │
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                ← FloatingNav + auth guard
│   │   │   └── dashboard/
│   │   │       ├── page.tsx              ← HeroProfile + cards + challenges + activity
│   │   │       ├── design-system/
│   │   │       │   ├── page.tsx          ← Boutons preview (tous variants + states)
│   │   │       │   └── colors/page.tsx   ← Couleurs sémantiques + leagues + XP
│   │   │       ├── challenges/
│   │   │       │   ├── page.tsx          ← Cards subscription-style + tabs pill
│   │   │       │   └── [id]/page.tsx     ← Détail challenge + participation
│   │   │       ├── submissions/
│   │   │       │   └── [id]/page.tsx     ← 2 colonnes : image+description+comments / ProfilePanel
│   │   │       ├── brief/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── BriefClient.tsx
│   │   │       │   └── BriefWorkspaceClient.tsx
│   │   │       ├── profile/
│   │   │       │   ├── page.tsx
│   │   │       │   └── ProfileForm.tsx   ← AvatarUpload + country select ISO + bio
│   │   │       ├── leaderboard/page.tsx
│   │   │       ├── notifications/page.tsx
│   │   │       └── settings/page.tsx
│   │   │
│   │   ├── (admin)/
│   │   │   └── admin/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx              ← Dashboard stats admin
│   │   │       ├── challenges/           ← CRUD challenges
│   │   │       ├── users/page.tsx        ← Liste users + plan badges
│   │   │       ├── emails/page.tsx       ← Envoi emails Resend
│   │   │       └── settings/page.tsx
│   │   │
│   │   ├── (public)/
│   │   │   └── u/[username]/page.tsx     ← Profil public
│   │   │
│   │   └── api/
│   │       ├── ai/brief/route.ts         ← Génération brief Anthropic
│   │       ├── briefs/[id]/
│   │       │   ├── start/route.ts
│   │       │   └── submit/route.ts
│   │       ├── likes/route.ts
│   │       ├── comments/route.ts
│   │       ├── xp/route.ts
│   │       ├── participations/route.ts
│   │       ├── notifications/route.ts
│   │       ├── profile/route.ts
│   │       └── cron/
│   │           ├── reveal/route.ts       ← Révèle submissions après deadline
│   │           └── inactivity/route.ts   ← Reset streak inactifs
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   └── FloatingNav.tsx           ← Nav flottante bottom (mobile) / sidebar (desktop)
│   │   │
│   │   ├── ui/                           ← Base UI shadcn
│   │   │   ├── button.tsx                ← rounded-full, hover:opacity-85
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── sonner.tsx                ← Toast notifications
│   │   │   └── tooltip.tsx
│   │   │
│   │   ├── admin/
│   │   │   └── ...
│   │   │
│   │   └── features/
│   │       ├── challenge/
│   │       │   ├── LikeButton.tsx        ← Pill rounded-full, optimistic update
│   │       │   ├── SubmissionComments.tsx← Avatars round, input rounded-full
│   │       │   ├── ProfilePanel.tsx      ← Panel droit submission : profil + challenge card
│   │       │   ├── SubmitForm.tsx        ← Formulaire soumission avec upload
│   │       │   ├── CountdownTimer.tsx    ← Compte à rebours deadline
│   │       │   └── ParticipateButton.tsx
│   │       │
│   │       └── dashboard/
│   │           ├── HeroProfile.tsx       ← Banner profil : avatar ring ligue, drapeau, stats 2×2
│   │           ├── GettingStarted.tsx    ← Checklist 5 étapes onboarding
│   │           ├── StreakCard.tsx        ← 7 jours activité
│   │           ├── LeagueCard.tsx        ← Progression XP + gate Pro
│   │           └── AvatarUpload.tsx      ← Upload avatar canvas compress, toast, preview live
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                 ← Supabase browser client
│   │   │   └── server.ts                 ← Supabase server client (cookies)
│   │   ├── anthropic/
│   │   │   └── client.ts                 ← Anthropic SDK init
│   │   └── utils/
│   │       ├── xp.ts                     ← Calcul XP + niveaux
│   │       ├── leagues.ts                ← Mapping XP → league
│   │       ├── badges.ts                 ← 14 types de badges
│   │       └── utils.ts                  ← cn(), formatters
│   │
│   └── types/
│       └── database.types.ts             ← Types auto-générés Supabase
│
├── public/                               ← Assets statiques
├── package.json
├── tailwind.config.ts                    ← (vide, config dans globals.css @theme)
├── next.config.ts
└── tsconfig.json
```

---

## Features détaillées

### Auth
- Email + password (Supabase Auth)
- Google OAuth (provider configuré)
- LinkedIn OIDC OAuth (provider configuré)
- Callback route `/auth/callback`
- Middleware auth guard sur `(dashboard)` et `(admin)`

### Dashboard principal (`/dashboard`)
- **HeroProfile** : avatar 88px avec ring gradient de ligue, drapeau pays (ISO → emoji), nom + username, stats en 2×2 (XP Total, Challenges soumis, Ligue, Rang Top X%)
- **GettingStarted** : checklist 5 étapes (profil, brief, challenge, submit, streak)
- **StreakCard** : 7 derniers jours d'activité visuels
- **LeagueCard** : barre XP progression vers prochaine ligue + gate Pro

### AvatarUpload
- Rond 96px avec ring gradient couleur de ligue
- Hover overlay noir semi-transparent + icône upload
- Input file caché, déclenché au clic
- Compression canvas : max 400×400px, JPEG 0.85
- Upload Supabase Storage : `avatars/{userId}/avatar.jpg` (upsert)
- Cache-buster `?t=Date.now()` sur l'URL
- Preview immédiat via FileReader avant upload
- Toast auto-dismiss 3s : vert succès / rouge erreur

### Profil utilisateur (`/dashboard/profile`)
- Formulaire : nom, username, bio, spécialité
- **Country select** : 40+ pays avec codes ISO 2 lettres (stockés en BDD)
- Upload avatar via AvatarUpload
- Sauvegarde via API route `/api/profile`

### Random Brief Generator (`/dashboard/brief`)
- Génération via Anthropic Claude (`claude-sonnet-4-6`)
- 3 générations/mois pour plan Free, illimité Pro
- Formulaire : track, niveau, contraintes optionnelles
- Brief affiché dans workspace avec deadline 7 jours
- Soumission brief via `/api/briefs/[id]/submit`
- Statuts : `draft` → `active` → `submitted` / `expired`

### Challenges (`/dashboard/challenges`)
- **Cards subscription-style** :
  - Icône track dans bg coloré 48px (ux_ui=violet, graphic=orange, motion=pink, 3d=green, branding=yellow, web=blue)
  - Badge niveau coloré (rookie=green, rising=blue, pro=orange, elite=red, legend=purple)
  - Titre + description (2 lignes max)
  - Deadline (`X jours restants` / `Aujourd'hui` / `Terminé`)
  - Compteur participants
  - Bouton `Participer` / `Soumis ✓` / `Terminé`
  - Hover : border primary/40, translate-y-0.5, bouton fill
- **Tabs pill** : Actifs / Passés, active = `bg-foreground text-background`

### Détail submission (`/dashboard/submissions/[id]`)
- Layout 2 colonnes (`flex-col md:flex-row gap-4 items-start`)
- **Col gauche** :
  - Card image (header 60px gradient track + aspect-video image + footer avec titre/track/deadline)
  - Card description
  - SubmissionComments
- **Col droite** : ProfilePanel
  - Header gradient + avatar −22px overlap
  - Badge plan (noir = Pro, gris = Free) + XP
  - Ligue + Spécialité
  - Challenge card (titre, niveau, track, deadline, lien)

### LikeButton
- Style pill : `rounded-full border`
- État aimé : `bg-red-50 border-red-200 text-red-500`
- Optimistic update (toggle immédiat)

### SubmissionComments
- Avatars `rounded-full`
- Séparateurs `divide-y divide-border`
- Input `rounded-full px-4 py-2`
- Envoi par bouton ou Enter

### XP & Leagues
- Gain XP sur : soumission challenge, brief aléatoire, streak, badges
- Leagues : Rookie → Rising → Pro → Elite → Legend
- Gate Pro : certains challenges réservés au plan Pro
- Rang calculé : `COUNT(profiles WHERE xp > user.xp) + 1`
- Top X% affiché dans HeroProfile

### Badges (14 types)
- Exemples : first_submission, streak_7, streak_30, pro_upgrade, challenge_winner, etc.

### Admin (`/admin`)
- Dashboard stats globales
- CRUD challenges (titre, brief, track, level, dates, XP reward)
- Liste utilisateurs avec plans
- Envoi emails Resend (broadcast)
- Settings plateforme

### Profil public (`/u/[username]`)
- Avatar, bio, spécialité, ligue
- Liste soumissions publiques
- Badges affichés

### Cron jobs
- `cron/reveal` : révèle automatiquement les submissions après deadline challenge
- `cron/inactivity` : reset streak pour users inactifs

### Design System Preview
- `/dashboard/design-system` : tous les variants buttons + states (disabled, loading, full-width)
- `/dashboard/design-system/colors` : tous les tokens sémantiques + leagues + XP gradient + hiérarchie texte + effets

---

## Variables d'environnement

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SITE_URL=https://kreevo-tau.vercel.app
RESEND_API_KEY=
PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=
CRON_SECRET=
```

---

## Déploiement

- **Plateforme** : Vercel
- **URL prod** : `https://kreevo-tau.vercel.app`
- **Repo** : `github.com/mrwnnx/kreevo`
- **Branch prod** : `main`
- Deploy automatique sur push `main`
- Variables d'env configurées dans Vercel Dashboard

---

## Backlog / À faire

- [ ] Webhooks Paddle (subscription upgrade/downgrade)
- [ ] Emails transactionnels Resend (welcome, brief expiry, challenge reveal)
- [ ] Filter leaderboard par track
- [ ] Scoring / classement par challenge
- [ ] Amélioration profil public (grid soumissions, stats)
- [ ] Route API `ai/feedback` — feedback IA sur soumission
- [ ] Route API `admin/challenges/generate` — génération challenge par IA
- [ ] Notifications temps réel (Supabase Realtime)
- [ ] Mode dark (tokens déjà en place dans globals.css)

---

## Notes techniques importantes

- `(supabase as any)` nécessaire pour certaines tables TypeScript retournant `never`
- `countryFlag(code)` : convertit ISO 2 lettres → emoji drapeau via `String.fromCodePoint(0x1F1E6 - 65 + charCode)`
- `--font-space-grotesk` est la variable CSS utilisée pour Plus Jakarta Sans (nommage legacy conservé pour éviter de toucher tous les fichiers)
- Canvas compression avatar : `canvas.toBlob('image/jpeg', 0.85)` après resize à 400×400
- Rang calculé en 2 phases : d'abord charger le profil, puis faire la requête `COUNT WHERE xp > user.xp`
- Toutes les pages dashboard sont des Server Components qui passent les données aux Client Components
- RLS Supabase actif sur toutes les tables — les API routes utilisent le `service_role` key pour bypass admin
