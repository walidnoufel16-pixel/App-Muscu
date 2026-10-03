# Repère

Application web (PWA) de musculation : programme personnalisé sur 8 semaines, piloté à l'effort ressenti (RPE).

- **Client** : app **Next.js** (export statique) dans `web/`, interface shadcn/ui + Tailwind, hors ligne grâce à un service worker généré au build, hébergée sur **Render**. L'ancienne version (un seul `index.html`) est archivée dans `ancienne-app/`.
- **Backend** : **Supabase** (Auth anonyme + e-mail, Postgres avec RLS, fonctions Edge `generer` et `oublier`).
- **IA** : la fonction `generer` appelle l'API Anthropic (Claude Haiku 4.5) avec le secret `ANTHROPIC_API_KEY`.

## Structure

```
web/                    l'app (Next.js, TypeScript)
  app/                  écrans, en trois onglets : entrainement (séance du jour, programme, séance,
                        assistant, composeur), exercices, profil ; plus questionnaire et bienvenue.
                        Les anciennes adresses (/plan, /seances, /explorer, /compte) redirigent.
                        Cardio guidé : entrainement/cardio (logique dans lib/logic/cardio.ts, sons dans lib/sons.ts).
  components/ui/        composants shadcn/ui
  components/repere/    composants de l'app (carte d'exercice, tableau des séries, minuteur…)
  lib/data/             bibliothèque : 231 exercices, référentiels, schéma du corps
  lib/logic/            logique métier en fonctions pures (semaine, variété, RPE, assistant…)
  lib/store.ts          état + sauvegarde locale + synchronisation Supabase
  public/img/           photos des exercices (free-exercise-db, domaine public)
  tests/                tests de parité (Vitest) et scénarios Playwright
scripts/build.mjs       build Render : web/ → dist/
scripts/sync-lib.mjs    recopie la bibliothèque dans la fonction generer
supabase/               migrations SQL et fonctions Edge generer et oublier
ancienne-app/           ancienne version, archivée
```

## Développement local

```bash
cd web
npm ci
npm run dev            # http://localhost:3000
npm test               # tests de parité de la logique métier
npm run build          # export statique dans web/out
```

À la racine, `node scripts/build.mjs` fait la même chose que Render (build de web/ puis copie dans dist/).

## Déploiement

### Client : automatique (Render)

Site statique Render relié à ce dépôt, branche `main`, déploiement automatique à chaque push.

| Réglage | Valeur |
|---|---|
| Build command | `node scripts/build.mjs` |
| Publish directory | `dist` |
| Variables | `SUPABASE_URL`, `SUPABASE_KEY` (clé **publishable**, jamais la clé secrète) |

Le service worker (généré par `web/scripts/sw.mjs`) prend le hash du commit (`RENDER_GIT_COMMIT`) :
chaque déploiement invalide l'ancien cache et les utilisateurs reçoivent la nouvelle version.

#### En-têtes HTTP (tableau de bord Render → Settings → Headers)

| Chemin | En-tête | Valeur |
|---|---|---|
| `/*` | `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://iyjiwfzrmyvcnmzwlgxe.supabase.co; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'` |
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
node scripts/sync-lib.mjs            # recopie web/lib/data dans generer/index.ts
node scripts/sync-lib.mjs --check    # vérifie que les deux listes sont identiques
supabase functions deploy generer
```

Matériel : l'échelle `eq` (0 salle complète → 3 poids du corps) est complétée par du matériel « en plus »,
déclaré à part (question `acc`) : `acc:'kb'` (kettlebell) ou `acc:'el'` (élastiques) pour un exercice qui l'exige,
`ou:'kb'` pour un exercice que ce matériel permet aussi (goblet squat). Côté app, `exoDispo()` applique la règle ;
côté IA, `dispo()` dans `generer`.

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
