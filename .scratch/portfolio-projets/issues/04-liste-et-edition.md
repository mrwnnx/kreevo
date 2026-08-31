# 04 — Liste « Mes projets », brouillons et édition

Status: ready-for-agent
Blocked by: 03

**Fichiers**
- Créer : `src/app/(dashboard)/dashboard/projects/page.tsx`
- Créer : `src/app/(dashboard)/dashboard/projects/[id]/edit/page.tsx`
- Modifier : la navigation du dashboard (ajouter l'entrée « Mes projets »)

---

- [ ] **Étape 1 — La liste**

Lit les lignes `kind='portfolio'` de l'utilisateur connecté, brouillons
**inclus**, triées `created_at desc`. Chaque carte : vignette, titre, une pastille
« Brouillon » le cas échéant, et les actions Modifier / Supprimer / Publier.

Le `select` doit être **explicite** (jamais `select('*')`) — c'est la règle posée
lors de l'audit sécurité pour ne pas exposer de colonnes par accident.

État vide soigné : un projet perso est souvent la première chose qu'un nouvel
inscrit publie, cet écran est une porte d'entrée.

- [ ] **Étape 2 — L'édition**

Réutilise `ProjectForm` du lot 03, pré-rempli. Un projet publié qu'on modifie
**reste publié** : `is_draft` et `is_visible` ne changent pas, sauf si l'auteur
clique explicitement sur un bouton qui les change.

La page charge la ligne avec `.eq('id', id).eq('user_id', user.id)` : un
utilisateur ne doit pas pouvoir ouvrir l'édition du projet d'un autre. Si la
ligne est absente → `notFound()`.

- [ ] **Étape 3 — Vérifier**

```bash
npx tsc --noEmit && npx next build
```
Parcours : publier un projet, le modifier, vérifier qu'il est **toujours
publié** après modification. Puis, connecté avec un **autre** compte, ouvrir
`/dashboard/projects/<id>/edit` du premier → doit rendre un 404.

- [ ] **Étape 4 — Commiter**

```bash
git commit -am "feat(portfolio): list my projects and edit them"
```
