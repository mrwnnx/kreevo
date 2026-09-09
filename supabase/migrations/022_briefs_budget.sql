-- ============================================================================
-- 022_briefs_budget.sql
-- ----------------------------------------------------------------------------
-- Le wizard de rédaction (maquette Figma `579:475`) demande un budget à
-- l'entreprise et l'affiche sur l'écran de récapitulatif (« $4,534 »).
--
-- ⚠️ Décision produit de Marwen du 2026-09-09 : elle RENVERSE la décision n°4
-- de la spec (« aucune mission rémunérée, aucun montant, Kreevo ne touche pas
-- à l'argent »). L'objection lui a été posée avant écriture, il a maintenu.
-- Kreevo ne traite toujours aucun paiement : la colonne ne fait qu'AFFICHER un
-- ordre de grandeur donné par l'entreprise.
--
-- Le montant est facultatif — la maquette dit « No commitment — a rough
-- estimate is totally fine » et l'étape est passable.
--
-- ⚠️ Le grant colonne n'est PAS un détail : `021` a révoqué INSERT/UPDATE au
-- niveau TABLE pour n'accorder qu'une liste nominative de colonnes. Une
-- colonne ajoutée après coup n'est donc PAS écrivable par une session — le
-- champ serait rejeté en `42501` alors que la RLS, elle, laisse passer. C'est
-- le piège symétrique de `014` (bucket sans policy) : la fonctionnalité a
-- l'air branchée et ne marche pas.
-- ============================================================================

begin;

alter table public.briefs
  add column if not exists budget numeric(12, 2);

comment on column public.briefs.budget is
  'Budget indicatif saisi par l''entreprise, facultatif. Purement déclaratif : '
  'Kreevo n''encaisse rien et ne se porte garant d''aucun montant.';

-- Un montant négatif n'a pas de sens ; `null` reste le cas normal (non précisé).
alter table public.briefs
  drop constraint if exists briefs_budget_non_negative;
alter table public.briefs
  add constraint briefs_budget_non_negative
  check (budget is null or budget >= 0);

-- Grants colonne — s'ajoutent à la liste nominative posée par `021`.
grant update (budget) on public.briefs to authenticated;
grant insert (budget) on public.briefs to authenticated;

commit;

-- ============================================================================
-- VÉRIFICATION
--
--   select column_name, data_type, is_nullable
--     from information_schema.columns
--    where table_name = 'briefs' and column_name = 'budget';
--   -- Attendu : numeric, YES.
--
--   select privilege_type
--     from information_schema.column_privileges
--    where table_name = 'briefs' and column_name = 'budget'
--      and grantee = 'authenticated';
--   -- Attendu : INSERT et UPDATE. `anon` ne doit RIEN retourner.
--
--   -- Et le contrôle qui compte, avec une vraie session b2b PostgREST :
--   --   -d '{"budget":4534}'   → 200/204
--   --   -d '{"budget":-1}'     → 23514 violation de contrainte
-- ============================================================================

-- ============================================================================
-- DOWN (rollback) — exécuter séparément.
-- ============================================================================
-- begin;
-- revoke update (budget) on public.briefs from authenticated;
-- revoke insert (budget) on public.briefs from authenticated;
-- alter table public.briefs drop constraint if exists briefs_budget_non_negative;
-- alter table public.briefs drop column if exists budget;
-- commit;
