-- ============================================================================
-- 016_briefs_visible_authenticated.sql
-- ----------------------------------------------------------------------------
-- `briefs_visible` (011) est déclarée `for select` sans `to <role>`, donc au
-- rôle `public` — ce qui couvre `anon`. La clé anon est dans le bundle client
-- (embarquée, publique par construction) : n'importe qui peut faire
--   curl "$SUPABASE_URL/rest/v1/briefs?status=eq.published&visibility=eq.public" \
--     -H "apikey: $ANON"
-- sans être connecté et lire TOUS les briefs publiés, contenu compris. Le
-- ciblage par ligue (spec 1, §Visibilité) devient alors une simple règle
-- d'affichage côté app, pas une frontière : n'importe qui peut lire le sujet
-- confidentiel d'un client destiné à une seule ligue.
--
-- Vérifié avant d'écrire (grep du code servant les briefs, 2026-09-02) :
--   - src/app/(dashboard)/dashboard/briefs/{page,[id]/page}.tsx — la SEULE
--     lecture publique+publiée via la RLS — passe par createClient() de
--     src/lib/supabase/server.ts (client de SESSION), et les deux redirigent
--     vers /login si `user` est absent : donc toujours un rôle `authenticated`
--     en pratique, jamais `anon`.
--   - src/app/(public)/brief/[token]/page.tsx (lien privé) lit par
--     `supabaseAdmin` (service role, src/lib/supabase/admin.ts) — confirmé
--     dans getPrivateBrief() : la RLS ne s'applique pas à ce chemin, il a son
--     propre filtre explicite (access_token + visibility='private' +
--     status='published'). Restreindre `briefs_visible` à `authenticated` ne
--     le touche pas.
--   - src/app/api/admin/moderation/route.ts et
--     src/app/api/admin/briefs/[id]/review/route.ts passent aussi par
--     `supabaseAdmin`.
-- Aucun chemin public légitime ne dépend donc de `briefs_visible` pour un
-- visiteur anonyme — la policy peut être restreinte à `authenticated` sans
-- rien casser.
--
-- `alter policy` plutôt que drop+create : la policy n'est jamais absente,
-- donc aucune fenêtre où la table serait soit grande ouverte soit totalement
-- fermée pendant la migration (même raisonnement que 008).
-- ============================================================================

begin;

alter policy "briefs_visible" on public.briefs to authenticated;

commit;

-- ============================================================================
-- VÉRIFICATION — depuis un terminal, SANS session (clé anon seule) :
--
--   curl -s "$SUPABASE_URL/rest/v1/briefs?select=id&status=eq.published&visibility=eq.public" \
--     -H "apikey: $ANON" -H "Authorization: Bearer $ANON"
--
-- Attendu : [] (tableau vide), même s'il existe des briefs publiés — jusqu'ici
-- la base de prod en a 0, donc rejouer ce test après la publication d'un vrai
-- brief pour une preuve non triviale. Puis, avec un token utilisateur
-- `authenticated` (pro designer), la même requête doit continuer de rendre
-- les briefs publics publiés.
-- ============================================================================

-- ============================================================================
-- DOWN (rollback) — exécuter séparément.
-- ============================================================================
-- begin;
-- alter policy "briefs_visible" on public.briefs to public;
-- commit;
