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

#### En-têtes HTTP (tableau de bord Render → Settings → Headers)

| Chemin | En-tête | Valeur |
|---|---|---|
| `/*` | `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://iyjiwfzrmyvcnmzwlgxe.supabase.co; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'` |
| `/*` | `X-Content-Type-Options` | `nosniff` |
| `/*` | `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `/` | `Cache-Control` | `no-cache` |
| `/index.html` | `Cache-Control` | `no-cache` |
| `/sw.js` | `Cache-Control` | `no-cache` |
| `/img/*` | `Cache-Control` | `public, max-age=604800` |

La politique `connect-src` n'autorise que le projet Supabase de production : en cas d'injection,
le navigateur refuse d'envoyer des données ailleurs. À adapter si `SUPABASE_URL` change.

### Backend : ponctuel (Supabase)

Le backend change rarement ; il se déploie à la main avec la CLI Supabase :

```bash
supabase link --project-ref iyjiwfzrmyvcnmzwlgxe
supabase db push                                   # nouvelles migrations
supabase functions deploy generer oublier          # fonctions Edge
```

La liste d'exercices de l'IA (`LIB` dans `generer`) est générée depuis celle de l'app (`EX` dans `public/index.html`).
Après toute modification de la bibliothèque :

```bash
node scripts/sync-lib.mjs            # recopie EX dans generer/index.ts
node scripts/sync-lib.mjs --check    # vérifie que les deux listes sont identiques
supabase functions deploy generer
```

Si la bibliothèque ou les règles de l'IA changent, incrémenter `VERSION_BIBLIOTHEQUE` dans `generer` :
les plans déjà en cache ne sont alors plus resservis.

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
- Tout texte venu d'ailleurs (séance reçue, plan de l'IA, état synchronisé) est nettoyé à l'entrée
  (`nettoieArbre`, `sansBalise`) et échappé à l'affichage (`esc`) dans `public/index.html`.
- La base refuse les séances partagées mal formées ou contenant `<` ou `>`, les états de plus de 256 Ko
  et plus de 50 séances publiées par compte (`20260927183706_limites.sql`).
- Une régénération forcée (`forcer`) est mise en cache sous une signature propre à l'utilisateur :
  elle ne peut pas remplacer le plan partagé des autres.

Les scripts de `supabase/rollback/` annulent chaque migration à la main en cas de problème.

## Licences

Schéma anatomique : [react-native-body-highlighter](https://github.com/HichamELBSI/react-native-body-highlighter), licence MIT (voir `public/LICENSE-body-highlighter.txt`).

Photos d'exercices : [free-exercise-db](https://github.com/yuhonas/free-exercise-db), domaine public (Unlicense),
redimensionnées en 420 × 280.
