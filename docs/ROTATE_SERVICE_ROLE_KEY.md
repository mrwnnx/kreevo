# Révoquer la clé `service_role` (à faire dans le dashboard Supabase)

## Pourquoi

La clé `service_role` **actuellement active** est présente dans l'historique git,
dans 4 commits — dont `e93e08f`, intitulé *« chore(security): read Supabase
service key from env in seed script »*. Ce commit a bien sorti la clé du code,
mais **sortir une clé du code ne l'invalide pas**. Vérifié le 2026-08-15 :

```
curl -s -o /dev/null -w "%{http_code}\n" "$SUPABASE_URL/rest/v1/profiles?select=id&limit=1" \
  -H "apikey: $SERVICE_ROLE" -H "Authorization: Bearer $SERVICE_ROLE"
# -> 200
```

Cette clé contourne toute la RLS : lecture **et** écriture sur chaque table de la
production. Le dépôt est privé, ce qui limite la portée — mais tout clone
antérieur, tout fork et tout accès en lecture au dépôt la contient encore.

À l'inverse, le `SUPABASE_MANAGEMENT_PAT`, lui aussi dans l'historique, est
**déjà mort** (401 sur `api.supabase.com/v1/projects`) : rien à faire dessus,
sinon le retirer de `.env.local` puisqu'il ne sert plus qu'à faire échouer les
scripts qui s'en servent.

La clé `anon`, elle, n'apparaît dans aucun commit — et de toute façon elle est
publique par conception.

## Ce qu'il faut mettre à jour au moment du swap

La valeur change, **pas le nom de la variable** : aucun code n'est à modifier.
Les endroits qui la lisent :

- `src/lib/supabase/admin.ts`
- `src/lib/supabase/server.ts`
- `scripts/seed-email-templates.mts`
- `scripts/seed-participants.ts`
- `scripts/send-all-types.mts`

Et les deux endroits où la **valeur** vit :

- `.env.local` (poste local)
- Vercel → projet `kreevo` → Settings → Environment Variables → `SUPABASE_SERVICE_ROLE_KEY`

## Marche à suivre

1. Dashboard Supabase → projet `ndflytgtduuvacjmdobc` → **Settings → API Keys**.
2. Créer une nouvelle clé secrète (`sb_secret_…`).
3. Mettre la nouvelle valeur dans Vercel (env **Production**) **puis** dans
   `.env.local`.
4. Redéployer, et vérifier que la prod répond toujours — les pages qui passent
   par `supabaseAdmin` sont les plus exposées : `/discover`, `/dashboard/history`,
   la page de détail d'une soumission.
5. **Seulement une fois la prod verte**, révoquer / désactiver l'ancienne clé.
6. Re-vérifier que l'ancienne est bien morte :

```
curl -s -o /dev/null -w "%{http_code}\n" "$SUPABASE_URL/rest/v1/profiles?select=id&limit=1" \
  -H "apikey: $ANCIENNE_CLE" -H "Authorization: Bearer $ANCIENNE_CLE"
# attendu : 401
```

⚠️ **À confirmer dans le dashboard avant d'agir** : selon le chemin proposé par
Supabase (nouvelles clés API vs rotation du secret JWT hérité), l'opération peut
invalider les **sessions utilisateurs en cours** et/ou la clé `anon`. Je n'ai pas
pu le vérifier d'ici — le PAT Management est mort. Lis ce que l'écran annonce
avant de confirmer, et fais-le à une heure creuse.

## Ce que ça ne règle pas

La clé reste dans l'historique git. Une fois révoquée, elle n'est plus qu'une
chaîne inerte — c'est le résultat recherché. Réécrire l'historique
(`git filter-repo`) n'apporte rien de plus sur un dépôt privé et casse tous les
clones ; ne le fais que si le dépôt doit devenir public un jour, ce qui n'est
pas prévu.
