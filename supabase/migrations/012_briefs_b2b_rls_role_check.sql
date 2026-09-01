-- ============================================================================
-- 012_briefs_b2b_rls_role_check.sql
-- Correction sur 011 : `companies_owner_insert` et `briefs_owner_write` ne
-- vérifiaient que la propriété (owner_id = auth.uid()), pas le rôle. N'importe
-- quel compte designer authentifié pouvait se déclarer entreprise par un appel
-- REST direct. 011 est corrigé pour qu'un environnement neuf porte déjà ce
-- contrôle ; cette migration applique le même changement à la base existante.
-- Cf. .scratch/briefs-b2b/spec.md
-- ============================================================================
begin;

drop policy if exists "companies_owner_insert" on public.companies;
create policy "companies_owner_insert" on public.companies for insert
  with check (
    owner_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'b2b')
  );

drop policy if exists "briefs_owner_write" on public.briefs;
create policy "briefs_owner_write" on public.briefs for insert
  with check (
    company_id in (select id from public.companies where owner_id = auth.uid())
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'b2b')
  );

commit;

-- ============================================================================
-- DOWN — exécuter séparément.
-- ============================================================================
-- begin;
-- drop policy if exists "companies_owner_insert" on public.companies;
-- create policy "companies_owner_insert" on public.companies for insert
--   with check (owner_id = auth.uid());
-- drop policy if exists "briefs_owner_write" on public.briefs;
-- create policy "briefs_owner_write" on public.briefs for insert
--   with check (company_id in (select id from public.companies where owner_id = auth.uid()));
-- commit;
