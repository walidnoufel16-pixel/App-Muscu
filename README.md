# Repère

Application web (PWA) de musculation : programme personnalisé sur 8 semaines, piloté à l'effort ressenti (RPE).

- **Client** : site statique dans `public/` (HTML, CSS et JS dans `index.html`, service worker `sw.js`), hébergé sur **Render**.
- **Backend** : **Supabase** (Auth anonyme + e-mail, Postgres avec RLS, fonctions Edge `generer` et `oublier`).
- **IA** : la fonction `generer` appelle l'API Anthropic (Claude Haiku 4.5) avec le secret `ANTHROPIC_API_KEY`.

## Structure

```
public/                 app servie telle quelle (images d'exercices dans img/)
scripts/build.mjs       build sans dépendance : public/ → dist/
supabase/
  config.toml
  migrations/           schéma versionné (tables, RLS, fonctions SQL)
  functions/generer/    génération du cycle par IA, avec cache et quotas
  functions/oublier/    suppression définitive du compte
```

## Développement local

```bash
node scripts/build.mjs        # produit dist/
npx serve dist                # ou tout autre serveur statique
```

Sans variable d'environnement, l'app pointe vers le projet Supabase de production.
Pour viser un autre projet :

```bash
SUPABASE_URL=https://xxxx.supabase.co SUPABASE_KEY=sb_publishable_... node scripts/build.mjs
```

## Déploiement

### Client : automatique (Render)

Site statique Render relié à ce dépôt, branche `main`, déploiement automatique à chaque push.

| Réglage | Valeur |
|---|---|
| Build command | `node scripts/build.mjs` |
| Publish directory | `dist` |
| Variables | `SUPABASE_URL`, `SUPABASE_KEY` (clé **publishable**, jamais la clé secrète) |

Le build donne au cache du service worker le hash du commit (`RENDER_GIT_COMMIT`) :
chaque déploiement invalide l'ancien cache et les utilisateurs reçoivent la nouvelle version.

### Backend : ponctuel (Supabase)

Le backend change rarement ; il se déploie à la main avec la CLI Supabase :

```bash
supabase link --project-ref iyjiwfzrmyvcnmzwlgxe
supabase db push                                   # nouvelles migrations
supabase functions deploy generer oublier          # fonctions Edge
```

Secrets des fonctions (tableau de bord → Edge Functions → Secrets) :

| Secret | Rôle |
|---|---|
| `ANTHROPIC_API_KEY` | obligatoire pour `generer` |
| `QUOTA_PAR_UTILISATEUR` | optionnel, générations payantes par compte et par jour (défaut 5) |
| `QUOTA_TOTAL` | optionnel, plafond global par jour (défaut 150) |

## Sécurité

- La clé publishable est publique par nature : l'accès aux données repose sur les règles RLS.
- Chaque utilisateur ne lit et n'écrit que sa ligne de `etats`.
- Une séance partagée ne se lit qu'avec son code, via `lire_seance(code)` : la table n'est pas listable.
- `generer` exige un vrai compte (anonyme ou e-mail) et décompte chaque appel payant dans `quotas_generation`.
- `plans_cache` et `quotas_generation` ne sont accessibles qu'au serveur.

## Licences

Illustrations anatomiques : [body-muscles](https://github.com/vulovix/body-muscles), Apache 2.0 (voir `public/LICENSE-body-muscles.txt`).
