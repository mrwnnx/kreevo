-- ============================================================================
-- 008_submissions_rls_tighten.sql
-- ----------------------------------------------------------------------------
-- La lecture publique de `submissions` laisse passer les brouillons et les
-- soumissions rejetées. Mesuré le 2026-08-15 avec la clé anon (celle qui part
-- dans le navigateur), sans être connecté : 81 lignes lisibles, dont 1 avec
-- is_draft = true et 15 avec validation_status = 'rejected'.
-- La policy en place filtre `is_visible` et rien d'autre.
--
-- Deux policies distinctes plutôt qu'une :
--   * lecture publique — uniquement le travail visible, fini et approuvé ;
--   * lecture propriétaire — un user voit TOUJOURS ses propres lignes, y compris
--     brouillon et rejeté. Sans elle, `dashboard/challenges/[id]/submit` casse :
--     c'est la seule page qui relit la soumission de l'utilisateur via le client
--     soumis à la RLS (toutes les autres passent par supabaseAdmin, qui la
--     contourne — donc /discover, /history et la page de détail ne bougent pas).
--
-- ⚠️ AVANT D'EXÉCUTER — relever les policies actuelles, leurs noms sont inconnus
-- de cette migration :
--     select policyname, cmd, roles, qual
--     from pg_policies where tablename = 'submissions';
-- Puis remplacer <NOM_POLICY_LECTURE_ACTUELLE> ci-dessous par le nom relevé.
--
-- Réversible : bloc DOWN inclus en bas.
-- ============================================================================

begin;

-- L'ancienne policy de lecture, trop large. Nom à substituer (voir en-tête).
drop policy if exists "<NOM_POLICY_LECTURE_ACTUELLE>" on public.submissions;

-- Lecture publique : le travail publié, terminé et approuvé, rien d'autre.
create policy "submissions_public_read"
  on public.submissions
  for select
  using (
    is_visible = true
    and is_draft = false
    and validation_status = 'approved'
  );

-- Lecture propriétaire : ses propres lignes, quel que soit leur état.
create policy "submissions_owner_read"
  on public.submissions
  for select
  using (auth.uid() = user_id);

commit;

-- ============================================================================
-- VÉRIFICATION (à faire après, depuis un terminal — pas depuis le navigateur,
-- qui porte une session et masquerait le problème) :
--
--   curl -s "$SUPABASE_URL/rest/v1/submissions?select=id,is_draft,validation_status&limit=200" \
--     -H "apikey: $ANON" -H "Authorization: Bearer $ANON" | grep -c '"is_draft": true'
--
-- Attendu : 0. Et la page /dashboard/challenges/<id>/submit doit toujours
-- rouvrir un brouillon existant.
-- ============================================================================

-- ============================================================================
-- DOWN (rollback) — exécuter ce bloc séparément pour annuler.
-- ============================================================================
-- begin;
-- drop policy if exists "submissions_public_read" on public.submissions;
-- drop policy if exists "submissions_owner_read"  on public.submissions;
-- -- puis recréer la policy d'origine relevée à l'étape « AVANT D'EXÉCUTER ».
-- commit;
