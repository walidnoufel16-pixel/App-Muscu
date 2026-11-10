# Audit final avant mise en prod : 10 novembre 2026

Branche `claude/app-muscu-deployment-plan-7398r6`, commit `4384469`, comparé à `fe1787d` (contre-audit n°2).
Références : `bilan-2026-11-10.md`, `contre-audit-2026-11-10.md`, `contre-audit-2-2026-11-10.md`.

## Verdict

**Presque prêt. Rien ne bloque techniquement, mais 4 correctifs courts sont à faire avant la mise en prod (moins d'une journée de travail).**

Pas de crash, pas de perte de données, et toutes les séances se lancent. Les données des comptes existants sont lues sans erreur : anciennes séances, ancien `recoSans: ["jambes"]`, séances `auto`, Oxa Plan avec `PLAN`/`FINI`. Les tests passent : vitest 45 fichiers / 490 tests, `tsc` sans erreur, `npm run build` OK, suite e2e `tous.mjs` 9/9, plus `seance-du-jour.mjs`. Aucune erreur JS dans mes parcours Playwright.

Mais trois des changements depuis `fe1787d` donnent à des utilisateurs réels un conseil faux ou contradictoire. Il reste aussi un trou de sécurité dans la règle « pas de soulevé de terre barre pour un débutant ».

**À corriger avant la prod (liste minimale)**
1. **F1 · « Cardio doux » ouvre un fractionné** (10 × 1 min 30 fort) un jour de repos. Il faut passer un préréglage « continu, facile » à l'assistant cardio.
2. **F2 · Comptes sans `objHebdo` : deux objectifs différents sur le même écran.** Les anneaux affichent « 1 sur 2 cette semaine », la carte « à 3 séances par semaine » et impose le repos. Il faut une seule valeur par défaut (`objectifHebdo(A)`) dans `recoPour`.
3. **F3 · Oxa Plan en cours : la carte du jour propose une autre séance** (« Ta séance du jour · Bas du corps ») que celle du programme. Si des comptes ont Oxa Plan ouvert en prod : ne pas afficher `CarteReco` quand le programme est actif et en cours, ou y montrer la prochaine séance du plan.
4. **F4 · Soulevé de terre sumo à la barre proposé aux débutants** (2 × 12 à 35 kg, repos 60 s). `chargeLombaires("sdts")` vaut `false` parce que `pat2` n'est pas `"lo"`. Correction d'une ligne de données.

Tout le reste peut partir en prod et se traiter ensuite (voir Priorités).

## Tableau de tous les points

| Point | État | Preuve courte |
|---|---|---|
| **N1** Séance du jour sur Entraînement | **Corrigé** (2 défauts nouveaux : F1, F3) | `CarteReco` (`accueil-entrainement.tsx:227`). Capture `final-…-carte-du-jour.png` : « Ta séance du jour · Bas du corps · 6 exercices · environ 45 min », Voir la séance → composeur → Commencer → séance → 1 série validée → carte « Séance en cours ». Repos : « Récupère », Cardio doux, Séance quand même, Ignorer aujourd'hui (reste masquée après rechargement). |
| N2 Agenda et séances prévues | Corrigé (reste mineur inchangé) | `recoPour` compte les prévus. Un prévu « Choix d'Oxa » sans muscles compte toujours pour le rythme, pas pour la récupération. |
| N3 Séances d'Oxa hors de Mes séances | **Corrigé** | « Commencer » depuis la carte → `SEANCES: Push, Bas du corps(auto)` ; Mes séances n'affiche que « Push ». |
| N3-a Mes séances vide et muette | **Corrigé** (sans la ligne d'aide) | Avec seulement des séances `auto` : « Qu'est-ce que tu travailles aujourd'hui ? », Créer une séance pour moi, Composer, Importer. Rien n'explique encore que les séances d'Oxa sont dans l'agenda. |
| N3-b Case « Garder » ignorée par Enregistrer | **Corrigé** | `composer/page.tsx:277` : la case n'apparaît qu'avec « Enregistrer pour … » ou sur une séance `auto` existante. |
| N3-c « Variante » sur une séance `auto` | **Corrigé** | `composer/page.tsx:128` (`!L.auto`), et la case « Garder » s'affiche sur ce chemin. |
| N3-d Textes devenus faux | **Corrigé** | Retirer de l'historique : plus de « reste dans Mes séances » pour une `auto` (`progres/page.tsx:414`, `agenda.tsx:413`). Tout effacer : seulement les séances gardées (`profil/page.tsx:76`). |
| N3-e Séances `auto` jamais purgées | Non corrigé (prévu plus tard) | Pas de purge. Sans risque à court terme. |
| N4 Valeurs inventées à l'accueil | Corrigé | Rejoué : `A` sans âge, taille, poids ni pesée. |
| N5 Pastilles et compteur de l'accueil | Corrigé | « 1 / 9 » … « 9 / 9 » (e2e `visite`). |
| N6 Avis du composeur avec course, cardio, 48 h | Corrigé | Inchangé depuis le contre-audit n°2. |
| N6-a Libellé de l'avis « efforts » | **Partiel** | Pluriel corrigé (« allège-les »). « Séance d'avant Oxa » reste obscur. |
| N7 Une seule génération | Corrigé | `seancePour`, utilisé aussi par la nouvelle carte. |
| N8 Une seule source « séance conseillée » | Corrigé, avec un nouveau doublon mineur | La fin de l'accueil « Voir la séance » mène à l'assistant, la carte du jour « Voir la séance » au composeur. |
| N9 Libellés | Corrigé | « Pas travaillés ces 7 derniers jours », « Pecs, épaules et triceps ». Trois boutons à 360 px : non vérifié. |
| N9-a Accord « Pecs récupère » | **Corrigé** | `nombre()` : « Dos récupère de la séance d'hier. », « Pecs et dos récupèrent. », « Dos et biceps récupèrent : retirés de ta séance. » |
| **N10** Chemins vers la feuille | **Corrigé** | `prochainLibre` pour le « + », Programmer, Programmer la suivante. Après une séance faite aujourd'hui, le « + » s'ouvre sur demain (« Mercredi 11 novembre »), ce qui est voulu ; le choix du jour reste en tête de la feuille. |
| **S1** Charges de départ | **Partiel** (F4) | Tractions débutant/régulier : 0 kg ; femme débutante 60 kg : SdT 25, squat 25, DC 20, DM 20 (barre ≥ 20). Oxa Plan semaine 1 selon le profil : reg. 0 → DC haltères incliné 10 kg × 6 (défaut 18) ; reg. 3 → DC 67,5 × 6, tractions +5 kg × 6. **Reste** : soulevé de terre sumo barre pour un débutant (F4). |
| **S2** Rythme et volume hebdo | **Corrigé** | 28 jours : débutant 3/sem → 12 séances ; débutant 5/sem → 14 (4 au plus, jamais d'affilée) ; régulier 4/sem → 16 ; confirmé 5/sem → 20, sans « Épaules et abdos » ; profil vide → 12. |
| **S3** Full body et modèles | **Partiel** | Débutant : 100 % full body. 2/sem : full body. 4/sem : haut/bas. **Reste** : régulier à 2/sem, **4 séries de pecs par semaine** (contre 10 de dos) ; à 3/sem (rotation haut/bas), 3 à 6 séries de pecs selon la semaine. Voir S-a. |
| **S4** Construction | **Partiel** | Force : principal à la barre, presse ou guidé (squat 4 × 5, tirage 4 × 5). Poids du corps exigeant ≤ 8 (dips 3 × 8). Deux tirages : oui. **Restes** : squat haltères ou goblet squat comme mouvement principal dans 25 à 37 % des full body 45 min en salle (régulier et confirmé) ; le 2e tirage fait baisser les pecs (S-a). |
| **S5** Durée | **Corrigé** | Message « Environ X min au lieu de Y » dans le composeur (`composer/page.tsx:218`). Les séances générées tombent juste : 30 → 30, 45 → 40 à 45, 60 → 50 à 60. |
| S6 48 h déclarées | Non traité (voulu) | `effortsDeclares` et `muscles-cibles.ts` non touchés. |
| S7 Oxa Plan | Charges corrigées ; **nouveau F3** | `ctxPlan` passe par `departProfil` (`core.ts:485`), « Première fois : charge prudente… ». |
| S8 Abducteurs sur le schéma | Non traité (voulu) | `muscles-cibles.ts` inchangé. |
| R1 Rythme : seule la muscu compte | **Corrigé** (reste compris) | Routine « Soin genoux » hier → aujourd'hui `seance · Full body` (avant : repos). |
| R2 Avis au jour de la séance | Corrigé (reste mineur inchangé) | Les séances prévues d'ici le jour J ne comptent pas dans l'avis du composeur. |
| R3 Réduction depuis la fin | Corrigé | Inchangé. |
| R3-a Pompes en appui vertical | **Corrigé** | `assistant.ts:122` : réservées au niveau 3. Débutant au poids du corps : pompes pike 3 × 12, jamais `pv3`. |
| R4 Reco pour un jour à venir | Corrigé | Inchangé. |
| R5 « Demain » respecte le rythme | Corrigé | Carte de repos : « Demain : full body. » |
| R6 Retour arrière | Corrigé | Inchangé. |
| R7 Équilibre masqué avant enregistrement | Corrigé | Inchangé. |

**Nouveaux problèmes depuis `fe1787d`**

| # | Gravité | Problème |
|---|---|---|
| F1 | **gênant (avant prod)** | « Cardio doux » → assistant cardio réglé sur « Fractionné · Tapis 32 min, 10 × 1 min 30 fort ». |
| F2 | **gênant (avant prod)** | Sans `objHebdo` : anneaux « 1 sur 2 », reco « à 3 séances par semaine », repos imposé. Trois valeurs par défaut différentes dans le code. |
| F3 | **gênant (avant prod si Oxa Plan est ouvert)** | Oxa Plan en cours : la carte propose une séance libre concurrente. |
| F4 | gênant (sécurité ; reste de S1, pas une régression) | Soulevé de terre sumo barre pour un débutant. |
| S-a | gênant (coach) | Le 2e tirage obligatoire (`assistant.ts:158`) fait passer les pecs à 2 séries en full body 45 min. |
| F5 | mineur | `seance-du-jour.mjs` n'est pas dans `SUITE` (`tous.mjs:9`) : la CI ne teste pas la nouvelle carte. |
| F6 | mineur | Split ≥ 5/sem avec muscles écartés : moins de séances que prévu, depuis le retrait d'« Épaules et abdos ». |
| F7 | mineur | Débutant qui choisit 5 séances : anneaux « 0 sur 5 », mais Oxa en autorise 4 au plus, sans le dire à l'accueil. |

---

## 1. Méthode

- Lecture de `git diff fe1787d..HEAD -- web/lib web/components web/app` (15 fichiers).
- Tests : `npx vitest run` (490/490), `npx tsc --noEmit` (OK), `npm run build` (OK, 922 fichiers dans le SW), `node tests/e2e/tous.mjs` (9/9), et les scénarios hors suite `seance-du-jour`, `menu-jour`, `visite`, `navigation` (OK). Les scénarios `entrainement`, `composer` et `migration` échouent, mais ils sont listés dans `A-REECRIRE.md` (écrans changés avant cette période) : ce ne sont pas des régressions.
- Trois tests vitest temporaires (supprimés) :
  - 12 profils suivis 28 jours avec `recoPour` + `seancePour` (séances `auto`, historique réel) ;
  - charges de départ (`departProfil`, `propositionLibre`) et `ctxPlan` sur les profils Oxa Plan des fixtures de parité ;
  - 60 tirages de `construireSeance` par cas, comparés au code de `fe1787d` (extrait avec `git archive` dans le dossier temporaire, supprimé).
- Deux scripts Playwright temporaires (supprimés). Parcours testés : accueil d'un compte vierge (femme, M'affiner, Je débute, 5/sem) jusqu'à « Voir la séance » ; carte du jour → Autre idée → Voir la séance → composeur → Commencer → séance → valider une série → retour (« Séance en cours ») → Mes séances ; Mes séances avec seulement des séances `auto` ; Oxa Plan en cours ; « + » après une séance faite ; ancien compte sans `objHebdo` avec `recoSans: ["jambes"]` et un prévu → Cardio doux, Séance quand même ; séance `auto` prévue demain ; débutant entraîné hier.
- Captures dans ce dossier : `final-2026-11-10-carte-du-jour.png`, `final-2026-11-10-oxa-plan-carte-du-jour.png`, `final-2026-11-10-repos-sans-objhebdo.png`, `final-2026-11-10-cardio-doux-fractionne.png`.

---

## 2. Navigation et parcours

### F1 · « Cardio doux » ouvre un fractionné (gênant, à corriger avant la prod)
- **Où** : `components/repere/accueil-entrainement.tsx:257` pousse `/entrainement/assistant?type=cardio`. L'assistant part toujours de `{ f: "fractionne", m: "tapis" }` (`app/entrainement/assistant/page.tsx:72`).
- **Constaté** (capture `final-…-cardio-doux-fractionne.png`) : sur la carte « Repos aujourd'hui · Récupère », toucher « Cardio doux » ouvre « Fractionné · Tapis de course, 32 min, 10 × 1 min 30 fort, 1 min tranquille ».
- **Pourquoi** : la carte dit « récupère », et le bouton mène à une séance d'intervalles. Un débutant qui lance sans regarder fait un HIIT un jour de repos. C'est l'inverse de la récupération active (zone 1-2, 20 à 30 min, ACSM). Le contre-audit n°1 (R1) partait justement de ce cardio doux comme comportement conseillé.
- **Correction** : ajouter un paramètre (`?type=cardio&style=continu&doux=1`) qui présélectionne « Continu », intensité facile, 20 à 30 min, vélo ou elliptique. Ou bien enregistrer directement un bloc « Cardio doux 25 min » prêt à lancer.

### F2 · Comptes sans `objHebdo` : deux objectifs sur le même écran (gênant, à corriger avant la prod)
- **Où** : `lib/logic/agenda.ts:188` passe `hebdo: undefined`, puis `pauseDe` prend 3 par défaut (`recommandation.ts`, `o.hebdo ?? 3`). Les anneaux et la série utilisent `objectifHebdo` (`lib/logic/motivation.ts:12`) : `objHebdo`, sinon `socle + 2`, sinon **2**. `bilan-semaine.ts:27` prend **3**.
- **Constaté** (capture `final-…-repos-sans-objhebdo.png`) : confirmé sans `objHebdo`, entraîné dimanche et lundi. En haut : « 1 sur 2 cette semaine ». Juste dessous : « Repos aujourd'hui · Entraîné hier : à 3 séances par semaine, un jour de repos entre deux séances. »
- **Qui est touché** : les comptes créés avant la question « Séances par semaine », ceux qui ont touché « Plus tard » à l'accueil, et les comptes Oxa Plan (qui ont `socle` mais pas `objHebdo`). Avant `2be40b4`, ces comptes étaient en split sans repos imposé. Désormais ils ont 3 séances par semaine, une alternance haut/bas et des jours de repos imposés. Ce choix est voulu (S2), mais l'écran se contredit.
- **Correction** : dans `recoPour`, `hebdo: objectifHebdo(E.A)`. Une seule source, qui respecte aussi `socle + 2` pour Oxa Plan. Ajouter une ligne « 3 séances par semaine par défaut · Modifier » sur la carte de repos quand `objHebdo` est absent.

### F3 · Oxa Plan en cours : une séance du jour concurrente (gênant, à corriger avant la prod si des comptes ont Oxa Plan ouvert)
- **Où** : `CarteDuJour` (`accueil-entrainement.tsx:219`) tombe sur `CarteReco` dès qu'il n'y a rien de prévu ni de fait aujourd'hui. Il ne regarde ni `useProgrammeActif()` ni `etat.PLAN` / `FINI`. Les séances d'Oxa Plan n'apparaissent dans l'agenda que si l'utilisateur les y a programmées (`quoi.t === "plan"`).
- **Constaté** (capture `final-…-oxa-plan-carte-du-jour.png`) : programme ouvert (`repere.programme = 1`), `PLAN` des fixtures, semaine 3, dernière séance du plan il y a 2 jours. La carte affiche « Ta séance du jour · Bas du corps · 7 exercices · environ 45 min · Voir la séance ». La tuile Oxa Plan (« Semaine 3 sur 8 ») est plus bas, dans Explorer.
- **Pourquoi** : quelqu'un qui suit un cycle de 8 semaines se voit proposer une séance hors programme, présentée comme « ta séance ». S'il la fait, sa semaine de programme prend du retard, et la récupération calculée ne suit plus le plan. Avant `4384469`, la carte ne montrait rien : c'est donc une régression de N1.
- **Correction** : si `prog && etat.PLAN && etat.FINI`, la carte montre la prochaine séance du plan (titre `week(E)[day]`, « Commencer » via `lancer` avec `{ t: "plan" }`), ou rien. La logique de repos peut rester, avec `socle` comme rythme (voir F2).

### N3-a, reste : Mes séances sans explication (mineur)
L'écran vide est revenu (Créer, Composer, Importer). Mais l'utilisateur qui a fait 10 séances d'Oxa ne comprend pas pourquoi elles ne sont pas là. Correction : la ligne proposée au contre-audit n°2 (« Les séances construites par Oxa restent dans ton agenda. Touche Garder pendant la séance pour les retrouver ici. »), affichée quand `SEANCES.some(s => s.auto)`.

### N8, reste : deux « Voir la séance » qui ne mènent pas au même endroit (mineur)
La fin de l'accueil mène à l'assistant (`?m=pec,dos,…`), la carte du jour au composeur (aperçu prêt à commencer). Le premier jour, la carte affiche « Ta première séance » → assistant ; dès le lendemain, elle mène au composeur. Ça marche, mais il vaudrait mieux un seul comportement (composeur dans les deux cas).

### F5 · Le test de la carte n'est pas dans la CI (mineur)
`tests/e2e/seance-du-jour.mjs` passe, mais il n'est pas dans `SUITE` (`tests/e2e/tous.mjs:9`). Il suffit de l'ajouter.

### F7 · Débutant qui choisit 5 séances par semaine (mineur)
Accueil rejoué : « Je débute », 5 séances → `objHebdo: 5`. Oxa plafonne à 4, jamais deux jours d'affilée (14 séances en 28 jours). Les anneaux affichent « 0 sur 5 ». La série compte aussi le cardio, donc l'objectif reste atteignable avec les « cardio doux ». Mais l'accueil ne dit pas que 5 sera ramené à 4 pour un débutant. Correction : à l'accueil, pour « Je débute », limiter les choix à 2, 3 ou 4, ou ajouter une ligne d'explication.

### Données des comptes existants (vérifié, pas de problème)
- Anciennes séances sans `auto` : visibles dans Mes séances, lancées et retirées normalement.
- `recoSans: ["jambes"]` : interprété (aucune proposition avec quadriceps, ischios ou mollets ; 14 jours simulés et parcours Playwright sans erreur). Le modèle renommé « Jambes et abdos » garde l'id `jambes`.
- Prévu `libre` vers une séance `auto` : affiché dans À venir (« Mercredi 11 · Dos · Biceps »).
- Oxa Plan en cours : `ctxPlan` change seulement la charge des exercices **jamais faits** (avec un journal, la progression reprend comme avant). Le test de parité le vérifie.
- Clé `en.json` supprimée (« … garde ce muscle … ») : remplacée par deux clés ; `i18n.test` passe.

---

## 3. Séances et programmes (l'œil du coach)

### Simulation 28 jours (en suivant la carte du jour chaque jour)

| Profil | Séquence | Séances | Séries / semaine (sem. 3 · sem. 4) |
|---|---|---|---|
| Débutant 3/sem, haltères, 30 min | full . full . full . . | 12 | pec 6, dos 6, épaules 6, quadriceps 6, ischios 9, mollets 0 |
| Débutant 5/sem, salle, 45 min | full . full . (4 au plus) | 14 | pec 12 · 9, dos 12 · 9, quadriceps 12 · 9 |
| Femme débutante, M'affiner, 3/sem, 45 min | full × 3 | 12 | pec 9, dos 9, quadriceps 14, ischios 14 |
| Régulier 2/sem, salle, 45 min | full . full | 8 | **pec 4**, épaules 4, triceps 4, **dos 10** |
| Régulier 4/sem, salle, 60 min | haut / bas | 16 | pec 12, dos 12, quadriceps 20, ischios 22 |
| Confirmé 5/sem, 60 min | push pull jambes (semaine 1 : full, haut) | 20 | pec 22 · 11, dos 12 · 24, triceps 24 · 12 |
| Confirmé 6/sem, 60 min | PPL × 2 | 24 | pec 22, dos 24, biceps 21, triceps 24 |
| Confirmé force 4/sem | haut / bas | 16 | **pec 8**, dos 14, quadriceps 20 |
| Profil vide | full puis haut / bas | 12 | **pec 3 · 6**, dos 7 · 14, quadriceps 16 · 8 |
| Ancien confirmé sans `objHebdo` | 3/sem, haut / bas | 12 | pec 14 · 7, quadriceps 10 · 20 |
| Débutant au poids du corps 3/sem | full × 3 | 12 | pec 9, dos 9, épaules 9 (pompes pike, jamais `pv3`) |

Le rythme est bon partout : pas de séance tous les jours, repos respecté, débutant jamais deux jours d'affilée. S2 est réglé. Ce qui reste concerne le **volume par muscle** en full body et en haut/bas à 45 min.

### S-a · Le 2e tirage obligatoire fait baisser les pecs en full body (gênant, coach)
- **Où** : `lib/logic/assistant.ts:158`. Pour un régulier ou un confirmé, si la séance contient pecs et dos, un 2e tirage est ajouté **avant** la réduction à la durée. La réduction part de la fin : elle prend alors des séries au développé (la case pecs vient après dos, quadriceps et ischios).
- **Constaté** (60 tirages par cas, salle, hypertrophie, `fe1787d` → `4384469`) :

  | Cas | Pecs (séries) | Tirages (séries) |
  |---|---|---|
  | Régulier, full body 45 min | 3,0 → **2,2** | 3,0 → 5,2 |
  | Confirmé, full body 45 min | 2,0 → 2,0 | 4,2 → **6,6** |
  | Confirmé, haut du corps 45 min | 4,0 → 4,0 (développé épaules 4,0 → **2,0**) | 4,0 → 7,0 |
  | Régulier ou confirmé, full body 30 min | 2,0 → 2,0 | 2,0 → 4,0 |

  Sur la semaine : régulier 2/sem, **4 séries de pecs contre 10 de dos** ; confirmé force 4/sem, 8 contre 14.
- **Attendu** : 10 séries par muscle et par semaine au minimum pour progresser chez un pratiquant entraîné (Schoenfeld, Ogborn et Krieger 2017). Un ratio tirage/poussée de 1:1 à 1,5:1, pas 2,5:1. Un développé à 2 séries comme seul travail des pecs de la séance, c'est de l'entretien, pas de l'hypertrophie.
- **Correction** : n'ajouter le 2e tirage que si la durée le permet, c'est-à-dire après la réduction et seulement s'il reste du budget. Ou bien protéger le principal de chaque grand groupe à 3 séries minimum, en réduisant d'abord le 2e tirage et les accessoires. Ce n'est pas bloquant : les séances restent sûres et crédibles. À faire ce mois-ci.

### S3, reste · 3 séances par semaine en haut/bas alterné (gênant, coach)
En mode « fhb » (régulier 3/sem, profil vide, comptes sans `objHebdo`), le full body ne revient plus après la première séance. On a ensuite haut, bas, haut puis bas, haut, bas. Les pecs oscillent entre 3 et 6 séries par semaine (profil vide) ou 7 et 14 (confirmé). Le schéma haut/bas sur 3 jours est un modèle connu, mais avec des séances « haut » de 45 min à 3 séries de pecs, le compte n'y est pas. Correction possible : à 3/sem, garder le full body comme modèle principal (A/B), et réserver haut/bas à 4 séances.

### F4 · Soulevé de terre sumo barre pour un débutant (gênant, sécurité ; reste de S1)
- **Où** : `assistant.ts:98` écarte pour un débutant les exercices à la barre (`eq === 1`) qui chargent les lombaires (`chargeLombaires`, `assistant.ts:180` : `pat2 === "lo"`). Or `EX.sdts` (soulevé de terre sumo, barre, défaut 70 kg) n'a pas `pat2: "lo"`, donc `chargeLombaires("sdts") === false`.
- **Constaté** : débutant homme, salle, 45 min, première séance : « Soulevé de terre sumo 2 × 12 · 60 s · **35 kg** ». Il apparaît dans 8 à 10 % des full body. Le même trou fait que le sumo n'est pas écarté non plus quand les lombaires récupèrent (`generer-seance.ts:16`).
- **Pourquoi** : c'est exactement la règle S1-3 (« pas de soulevé de terre barre généré pour un débutant »). En plus, 12 répétitions de soulevé de terre avec 60 s de repos, c'est une prescription d'accessoire sur un mouvement technique et fatigant.
- **Correction** : `pat2: "lo"` sur `sdts` (et vérifier `kbsdt1`, `trap`). Une ligne de données, et un test.

### S4, reste · Mouvement principal des jambes trop léger en salle (mineur à gênant)
Sur 60 full body 45 min en salle complète, pour un régulier ou un confirmé en hypertrophie, le premier exercice de quadriceps est le squat haltères 15 fois, le goblet squat 7 fois, le squat barre 6 fois, la presse 10 fois et le hack squat 11 fois. Le parcours rejoué donne « Goblet squat 4 × 8 · 14 kg » comme principal d'un « Bas du corps » de régulier. Un goblet squat à 14-16 kg n'est pas un stimulus suffisant pour un pratiquant régulier, puisque le chargement est limité par les bras. Correction : comme `FORCE`, préférer `sq`, `sqf`, `pr`, `hack` et `smith` en case 0 dès le niveau 2, quel que soit l'objectif, quand le matériel le permet. Garder `gob` et `sqh` pour le débutant et le matériel haltères.

### Charges de départ (S1) : contrôle
| Profil | Soulevé de terre | Squat | Développé couché | Développé militaire | Tractions | Curl |
|---|---|---|---|---|---|---|
| Femme débutante, 60 kg | 25 | 25 | 20 | 20 | 0 | 3 |
| Homme débutant | 40 | 40 | 30 | 20 | 0 | 6 |
| Homme régulier | 65 | 65 | 47,5 | 27,5 | 0 | 10 |
| Homme confirmé | 80 | 80 | 60 | 35 | +5 | 12 |
| Profil vide | 50 | 50 | 40 | 22,5 | 0 | 8 |

C'est prudent et crédible. Deux remarques mineures :
- « Je préfère ne pas répondre » au sexe est traité comme un homme (`core.ts:619`, `kSexe = 1`). Un facteur intermédiaire (0,8 / 0,9) serait plus prudent.
- Dans Oxa Plan, `regularite: 3` veut dire « 3 fois par semaine ou plus », pas « confirmé ». Ce profil reçoit pourtant des tractions à +5 kg × 6 dès la semaine 1 (`core.ts:615`). C'est acceptable, puisque le RPE et la série d'ajustement suivent, mais des tractions au poids du corps la première semaine seraient plus sûres.

### Oxa Plan (S7)
Charges de départ selon le profil, vérifiées sur les fixtures : reg. 0, haltères → développé incliné haltères 10 kg × 6 (avant : 18), Arnold 6 kg ; reg. 2 → DC 52,5 × 6 ; reg. 3 → DC 67,5 × 6. Ces valeurs sont cohérentes avec la périodisation (RPE 7 en semaine 1). Le seul point nouveau est F3 (la carte du jour).

### F6 · Split avec muscles écartés (mineur)
Confirmé 5/sem qui écarte jambes et pecs : 6 séances en 10 jours (pull, haut sans dos, pull…). Avant, « Épaules et abdos » comblait ces jours-là. Cas rare. On peut réautoriser « Épaules et abdos » quand des groupes sont écartés.

---

## 4. Priorités

**Avant la mise en prod (moins d'une journée)**
1. F1 : « Cardio doux » → assistant cardio en continu, facile, 20 à 30 min.
2. F2 : `recoPour` utilise `objectifHebdo(E.A)` (une seule valeur par défaut, qui respecte `socle`).
3. F3 : pas de `CarteReco` quand Oxa Plan est actif et en cours (ou la prochaine séance du plan à la place).
4. F4 : `pat2: "lo"` sur le soulevé de terre sumo, plus un test.
5. F5 : ajouter `seance-du-jour` à `SUITE` (cinq minutes, ça protège la nouvelle carte).

**Ce mois**
6. S-a : le 2e tirage seulement s'il reste du temps, et le principal de chaque grand groupe à 3 séries minimum.
7. S3 (reste) : à 3/sem, full body A/B plutôt que haut/bas alterné.
8. S4 (reste) : mouvement principal des jambes à la barre, à la presse ou guidé dès le niveau 2 en salle.
9. N3-a (ligne d'aide), N6-a (« séance d'avant Oxa »), N8 (un seul « Voir la séance »), F7 (5 séances pour un débutant).

**Plus tard**
10. N3-e : purge des séances `auto` anciennes (avec le recalage des index).
11. R2 (reste) : séances prévues dans l'avis du composeur. N2 (reste) : prévu « Choix d'Oxa » sans muscles.
12. S6, S8 (laissés de côté volontairement), F6.
