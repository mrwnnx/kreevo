# 10 — Modération des projets perso

Status: ready-for-agent
Blocked by: 01

Le pendant obligatoire de la décision « aucune validation à l'entrée ».

**Fichiers**
- Modifier : `src/app/api/submissions/[id]/report/route.ts`
- Modifier : `src/app/(admin)/admin/moderation/page.tsx`

---

- [ ] **Étape 1 — Le seuil, adapté au type**

Le seuil de 3 signalements bascule aujourd'hui `validation_status` sur
`on_hold` — une colonne sans objet pour un projet perso, et que la RLS n'utilise
plus pour lui. Pour `kind='portfolio'`, il doit passer **`is_visible` à `false`**
et renseigner `reported_at`.

Conserver la fenêtre de signalement de 24 h ? **Non** : elle a du sens pour une
soumission de challenge (on conteste un travail récent), pas pour un projet
perso qui reste en ligne indéfiniment. Pour `kind='portfolio'`, pas de fenêtre.

- [ ] **Étape 2 — La file admin**

`/admin/moderation` doit lister les deux types et dire lequel est lequel.
L'action de restauration diffère : `validation_status='approved'` pour un
challenge, `is_visible=true` pour un projet perso.

⚠️ Les actions `PATCH` de l'espace admin **ignorent silencieusement leurs
erreurs** (constat de juin, non corrigé). Ne pas reproduire ce pattern ici :
lire l'erreur, la remonter, et n'afficher un succès que s'il y en a un.

- [ ] **Étape 3 — Vérifier**

Créer un projet de test, le signaler depuis 3 comptes différents, vérifier en
base que `is_visible` est passé à `false`, puis qu'il a disparu de `/discover`,
de `/u/[username]` et que `/p/[id]` rend un 404. Restaurer depuis l'admin et
vérifier qu'il revient partout.

- [ ] **Étape 4 — Commiter**

```bash
git commit -am "feat(portfolio): hide a reported project at the threshold, and let an admin restore it"
```
