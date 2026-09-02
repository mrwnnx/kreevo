-- ============================================================================
-- 021_briefs_column_grants.sql
-- ----------------------------------------------------------------------------
-- Même dette que 020, sur `briefs` : `briefs_owner_update`/`briefs_owner_
-- write` filtrent la ligne, pas les colonnes, et `anon`/`authenticated` ont
-- INSERT/UPDATE au niveau TABLE par défaut.
--
-- Vérifié par lecture avant d'écrire — deux fichiers écrivent `briefs` en
-- session, tous deux dans `src/components/features/brief/` et
-- `src/app/api/briefs/[id]/token/route.ts` :
--   `saveBrief` UPDATE  : title, context, brief, constraints, criteria,
--     deliverable, specialty_id, industry_id, project_type_id, visibility,
--     target_league_ids, deadline_at, max_responses, access_token, et
--     conditionnellement status/published_at (branche "publish").
--   `saveBrief` INSERT  : les mêmes, plus `company_id` (posé une seule fois,
--     à la création).
--   token/route.ts UPDATE : `access_token` seul.
-- `company_id` n'est JAMAIS réécrit par un UPDATE de session — seulement posé
-- à l'INSERT. `rejection_reason` n'est jamais écrit par un client de
-- session : seule la route d'approbation (service role) l'écrit au refus.
--
-- Mesuré avant de fermer (pas supposé) : un `PATCH company_id` vers une AUTRE
-- entreprise était déjà refusé par la RLS elle-même — `briefs_owner_update`
-- n'a pas de `with check` explicite, donc Postgres réutilise le `using`
-- (`company_id in (select id from companies where owner_id = auth.uid())`)
-- comme check sur la ligne APRÈS écriture : la nouvelle valeur de
-- `company_id` doit, elle aussi, appartenir à l'appelant. `owner_id` étant
-- unique en base (une entreprise = un compte), la seule valeur qui passe ce
-- check est l'id de sa PROPRE entreprise — un no-op. Confirmé par une vraie
-- requête PostgREST avant cette migration (cf. final-fix-report.md) : refusé
-- par la RLS, sans avoir besoin du grant colonne. La colonne est quand même
-- retirée du grant UPDATE ci-dessous, en profondeur — l'app ne l'écrit
-- jamais par UPDATE, et une future policy plus permissive ne devrait pas
-- pouvoir réhabiliter ce chemin silencieusement.
--
-- `access_token` et `status` restent accordés : l'app les écrit
-- légitimement (régénération du jeton, passage en revue/publication), et
-- restreindre `status` casserait la sauvegarde normale d'un brief. Le
-- verrou sur le passage à `published` reste le trigger `guard_brief_publish`
-- (015/018/019), pas ce grant — même dette assumée que `xp`/`league` dans
-- 013 pour `profiles` : la colonne doit rester ouverte pour l'usage légitime,
-- le contrôle vit ailleurs (ici un trigger, pas une policy).
-- ============================================================================

begin;

revoke update on public.briefs from anon;
revoke update on public.briefs from authenticated;
grant update (
  title, context, brief, constraints, criteria, deliverable,
  specialty_id, industry_id, project_type_id,
  visibility, target_league_ids, deadline_at, max_responses,
  access_token, status, published_at
) on public.briefs to authenticated;

revoke insert on public.briefs from anon;
revoke insert on public.briefs from authenticated;
grant insert (
  company_id, title, context, brief, constraints, criteria, deliverable,
  specialty_id, industry_id, project_type_id,
  visibility, target_league_ids, deadline_at, max_responses,
  access_token, status, published_at
) on public.briefs to authenticated;

commit;

-- ============================================================================
-- VÉRIFICATION — depuis un terminal, avec une VRAIE session b2b PostgREST,
-- propriétaire d'un brief :
--
--   curl -s -X PATCH "$SUPABASE_URL/rest/v1/briefs?id=eq.<mon_brief>" \
--     -H "apikey: $ANON" -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
--     -H "Content-Type: application/json" \
--     -d '{"company_id":"<une_autre_entreprise>"}'
--   # Attendu : 42501 permission denied for column company_id.
--
-- Puis, mêmes en-têtes, une sauvegarde normale doit continuer de marcher :
--   -d '{"title":"Nouveau titre","deadline_at":"2027-01-01T23:59:59Z"}'
--   # Attendu : 200/204.
-- ============================================================================

-- ============================================================================
-- DOWN (rollback) — exécuter séparément. ⚠️ Rétablit la faille.
-- ============================================================================
-- begin;
-- revoke update (
--   title, context, brief, constraints, criteria, deliverable,
--   specialty_id, industry_id, project_type_id,
--   visibility, target_league_ids, deadline_at, max_responses,
--   access_token, status, published_at
-- ) on public.briefs from authenticated;
-- revoke insert (
--   company_id, title, context, brief, constraints, criteria, deliverable,
--   specialty_id, industry_id, project_type_id,
--   visibility, target_league_ids, deadline_at, max_responses,
--   access_token, status, published_at
-- ) on public.briefs from authenticated;
-- grant update on public.briefs to anon, authenticated;
-- grant insert on public.briefs to anon, authenticated;
-- commit;
