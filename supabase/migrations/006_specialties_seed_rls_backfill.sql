-- ============================================================================
-- 006_specialties_seed_rls_backfill.sql   (PHASE 1)
-- ----------------------------------------------------------------------------
-- La table `specialties` et les FK `profiles.specialty_id` / `challenges.specialty_id`
-- PRÉEXISTENT en prod (créées hors-migration). Cette migration ne crée donc
-- NI table NI colonne NI FK : elle se contente de
--   1. seeder les 2 specialties (ux_ui, graphic) — idempotent
--   2. poser les RLS policies manquantes (RLS est activé mais 0 policy)
--   3. backfiller specialty_id depuis les colonnes texte legacy
--
-- Les colonnes texte `specialty` (profiles/challenges) sont CONSERVÉES (drop en PHASE 7).
-- Réversible : voir bloc DOWN en bas.
-- ============================================================================

begin;

-- ── 1. SEED specialties (idempotent via UNIQUE(slug)) ───────────────────────
insert into public.specialties (slug, name, name_fr, name_en, name_ar, emoji, order_index, is_active)
values
  ('ux_ui',   'UX/UI Design',   'UX/UI',     'UX/UI',          'تصميم تجربة وواجهة المستخدم', '✏️', 1, true),
  ('graphic', 'Graphic Design', 'Graphisme', 'Graphic Design', 'تصميم جرافيك',                '🎨', 2, true)
on conflict (slug) do nothing;

-- ── 2. RLS POLICIES (mirror du pattern projet : challenge_types/industries/leagues) ──
-- Public read : lecture autorisée à tous UNIQUEMENT pour les specialties actives.
-- (les admins lisent quand même les inactives via la policy admin_write FOR ALL ci-dessous)
drop policy if exists specialties_public_read on public.specialties;
create policy specialties_public_read
  on public.specialties
  for select
  using (is_active = true);

-- Admin write : INSERT/UPDATE/DELETE (et SELECT des inactives) réservés aux admins.
-- Pattern identique à challenge_types_admin_write / industries_admin_write.
drop policy if exists specialties_admin_write on public.specialties;
create policy specialties_admin_write
  on public.specialties
  for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

-- ── 3. BACKFILL profiles.specialty (texte) → specialty_id (FK) ──────────────
-- UUID résolus par slug (jamais hardcodés). NULL / '' laissés tels quels.
update public.profiles
   set specialty_id = (select id from public.specialties where slug = 'ux_ui')
 where specialty in ('ux_ui', 'UX/UI', 'UI Design', 'Interaction Design', 'Product Design');

update public.profiles
   set specialty_id = (select id from public.specialties where slug = 'graphic')
 where specialty in ('graphic', 'Visual Design');

-- ── 3b. BACKFILL challenges.specialty (texte) → specialty_id (FK) ───────────
update public.challenges
   set specialty_id = (select id from public.specialties where slug = 'ux_ui')
 where specialty in ('UX Designer', 'UI Designer');

update public.challenges
   set specialty_id = (select id from public.specialties where slug = 'graphic')
 where specialty in ('Graphic Designer');

commit;

-- ============================================================================
-- DOWN  (rollback) — exécuter ce bloc séparément pour annuler.
-- Ne DROP PAS la table specialties (elle préexiste à cette migration).
-- ----------------------------------------------------------------------------
-- begin;
--
-- -- 1. Vider les FK (retour à l'état pré-migration : tout NULL)
-- --    (doit précéder le DELETE du seed à cause de la contrainte FK)
-- update public.profiles   set specialty_id = null where specialty_id is not null;
-- update public.challenges set specialty_id = null where specialty_id is not null;
--
-- -- 2. Supprimer les policies posées par cette migration
-- drop policy if exists specialties_public_read  on public.specialties;
-- drop policy if exists specialties_admin_write  on public.specialties;
--
-- -- 3. Supprimer les 2 rows seed (par slug)
-- delete from public.specialties where slug in ('ux_ui', 'graphic');
--
-- commit;
-- ============================================================================
