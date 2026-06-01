-- ============================================================================
-- 005_feedback_lang.sql
-- Track the language each AI feedback was generated in, so the UI can offer a
-- "Translate feedback" button only when the user's active locale differs.
--
-- Non-destructive: adds one nullable text column. Existing rows are back-filled
-- to 'en' (feedbacks created before the Part-2 localized-prompt change were
-- generated in hardcoded English).
--
-- ⚠️ NOT auto-applied. Review then run in the SQL editor. DOWN section below.
-- ============================================================================

begin;

alter table public.submission_feedbacks
  add column if not exists lang text;

update public.submission_feedbacks
  set lang = 'en'
  where lang is null;

commit;

-- ============================================================================
-- DOWN (rollback) — run this block to fully revert 005.
-- ----------------------------------------------------------------------------
-- begin;
-- alter table public.submission_feedbacks drop column if exists lang;
-- commit;
-- ============================================================================
