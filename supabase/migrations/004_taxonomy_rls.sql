-- ============================================================================
-- 004_taxonomy_rls.sql
-- RLS for the taxonomy reference tables (challenge_types, industries).
--
-- Mirrors the existing `leagues` pattern exactly:
--   <table>_public_read  — FOR SELECT, USING (true)        (labels shown publicly)
--   <table>_admin_write  — FOR ALL, USING (profiles.role = 'admin' for auth.uid())
-- The service role (supabaseAdmin) bypasses RLS, so the /api/admin routes and
-- server-side reads keep working; the public_read policy covers the anon role.
--
-- Note: 003 created these tables WITHOUT RLS — this enables it.
-- ⚠️ NOT auto-applied. Review then run. DOWN section at the bottom reverts it.
-- ============================================================================

begin;

alter table public.challenge_types enable row level security;
alter table public.industries enable row level security;

create policy "challenge_types_public_read" on public.challenge_types
  for select using (true);

create policy "challenge_types_admin_write" on public.challenge_types
  for all using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

create policy "industries_public_read" on public.industries
  for select using (true);

create policy "industries_admin_write" on public.industries
  for all using (
    exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'admin')
  );

commit;

-- ============================================================================
-- DOWN (rollback) — run this block to fully revert 004.
-- ----------------------------------------------------------------------------
-- begin;
-- drop policy if exists "challenge_types_public_read" on public.challenge_types;
-- drop policy if exists "challenge_types_admin_write" on public.challenge_types;
-- drop policy if exists "industries_public_read" on public.industries;
-- drop policy if exists "industries_admin_write" on public.industries;
-- alter table public.challenge_types disable row level security;
-- alter table public.industries disable row level security;
-- commit;
-- ============================================================================
