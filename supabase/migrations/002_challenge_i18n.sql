-- ============================================================================
-- 002_challenge_i18n.sql
-- Multilingual challenges (Model C — admin writes a source language, AI fills
-- the other two, admin validates before publish).
--
-- Non-destructive & reversible:
--   • Adds per-language columns (_fr/_en/_ar) for the 6 text fields.
--   • Adds source_lang + translation_status (jsonb, one status per language).
--   • Back-fills existing rows from the legacy columns as French, validated.
--   • LEGACY columns (title, brief, context, deliverable, constraints, criteria)
--     are KEPT — they keep their NOT NULL constraint and act as a mirror of the
--     source language + final read fallback. Nothing is dropped or altered.
--
-- ⚠️ NOT auto-applied. Review, then run via Supabase SQL editor / Management API.
-- A DOWN section at the bottom reverts every change.
-- ============================================================================

begin;

-- ── 1. Per-language text columns (all nullable → additive, safe) ────────────
alter table public.challenges
  add column if not exists title_fr        text,
  add column if not exists title_en        text,
  add column if not exists title_ar        text,
  add column if not exists brief_fr        text,
  add column if not exists brief_en        text,
  add column if not exists brief_ar        text,
  add column if not exists context_fr      text,
  add column if not exists context_en      text,
  add column if not exists context_ar      text,
  add column if not exists deliverable_fr  text,
  add column if not exists deliverable_en  text,
  add column if not exists deliverable_ar  text,
  add column if not exists constraints_fr  text,
  add column if not exists constraints_en  text,
  add column if not exists constraints_ar  text,
  add column if not exists criteria_fr     text,
  add column if not exists criteria_en     text,
  add column if not exists criteria_ar     text;

-- ── 2. Source language + per-language translation status ────────────────────
alter table public.challenges
  add column if not exists source_lang text not null default 'fr'
    check (source_lang in ('fr', 'en', 'ar')),
  add column if not exists translation_status jsonb not null
    default '{"fr":"draft","en":"draft","ar":"draft"}'::jsonb;

-- ── 3. Back-fill existing rows (idempotent: only rows not yet migrated) ──────
-- Existing content is the hand-written canonical French version.
update public.challenges set
  title_fr       = title,
  brief_fr       = brief,
  context_fr     = context,
  deliverable_fr = deliverable,
  constraints_fr = constraints,
  criteria_fr    = criteria,
  source_lang    = 'fr',
  translation_status = '{"fr":"validated","en":"draft","ar":"draft"}'::jsonb
where title_fr is null;

commit;

-- ============================================================================
-- DOWN (rollback) — run this block to fully revert 002.
-- ----------------------------------------------------------------------------
-- begin;
-- alter table public.challenges
--   drop column if exists title_fr,        drop column if exists title_en,        drop column if exists title_ar,
--   drop column if exists brief_fr,        drop column if exists brief_en,        drop column if exists brief_ar,
--   drop column if exists context_fr,      drop column if exists context_en,      drop column if exists context_ar,
--   drop column if exists deliverable_fr,  drop column if exists deliverable_en,  drop column if exists deliverable_ar,
--   drop column if exists constraints_fr,  drop column if exists constraints_en,  drop column if exists constraints_ar,
--   drop column if exists criteria_fr,     drop column if exists criteria_en,     drop column if exists criteria_ar,
--   drop column if exists source_lang,
--   drop column if exists translation_status;
-- commit;
-- ============================================================================
