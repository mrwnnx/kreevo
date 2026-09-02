-- ============================================================================
-- 017_companies_read_columns.sql
-- ----------------------------------------------------------------------------
-- `companies_public_read` (011) est `for select using (true)`, sans
-- restriction de colonne ni de rôle : `owner_id`, `can_publish` et
-- `first_brief_approved` sortent en anonyme, avec `select *`. `owner_id`
-- relie publiquement un compte `profiles` à une entreprise ; `can_publish`
-- prépare un futur abonnement payant ; `first_brief_approved` dit
-- publiquement quelle entreprise est encore en probation — aucun des trois
-- n'a de raison de sortir d'un GET anonyme.
--
-- MOYEN CHOISI : ni un pur grant colonne, ni une pure vue, mais les deux —
-- parce qu'un grant colonne seul ne peut pas exprimer "ces colonnes,
-- seulement sur MA propre ligne" (un GRANT n'est pas scopé par ligne, une
-- policy RLS oui) :
--
--   1. La policy `companies_public_read` (using true, ouverte à tout le
--      monde) est remplacée par `companies_owner_select`, restreinte à
--      `owner_id = auth.uid()` — l'entreprise continue de lire SA PROPRE
--      fiche en entier (y compris can_publish/first_brief_approved) par le
--      client de session, exactement comme avant pour elle-même.
--   2. Une vue `companies_public` expose uniquement les colonnes nécessaires
--      à l'affichage d'un brief — id, name, logo_url, description,
--      website_url, location — pour TOUTES les entreprises. Une vue, non
--      security_invoker, tourne avec les droits de son propriétaire (le rôle
--      de migration, qui contourne la RLS) : elle ne re-consulte donc pas la
--      policy resserrée de la table de base, et ne peut de toute façon pas
--      exposer owner_id/can_publish/first_brief_approved puisqu'ils ne sont
--      même pas dans sa définition.
--
-- Vérifié avant d'écrire (grep de `.from('companies')`, 2026-09-02) : tous
-- les appels au client de SESSION passant par des colonnes privées
-- (`can_publish`, `first_brief_approved`) sont déjà filtrés par
-- `.eq('owner_id', user.id)` — donc lisent leur propre ligne, couverte par
-- (1). Les deux seuls appels lisant le nom/logo d'une AUTRE entreprise que la
-- sienne par le client de session sont les embeds PostgREST
-- `companies(name, logo_url, …)` de
-- src/app/(dashboard)/dashboard/briefs/{page,[id]/page}.tsx — un embed suit
-- la relation de la TABLE de base, pas d'une vue, donc `owner_id =
-- auth.uid()` les aurait cassés pour tout brief qui n'appartient pas au
-- designer qui regarde. Ces deux fichiers sont donc changés dans le même lot
-- pour lire `companies_public` via un second aller (join fait en JS), pas
-- l'embed.
-- ============================================================================

begin;

drop policy if exists "companies_public_read" on public.companies;
create policy "companies_owner_select" on public.companies for select
  to authenticated
  using (owner_id = auth.uid());

create or replace view public.companies_public as
  select id, name, logo_url, description, website_url, location
  from public.companies;

-- ⚠️ Piège découvert en appliquant cette migration (2026-09-02) : Supabase
-- accorde par défaut TOUT (INSERT/UPDATE/DELETE/TRUNCATE, pas seulement
-- SELECT) à `anon`/`authenticated` sur toute nouvelle relation créée dans
-- `public` — même comportement que celui documenté en 013 pour les tables.
-- Cette vue est un simple SELECT sur une seule relation (pas de DISTINCT, pas
-- d'agrégat, pas d'UNION) : Postgres la considère "automatiquement
-- modifiable" et réécrit un UPDATE/INSERT/DELETE dessus en la même opération
-- sur `public.companies` — EXÉCUTÉE AVEC LES DROITS DU PROPRIÉTAIRE DE LA VUE
-- (celui qui contourne la RLS, cf. plus haut), pas ceux de l'appelant. Sans
-- ce `revoke`, n'importe quel `authenticated` (et même `anon`) aurait pu
-- écrire `owner_id`/`can_publish`/`first_brief_approved` de N'IMPORTE QUELLE
-- entreprise via `PATCH .../companies_public`, en contournant la RLS que 017
-- vient justement de resserrer. D'où le `revoke all` explicite avant de ne
-- régrant que `select` — ne jamais se fier au grant par défaut d'une vue.
revoke all on public.companies_public from anon, authenticated;
grant select on public.companies_public to anon, authenticated;

commit;

-- ============================================================================
-- VÉRIFICATION — depuis un terminal, SANS session (clé anon seule) :
--
--   curl -s "$SUPABASE_URL/rest/v1/companies?select=*" \
--     -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
--   # Attendu : [] — plus aucune ligne, colonnes sensibles comprises.
--
--   curl -s "$SUPABASE_URL/rest/v1/companies_public?select=*" \
--     -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
--   # Attendu : les mêmes lignes qu'avant (0 en prod aujourd'hui), mais avec
--   # SEULEMENT id/name/logo_url/description/website_url/location — jamais
--   # owner_id, can_publish, first_brief_approved.
--
-- Puis, avec un token utilisateur `authenticated` propriétaire d'une fiche :
--   curl -s "$SUPABASE_URL/rest/v1/companies?select=*&owner_id=eq.<user_id>" \
--     -H "apikey: $ANON" -H "Authorization: Bearer $USER_ACCESS_TOKEN"
--   # Attendu : la fiche complète, can_publish/first_brief_approved compris.
-- ============================================================================

-- ============================================================================
-- DOWN (rollback) — exécuter séparément.
-- ============================================================================
-- begin;
-- revoke select on public.companies_public from anon, authenticated;
-- drop view if exists public.companies_public;
-- drop policy if exists "companies_owner_select" on public.companies;
-- create policy "companies_public_read" on public.companies for select using (true);
-- commit;
