-- Seed: 18 help articles (3 per category × 6 categories)
-- Idempotent via ON CONFLICT (slug)

INSERT INTO help_articles (slug, category, title_fr, title_en, excerpt_fr, excerpt_en, content_fr, content_en, order_index) VALUES

-- ════════════════════════════════════════════════
-- CATEGORY: getting-started
-- ════════════════════════════════════════════════

('create-account', 'getting-started',
 'Comment créer un compte sur Kreevo',
 'How to create a Kreevo account',
 'Inscris-toi en 30 secondes via Google, LinkedIn ou email + mot de passe.',
 'Sign up in 30 seconds via Google, LinkedIn or email + password.',
 $md$
## Inscription en 30 secondes

Tu as deux options pour créer ton compte :

1. **Google ou LinkedIn** — Clique sur "Continuer avec Google" ou "LinkedIn" sur la page d'inscription. C'est le plus rapide : ton avatar et ton nom complet sont récupérés automatiquement.
2. **Email + mot de passe** — Saisis ton email, choisis un mot de passe d'au moins 8 caractères, valide. Tu recevras un lien de confirmation à activer dans les 24h.

> 💡 On recommande Google ou LinkedIn pour gagner du temps sur le pré-remplissage.

## L'onboarding en 7 étapes

Après inscription, tu passes par un parcours court qui configure ton profil designer :

1. **Nom complet** et **username** (ton URL publique sera `kreevo.io/u/{username}`)
2. **Spécialité** — UX/UI Designer ou Graphic Designer + niveau (Entry, Junior, Senior)
3. **Outils** que tu utilises (Figma, Photoshop, Illustrator, etc.)
4. **Objectifs** — Getting hired ou Improving skills
5. **Réseaux sociaux** (Behance, Dribbble, LinkedIn, etc.)
6. **Photo de profil** (skippable, modifiable plus tard)
7. **Pays**

Tout est modifiable plus tard depuis `/dashboard/profile`.

## Si tu ne reçois pas l'email de confirmation

Vérifie tes spams. Sinon écris-nous via la page [Contact](/help/contact).
$md$,
 $md$
## Sign up in 30 seconds

Two options to create your account:

1. **Google or LinkedIn** — Click "Continue with Google" or "LinkedIn" on the signup page. Fastest option: your avatar and full name are auto-filled.
2. **Email + password** — Enter your email, pick a password of at least 8 characters, validate. You'll receive a confirmation link valid for 24 hours.

> 💡 We recommend Google or LinkedIn to skip manual entry.

## The 7-step onboarding

After signup, a short flow configures your designer profile:

1. **Full name** and **username** (your public URL will be `kreevo.io/u/{username}`)
2. **Specialty** — UX/UI Designer or Graphic Designer + level (Entry, Junior, Senior)
3. **Tools** you use (Figma, Photoshop, Illustrator, etc.)
4. **Goals** — Getting hired or Improving skills
5. **Social links** (Behance, Dribbble, LinkedIn, etc.)
6. **Profile picture** (skippable, editable later)
7. **Country**

All editable later from `/dashboard/profile`.

## Not receiving the confirmation email?

Check your spam folder. Otherwise reach out via the [Contact](/help/contact) page.
$md$,
 1),

('configure-profile', 'getting-started',
 'Configurer ton profil designer',
 'Configure your designer profile',
 'Bio, spécialité, outils, réseaux sociaux : remplis ton profil pour le présenter aux clients et au leaderboard.',
 'Bio, specialty, tools, socials: fill your profile to showcase your work to clients and on the leaderboard.',
 $md$
## Pourquoi remplir ton profil

Ton profil sert à 2 choses :
- **Te présenter** dans le leaderboard et la galerie des soumissions
- **Construire ton portfolio public** sur `kreevo.io/u/{username}` que tu peux partager aux recruteurs

Plus ton profil est complet, plus tes soumissions sont visibles et crédibles.

## Les champs à remplir

Va dans `/dashboard/profile` :

- **Avatar** — drag & drop, compression auto à 1200px
- **Nom complet** + **username** (l'URL publique)
- **Bio** (160 caractères max)
- **Pays** + **ville**
- **Spécialité** (UX/UI ou Graphic) + niveau (Entry/Junior/Senior)
- **Outils** (multi-select Figma, Sketch, etc.)
- **Objectifs** (Getting hired / Improving skills)
- **Liens sociaux** (Behance, Dribbble, LinkedIn, GitHub, etc.)

## Auto-save

Toutes tes modifications sont sauvegardées automatiquement (debounce 700ms). Tu vois "Saving…" puis "✓ Saved" en haut de la page.

## Pré-rempli depuis l'OAuth

Si tu t'es inscrit via Google ou LinkedIn, ton avatar, nom et URL LinkedIn sont déjà renseignés.
$md$,
 $md$
## Why fill out your profile

Your profile serves two purposes:
- **Introduce yourself** in the leaderboard and submissions gallery
- **Build your public portfolio** at `kreevo.io/u/{username}` that you can share with recruiters

The more complete, the more credible and visible your submissions.

## Fields to fill

Go to `/dashboard/profile`:

- **Avatar** — drag & drop, auto-compressed to 1200px
- **Full name** + **username** (public URL)
- **Bio** (160 chars max)
- **Country** + **city**
- **Specialty** (UX/UI or Graphic) + level (Entry/Junior/Senior)
- **Tools** (multi-select Figma, Sketch, etc.)
- **Goals** (Getting hired / Improving skills)
- **Social links** (Behance, Dribbble, LinkedIn, GitHub, etc.)

## Auto-save

All your edits are saved automatically (700ms debounce). You'll see "Saving…" then "✓ Saved" at the top.

## OAuth pre-fill

If you signed up via Google or LinkedIn, your avatar, name, and LinkedIn URL are already filled in.
$md$,
 2),

('understand-leagues', 'getting-started',
 'Comprendre le système de leagues',
 'Understanding the league system',
 'Stone, Bronze, Silver, Gold, Platinum, Diamond, Master, Legend : 8 niveaux de progression XP-driven.',
 'Stone, Bronze, Silver, Gold, Platinum, Diamond, Master, Legend: 8 XP-driven progression tiers.',
 $md$
## Les 8 ligues

Kreevo a 8 ligues, du débutant au top mondial :

| # | Ligue | Accès |
|---|-------|-------|
| 1 | Stone 🪨 | Tous |
| 2 | Bronze 🟤 | Tous |
| 3 | Silver ⚪ | Pro uniquement |
| 4 | Gold 🟡 | Pro uniquement |
| 5 | Platinum 🔵 | Pro uniquement |
| 6 | Diamond 💎 | Pro uniquement |
| 7 | Master 👑 | Pro uniquement |
| 8 | Legend 🔴 | Pro uniquement |

Tu démarres en **Stone**. Pour monter, il faut atteindre 2 conditions :

1. **Seuil XP** — un % du total des XP disponibles dans tes challenges de ligue (configuré par l'admin, ex: 60%)
2. **Nombre minimum de challenges** complétés dans la ligue (par défaut : 3)

## Comment gagner de l'XP

- Soumettre un challenge approuvé = `xp_reward` du challenge (variable selon difficulté)
- Rejoindre un challenge = +50 XP
- Recevoir un like = +2 XP
- Recevoir un commentaire = +5 XP
- Donner un commentaire constructif = +10 XP

## Comment redescendre

Tu peux être rétrogradé d'une ligue dans 2 cas :
- **Inactivité 90 jours** sans soumission
- **Tier window failed** : si l'admin a configuré un délai pour ta ligue et que tu n'atteins pas le seuil dans ce délai (avec pénalité XP configurable)
$md$,
 $md$
## The 8 leagues

Kreevo has 8 leagues from beginner to world-class:

| # | League | Access |
|---|--------|--------|
| 1 | Stone 🪨 | Everyone |
| 2 | Bronze 🟤 | Everyone |
| 3 | Silver ⚪ | Pro only |
| 4 | Gold 🟡 | Pro only |
| 5 | Platinum 🔵 | Pro only |
| 6 | Diamond 💎 | Pro only |
| 7 | Master 👑 | Pro only |
| 8 | Legend 🔴 | Pro only |

You start in **Stone**. To level up, you need to meet 2 conditions:

1. **XP threshold** — a % of total XP available in your league challenges (admin-configured, e.g. 60%)
2. **Minimum challenges completed** in the league (default: 3)

## How to earn XP

- Submit an approved challenge = challenge `xp_reward` (varies by difficulty)
- Join a challenge = +50 XP
- Receive a like = +2 XP
- Receive a comment = +5 XP
- Give a constructive comment = +10 XP

## How to be demoted

You can drop one league in two cases:
- **90 days inactivity** with no submissions
- **Tier window failed**: if admin set a deadline on your league and you don't reach the threshold in time (configurable XP penalty)
$md$,
 3),

-- ════════════════════════════════════════════════
-- CATEGORY: challenges
-- ════════════════════════════════════════════════

('how-challenges-work', 'challenges',
 'Comment fonctionnent les challenges',
 'How challenges work',
 'Choisis un challenge dans ta ligue, accepte la deadline personnelle, soumets ton travail avant la fin du chrono.',
 'Pick a challenge in your league, accept the personal deadline, submit your work before the timer ends.',
 $md$
## Le parcours challenge en 3 étapes

### 1. Découverte (mode preview)
Sur `/dashboard/challenges/[id]`, tu vois :
- Specialty, type et industry du défi
- Brief court, XP à gagner, deadline en jours
- Avatar des participants déjà inscrits

### 2. Participation
Clique **"Je participe →"**. Une dialog te confirme : "Tu es prêt ? — chrono de N jours démarre, brief complet débloqué".

Une fois accepté :
- Le **brief complet** se débloque (scénario, livrable attendu, contraintes, critères)
- Le **chrono démarre** : `joined_at + deadline_days` = ta deadline personnelle
- **Important** : tu ne peux participer qu'à **un seul challenge à la fois**

### 3. Soumission
Avant la deadline, tu soumets via `/dashboard/challenges/[id]/submit` (cf. article [Comment soumettre](/help/submissions/how-to-submit)).

## Filtre par ligue

Tu ne vois que les challenges de **ta ligue actuelle** ou des ligues **inférieures**. Les challenges des ligues supérieures sont locked tant que tu n'as pas été promu.

## Si tu rates la deadline

Pas de soumission avant ta deadline personnelle = **−50 XP** + status `expired`. Tu peux retenter le même challenge ou en choisir un nouveau.
$md$,
 $md$
## The challenge flow in 3 steps

### 1. Discovery (preview mode)
On `/dashboard/challenges/[id]`, you see:
- Specialty, type and industry
- Short brief, XP reward, deadline in days
- Avatars of participants already in

### 2. Participation
Click **"Je participe →"**. A dialog confirms: "Ready? — N-day timer starts, full brief unlocked".

Once you accept:
- The **full brief** unlocks (scenario, expected deliverable, constraints, criteria)
- **Timer starts**: `joined_at + deadline_days` = your personal deadline
- **Important**: you can only join **one challenge at a time**

### 3. Submission
Before the deadline, submit via `/dashboard/challenges/[id]/submit` (see [How to submit](/help/submissions/how-to-submit)).

## Filtered by league

You only see challenges from **your current league** or **lower leagues**. Higher-league challenges are locked until you're promoted.

## Missing the deadline

No submission before your personal deadline = **−50 XP** + `expired` status. You can retry the same challenge or pick a new one.
$md$,
 1),

('brief-generator', 'challenges',
 'Le générateur de briefs IA',
 'The AI brief generator',
 'Notre IA génère des briefs de challenge cohérents en combinant spécialité × type × industry.',
 'Our AI generates coherent challenge briefs by combining specialty × type × industry.',
 $md$
## Comment ça marche

Quand l'admin crée un nouveau challenge, il sélectionne 4 paramètres :

1. **Spécialité** — UX Designer / UI Designer / Graphic Designer
2. **Type de défi** — User Flow, UX Research, Wireframes, UI Screen, Logo, Brand Identity, Affiche, Packaging, etc. (filtré par spécialité)
3. **Industrie** — Fintech, E-commerce, SaaS, Santé, Mode, Crypto, Mobilité, etc. (25 options)
4. **Durée** — nombre de jours pour la deadline personnelle (1-365)

Ensuite, un clic sur **"Générer avec l'IA"** appelle Claude Sonnet pour rédiger un brief structuré :

- **Titre** clair et engageant
- **Brief court** (1-2 phrases)
- **Contexte / scénario** (situation réaliste, contraintes du marché)
- **Livrable attendu** (Figma frame, logo PNG, présentation, etc.)
- **Contraintes** (couleurs imposées, format, audience cible)
- **Critères d'évaluation** (lisibilité, hiérarchie, originalité)

## Pourquoi c'est fiable

Le prompt envoyé à Claude est structuré pour produire des briefs **réalistes** et **techniquement corrects**, calibrés sur le niveau de la ligue.

## Tu peux éditer

L'admin garde la main sur le résultat — il peut corriger n'importe quel champ avant de publier.
$md$,
 $md$
## How it works

When admin creates a new challenge, they pick 4 parameters:

1. **Specialty** — UX Designer / UI Designer / Graphic Designer
2. **Challenge type** — User Flow, UX Research, Wireframes, UI Screen, Logo, Brand Identity, Poster, Packaging, etc. (filtered by specialty)
3. **Industry** — Fintech, E-commerce, SaaS, Health, Fashion, Crypto, Mobility, etc. (25 options)
4. **Duration** — number of days for the personal deadline (1-365)

Then, clicking **"Generate with AI"** calls Claude Sonnet to write a structured brief:

- **Clear, engaging title**
- **Short brief** (1-2 sentences)
- **Context / scenario** (realistic situation, market constraints)
- **Expected deliverable** (Figma frame, logo PNG, presentation, etc.)
- **Constraints** (mandatory colors, format, target audience)
- **Evaluation criteria** (legibility, hierarchy, originality)

## Why it's reliable

The Claude prompt is engineered to produce **realistic** and **technically correct** briefs, calibrated to league level.

## Editable

Admin keeps full control — they can edit any field before publishing.
$md$,
 2),

('personal-deadline', 'challenges',
 'La deadline personnelle',
 'The personal deadline',
 'Chaque challenge a un nombre de jours fixé. Ton chrono démarre quand tu acceptes — pas avant.',
 'Each challenge has a set number of days. Your timer starts when you accept — not before.',
 $md$
## Comment elle se calcule

Quand tu rejoins un challenge, on enregistre `joined_at` (l'instant T) et le challenge a un `deadline_days` (par exemple 3 ou 7 jours).

**Ta deadline personnelle = `joined_at + deadline_days`**

Concrètement : si tu rejoins le mardi à 14h un challenge avec `deadline_days = 3`, tu as jusqu'au **vendredi 14h** pour soumettre.

## Pourquoi c'est personnel

Ce n'est PAS une date globale fixée par l'admin. Chaque participant a son propre chrono indépendant. Tu peux rejoindre un challenge n'importe quand sans rater une "fenêtre globale".

## Le countdown live

Sur la page du challenge en mode active, une sidebar à droite affiche un compteur live (jours, heures, minutes) qui décrémente en temps réel.

## Tu n'as qu'un challenge actif à la fois

Pour t'éviter de te disperser, tu ne peux avoir **qu'un seul challenge en cours** simultanément. Soumets ou rate-le pour pouvoir en rejoindre un autre.

## Si tu dépasses

Le cron quotidien (02:00 UTC) marque ta participation comme `expired` et te retire **−50 XP**. Tu peux re-rejoindre le même challenge ou en choisir un nouveau.
$md$,
 $md$
## How it's calculated

When you join a challenge, we record `joined_at` (timestamp) and the challenge has a `deadline_days` (e.g. 3 or 7 days).

**Your personal deadline = `joined_at + deadline_days`**

So: if you join Tuesday at 2 PM a challenge with `deadline_days = 3`, you have until **Friday 2 PM** to submit.

## Why it's personal

It's NOT a global date set by admin. Every participant has their own independent timer. You can join any challenge anytime without missing a "global window".

## Live countdown

On the active challenge page, a right sidebar shows a live counter (days, hours, minutes) decrementing in real time.

## One active challenge at a time

To prevent scattering, you can only have **one challenge active** at a time. Submit it or let it expire to join another.

## If you exceed

The daily cron (02:00 UTC) marks your participation as `expired` and deducts **−50 XP**. You can re-join the same challenge or pick a new one.
$md$,
 3),

-- ════════════════════════════════════════════════
-- CATEGORY: submissions
-- ════════════════════════════════════════════════

('how-to-submit', 'submissions',
 'Comment soumettre ton travail',
 'How to submit your work',
 'Cover obligatoire, jusqu''à 3 visuels supplémentaires, titre, description, collaborateurs : 2 étapes.',
 'Mandatory cover, up to 3 extra images, title, description, collaborators: 2 simple steps.',
 $md$
## Étape 1 — Visuels

Sur `/dashboard/challenges/[id]/submit`, en mode plein écran :

- **Cover** (obligatoire) — aspect 16/10, c'est l'image principale qui apparaît dans la galerie
- **Jusqu'à 3 visuels supplémentaires** (optionnels) — pour montrer des variantes, prototypes, détails
- Drag & drop ou click pour uploader

> 💡 La cover doit accrocher l'œil. Choisis ton meilleur shot.

## Étape 2 — Détails

- **Titre** (obligatoire pour publier)
- **Description** — explique ton process, tes choix, tes inspirations
- **Lien projet** — Figma, Behance, Dribbble (optionnel)
- **Collaborateurs** — recherche par username ou nom (optionnel)
- **Toggle "Afficher dans mon profil public"** — soumission visible sur ton portfolio

## Brouillon vs Publication

- **Save as draft** : enregistré, pas visible, pas d'XP, modifiable plus tard
- **Publier maintenant** : déclenche la validation IA (Stone/Bronze/Silver) ou admin (Gold+)

## Combien de tentatives

Free : 1 tentative par challenge. Pro : tentatives illimitées tant que la deadline n'est pas dépassée.
$md$,
 $md$
## Step 1 — Visuals

On `/dashboard/challenges/[id]/submit`, full-screen mode:

- **Cover** (required) — 16/10 aspect ratio, the main image shown in the gallery
- **Up to 3 extra images** (optional) — for variants, prototypes, details
- Drag & drop or click to upload

> 💡 The cover should grab attention. Pick your best shot.

## Step 2 — Details

- **Title** (required to publish)
- **Description** — explain your process, choices, inspirations
- **Project link** — Figma, Behance, Dribbble (optional)
- **Collaborators** — search by username or name (optional)
- **Toggle "Show on my public profile"** — submission visible on your portfolio

## Draft vs Publish

- **Save as draft**: stored, not visible, no XP, editable later
- **Publish now**: triggers AI validation (Stone/Bronze/Silver) or admin review (Gold+)

## How many attempts

Free: 1 attempt per challenge. Pro: unlimited attempts as long as the deadline isn't passed.
$md$,
 1),

('accepted-formats', 'submissions',
 'Formats et limites de fichiers',
 'Accepted file formats & limits',
 'Images JPEG/PNG/WebP, 5 Mo max par fichier, compression auto.',
 'JPEG/PNG/WebP images, 5MB max per file, auto-compression.',
 $md$
## Formats acceptés

Pour la cover et les images supplémentaires :

- **JPEG / JPG** ✅
- **PNG** ✅
- **WebP** ✅
- GIF, SVG, PDF, MP4 ❌ (pas supportés actuellement)

## Limites

- **Taille max** : 5 Mo par fichier
- **Dimensions recommandées** : 1920×1200 (cover 16/10), 1200×1200 (extras)
- **Compression auto** : si ton fichier dépasse, on compresse en JPEG côté navigateur (qualité 0.85 → 0.3) avant upload

## Stockage

Tes images sont stockées dans le bucket Supabase `submissions`, public en lecture, servies via CDN.

## Si l'upload échoue

Vérifie :
- Ta connexion internet
- Le format du fichier
- Que tu es bien connecté (la session peut expirer)

Si rien ne marche, contacte-nous via [Contact](/help/contact).

## Liens externes

Si ton projet est trop gros pour Kreevo (vidéo, prototype interactif), ajoute le **lien Figma / Behance / Dribbble** dans le champ "Lien projet" à l'étape 2 de la soumission.
$md$,
 $md$
## Accepted formats

For cover and extra images:

- **JPEG / JPG** ✅
- **PNG** ✅
- **WebP** ✅
- GIF, SVG, PDF, MP4 ❌ (not currently supported)

## Limits

- **Max size**: 5 MB per file
- **Recommended dimensions**: 1920×1200 (cover 16/10), 1200×1200 (extras)
- **Auto-compression**: if your file exceeds, we compress to JPEG client-side (quality 0.85 → 0.3) before upload

## Storage

Your images are stored in Supabase bucket `submissions`, public-read, served via CDN.

## If upload fails

Check:
- Your internet connection
- The file format
- That you're logged in (session may have expired)

If nothing works, contact us via [Contact](/help/contact).

## External links

If your project is too big for Kreevo (video, interactive prototype), add the **Figma / Behance / Dribbble link** in the "Project link" field at step 2 of submission.
$md$,
 2),

('scoring-system', 'submissions',
 'Le système de score et claps',
 'The scoring & claps system',
 'Validation IA ou admin, claps de la communauté (1-10 par user), score total visible sur ta soumission.',
 'AI or admin validation, community claps (1-10 per user), total score visible on your submission.',
 $md$
## Validation : 2 niveaux

### IA automatique (Stone, Bronze, Silver)
Notre IA Claude Sonnet (vision) analyse ta soumission contre les critères du challenge. En quelques secondes :
- ✅ **Approved** → tes XP sont attribués, ta soumission apparaît dans la galerie
- ❌ **Rejected** → raison expliquée, fenêtre de **contestation 24h** ouverte

### Validation admin (Gold et au-dessus)
Pour les ligues élevées, c'est un humain (Marwen) qui review en moins de 48h. Notification envoyée dès qu'une décision est prise.

## Les claps de la communauté

Chaque user peut donner **1 à 10 étoiles** par soumission. Tu peux splitter sur plusieurs reviews si tu veux. Le **total claps** apparaît sur ta soumission et booste sa visibilité.

> Plan Free limité à 5 reviews/jour. Pro : illimité.

## XP gagnés sur ta soumission

- **Like reçu** : +2 XP
- **Commentaire reçu** : +5 XP
- **Soumission validée** : `xp_reward` du challenge (variable)

## Reports communauté

Si 3 users signalent ta soumission dans les 24h, elle passe en `on_hold` et un admin review. C'est rare mais transparent.

## Contester un rejet

Si l'IA rejette à tort, tu as **24h** pour contester avec un message d'explication. Un admin tranche.
$md$,
 $md$
## Validation: 2 levels

### Auto AI (Stone, Bronze, Silver)
Our Claude Sonnet (vision) analyzes your submission against the challenge criteria. In seconds:
- ✅ **Approved** → XP credited, submission appears in the gallery
- ❌ **Rejected** → reason explained, **24-hour contest window** opens

### Admin review (Gold and above)
For higher leagues, a human (Marwen) reviews within 48 hours. Notification sent on decision.

## Community claps

Each user can give **1 to 10 stars** per submission. You can split across multiple reviews. The **total claps** appears on your submission and boosts its visibility.

> Free plan limited to 5 reviews/day. Pro: unlimited.

## XP earned on your submission

- **Like received**: +2 XP
- **Comment received**: +5 XP
- **Approved submission**: challenge `xp_reward` (variable)

## Community reports

If 3 users flag your submission within 24h, it goes `on_hold` and an admin reviews. Rare but transparent.

## Contesting a rejection

If the AI rejects unfairly, you have **24h** to contest with an explanation. An admin decides.
$md$,
 3),

-- ════════════════════════════════════════════════
-- CATEGORY: profile
-- ════════════════════════════════════════════════

('profile-url', 'profile',
 'Personnaliser ton URL kreevo.io/u/{username}',
 'Customize your kreevo.io/u/{username} URL',
 'Ton username = ton portfolio public partageable. Modifiable depuis ton profil.',
 'Your username = your shareable public portfolio. Editable from your profile.',
 $md$
## Ton portfolio public

Chaque user a une URL publique : `kreevo.io/u/{username}`. C'est ta vitrine — tu peux la mettre dans ton CV, ton LinkedIn, ton bio Twitter.

## Ce qui s'affiche dessus

- Avatar, nom, bio, pays
- ProBadge si tu es Pro
- Liens sociaux (Behance, Dribbble, etc.)
- Spécialité + outils
- Liste de tes soumissions **publiées** + **`is_visible = true`** + **validées**
- Tri par track : Tous / UX·UI / Graphic
- Featured work (top par claps reçus)

## Modifier ton username

Va dans `/dashboard/profile`, champ "Username". Le nouveau username doit être :
- Unique (vérifié au save)
- 3 à 30 caractères
- Lettres minuscules, chiffres, underscore (`_`) et tiret (`-`) uniquement

> ⚠️ Si tu changes ton username, ton ancienne URL `kreevo.io/u/{ancien}` devient morte. Préviens les gens à qui tu l'as partagée.

## Soumissions privées

Si tu ne veux pas qu'une soumission apparaisse sur ton portfolio public (ex: brouillon, ratée), désactive le toggle **"Afficher dans mon profil public"** au moment de la soumission ou édite-la après.
$md$,
 $md$
## Your public portfolio

Every user gets a public URL: `kreevo.io/u/{username}`. It's your showcase — drop it on your resume, LinkedIn, Twitter bio.

## What's displayed

- Avatar, name, bio, country
- ProBadge if you're Pro
- Social links (Behance, Dribbble, etc.)
- Specialty + tools
- List of your **published** + **`is_visible = true`** + **approved** submissions
- Sorted by track: All / UX·UI / Graphic
- Featured work (top by claps received)

## Editing your username

Go to `/dashboard/profile`, "Username" field. The new username must be:
- Unique (checked on save)
- 3 to 30 characters
- Lowercase letters, digits, underscore (`_`) and hyphen (`-`) only

> ⚠️ If you change your username, your old `kreevo.io/u/{old}` URL becomes dead. Notify anyone you've shared it with.

## Private submissions

If you don't want a submission to appear on your public portfolio (e.g. draft, failed), disable the **"Show on my public profile"** toggle at submission time or edit it after.
$md$,
 1),

('badges-and-xp', 'profile',
 'Badges et XP : comprendre ta progression',
 'Badges and XP: tracking your progress',
 'XP cumulé global + XP de ligue + badges pour les milestones et achievements.',
 'Global cumulative XP + per-league XP + badges for milestones and achievements.',
 $md$
## XP global vs XP de ligue

- **XP global** (`profile.xp`) — cumul de TOUS tes XP gagnés depuis ton inscription. Visible sur ton dashboard.
- **XP de ligue** — uniquement les XP gagnés dans les challenges de ta ligue actuelle. Sert à calculer ton avancement vers la promotion.

Quand tu montes de ligue, ton **XP global est conservé**, mais ton XP de ligue repart de 0 dans la nouvelle ligue.

## Badges (en construction)

On prépare un système de badges pour les milestones :

- **Reached Bronze** / Silver / Gold / Platinum / Diamond / Master / Legend
- **Champion of the month** (top 1 d'un challenge)
- **Podium** (top 3)
- **Top 10**
- **Completed** (avoir complété N challenges)

Ces badges s'afficheront sur ton portfolio public et ton dashboard.

## Streaks

Ton streak augmente d'1 jour pour chaque jour consécutif où tu as une activité (soumission ou commentaire). Si tu rates une journée, le cron `streak-reset` (1h UTC) le remet à 0.

Ton **best streak** est conservé et affiché à côté de ton streak actuel.

## Tableau de bord stats

Va sur `/dashboard` pour voir :
- League / XP total / Streak / Challenges complétés
- Graph XP des 7 derniers jours
- Graph challenges complétés des 7 derniers jours
$md$,
 $md$
## Global XP vs league XP

- **Global XP** (`profile.xp`) — sum of ALL XP earned since signup. Shown on your dashboard.
- **League XP** — only XP earned in your current league's challenges. Used to compute promotion progress.

When you level up, your **global XP is kept**, but league XP resets to 0 in the new league.

## Badges (in progress)

We're shipping a badge system for milestones:

- **Reached Bronze** / Silver / Gold / Platinum / Diamond / Master / Legend
- **Champion of the month** (top 1 of a challenge)
- **Podium** (top 3)
- **Top 10**
- **Completed** (N challenges completed)

These will display on your public portfolio and dashboard.

## Streaks

Your streak increments by 1 each consecutive day with activity (submission or comment). Miss a day and the cron `streak-reset` (1 AM UTC) resets it to 0.

Your **best streak** is preserved and shown next to your current streak.

## Stats dashboard

Go to `/dashboard` to see:
- League / Total XP / Streak / Challenges completed
- XP graph for the last 7 days
- Challenges-completed graph for the last 7 days
$md$,
 2),

('export-portfolio', 'profile',
 'Exporter ton portfolio Kreevo',
 'Export your Kreevo portfolio',
 'Pas d''export PDF natif pour l''instant — utilise le partage du lien public ou la capture d''écran.',
 'No native PDF export yet — use the public link share or screenshot.',
 $md$
## Méthode 1 — Partager le lien public

Le plus simple : copie l'URL `kreevo.io/u/{ton-username}` et envoie-la. Le destinataire voit ton portfolio en lecture seule, sans avoir besoin de compte Kreevo.

Tu peux mettre ce lien dans :
- Ton CV
- Ta signature email
- Ton bio LinkedIn / Twitter / Instagram
- Ton portfolio Notion ou autre

## Méthode 2 — Capture d'écran

Pour un PDF "à plat" :
- Ouvre `kreevo.io/u/{ton-username}` dans Chrome
- `Cmd+P` (Mac) ou `Ctrl+P` (Windows)
- Sélectionne "Save as PDF"

> 💡 Pour une meilleure qualité, désactive les en-têtes/pieds de page dans les options d'impression.

## Méthode 3 — Récupérer tes images sources

Tes images uploadées sont stockées sur Supabase Storage. Tu peux les récupérer une par une depuis chaque page de soumission (clic droit → "Enregistrer l'image sous…").

## Export PDF natif (à venir)

On travaille sur un export PDF officiel avec layout pro. ETA : Q3 2026. Feedback bienvenu via [Contact](/help/contact).

## Export GDPR

Pour récupérer **toutes tes données personnelles** au format JSON, écris-nous à [help/contact](/help/contact). On a 30 jours pour répondre.
$md$,
 $md$
## Method 1 — Share the public link

Easiest: copy the URL `kreevo.io/u/{your-username}` and send it. The recipient sees your portfolio read-only, no Kreevo account needed.

Drop this link in:
- Your resume
- Your email signature
- Your LinkedIn / Twitter / Instagram bio
- Your Notion portfolio or similar

## Method 2 — Screenshot

For a flat PDF:
- Open `kreevo.io/u/{your-username}` in Chrome
- `Cmd+P` (Mac) or `Ctrl+P` (Windows)
- Select "Save as PDF"

> 💡 For better quality, disable headers/footers in print options.

## Method 3 — Get your source images

Your uploaded images are stored on Supabase Storage. You can grab them one by one from each submission page (right-click → "Save image as…").

## Native PDF export (coming)

We're working on an official PDF export with pro layout. ETA: Q3 2026. Feedback welcome via [Contact](/help/contact).

## GDPR export

To get **all your personal data** as JSON, contact us via [help/contact](/help/contact). We have 30 days to respond.
$md$,
 3),

-- ════════════════════════════════════════════════
-- CATEGORY: billing
-- ════════════════════════════════════════════════

('free-vs-pro', 'billing',
 'Free vs Pro : les différences',
 'Free vs Pro: the differences',
 'Free pour commencer, Pro pour les ligues 3+, feedback détaillé et soumissions illimitées.',
 'Free to start, Pro for leagues 3+, detailed feedback, and unlimited submissions.',
 $md$
## Plan Free (gratuit)

- ✅ Accès aux ligues **Stone** et **Bronze**
- ✅ Inscription aux challenges (1 actif à la fois)
- ✅ 1 tentative par challenge
- ✅ Soumissions publiques
- ✅ Likes / commentaires (5 reviews/jour max)
- ✅ Validation IA des soumissions Stone/Bronze
- ✅ Leaderboard (top 3 visibles)
- ✅ Profil public `kreevo.io/u/{username}`
- ❌ Ligues **Silver à Legend** (pro_only)
- ❌ Tentatives multiples par challenge
- ❌ Reviews illimitées
- ❌ Feedback détaillé IA
- ❌ Leaderboard complet (gate à partir du rang 4)

## Plan Pro

- 💜 Tout le Free
- 💜 Accès **Silver, Gold, Platinum, Diamond, Master, Legend**
- 💜 Tentatives illimitées par challenge
- 💜 Reviews illimitées
- 💜 **Feedback IA détaillé** sur tes soumissions approuvées (analyse Claude Sonnet : strengths, improvements, next steps)
- 💜 Leaderboard complet visible
- 💜 Badge **PRO** à côté de ton @username partout
- 💜 Support prioritaire

## Tarifs

- **Mensuel** : $9 / mois
- **Annuel** : $79 / an (~$6.58/mois, 27% d'économie)

## Pour qui

Tu peux rester en **Free** indéfiniment et progresser en Stone/Bronze. **Pro** est pertinent quand tu veux passer en Silver+ ou avoir du feedback structuré pour décrocher un job.
$md$,
 $md$
## Free plan

- ✅ Access to **Stone** and **Bronze** leagues
- ✅ Join challenges (1 active at a time)
- ✅ 1 attempt per challenge
- ✅ Public submissions
- ✅ Likes / comments (5 reviews/day max)
- ✅ AI validation of Stone/Bronze submissions
- ✅ Leaderboard (top 3 visible)
- ✅ Public profile `kreevo.io/u/{username}`
- ❌ **Silver to Legend** leagues (pro_only)
- ❌ Multiple attempts per challenge
- ❌ Unlimited reviews
- ❌ Detailed AI feedback
- ❌ Full leaderboard (gated past rank 4)

## Pro plan

- 💜 Everything in Free
- 💜 Access to **Silver, Gold, Platinum, Diamond, Master, Legend**
- 💜 Unlimited attempts per challenge
- 💜 Unlimited reviews
- 💜 **Detailed AI feedback** on your approved submissions (Claude Sonnet analysis: strengths, improvements, next steps)
- 💜 Full leaderboard visible
- 💜 **PRO** badge next to your @username everywhere
- 💜 Priority support

## Pricing

- **Monthly**: $9 / month
- **Yearly**: $79 / year (~$6.58/month, 27% savings)

## Who's it for

You can stay **Free** indefinitely and progress in Stone/Bronze. **Pro** is worth it when you want to enter Silver+ or get structured feedback to land a job.
$md$,
 1),

('upgrade-pro', 'billing',
 'Comment passer en Pro',
 'How to upgrade to Pro',
 'Va dans Settings, choisis Mensuel ou Annuel, paie via Paddle (CB / Apple Pay / Google Pay).',
 'Go to Settings, pick Monthly or Yearly, pay via Paddle (card / Apple Pay / Google Pay).',
 $md$
## Étapes pour upgrader

1. Connecte-toi
2. Va dans `/dashboard/settings`
3. Section **Plan & Billing** → bouton **"Upgrade to Pro"**
4. Choisis ton plan : Mensuel ($9/mo) ou Annuel ($79/yr)
5. Tu es redirigé vers le checkout Paddle
6. Saisis ton mode de paiement (CB, Apple Pay, Google Pay, PayPal selon disponibilité)
7. Confirme le paiement

Activation **immédiate** dès la confirmation. Tu vois ton badge PRO apparaître partout dans la minute.

## Modes de paiement

- Carte de crédit / débit (Visa, MasterCard, Amex)
- Apple Pay
- Google Pay
- PayPal (selon le pays)
- Virement SEPA (Pro annuel uniquement, sur demande)

## Reçu de paiement

Paddle envoie automatiquement la facture à l'email de ton compte. Conserve-le pour ta compta.

## TVA

Paddle gère automatiquement la TVA selon ton pays. Si tu es entreprise avec un numéro de TVA intracommunautaire, tu peux le saisir au checkout.

## Échec de paiement

Si ton paiement est refusé :
- Vérifie que ta carte n'est pas expirée ou plafonnée
- Essaie un autre mode de paiement
- Contacte ta banque
- Sinon écris-nous via [Contact](/help/contact)
$md$,
 $md$
## Upgrade steps

1. Log in
2. Go to `/dashboard/settings`
3. **Plan & Billing** section → **"Upgrade to Pro"** button
4. Pick your plan: Monthly ($9/mo) or Yearly ($79/yr)
5. You're redirected to Paddle checkout
6. Enter your payment method (card, Apple Pay, Google Pay, PayPal where available)
7. Confirm payment

**Immediate activation** on confirmation. Your PRO badge appears everywhere within a minute.

## Payment methods

- Credit / debit card (Visa, MasterCard, Amex)
- Apple Pay
- Google Pay
- PayPal (depending on country)
- SEPA bank transfer (Pro yearly only, on request)

## Payment receipt

Paddle auto-sends the invoice to your account email. Keep it for accounting.

## VAT

Paddle handles VAT automatically based on your country. If you're a business with an EU VAT number, you can enter it at checkout.

## Payment failure

If payment is declined:
- Check the card isn't expired or capped
- Try another payment method
- Contact your bank
- Otherwise reach out via [Contact](/help/contact)
$md$,
 2),

('cancel-subscription', 'billing',
 'Annuler ton abonnement Pro',
 'Cancel your Pro subscription',
 'Annulable à tout moment depuis Settings. Tu gardes Pro jusqu''à la fin de la période payée.',
 'Cancel anytime from Settings. You keep Pro until the end of the paid period.',
 $md$
## Comment annuler

1. Va dans `/dashboard/settings`
2. Section **Plan & Billing**
3. Clique sur **"Manage subscription"** (lien vers le portail Paddle)
4. Dans le portail Paddle, clique sur **"Cancel subscription"**
5. Confirme

L'annulation est **immédiate** dans la base, mais tu **gardes l'accès Pro jusqu'à la fin de la période payée** (jusqu'au prochain renouvellement qui ne se fera pas).

## Que se passe-t-il après ?

- À la fin de la période payée, tu repasses automatiquement en Free
- Tes soumissions et profil **restent intacts**
- Tu **perds l'accès aux ligues Silver+** : tu redescends à Bronze (ou ta dernière ligue accessible en Free)
- Ton badge PRO disparaît
- Le feedback IA détaillé n'est plus disponible sur tes nouvelles soumissions

## Remboursement

Politique :
- **Premier achat** : remboursement intégral si demandé dans les **7 jours** et que tu n'as pas encore activé Pro (pas de soumission Pro, pas d'accès aux ligues Pro)
- **Renouvellement** : remboursement au cas par cas (contacte le support)
- **Annulation classique** : pas de remboursement, mais tu gardes Pro jusqu'à la fin de la période

## Questions

Pour toute question facturation : [Contact](/help/contact) avec sujet "Question facturation".
$md$,
 $md$
## How to cancel

1. Go to `/dashboard/settings`
2. **Plan & Billing** section
3. Click **"Manage subscription"** (link to Paddle portal)
4. In the Paddle portal, click **"Cancel subscription"**
5. Confirm

Cancellation is **immediate** in our DB, but you **keep Pro access until the end of the paid period** (until the next renewal, which won't happen).

## What happens after

- At the end of the paid period, you auto-revert to Free
- Your submissions and profile **stay intact**
- You **lose access to Silver+ leagues**: drop back to Bronze (or your last Free-accessible league)
- Your PRO badge disappears
- Detailed AI feedback is no longer available on new submissions

## Refund

Policy:
- **First purchase**: full refund if requested within **7 days** and Pro hasn't been activated (no Pro submission, no Pro league access)
- **Renewal**: case-by-case refund (contact support)
- **Standard cancellation**: no refund, but you keep Pro until period end

## Questions

For billing questions: [Contact](/help/contact) with subject "Billing question".
$md$,
 3),

-- ════════════════════════════════════════════════
-- CATEGORY: account
-- ════════════════════════════════════════════════

('change-email-password', 'account',
 'Modifier ton email ou mot de passe',
 'Change your email or password',
 'Settings → Security. Confirmation email à valider pour le changement d''email.',
 'Settings → Security. Confirmation email required for email change.',
 $md$
## Modifier ton mot de passe

1. `/dashboard/settings` → onglet **Security**
2. Saisis ton mot de passe actuel
3. Saisis le nouveau (8 caractères min, mix de lettres/chiffres recommandé)
4. Confirme le nouveau mot de passe
5. Clique **Save**

Tu restes connecté sur ton appareil. Les autres sessions sont déconnectées (sécurité).

## Mot de passe oublié

Sur la page de login, clique **"Mot de passe oublié ?"** :
1. Saisis ton email
2. Tu reçois un lien de reset valable 1h
3. Clique le lien, choisis un nouveau mot de passe
4. Reconnecte-toi

> Si tu ne reçois pas l'email : check tes spams, l'adresse expéditeur est `noreply@kreevo.io`.

## Modifier ton email

1. `/dashboard/settings` → onglet **Security**
2. Saisis ton nouvel email
3. Saisis ton mot de passe actuel pour confirmer
4. Tu reçois un lien de **confirmation à ton nouvel email**
5. Clique le lien dans les 24h

Tant que tu n'as pas cliqué le lien, ton ancien email reste valide.

## OAuth (Google / LinkedIn)

Si tu t'es inscrit via OAuth, tu n'as **pas de mot de passe** côté Kreevo. Pour gérer ton accès, va dans tes paramètres Google ou LinkedIn (ou voir l'article [Connecter Google / LinkedIn](/help/account/connect-oauth)).
$md$,
 $md$
## Change your password

1. `/dashboard/settings` → **Security** tab
2. Enter your current password
3. Enter the new one (8 chars min, mix of letters/digits recommended)
4. Confirm the new password
5. Click **Save**

You stay logged in on your device. Other sessions are signed out (security).

## Forgot your password

On the login page, click **"Forgot password?"**:
1. Enter your email
2. You'll receive a reset link valid for 1 hour
3. Click the link, pick a new password
4. Log in

> If you don't get the email: check spam, the sender address is `noreply@kreevo.io`.

## Change your email

1. `/dashboard/settings` → **Security** tab
2. Enter your new email
3. Enter your current password to confirm
4. You'll receive a **confirmation link at the new email**
5. Click the link within 24h

Until you click, your old email stays valid.

## OAuth (Google / LinkedIn)

If you signed up via OAuth, you have **no Kreevo password**. Manage access via your Google or LinkedIn settings (or see [Connect Google / LinkedIn](/help/account/connect-oauth)).
$md$,
 1),

('connect-oauth', 'account',
 'Connecter Google ou LinkedIn',
 'Connect Google or LinkedIn',
 'OAuth pour t''inscrire ou te connecter en 1 clic. Pré-remplit ton profil.',
 'OAuth for one-click signup or login. Pre-fills your profile.',
 $md$
## OAuth — c'est quoi

OAuth = **connexion via un compte tiers** (Google ou LinkedIn) sans avoir à créer de mot de passe spécifique à Kreevo. Plus rapide, plus sécurisé.

## Connexion OAuth

Sur la page login ou signup :
- **"Continuer avec Google"** → tu choisis ton compte Google → autorisation → connecté
- **"Continuer avec LinkedIn"** → tu te connectes à LinkedIn → autorisation → connecté

## Ce qu'on récupère

Avec ton autorisation explicite :
- Email
- Avatar / photo de profil
- Nom complet (prénom + nom)
- Pour LinkedIn : URL de ton profil LinkedIn

Ces infos pré-remplissent automatiquement ton onboarding.

## Ce qu'on ne récupère PAS

- Tes contacts / connexions
- Tes messages
- Tes posts ou données privées

On ne lit que les champs que tu autorises au moment de l'OAuth grant.

## Lier OAuth à un compte existant

Si tu as déjà un compte email et tu veux ajouter Google/LinkedIn :

1. Connecte-toi avec ton email + mot de passe
2. `/dashboard/settings` → **Security** → **Connected accounts**
3. Clique sur **"Connect Google"** ou **"Connect LinkedIn"**

> ⚠️ L'email du compte OAuth doit être le **même** que celui de ton compte Kreevo.

## Délier OAuth

Dans la même section. Si c'est ta seule méthode de connexion, on te demandera de définir un mot de passe avant de délier (sinon tu ne pourrais plus te connecter).
$md$,
 $md$
## OAuth — what is it

OAuth = **login via a third-party account** (Google or LinkedIn) without creating a Kreevo-specific password. Faster, more secure.

## OAuth login

On the login or signup page:
- **"Continue with Google"** → pick your Google account → authorize → logged in
- **"Continue with LinkedIn"** → log into LinkedIn → authorize → logged in

## What we collect

With your explicit authorization:
- Email
- Avatar / profile picture
- Full name (first + last)
- LinkedIn: your LinkedIn profile URL

These auto-fill your onboarding.

## What we DON'T collect

- Your contacts / connections
- Your messages
- Your posts or private data

We only read fields you authorize at OAuth grant time.

## Link OAuth to existing account

If you have an email account and want to add Google/LinkedIn:

1. Log in with email + password
2. `/dashboard/settings` → **Security** → **Connected accounts**
3. Click **"Connect Google"** or **"Connect LinkedIn"**

> ⚠️ The OAuth account email must be the **same** as your Kreevo account.

## Unlink OAuth

Same section. If it's your only login method, we'll ask you to set a password before unlinking (otherwise you couldn't log in anymore).
$md$,
 2),

('delete-account', 'account',
 'Supprimer ton compte',
 'Delete your account',
 'Suppression définitive et irréversible. Tes soumissions et données sont supprimées sous 30 jours (RGPD).',
 'Permanent and irreversible deletion. Your submissions and data are deleted within 30 days (GDPR).',
 $md$
## Avant de supprimer

⚠️ **C'est irréversible.** Tu vas perdre :
- Ton profil et tout ton historique
- Tes XP et ton rang ligue
- Tes soumissions (cover, images, descriptions)
- Tes commentaires donnés et reçus
- Tes badges et streaks
- Ton portfolio public `kreevo.io/u/{username}` (URL devient morte)

Si tu veux juste **faire une pause**, désactive simplement les notifications dans `/dashboard/settings` au lieu de supprimer.

## Comment supprimer

1. `/dashboard/settings` → tout en bas, section **Danger zone**
2. Bouton **"Delete account"** (rouge)
3. Tape ton username dans le champ de confirmation
4. Saisis ton mot de passe (ou re-auth OAuth)
5. Confirme

Suppression effective : tu es déconnecté immédiatement. Tes données sont marquées pour suppression et retirées de la base sous **30 jours** maximum (conformité RGPD).

## Si tu es en Pro

**Annule d'abord ton abonnement** dans la section Billing pour éviter le prochain renouvellement (cf. [Annuler ton abonnement](/help/billing/cancel-subscription)).

Si tu supprimes en plein cycle Pro, tu n'as **pas de remboursement automatique**. Demande au support si tu veux un remboursement au prorata.

## Récupérer mes données avant suppression

Tu as droit à un **export RGPD** de tes données personnelles. Demande-le à [Contact](/help/contact) **avant** de supprimer ton compte. On a 30 jours pour répondre.

## Backup légal

Pour des raisons légales (fiscales, anti-fraude), on garde certaines métadonnées (logs de paiement Paddle, données fiscales) pendant 10 ans même après suppression. Ces données ne sont pas reliées à ton profil.
$md$,
 $md$
## Before deleting

⚠️ **This is irreversible.** You'll lose:
- Your profile and all history
- Your XP and league rank
- Your submissions (cover, images, descriptions)
- Your comments given and received
- Your badges and streaks
- Your public portfolio `kreevo.io/u/{username}` (URL becomes dead)

If you just want to **take a break**, just disable notifications in `/dashboard/settings` instead of deleting.

## How to delete

1. `/dashboard/settings` → at the very bottom, **Danger zone** section
2. **"Delete account"** button (red)
3. Type your username in the confirmation field
4. Enter your password (or OAuth re-auth)
5. Confirm

Effective deletion: you're signed out immediately. Your data is flagged for deletion and removed from DB within **30 days** max (GDPR compliance).

## If you're Pro

**Cancel your subscription first** in the Billing section to avoid the next renewal (see [Cancel subscription](/help/billing/cancel-subscription)).

If you delete mid-cycle Pro, you get **no automatic refund**. Ask support for a prorated refund if you want one.

## Recover my data before deletion

You have a right to a **GDPR export** of your personal data. Request it via [Contact](/help/contact) **before** deleting your account. We have 30 days to reply.

## Legal backup

For legal reasons (tax, anti-fraud), we keep some metadata (Paddle payment logs, tax data) for 10 years even after deletion. This data isn't tied to your profile.
$md$,
 3)

ON CONFLICT (slug) DO UPDATE SET
  category    = EXCLUDED.category,
  title_fr    = EXCLUDED.title_fr,
  title_en    = EXCLUDED.title_en,
  excerpt_fr  = EXCLUDED.excerpt_fr,
  excerpt_en  = EXCLUDED.excerpt_en,
  content_fr  = EXCLUDED.content_fr,
  content_en  = EXCLUDED.content_en,
  order_index = EXCLUDED.order_index,
  updated_at  = now();
