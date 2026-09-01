# 02 — Inscription entreprise, fiche, espace dédié

Status: ready-for-agent
Blocked by: 01

**Fichiers**
- Modifier : `src/app/(public)/hire/page.tsx` — la page « bientôt » devient la porte d'entrée
- Créer : `src/app/(auth)/signup/company/page.tsx` — inscription entreprise
- Créer : `src/app/(company)/company/onboarding/page.tsx` — la fiche entreprise
- Créer : `src/app/(company)/layout.tsx` + `src/app/(company)/company/page.tsx` — l'espace
- Créer : `src/components/features/company/CompanyForm.tsx`, `.../actions.ts`
- Modifier : la redirection après connexion

**Interfaces produites**
```ts
// src/components/features/company/actions.ts
export async function saveCompany(formData: FormData): Promise<
  { ok: true; id: string } | { ok: false; error: string }
>
```
Champs : `name` (requis), `logoUrl` (requis), `description`, `websiteUrl`, `location`.

---

- [ ] **Étape 1 — `/hire` devient la porte d'entrée**

Remplace le « bientôt disponible » par une vraie présentation et un bouton vers
`/signup/company`. **Conserve le formulaire de liste d'attente existant** et sa table
`hire_waitlist` : c'est le seul signal de demande qui existe, on ne le jette pas.

- [ ] **Étape 2 — L'inscription entreprise**

Même mécanisme que l'inscription designer, avec **`role: 'b2b'` dans les métadonnées**
du compte — c'est le trigger `handle_new_user()` du lot 01 qui le lit et pose le rôle
à la création. Ne mets **jamais** à jour le rôle après coup : il y aurait une fenêtre
pendant laquelle l'entreprise ressemble à un designer.

- [ ] **Étape 3 — La fiche entreprise**

Écran affiché juste après l'inscription : nom **obligatoire**, logo **obligatoire**,
description, URL et localisation facultatives. Le logo passe par le composant
`ImageUpload` existant, bucket `companies`.

**Tant que la fiche n'existe pas, le compte ne peut rien faire** : toute page de
l'espace entreprise redirige vers cet écran. C'est ce qui évite les comptes fantômes.

- [ ] **Étape 4 — L'espace entreprise et la redirection**

Un groupe de routes `(company)` avec son propre layout : ses briefs, sa fiche. **Ni
ligue, ni XP, ni challenge, ni portfolio** — ces notions n'existent pas pour elle.

Après connexion, le rôle décide de la destination : `admin` → l'espace admin, `b2b` →
l'espace entreprise, sinon le tableau de bord designer. Cherche où la redirection
post-connexion se fait aujourd'hui et suis le motif en place.

⚠️ Un compte `b2b` qui atteindrait `/dashboard` ne doit pas y rester : le tableau de
bord designer lit `league`, `xp` et `specialty`, qui sont nuls pour lui. Redirige.

- [ ] **Étape 5 — Vérifier**

```bash
npx tsc --noEmit && npx next build
```
Puis, par l'API et avec des comptes de test que tu supprimes ensuite :
- une inscription entreprise crée bien un profil `role='b2b'` ;
- sans fiche, l'espace entreprise renvoie vers l'écran de fiche ;
- une fois la fiche créée, la ligne `companies` porte le bon `owner_id` ;
- un compte designer existant n'est **pas** affecté : il arrive toujours sur
  `/dashboard`.

Prouve la suppression de tes comptes et lignes de test.

- [ ] **Étape 6 — Commiter**

```bash
git commit -am "feat(briefs): company signup, profile and dedicated space"
```
