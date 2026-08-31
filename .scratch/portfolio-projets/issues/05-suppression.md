# 05 — Suppression d'un projet

Status: needs-info
Blocked by: 04

⚠️ **Ce ticket commence par une mesure, pas par du code.** Les clés étrangères
vers `submissions` n'ont jamais été auditées. Celles vers `profiles` ne
l'avaient pas été non plus, et **19 utilisateurs sur 75 étaient silencieusement
insupprimables** — la route renvoyait `{ok:true}` et l'utilisateur restait là.
Ne pas reproduire ce bug.

**Fichiers**
- Créer : `src/app/api/projects/[id]/route.ts` (DELETE)
- Modifier : la liste du lot 04 (bouton + confirmation)

---

- [ ] **Étape 1 — Auditer les clés étrangères AVANT d'écrire quoi que ce soit**

```sql
select conname,
       conrelid::regclass as table_source,
       confdeltype        as on_delete   -- a=NO ACTION, c=CASCADE, n=SET NULL, r=RESTRICT
from pg_constraint
where confrelid = 'public.submissions'::regclass;
```
Tables concernées attendues : `comments`, `submission_likes`,
`submission_reports`, `submission_contests`, et possiblement
`submission_feedbacks`.

**Le résultat décide de la suite** :
- toutes en `CASCADE` → la suppression est directe, passer à l'étape 3 ;
- une seule en `NO ACTION` → écrire une migration `010_` qui la passe en
  `CASCADE` (donnée strictement rattachée au projet : un commentaire sur un
  projet supprimé n'a plus d'objet), **avant** d'écrire la route.

Consigner le résultat sous `## Answer` dans ce fichier et passer le
`Status:` à `ready-for-agent`.

- [ ] **Étape 2 — Migration si nécessaire** (dépend de l'étape 1)

- [ ] **Étape 3 — La route DELETE**

Contrat, calqué sur `DELETE /api/admin/users/[id]` refait en juin :
- vérifier la propriété : `.eq('id', id).eq('user_id', user.id)` ;
- **ne jamais renvoyer `{ok:true}` sans avoir lu l'erreur** de la requête ;
- erreur → `500` avec le message ; ligne absente → `404` ;
- refuser la suppression d'un `kind='challenge'` : un travail de challenge n'est
  pas supprimable par son auteur (il porte de l'XP et un historique) → `403`.

- [ ] **Étape 4 — Nettoyer le stockage**

Les objets du bucket `submissions` n'ont **aucune** clé étrangère : ils ne
bloquent pas la suppression et restent orphelins. Supprimer explicitement la
couverture et les photos du projet après la suppression de la ligne, en
best-effort (un échec de nettoyage ne doit pas faire échouer la suppression).

- [ ] **Étape 5 — Vérifier**

Créer un projet de test, le liker et le commenter depuis un autre compte, puis
le supprimer. Vérifier ensuite qu'il ne reste **rien** :

```bash
set -a && . .env.local && set +a
for t in submissions submission_likes comments submission_reports; do
  printf "%-20s " "$t"
  curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/$t?select=id&submission_id=eq.<ID>" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
  echo
done
```
Attendu : `[]` partout. Pour `submissions`, filtrer sur `id=eq.<ID>`.

- [ ] **Étape 6 — Commiter**

```bash
git commit -am "feat(portfolio): delete a project, and everything hanging off it"
```
