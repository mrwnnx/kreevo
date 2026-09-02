-- ============================================================================
-- 020_companies_column_grants.sql
-- ----------------------------------------------------------------------------
-- Même classe de bug que celle fermée sur `profiles` par 013 : `companies_
-- owner_write` (UPDATE, 011) filtre la LIGNE (owner_id = auth.uid()) mais pas
-- les COLONNES, et Supabase accorde par défaut UPDATE au niveau TABLE
-- (toutes colonnes) à `anon`/`authenticated`. Mesuré en direct avec un
-- compte b2b réel (cf. final-fix-report.md) :
--
--   PATCH /rest/v1/companies?id=eq.<mon_id>  {"first_brief_approved": true}
--   → 200, appliqué
--   POST  /rest/v1/briefs {..., "status":"published"}
--   → 201, publié
--
-- Une entreprise s'auto-approuve, puis publie. Zéro passage par
-- l'administrateur — exactement le trou que le trigger `guard_brief_publish`
-- (015/018/019) était censé condamner, atteint par une autre porte : il
-- suffit de poser `companies.first_brief_approved = true` soi-même AVANT de
-- publier, et le trigger ne voit alors plus rien à refuser (l'entreprise
-- EST approuvée, au sens où il regarde).
--
-- Vérifié par lecture avant d'écrire (pas supposé) — seules deux écritures
-- de session existent sur `companies`, toutes deux dans
-- `src/components/features/company/actions.ts` (`saveCompany`) :
--   UPDATE (ligne 39-46) : name, logo_url, description, website_url,
--     location, updated_at
--   INSERT (ligne 57-63) : owner_id, name, logo_url, description,
--     website_url, location
-- `owner_id` est nécessaire à l'INSERT (il faut bien poser qui possède la
-- ligne créée) mais n'a aucune raison de rester modifiable ensuite — d'où
-- deux listes différentes pour INSERT et UPDATE.
--
-- Restent interdits en écriture de session, dans les deux sens : `id`
-- (clé primaire), `created_at`, `can_publish`, `first_brief_approved` — et
-- pour l'UPDATE seulement, `owner_id` (transférer sa fiche à un autre
-- compte n'a pas de sens métier et n'est jamais fait par l'app).
-- ============================================================================

begin;

revoke update on public.companies from anon;
revoke update on public.companies from authenticated;
grant update (name, logo_url, description, website_url, location, updated_at)
  on public.companies to authenticated;

revoke insert on public.companies from anon;
revoke insert on public.companies from authenticated;
grant insert (owner_id, name, logo_url, description, website_url, location)
  on public.companies to authenticated;

commit;

-- ============================================================================
-- VÉRIFICATION — depuis un terminal, avec une VRAIE session b2b PostgREST,
-- propriétaire de sa fiche entreprise :
--
--   curl -s -X PATCH "$SUPABASE_URL/rest/v1/companies?id=eq.<mon_id>" \
--     -H "apikey: $ANON" -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
--     -H "Content-Type: application/json" \
--     -d '{"first_brief_approved":true}'
--   # Attendu : 42501 permission denied for column first_brief_approved.
--
-- Puis, mêmes en-têtes, les colonnes légitimes doivent toujours s'écrire :
--   -d '{"name":"Nouveau nom","description":"..."}'
--   # Attendu : 200/204.
-- ============================================================================

-- ============================================================================
-- DOWN (rollback) — exécuter séparément. ⚠️ Rétablit la faille.
-- ============================================================================
-- begin;
-- revoke update (name, logo_url, description, website_url, location, updated_at)
--   on public.companies from authenticated;
-- revoke insert (owner_id, name, logo_url, description, website_url, location)
--   on public.companies from authenticated;
-- grant update on public.companies to anon, authenticated;
-- grant insert on public.companies to anon, authenticated;
-- commit;
