# 02 — Verrou XP : un projet perso ne rapporte jamais d'XP

Status: ready-for-agent
Blocked by: 01

Le point le plus critique du chantier. Deux chemins fuient réellement, car ils
sont ouverts au public dès qu'un projet perso est dans le feed mélangé.

**Fichiers**
- Modifier : `src/app/api/submissions/[id]/like/route.ts`
- Modifier : `src/app/api/submissions/[id]/comments/route.ts`
- Modifier : `src/app/api/submissions/[id]/report/route.ts`

---

- [ ] **Étape 1 — Like : ne créditer que le challenge**

Dans `like/route.ts`, la requête initiale sélectionne déjà `user_id, total_likes` :
ajouter `kind`, puis conditionner le crédit.

```ts
  const { data: submission } = await supabaseAdmin
    .from('submissions')
    .select('user_id, total_likes, kind')      // + kind
    .eq('id', submissionId)
    .single()
```

```ts
  // Un projet de portfolio ne rapporte jamais d'XP (décision produit) : le like
  // reste cosmétique, seul le compteur bouge.
  const ownerId = submission.user_id
  if (creditXp && ownerId && submission.kind === 'challenge') {
```

- [ ] **Étape 2 — Commentaire : même verrou (+5 XP aujourd'hui)**

Dans `comments/route.ts`, la ligne
`if (submission.user_id && submission.user_id !== user.id) {`
devient :

```ts
  if (submission.user_id && submission.user_id !== user.id && submission.kind === 'challenge') {
```

Ajouter `kind` au `select` de `submission` dans cette même route.
⚠️ La **notification** au propriétaire est dans ce bloc : la déplacer hors du
`if` si on veut qu'un auteur soit prévenu d'un commentaire sur son projet perso.
Décision retenue : **prévenir quand même** — sortir `notify` du bloc XP.

- [ ] **Étape 3 — Signalement : défense en profondeur**

Dans `report/route.ts`, la révocation d'XP au seuil ne concerne qu'un projet
validé. Ajouter `kind` au second `select` et conditionner :

```ts
    if (subFull?.xp_attributed && ownerId && subFull.kind === 'challenge') {
```

- [ ] **Étape 4 — Vérifier**

```bash
npx tsc --noEmit && npx next build
```

Puis la mesure qui tranche, **après** le lot 03 quand un projet perso existe :
relever l'XP du propriétaire, liker et commenter son projet perso depuis un
autre compte, relire l'XP.

```bash
set -a && . .env.local && set +a
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/profiles?select=xp&id=eq.<OWNER_ID>" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```
Attendu : **valeur identique avant et après**. Un écart de +2 (like) ou +5
(commentaire) signifie que le verrou ne tient pas.

- [ ] **Étape 5 — Commiter**

```bash
git commit -am "fix(portfolio): keep XP on challenge work only, on like, comment and report"
```
