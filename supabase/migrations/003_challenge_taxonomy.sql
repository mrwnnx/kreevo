-- ============================================================================
-- 003_challenge_taxonomy.sql
-- Challenge Types & Industries as admin-managed CRUD tables (Lot 1/3).
--
-- - challenge_types / industries: multilingual labels (name_fr/en/ar) with the
--   same translation_status jsonb shape as challenges. challenge_types keeps a
--   `specialty` text column to preserve the hardcoded TYPES[specialty] grouping.
-- - Seeded from the 18 distinct types + 25 industries (incl. "Environnement",
--   unused) as French, validated. en/ar empty → fallback to fr at read time.
-- - challenges gets nullable FK columns challenge_type_id / industry_id,
--   back-filled by exact name match. LEGACY text columns (challenge_type,
--   industry) are KEPT (non-destructive; cleanup in Lot 3).
-- - specialty is intentionally NOT migrated (stays hardcoded — onboarding/XP logic).
--
-- ⚠️ NOT auto-applied. Review then run. DOWN section at the bottom reverts it.
-- ============================================================================

begin;

-- ── 1. Reference tables ─────────────────────────────────────────────────────
create table if not exists public.challenge_types (
  id uuid primary key default gen_random_uuid(),
  name_fr text unique,
  name_en text,
  name_ar text,
  specialty text,                       -- 'UX Designer' | 'UI Designer' | 'Graphic Designer'
  translation_status jsonb not null default '{"fr":"draft","en":"draft","ar":"draft"}'::jsonb,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.industries (
  id uuid primary key default gen_random_uuid(),
  name_fr text unique,
  name_en text,
  name_ar text,
  translation_status jsonb not null default '{"fr":"draft","en":"draft","ar":"draft"}'::jsonb,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- ── 2. Seed challenge_types (grouped by specialty, TS order preserved) ──────
insert into public.challenge_types (name_fr, specialty, display_order, translation_status)
values
  ('User Flow',        'UX Designer',      1,  '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('UX Research',      'UX Designer',      2,  '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Wireframes',       'UX Designer',      3,  '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('UX Case Study',    'UX Designer',      4,  '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Prototype',        'UX Designer',      5,  '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('IA / Navigation',  'UX Designer',      6,  '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('UI Screen',        'UI Designer',      7,  '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('UI Kit',           'UI Designer',      8,  '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Design System',    'UI Designer',      9,  '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Redesign',         'UI Designer',      10, '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Dark Mode',        'UI Designer',      11, '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Dashboard',        'UI Designer',      12, '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Logo',             'Graphic Designer', 13, '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Brand Identity',   'Graphic Designer', 14, '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Affiche',          'Graphic Designer', 15, '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Social Media Kit', 'Graphic Designer', 16, '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Packaging',        'Graphic Designer', 17, '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Motion',           'Graphic Designer', 18, '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb)
on conflict (name_fr) do nothing;

-- ── 3. Seed industries (25, incl. unused "Environnement") ───────────────────
insert into public.industries (name_fr, display_order, translation_status)
values
  ('Fintech',         1,  '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('E-commerce',      2,  '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('SaaS',            3,  '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Retail',          4,  '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Immobilier',      5,  '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Santé',           6,  '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Fitness',         7,  '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Nutrition',       8,  '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Bien-être',       9,  '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Éducation',       10, '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Musique',         11, '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Gaming',          12, '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Streaming',       13, '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Sport',           14, '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Mode',            15, '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Food & Beverage', 16, '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Voyage',          17, '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Luxe',            18, '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Beauté',          19, '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('IA',              20, '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Cybersécurité',   21, '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Crypto',          22, '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Mobilité',        23, '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('ONG',             24, '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb),
  ('Environnement',   25, '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb)
on conflict (name_fr) do nothing;

-- ── 4. FK columns on challenges (nullable) + back-fill by name ──────────────
alter table public.challenges
  add column if not exists challenge_type_id uuid references public.challenge_types(id),
  add column if not exists industry_id       uuid references public.industries(id);

update public.challenges c
  set challenge_type_id = t.id
  from public.challenge_types t
  where t.name_fr = c.challenge_type and c.challenge_type_id is null;

update public.challenges c
  set industry_id = i.id
  from public.industries i
  where i.name_fr = c.industry and c.industry_id is null;

-- Helpful indexes for the FK lookups.
create index if not exists idx_challenges_challenge_type_id on public.challenges(challenge_type_id);
create index if not exists idx_challenges_industry_id       on public.challenges(industry_id);

commit;

-- ============================================================================
-- DOWN (rollback) — run this block to fully revert 003.
-- ----------------------------------------------------------------------------
-- begin;
-- drop index if exists public.idx_challenges_challenge_type_id;
-- drop index if exists public.idx_challenges_industry_id;
-- alter table public.challenges
--   drop column if exists challenge_type_id,
--   drop column if exists industry_id;
-- drop table if exists public.challenge_types;
-- drop table if exists public.industries;
-- commit;
-- ============================================================================
