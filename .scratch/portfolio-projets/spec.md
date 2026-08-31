# Portfolio — projets personnels

**Date** : 2026-08-31
**État** : spec validée en brainstorming, plan d'implémentation à écrire

## Le problème

Aujourd'hui un projet ne peut exister qu'attaché à un challenge. La colonne
`submissions.challenge_id` est nullable, mais **0 ligne sur 87** l'utilise :
toute la mécanique — validation IA au publish, XP, ligues, anti-farm — est
construite autour du challenge.

L'objectif est de donner à chaque utilisateur un portfolio où il ajoute **ses
propres** projets, avec le parcours de Dribbble et le design system de Kreevo.

## Ce qui existe déjà (mesuré, pas supposé)

Kreevo porte déjà l'essentiel de la surface Dribbble :

| Brique | Où |
|---|---|
| Feed public avec tri et filtres | `/discover` (vues projets/designers, tri pertinence/récent, filtres spécialité/ligue/pays/outil) |
| Profil-portfolio public et partageable | `/u/[username]` — autonome, lightbox, footer « Powered by », lisible sans compte |
| Upload riche | couverture, titre, description, lien, photos multiples avec légendes, interrupteur « afficher sur mon profil » |
| Social | likes, commentaires, vues, signalements, contestations |
| Annuaire | `/designers` |

**Constat vérifié le 2026-08-31** : `/discover` filtre les projets par les
attributs de leur **auteur** (`profiles.specialty_id`, `country`, `tools`,
`league`), jamais par ceux de la soumission. Un projet perso hérite donc
automatiquement des filtres de son auteur.

## Décisions produit (arbitrées par Marwen)

1. **Aucune validation à l'entrée.** Publication directe, comme Dribbble.
2. **Zéro XP.** Un projet perso ne fait jamais monter en ligue.
3. **Feed mélangé.** Les projets perso apparaissent dans `/discover` au même
   rang que les travaux de challenge.
4. **Illimité et gratuit.** Aucun plafond, aucun gating Pro.
5. **Modération a posteriori** via le signalement et la file admin existants.
6. **Taxonomie obligatoire** : spécialité, industrie, type de projet, outils.
   ⚠️ Choix maintenu après correction : la taxonomie ne conditionne **pas** les
   filtres actuels de `/discover` (ils portent sur le profil). Elle sert
   l'affichage, le SEO et les filtres futurs.
7. **Badge sur le travail validé**, pas sur le projet perso : la distinction
   valorise le challenge au lieu de stigmatiser le portfolio.
8. **Brouillon, édition, suppression, et réorganisation** du portfolio
   (épinglage + ordre manuel).

## Approche retenue : une table, une colonne discriminante

`submissions` gagne une colonne `kind` valant `challenge` ou `portfolio`.

**Pourquoi.** Les quatre tables sociales — `comments`, `submission_likes`,
`submission_reports`, `submission_contests` — sont **toutes** clés sur
`submission_id`. Réutiliser la table donne gratuitement les likes, les
commentaires, les signalements, les vues, la lightbox, les cartes, le feed
mélangé, la page publique du profil et la file de modération.

Le badge devient **structurel** : `kind = 'challenge'` n'est pas falsifiable par
un utilisateur.

Bonus : l'ordre manuel valant pour les deux types, l'auteur ordonne sa vitrine
entière et peut intercaler un travail de challenge entre deux projets perso.

**Prix payé** : une ligne `portfolio` laisse ~12 colonnes de challenge à `null`
(`ai_analysis`, `xp_earned`, `participation_id`, `validated_by`…). Inélégant,
inoffensif.

### Alternative écartée : une table `projects` séparée

Modèle plus propre, mais impose soit de rendre polymorphes les 4 tables
sociales (migration de données vivantes), soit de les dupliquer, **plus** un
feed fusionné dont la pagination est le vrai piège. Estimé à 2–3× le travail,
pour un gain surtout esthétique.

## Modèle de données

### Colonnes ajoutées à `submissions`

| Colonne | Type | Rôle |
|---|---|---|
| `kind` | `text not null default 'challenge'`, CHECK `in ('challenge','portfolio')` | Discriminante. Les 87 lignes existantes deviennent `challenge` sans migration de données |
| `specialty_id` | `uuid → specialties(id)` | Taxonomie choisie par l'auteur. Nulle pour un projet de challenge (l'info vient du challenge) |
| `industry_id` | `uuid → industries(id)` | idem |
| `project_type_id` | `uuid → challenge_types(id)` | idem. Nom volontairement différent de la table cible : « type de projet » a du sens hors challenge |
| `tools` | `text[]` | Outils utilisés. Même forme que `profiles.tools`, donc exploitable par un filtre futur |
| `portfolio_position` | `int` | Ordre manuel sur `/u/[username]`. Vaut pour les **deux** types |
| `pinned_at` | `timestamptz` | Épinglage. Vaut pour les deux types |

### Ordre d'affichage du portfolio

`pinned_at desc nulls last`, puis `portfolio_position asc nulls last`, puis
`created_at desc`. Un portfolio jamais réorganisé garde donc l'ordre
chronologique inverse actuel.

### Lecture publique (RLS)

La policy `submissions_visible` passe de « approuvé » à « approuvé ou perso » :

```sql
alter policy "submissions_visible" on public.submissions
  using (
    (
      is_visible = true
      and is_draft = false
      and (kind = 'portfolio' or validation_status = 'approved')
    )
    or user_id = auth.uid()
  );
```

La branche propriétaire reste inchangée — c'est elle qui fait fonctionner la
réouverture d'un brouillon.

### Verrou XP

Tous les chemins qui écrivent de l'XP sont conditionnés à `kind = 'challenge'`.
Les six chemins ont été relevés le 2026-08-31 :

| Chemin | Atteignable depuis un projet perso ? |
|---|---|
| `api/submissions/[id]/like/route.ts` — +2 XP au propriétaire au premier like | **OUI — fuite** |
| `api/submissions/[id]/comments/route.ts` — XP au propriétaire sur commentaire | **OUI — fuite** |
| `api/submissions/[id]/report/route.ts` — révocation d'XP au seuil de signalement | Non (rien à révoquer), à verrouiller quand même |
| `lib/utils/submissions.ts` — attribution à la validation | Non : un projet perso n'entre jamais dans le flux de validation |
| `lib/utils/submissions.ts` — XP au parrain | Non, même raison |
| `lib/utils/submissions.ts` — révocation | Non, même raison |

Les **deux fuites réelles sont le like et le commentaire**, tous deux ouverts au
public sur un projet perso puisque le feed est mélangé. Les quatre autres sont
verrouillés par défense en profondeur, pas parce qu'ils saignent.

### Stockage

Aucun bucket nouveau : on réutilise `submissions` (public, 5 Mo, images fixes).

## Parcours d'ajout

Page unique, pas de multi-étapes : le formulaire de challenge n'a deux étapes
que parce que la seconde est l'analyse IA, absente ici.

**Entrées** : bouton « Ajouter un projet » sur son propre `/u/[username]` et
dans le dashboard. Route `/dashboard/projects/new`.

**Champs, dans l'ordre :**

1. **Couverture** — obligatoire, glisser-déposer, compression client
   (composant `ImageUpload` existant)
2. **Photos supplémentaires** — plusieurs, chacune avec sa légende (mécanique
   existante du formulaire de challenge)
3. **Titre** — obligatoire
4. **Description** — libre
5. **Lien du projet** — optionnel (site, Figma, dépôt…)
6. **Spécialité, industrie, type de projet, outils** — obligatoires
7. **Actions** — « Enregistrer en brouillon » et « Publier »

**À la publication** : `kind='portfolio'`, `is_draft=false`, `is_visible=true`.
Aucun appel Anthropic, aucun XP, aucune ligue touchée, en ligne immédiatement.

## Gestion des projets

- **Liste « Mes projets »** dans le dashboard : publiés et brouillons ensemble,
  avec modifier / supprimer / publier.
- **Édition** : même formulaire pré-rempli. Un projet publié modifié reste
  publié.
- **Suppression** : confirmation explicite. ⚠️ **À vérifier en base avant
  d'écrire la route** : le comportement des clés étrangères vers `submissions`
  (likes, commentaires, signalements, contestations) n'a jamais été audité.
  Celles vers `profiles` ne l'avaient pas été non plus, et **19 utilisateurs sur
  75 étaient silencieusement insupprimables**. Ne pas reproduire ce bug.
- **Réorganisation** : mode « Organiser » sur son propre `/u/[username]` —
  glisser pour ordonner, cliquer pour épingler. Écrit `portfolio_position` et
  `pinned_at`.

## Écrans impactés

| Écran | Ce qui bouge |
|---|---|
| `/u/[username]` | Accepte les lignes `portfolio` (exige aujourd'hui `validation_status='approved'`), applique le nouvel ordre, affiche « Ajouter un projet » au propriétaire, gère un challenge absent — la page affiche aujourd'hui le titre du challenge en méta |
| `/discover` | Même relâchement du filtre, plus le badge « validé » sur les cartes de challenge |
| **`/p/[id]` — page publique du projet** | **N'existe pas, à créer.** Le détail d'une soumission n'existe qu'en `/dashboard/submissions/[id]`, derrière un login. Dans un feed public mélangé, cliquer une carte doit mener à une page publique. Une seule route sert les deux `kind`. Nom `/p/[id]` : court, partageable, agnostique du type — à surcharger si Marwen préfère autre chose. Elle ne remplace pas la page dashboard, qui garde les outils réservés au propriétaire |
| Signalement / `/admin/moderation` | Le seuil de 3 signalements bascule aujourd'hui `validation_status` sur `on_hold`, colonne sans objet pour un projet perso. Pour `kind='portfolio'`, le seuil passe `is_visible` à `false` et renseigne `reported_at` ; l'admin restaure en repassant `is_visible` à `true` |

## Hors périmètre

Vidéo et GIF animé (le bucket n'accepte que des images fixes), collections
façon Dribbble, followers, tags libres, domaine personnalisé.

## Risques et dette

1. **`/discover` charge 300 soumissions puis filtre en mémoire.** Avec 87 lignes
   ça passe ; avec des projets perso illimités et gratuits, ce plafond
   deviendra faux — et **silencieusement** : le feed cessera d'afficher tout,
   sans erreur. Pas un blocage pour livrer, mais une dette que cette feature
   fait arriver.
2. **Contenu non validé indexé par Google.** Quelqu'un peut publier le travail
   d'un autre, visible immédiatement sous le nom de Kreevo. La modération a
   posteriori est le filet ; elle n'empêche pas la première heure en ligne.
   Conséquence assumée de la décision 1.

## Vérification

Il n'y a pas de suite de tests sur Kreevo. La preuve passe donc par :

- `npx tsc --noEmit` et `npx next build` verts ;
- le parcours réel joué en local (créer, brouillon, publier, éditer, réordonner,
  supprimer) ;
- **la nouvelle règle RLS mesurée en anonyme depuis un terminal**, jamais depuis
  le navigateur : celui-ci porte une session et la branche propriétaire de la
  policy masque la fuite. Attendu : un brouillon `portfolio` invisible, un
  projet publié visible, une soumission de challenge rejetée toujours
  invisible ;
- le verrou XP prouvé par la mesure : liker un projet perso ne doit **pas**
  bouger l'XP du propriétaire.

## Point bloquant

La migration SQL demande le PAT Supabase, que Claude n'a pas. Deux voies : soit
Marwen le fournit, soit le fichier de migration lui est livré et il l'exécute —
comme pour le bucket `onboarding`.
