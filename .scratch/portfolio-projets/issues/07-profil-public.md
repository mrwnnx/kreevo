# 07 — `/u/[username]` : afficher les projets perso

Status: ready-for-agent
Blocked by: 01, 06

**Fichiers**
- Modifier : `src/app/(public)/u/[username]/page.tsx` (582 lignes — ne pas la
  restructurer, y toucher chirurgicalement)

---

- [ ] **Étape 1 — Élargir la requête**

Aujourd'hui :
```ts
.eq('is_visible', true).eq('is_draft', false).eq('validation_status', 'approved')
```
Devient : `is_visible` et `is_draft` inchangés, mais le filtre de validation ne
s'applique **qu'aux** lignes `challenge`. En PostgREST :
```ts
.or('kind.eq.portfolio,validation_status.eq.approved')
```

- [ ] **Étape 2 — Appliquer l'ordre du portfolio**

`pinned_at desc nulls last`, puis `portfolio_position asc nulls last`, puis
`created_at desc`. Un portfolio jamais réorganisé garde donc exactement l'ordre
actuel — aucune régression visuelle pour les 94 comptes existants.

- [ ] **Étape 3 — Gérer l'absence de challenge**

La page affiche aujourd'hui `challenges(title, specialty, …)` en méta. Pour un
projet perso, ce join est `null` : afficher à la place la taxonomie propre du
projet (spécialité, type, industrie). **Ne pas afficher « — »** là où il y a une
vraie donnée disponible.

- [ ] **Étape 4 — Le bouton d'ajout**

Quand le visiteur est le propriétaire, un bouton « Ajouter un projet » vers
`/dashboard/projects/new`. Invisible pour tout le monde d'autre — la page est
publique et sert de portfolio partageable.

- [ ] **Étape 5 — Les cartes mènent à `/p/[id]`**

- [ ] **Étape 6 — Vérifier**

```bash
npx tsc --noEmit && npx next build
```
Parcours, **en navigation privée** : `/u/marwen` (6 soumissions approuvées, dont
4 multi-images) doit rendre exactement comme avant. Puis publier un projet perso
et vérifier qu'il apparaît. Vérifier aussi en FR, EN et AR (RTL).

- [ ] **Étape 7 — Commiter**

```bash
git commit -am "feat(portfolio): show personal projects on the public profile"
```
