-- ============================================================================
-- 008_submissions_rls_tighten.sql
-- ----------------------------------------------------------------------------
-- La lecture publique de `submissions` laisse passer les brouillons et les
-- soumissions rejetées. Mesuré le 2026-08-15 avec la clé anon (celle qui part
-- dans le navigateur), sans être connecté : 81 lignes lisibles, dont 1 avec
-- is_draft = true et 15 avec validation_status = 'rejected'.
--
-- Policy en place (relevée dans pg_policies le 2026-08-17) :
--   submissions_visible / SELECT / public
--     using ((is_visible = true) OR (user_id = auth.uid()))
--
-- La branche propriétaire est déjà là et reste inchangée — c'est elle qui fait
-- fonctionner `dashboard/challenges/[id]/submit`, seule page qui relit la
-- soumission de l'utilisateur via le client soumis à la RLS (toutes les autres
-- passent par supabaseAdmin, qui la contourne). Seule la branche PUBLIQUE est
-- resserrée : visible + terminé + approuvé.
--
-- ALTER plutôt que DROP + CREATE : la policy n'est jamais absente, donc aucune
-- fenêtre pendant laquelle la table serait en lecture libre.
--
-- Réversible : bloc DOWN inclus en bas.
-- ============================================================================

begin;

alter policy "submissions_visible"
  on public.submissions
  using (
    (
      is_visible = true
      and is_draft = false
      and validation_status = 'approved'
    )
    or user_id = auth.uid()
  );

commit;

-- ============================================================================
-- VÉRIFICATION — depuis un terminal, PAS depuis le navigateur : celui-ci porte
-- une session et la branche propriétaire masquerait le problème.
--
--   curl -s "$SUPABASE_URL/rest/v1/submissions?select=id,is_draft,validation_status&limit=200" \
--     -H "apikey: $ANON" -H "Authorization: Bearer $ANON" \
--   | python3 -c "import json,sys; d=json.load(sys.stdin); \
--       print(sum(1 for r in d if r['is_draft']), 'brouillon(s),', \
--             sum(1 for r in d if r['validation_status']=='rejected'), 'rejetée(s)')"
--
-- Attendu : 0 brouillon, 0 rejetée.
-- Et /dashboard/challenges/<id>/submit doit toujours rouvrir un brouillon.
-- ============================================================================

-- ============================================================================
-- DOWN (rollback) — exécuter ce bloc séparément pour annuler.
-- ============================================================================
-- begin;
-- alter policy "submissions_visible"
--   on public.submissions
--   using ((is_visible = true) or user_id = auth.uid());
-- commit;
