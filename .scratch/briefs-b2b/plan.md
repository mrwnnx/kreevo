# Briefs B2B — spec 1 · Plan d'implémentation

> **Pour un agent exécutant** : utiliser `superpowers:subagent-driven-development` ou
> `superpowers:executing-plans`. Un fichier par ticket sous `issues/`, conformément à
> `docs/agents/issue-tracker.md`.

**But** : une entreprise s'inscrit, rédige un brief avec une aide de l'IA, choisit qui
le voit, et les designers concernés le découvrent dans un onglet dédié.

**Architecture** : on réutilise la porte d'entrée existante. `profiles.role` gagne la
valeur `b2b`, une table `companies` porte la fiche entreprise, une table `briefs` porte
le contenu. Inscription, connexion Google, mot de passe oublié, session et RLS restent
inchangés.

**Stack** : Next.js 16 (App Router, Turbopack), React 19, Tailwind v4,
Supabase (PostgreSQL 17), TypeScript strict.

**Spec** : `.scratch/briefs-b2b/spec.md` — à lire avant tout ticket.

## Contraintes globales

Elles s'appliquent à **tous** les tickets sans être répétées.

- **Aucun trailer `Co-Authored-By` dans un message de commit.** Vercel Hobby lit les
  co-auteurs comme des collaborateurs et **bloque le build** sur un repo privé. Gate
  avant chaque push : `git log -1 --format='%B' | grep -i "co-authored-by"` ne doit
  rien rendre.
- **Aucune suite de tests dans ce repo.** La preuve d'un lot : `npx tsc --noEmit`
  (exit 0), `npx next build` (exit 0), plus la vérification propre au ticket.
  N'installe aucun framework de test.
- **Le dev local écrit dans la base de PRODUCTION** — 94 profils et 87 soumissions
  réels. Toute ligne de test doit être supprimée, et la suppression prouvée.
- **Toute vérification de visibilité se fait en anonyme depuis un terminal**, jamais
  depuis le navigateur : celui-ci porte une session et la branche propriétaire des
  policies masque les fuites.
- **Ne jamais conclure au succès sur l'absence d'erreur.** Un `UPDATE` dont le `WHERE`
  ne matche aucune ligne renvoie `204` sans erreur. Chaîner `.select('id')` et vérifier
  qu'une ligne a été touchée. C'est le fil rouge des chantiers précédents de ce repo.
- **Les actions admin de ce repo avalent silencieusement leurs erreurs** (constat
  documenté). Ne pas reproduire ce pattern.
- **Jamais de `select('*')`** — colonnes explicites, règle posée après un audit.
- **Ne rien importer depuis `src/lib/utils/submissions.ts`** dans un module atteignable
  côté client : SDK Anthropic au top-level, casse le build Turbopack en aval.
- Migrations applicables par la Management API :
  `POST https://api.supabase.com/v1/projects/ndflytgtduuvacjmdobc/database/query`.
- i18n fr/en/ar, RTL compris. Design system pastel, pas de Material.
- Messages de commit en anglais.

## Ce que le terrain impose

- **Un trigger `handle_new_user()` sur `auth.users` crée le profil** en lisant
  `raw_user_meta_data` (`username`, `full_name`, `avatar_url`) et applique la promo
  `plan='pro'` jusqu'au 2026-12-31. C'est **là** qu'il faut poser le rôle `b2b`, et non
  par une mise à jour après coup qui laisserait une fenêtre où l'entreprise ressemble à
  un designer.
- `challenges` porte déjà la structure d'un brief : on la copie, on ne la partage pas.
- `requireAdmin()` (`src/lib/admin.ts`) est le motif d'autorisation admin du repo.

## Un mot de vocabulaire qui évite un contresens

Dans cette spec, **« public » ne signifie pas « visible du monde entier »**. Un brief
public s'affiche dans l'onglet Brief des designers ciblés, **derrière une connexion**.
Il s'oppose à « privé par lien », pas à « confidentiel ». Conséquence : **aucun brief,
public ou privé, n'entre dans le sitemap**, et la seule page ouverte sans compte est
celle du lien privé — protégée par son jeton.

## Les lots, dans l'ordre

| # | Lot | Livrable vérifiable seul |
|---|---|---|
| 01 | Migration : rôle `b2b`, `companies`, `briefs`, bucket, RLS | La base accepte une entreprise et un brief, rien ne fuit |
| 02 | Inscription entreprise + fiche + espace dédié | Une entreprise s'inscrit et arrive chez elle |
| 03 | Rédaction du brief et brouillon | Elle écrit et retrouve son brouillon |
| 04 | Assistance IA « améliorer » champ par champ | Un champ est reformulé sur demande, et seulement sur demande |
| 05 | Publication : visibilité, ligues, échéance, plafond | Le brief part en attente de validation |
| 06 | Modération : file admin et validation du premier brief | Marwen publie ou refuse |
| 07 | Onglet Brief côté designer | Un designer Pro de la bonne ligue le voit |
| 08 | Page du lien privé + `noindex` + sitemap | Un brief privé s'ouvre par son lien et n'est indexé nulle part |

**Dépendances** : 02→01, 03→02, 04→03, 05→03, 06→05, 07→05, 08→05.
Le lot 06 précède 07 et 08 en pratique : sans validation, aucun brief n'est publié,
donc rien à afficher.
