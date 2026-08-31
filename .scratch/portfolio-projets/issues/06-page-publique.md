# 06 — Page publique d'un projet : `/p/[id]`

Status: ready-for-agent
Blocked by: 01

C'est le plus gros morceau non anticipé du chantier. Aujourd'hui le détail d'une
soumission n'existe qu'en `/dashboard/submissions/[id]`, **derrière un login**.
Dans un feed public mélangé, cliquer une carte doit mener quelque part de public.

**Fichiers**
- Créer : `src/app/(public)/p/[id]/page.tsx`
- Créer : `src/app/(public)/p/[id]/opengraph-image.tsx`
- Réutiliser : `ImageLightbox`, `GlassShell`, `GlassHeader`, `PoweredByFooter`

Une seule route sert les **deux** `kind`. Elle ne remplace pas la page dashboard,
qui garde les outils réservés au propriétaire (feedback IA, statut de validation).

---

- [ ] **Étape 1 — La page**

Lecture par `supabaseAdmin` avec un `select` **explicite**, filtrée sur ce qui
est réellement public :
`is_draft=false`, `is_visible=true`, et `(kind='portfolio' or validation_status='approved')`.
Sinon `notFound()` — un brouillon ou une soumission rejetée ne doit pas fuir par
cette route.

Contenu : couverture et photos en galerie (lightbox, **sans login**), titre,
description, lien du projet, auteur (avatar, nom, lien vers `/u/[username]`),
compteurs, et le **badge « validé »** si `kind='challenge'`. Pour un projet de
challenge, afficher aussi le challenge d'origine.

Le layout `(public)` ne pose aucun chrome : la page rend son propre en-tête,
adaptatif selon que le visiteur est connecté — c'est le pattern déjà en place sur
`/u/[username]`.

- [ ] **Étape 2 — Incrémenter les vues**

Réutiliser la RPC existante `increment_submission_views`. Ne pas la déclencher
pour le propriétaire regardant sa propre page.

- [ ] **Étape 3 — SEO et partage**

`generateMetadata` : titre du projet + nom de l'auteur, description tronquée,
`alternates.canonical` sur `/p/[id]`, et une image OG.

⚠️ Quirk Next 16 relevé sur `/u/[username]` : le fichier `opengraph-image` sort
avec un suffixe de hash dans la route (`opengraph-image-155jyy`). Ne pas
construire l'URL OG à la main.

⚠️ `next/image` : remplacer une image sans changer son nom ne casse pas le cache.

- [ ] **Étape 4 — Vérifier**

```bash
npx tsc --noEmit && npx next build
```
Puis, **en navigation privée** (donc sans session) :
- un projet perso publié → 200, images cliquables ;
- un **brouillon** → 404 ;
- une soumission de challenge **rejetée** → 404 ;
- une soumission de challenge approuvée → 200 avec le badge « validé ».

- [ ] **Étape 5 — Commiter**

```bash
git commit -m "feat(portfolio): a public page for a single work, both kinds"
```
