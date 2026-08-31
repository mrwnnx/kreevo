# Portfolio — projets personnels · Plan d'implémentation

> **Pour un agent exécutant** : utiliser `superpowers:subagent-driven-development`
> ou `superpowers:executing-plans`. Les étapes sont des cases à cocher.
> Les tickets sont un fichier par lot sous `issues/`, conformément à
> `docs/agents/issue-tracker.md`.

**But** : permettre à chaque utilisateur de publier ses propres projets — hors
challenge — avec le parcours de Dribbble et le design system de Kreevo.

**Architecture** : une seule table. `submissions` gagne une colonne `kind`
(`challenge` | `portfolio`). Un projet perso est une ligne sans challenge, sans
validation et sans XP. Les likes, commentaires, signalements, vues, le feed
mélangé et la file de modération sont réutilisés tels quels.

**Stack** : Next.js 16 (App Router, Turbopack), React 19, Tailwind v4,
Supabase (PostgreSQL 17), TypeScript strict.

**Spec** : `.scratch/portfolio-projets/spec.md` — à lire avant tout ticket.

## Contraintes globales

Elles s'appliquent à **tous** les tickets, sans être répétées dans chacun.

- **Aucun trailer `Co-Authored-By` dans les messages de commit.** Vercel plan
  Hobby lit les co-auteurs comme des collaborateurs et **bloque le build** sur
  un repo privé. Gate obligatoire avant chaque push :
  `git log -1 --format='%B' | grep -i "co-authored-by"` doit ne rien rendre.
- **Il n'y a aucune suite de tests dans ce repo.** La preuve d'un lot passe par
  `npx tsc --noEmit` (exit 0), `npx next build` (exit 0), et la vérification
  propre au ticket. Ne pas installer de framework de test : hors périmètre.
- **Le dev local écrit dans la base de PROD.** Ne jamais jouer un parcours
  destructif sur de la donnée réelle ; créer ses propres lignes de test et les
  nettoyer.
- **Toute vérification de RLS se fait en anonyme depuis un terminal**, jamais
  depuis le navigateur : celui-ci porte une session et la branche propriétaire
  de la policy masque la fuite.
- `kind` vaut `'challenge'` par défaut, contrainte CHECK `in ('challenge','portfolio')`.
- Un projet `portfolio` ne déclenche **aucun appel Anthropic** et **aucune
  écriture d'XP**.
- Taxonomie **obligatoire** à la publication : spécialité, industrie, type de
  projet, outils.
- Bucket de stockage réutilisé : `submissions` (public, 5 Mo, images fixes).
- Ordre du portfolio : `pinned_at desc nulls last`, puis
  `portfolio_position asc nulls last`, puis `created_at desc`.
- URL publique d'un projet : `/p/[id]`, servant les deux `kind`.
- Seuil de signalement inchangé à **3**. Pour `kind='portfolio'`, il passe
  `is_visible` à `false` (et non `validation_status='on_hold'`).

## Les lots, dans l'ordre d'exécution

| # | Lot | Livrable vérifiable seul |
|---|---|---|
| 01 | Migration : colonnes + CHECK + RLS | La base accepte `kind`, et un projet perso publié est lisible en anonyme |
| 02 | Verrou XP | Liker et commenter un projet perso ne bouge plus l'XP du propriétaire |
| 03 | Formulaire d'ajout `/dashboard/projects/new` | On crée et publie un projet perso de bout en bout |
| 04 | Liste « Mes projets » + brouillon + édition | On retrouve, rouvre et modifie ses projets |
| 05 | Suppression (précédée de l'audit des clés étrangères) | Un projet supprimé disparaît vraiment, likes et commentaires compris |
| 06 | Page publique `/p/[id]` | Un projet est consultable et partageable sans compte |
| 07 | `/u/[username]` : projets perso, bouton d'ajout, ordre | Le portfolio public affiche les deux types |
| 08 | `/discover` : feed mélangé + badge « validé » | Les projets perso apparaissent, le travail validé est identifiable |
| 09 | Réorganisation : épingler et ordonner | L'auteur ordonne sa vitrine entière |
| 10 | Modération des projets perso | 3 signalements masquent un projet, l'admin restaure |

**Dépendances** : 02→01, 03→01, 04→03, 05→04, 06→01, 07→01+06, 08→01+06,
09→07, 10→01. Les lots 06, 07 et 08 se tiennent : livrer 08 sans 06 produirait
des cartes qui mènent à une page interdite aux visiteurs.
