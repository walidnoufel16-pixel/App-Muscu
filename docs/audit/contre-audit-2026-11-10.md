# Contre-audit Oxa — 10 novembre 2026

Branche `claude/app-muscu-deployment-plan-7398r6`, commit `4b9084e` (corrections `bc65eb7`, `7ace530`, `4b9084e` après le bilan `415e9cb`). Référence : `docs/audit/bilan-2026-11-10.md`.

Méthode :
- lecture de `git diff 415e9cb..HEAD` ;
- deux tests vitest temporaires (supprimés depuis). Ils suivent `recoPour` pendant 28 jours pour 9 profils, appellent `seancePour` (la génération désormais unique) sur 15 cas, `departProfil` et `propositionLibre` pour les charges, et `avisSeance` pour l'avis du composeur ;
- l'app construite (`npm run build`) et un script Playwright temporaire (supprimé) sur le parcours « séance pour un jour à venir ». Captures : `contre-2026-11-10-assistant-jour-a-venir.png`, `contre-2026-11-10-composeur-jour-a-venir.png` ;
- la suite existante passe : 47 fichiers, 479 tests.

## Tableau récapitulatif

| Point | État | En une ligne |
|---|---|---|
| N1 Reco du jour absente de l'accueil | **Non corrigé** | `CarteDuJour` renvoie toujours `null` dès qu'il y a un historique (`accueil-entrainement.tsx:206`). |
| N2 Agenda aveugle aux séances prévues | **Corrigé** | `recoPour` fait tourner les séances : confirmé 5/sem → pull, jambes, épaules-abdos, push. |
| N3 « Mes séances » envahie | **Non corrigé** | `agenda.tsx:249`, `assistant/page.tsx:124`, composeur : toujours `SEANCES.push`. |
| N4 Valeurs inventées à l'accueil | **Corrigé** | Plus d'âge, de taille ni de poids écrits d'office, plus de fausse pesée. |
| N5 Pastilles et compteur de l'accueil | **Corrigé** | Muscles écartés retirés des pastilles ; « 9 questions » et « i / 9 » concordent. |
| N6 Avis du composeur sans course, cardio ni 48 h | **Non corrigé** | `avis-seance.ts:80` et `:125` sans `efforts`. Séance jambes après « hier : quadriceps, ischios » : aucun avis. |
| N7 « Autre » du composeur différent | **Corrigé** | Une seule fonction, `seancePour` (`generer-seance.ts`), pour l'assistant, l'agenda et le composeur. |
| N8 Trois sources pour la séance conseillée | **Corrigé**, avec un défaut nouveau | Le bloc de l'assistant utilise `recoPour`. Mais pour un jour à venir, il montre la reco d'**aujourd'hui** (voir R4). |
| N9 Libellés | **Non corrigé** | « Dos récupèrent », « cette semaine » sur 7 jours glissants, « Pecs et triceps » avec les épaules. |
| N10 Trop de chemins vers la feuille | **Non corrigé** | — |
| S1 Charges de départ | **Partiellement corrigé** | Séances libres : correct. Restent les tractions à +5 kg de lest pour une débutante, des barres sous 20 kg, et Oxa Plan toujours à `x.d`. |
| S2 Rythme et volume hebdo | **Partiellement corrigé** | Quota et repos respectés de 2 à 4 séances/sem. Mais le cardio doux conseillé bloque la muscu, pas de repos imposé à 5 ou plus, profil vide à 6/sem, et le tirage pèse deux fois la poussée en split. |
| S3 Full body débutant | **Partiellement corrigé** | Débutant : full body. Mais à 2/sem, l'alternance haut/bas laisse 3 à 6 séries de pecs par semaine. Débutant à 5/sem : 5 full body du lundi au vendredi. |
| S4 Construction des séances | **Partiellement corrigé** | Exclusions, 2 polyarticulaires et élévations latérales : bon. Nouveaux défauts : réduction à 30 min, curls traités comme mouvement principal, squat haltères 18 kg en force, pompes en appui vertical 3 × 12 pour un débutant. |
| S5 Durée annoncée | **Partiellement corrigé** | L'estimation est honnête (échauffement compris), mais 60 min demandées donnent 45 min (pull confirmé, débutant), et 45 min au poids du corps donnent 15 à 20 min (pull). |
| S6 48 h déclarées | **Non corrigé** | Délais forfaitaires ; trapèzes et lombaires toujours absents de l'écran de fin (`accueil-premier.tsx:181`). |
| S7 Oxa Plan | Inchangé (voulu) | Rien de neuf, mais les charges de départ restent fixes (`core.ts:485`) : le risque S1 demeure pour Oxa Plan. |
| S8 Abducteurs sur le schéma | **Non corrigé** | `muscles-cibles.ts` inchangé ; exclus de la génération (`JAMAIS`), mais toujours « ischios » sur la fiche. |

**Régressions et nouveaux problèmes** (détail en partie 3) :

| # | Gravité | Problème |
|---|---|---|
| R1 | **bloquant (logique)** | Le « Cardio doux » conseillé un jour de repos compte comme jour d'entraînement : le lendemain, « Entraîné hier », donc encore repos. En suivant le conseil : **1 séance de muscu en 14 jours**. Une sortie de course déclenche la même règle. |
| R2 | gênant | Séance pour un jour à venir, ouverte dans le composeur : l'avis évalue la récupération **aujourd'hui** (« Pecs, épaules et triceps récupèrent encore. Travaillés aujourd'hui… » pour une séance du vendredi 13). |
| R3 | gênant | Construction à 30 min : la réduction coupe d'abord le **premier** exercice. Push confirmé : développé couché 2 séries, épaules 4, dips 4. |
| R4 | gênant | Assistant ouvert pour un jour à venir : « Ma recommandation du jour » parle d'aujourd'hui (« Séance faite aujourd'hui… Demain : dos et biceps »). |
| R5 | mineur | « Demain : full body » un samedi où le quota est atteint, alors que le dimanche sera aussi un repos. |
| R6 | mineur | Après « Enregistrer pour ven 13 », le retour arrière ramène à l'assistant, prêt à recréer la même séance. |
| R7 | mineur | Conseils d'équilibre masqués sur une séance Oxa : défendable, mais le masque suit la séance enregistrée (`gen`) pour toujours. |

---

## 1. Navigation et parcours

### N1 — Non corrigé (gênant)
`components/repere/accueil-entrainement.tsx:140-206` : la carte du jour n'affiche que « en cours », « prévue », « faite » ou « première séance », puis `return null`. Le composant `Recommandation` en mode plein n'est toujours monté nulle part (seul usage : `assistant/page.tsx:182`). Rien n'a changé. La correction proposée tient toujours : un `Hero` « Aujourd'hui : … » à partir de `recoPour(etat, auj)`, avec « Commencer », « Autre idée » et « Ignorer ». Le repos (`pause`) a désormais un texte prêt à l'emploi.

### N2 — Corrigé
`lib/logic/agenda.ts:169-189` (`recoPour`) : les prévus à partir d'aujourd'hui comptent comme faits. En programmant jour par jour depuis le mardi 10, après un full body le lundi 9 :
- débutant 3/sem : 10 repos (entraîné hier), 11 full, 12 repos, 13 full, 14 et 15 repos (quota), 16 full ;
- régulier 4/sem : push, repos, jambes, pull, repos, repos, épaules-abdos ;
- confirmé 5/sem : repos, pull, jambes, épaules-abdos, repos, repos, push.

Il n'y a plus de « 7 × Full body ». Reste à faire (mineur) : un prévu « Choix d'Oxa » sans muscles (`quoi: { t: "reco" }`, sans `m`) compte pour le rythme mais pas pour la récupération (`agenda.ts:181`). Le surlendemain, Oxa peut proposer les mêmes muscles que ceux qu'il choisira le jour J.

### N3 — Non corrigé (gênant)
Toujours trois `SEANCES.push` pour des séances générées : `agenda.tsx:249` (aperçu « Ajouter »), `assistant/page.tsx:124` (« Créer et commencer ») et le composeur (`composer/page.tsx:140`, nouveau chemin « Enregistrer pour … »). Comme `recoPour` pousse maintenant à programmer toute la semaine avec « Oxa choisit pour toi », la bibliothèque grossit plus vite qu'avant : une copie par jour programmé.

### N4 — Corrigé (reste mineur)
`accueil-premier.tsx:106-109` : seul `duree ??= 45` est écrit, plus de pesée. Reste mineur : les compteurs affichent 30 ans, 165 ou 177 cm et 70 kg (`profil-sportif.tsx:176-183`) sans rien enregistrer. Si ce sont tes vraies valeurs, tu passes sans toucher, et ton profil reste vide (« — » dans Profil, pas de poids pour `departProfil`). Un état « non renseigné » visible (compteur grisé, « Passer ») lèverait l'ambiguïté.

### N5 — Corrigé
`accueil-premier.tsx:181` filtre les muscles écartés. Le compteur affiche « {i} / 9 », puis « Dernière question » ; la bienvenue annonce 9 questions. C'est cohérent.

### N6 — Non corrigé (gênant)
`ContexteAvis` (`avis-seance.ts:37`) n'a toujours pas d'`efforts`. Fait constaté : séance « quadriceps, ischios, mollets » générée le 10, avec `A.avant = { d: 9, m: [qua, isc] }`, résultat `avisSeance` = `[]`. Pas un mot sur la récupération, alors que l'assistant (`avisMuscles`) prévient.

### N7 — Corrigé
`lib/logic/generer-seance.ts` (`seancePour`) est appelée par l'assistant (`assistant/page.tsx:115`), l'aperçu de l'agenda (`agenda.tsx:236`) et « Autre » (`composer/page.tsx:204`, qui passe désormais `l.pour`). Niveau, priorités, habitudes, mode dense et lombaires sont partout pris en compte.

### N8 — Corrigé, avec un défaut nouveau (voir R4)
`recommandation.tsx:37` utilise `recoPour`, qui ne renvoie jamais `null` (repli full body). Un nouveau compte voit désormais le bloc dans l'assistant, et l'expiration des 48 h ne le fait plus disparaître.

### N9 — Non corrigé (mineur)
- `avis-seance.ts:85` et `:238` : « {a} récupèrent » avec un seul muscle. La nouvelle phrase « {a} récupèrent : retirés de ta séance. » (`recommandation.ts:219`) a le même défaut, et donne « Dos récupèrent : retirés… ».
- `recommandation.ts:214` : « Pas encore travaillés cette semaine » (calculé sur 7 jours glissants).
- `recommandation.ts:82` : « Pecs et triceps » contient les épaules.
- Nouveau : « Tes 3 séances de la semaine sont faites » compte aussi les sorties de course et le cardio (voir R1). Le libellé laisse croire à des séances de muscu.

### N10 — Non corrigé (mineur)
Points d'entrée inchangés.

---

## 2. Séances et programmes

### S1 — Partiellement corrigé
**Ce qui est bon.** `departProfil` (`core.ts:612-623`) met à l'échelle selon le niveau, le sexe, le poids et les répétitions, et la séance affiche « Première fois : charge prudente… ». Charges produites pour 10 répétitions :

| Profil | Soulevé de terre | Squat barre | Couché barre | Militaire | Presse | Rowing barre | Leg extension |
|---|---|---|---|---|---|---|---|
| Femme débutante 60 kg | 25 | 25 | 20 | 10 | 40 | 20 | 12,5 |
| Homme débutant 80 kg | 45 | 45 | 32,5 | 17,5 | 65 | 27,5 | 22,5 |
| Homme régulier 80 kg | 70 | 70 | 50 | 30 | 100 | 42,5 | 35 |
| Homme confirmé 85 kg | 90 | 90 | 67,5 | 40 | 135 | 57,5 | 45 |
| Profil inconnu | 50 | 50 | 40 | 22,5 | 80 | 32,5 | 25 |

C'est prudent et crédible : pour un débutant, ça correspond à une charge que tu soulèves 15 fois ou plus, la règle de la NSCA. Plus de soulevé de terre barre dans une séance générée pour un débutant (`assistant.ts:88`). La trap bar reste possible, ce qui est un bon choix.

**Ce qui reste.**
1. **Exercices lestés** : `departProfil` renvoie `x.d` quand `ch !== "kg"` (`core.ts:614`). Tractions supination pour une débutante : **+5 kg de lest, 3 × 10**, sans explication. La plupart des débutants ne font pas une traction au poids du corps. Il faut 0 kg de lest (ou une version assistée, élastique, négatives) et des répétitions « au max, 3 à 6 ».
2. **Barres sous 20 kg** : le plancher de 20 kg ne s'applique que si `x.d >= 40` (`core.ts:621`). Une femme débutante se voit proposer développé militaire 10 kg, fentes barre 10 kg, rowing barre sur banc 7,5 kg, mollets assis barre 10 kg. Un homme débutant : militaire 17,5 kg. C'est infaisable avec une barre olympique de 20 kg. Il faudrait un plancher « barre à vide » (20 kg, ou 15 kg en barre femme) pour les barres libres, et « barre EZ ou barre fixe » ailleurs.
3. **Oxa Plan** : `ctxPlan` (`core.ts:485`) part toujours de `x.d` à la première fois. Le changement est volontaire, mais le problème de sécurité du bilan (80 kg au soulevé de terre, 80 kg au squat) reste entier pour une débutante qui suit Oxa Plan. Brancher `departProfil` dans ce repli ne change rien à la périodisation.

### S2 — Partiellement corrigé
Simulation sur 28 jours, en suivant chaque jour la séance conseillée par `recoPour` (P = repos imposé par le rythme). Séries par semaine aux semaines 3 et 4 :

| Profil | Séquence (1re semaine) | Séances/sem | Volume hebdo |
|---|---|---|---|
| Débutante 3/sem, 45 min | full P full P full P P | 3 | pecs 9, dos 9, quadriceps 13,5, ischios 13,5 |
| Régulier 3/sem, 60 min | full P bas P haut P P | 3 | alterne : pecs 6 puis 12, quadriceps 20 puis 10 |
| Régulier 4/sem, 60 min | full push P jambes pull P P | 4 | pecs 10, dos 8, épaules 14, quadriceps 10 |
| Confirmé 5/sem, 60 min | full . pull jambes ép-abdos pull P | 5 | **pecs 11, dos 22, biceps 23**, quadriceps 13 à 26, épaules 19 |
| Confirmé 6/sem | idem | 6 | pecs 11, **dos 22, biceps 23, quadriceps 26**, ischios 22 |
| **Profil vide** (« Plus tard ») | full ép-abdos pull jambes haut . . | **6** | 11 à 16 partout |
| Débutant 3/sem + course mardi, jeudi, samedi | full P P full P P P | **2** | pecs 6, quadriceps 3 |

**Corrigé** : de 2 à 4 séances par semaine, le quota et les jours de repos sont tenus. Plus de 7 séances sur 7.

**Reste à faire** :
1. **Le cardio et la course comptent comme jours d'entraînement** (`agenda.ts:175`, `if (j.fait.length || futurs.length)`). C'est R1 : la boucle avec le « Cardio doux » d'Oxa. Pour un coureur, un footing facile de 8 km bloque une séance haut du corps le lendemain. Physiologiquement, rien ne l'interdit. Correction : ne compter que les jours de muscu (`famille === "muscu"`) pour le quota et pour « pas deux jours d'affilée ». La récupération des jambes passe déjà par `effortsEndurance`.
2. **Pas de règle de repos au-delà de 4 séances par semaine** (`recommandation.ts:172-180`) : un débutant qui déclare 5 séances fait **5 full body du lundi au vendredi**. Les pecs travaillent 4 jours sur 5, parce qu'à 3 séries un muscle est considéré récupéré en 24 h (`etatGroupes`, seuil à 4 séries). L'ACSM recommande 48 h entre deux séances sur les mêmes groupes. Correction : un débutant reste plafonné à 3 ou 4 full body, et les jours en plus deviennent « Cardio doux » ou « Mobilité ».
3. **Profil non rempli** : sans `objHebdo`, pas de pause, et le mode split s'applique. Résultat : 6 séances par semaine pour quelqu'un dont on ne sait rien. Correction : par défaut, considérer 3 séances par semaine en full body et haut/bas.
4. **Déséquilibre tirage / poussée en split** : le confirmé fait 2 séances pull par semaine pour 1 push, soit **22 séries de dos et 23 de biceps contre 11 de pecs**. La cause est la même que dans le bilan : les épaules sont à la fois dans « Pecs et triceps » et dans « Épaules et abdos », donc `frais()` bloque souvent la poussée. Le plafond `0,9 × CIBLE` n'empêche pas les débordements, car il est testé **avant** la séance qui ajoute 8 à 10 séries (le test `rythme.test.ts` tolère 1,5 × 16 + 4 = 28). Correction : retirer `epa` du modèle push (ou retirer « Épaules et abdos » de la rotation), et tester `semaine + apport prévu ≤ 1,2 × CIBLE`.

### S3 — Partiellement corrigé
`modeDe` (`recommandation.ts:96`) : débutant → full body, 3 séances ou moins → full, haut, bas, sinon splits. Le cas du bilan, « Jambes » comme première séance, est réglé : après « hier : pecs, triceps », la proposition est un full body sans pecs.

**Reste à faire** :
- **2 séances par semaine en haut/bas** : chaque muscle n'est travaillé qu'une fois par semaine, avec **pecs 3, dos 6, quadriceps 3 à 8 séries/sem**. C'est sous le minimum utile (environ 10 séries, ou au moins 2 fois par semaine par muscle selon Schoenfeld 2016). À 2 séances, il faut 2 full body.
- **Régulier à 4 séances** : rotation push, pull, jambes, épaules-abdos, donc chaque muscle une fois par semaine (pecs 10, dos 8). Un haut/bas × 2 est le standard à 4 séances et donne 2 fois par semaine.
- Débutant à 5 séances : voir S2, point 2.

### S4 — Partiellement corrigé
**Corrigé** (`assistant.ts:41-157`, cases par fonction) :
- plus de pliométrie, de push press, d'élévations frontales, de rotation externe ni d'abducteurs (`JAMAIS`, `horsIA`, `soin`) ;
- deux polyarticulaires sur les grands groupes : confirmé jambes = squat barre 5 × 8, hip thrust 4 × 8, fentes 3 × 10, leg curl, leg extension, mollets debout et assis ;
- élévations latérales présentes en push confirmé ;
- une seule variante de leg extension.

**Nouveaux défauts, produits par le nouveau code** :
1. **Réduction à 30 min (R3)** : `assistant.ts:143-144`. Quand rien ne tient, la boucle « partout » réduit les exercices dans l'ordre de `res` : le premier, c'est-à-dire le principal du muscle le plus important, passe à 2 séries. Résultat sur trois tirages, push confirmé 30 min : **développé couché 2 × 8, développé épaules 4 × 8, dips machine 4 × 8**. C'est l'inverse de ce qu'il faut. Correction : réduire en partant de la fin (les petits muscles d'abord), ou répartir.
2. **Les curls sont traités comme polyarticulaires** : `estPoly` (`assistant.ts:122`) compte tout second schéma, avant-bras compris. Celui d'`avis-seance.ts:43` exclut `avb`, `tra`, `add` et `mol`. Conséquence : « Curl au pupitre 3 × 8, repos 2 min 30 », « Curl à la poulie 3 × 8, 2 min 30 » dans un pull de 30 min, « Curl marteau 4 × 10 (90 s) ». C'est du temps perdu, et ça dégrade aussi la durée (S5). Correction : réutiliser l'`estPoly` d'`avis-seance`.
3. **Force sans barre** : la case 1 des quadriceps mélange squat barre, goblet squat, squat haltères et kettlebell (`assistant.ts:51`). Confirmé, objectif force : **squat haltères 4 × 5 à 18 kg** comme mouvement principal. Un 5RM aux haltères de 18 kg n'a pas de sens en force. Correction : pour l'objectif force et les niveaux régulier ou confirmé, ne garder en case 1 que les barres, la presse ou le hack squat quand le matériel le permet.
4. **Poids du corps : pompes en appui vertical 3 × 12** pour un débutant comme pour un régulier (`pv3` en case 1 des épaules, `assistant.ts:55`, et `r = max(r, 12)` pour `ch: "aucune"`). Ce sont des pompes en équilibre sur les mains, un exercice avancé, risqué pour la nuque et les épaules d'un débutant. 12 répétitions est irréaliste même pour un confirmé moyen. Correction : pike push-ups (pieds au sol) pour les débutants et les réguliers, et des répétitions plafonnées par exercice.
5. **Haut du corps régulier, 45 min** : un seul tirage (tirage vertical 4 × 8) contre chest press, militaire et dips à 3 × 8. Ça fait 4 séries de dos pour environ 9 de poussée, et pas de rowing. L'équilibre « tirage avant poussée » (`PREF`) ne joue que sur l'ordre, pas sur le nombre de cases. Correction : en haut du corps, 2 cases de dos (vertical et horizontal) avant la deuxième case d'un muscle de poussée.

### S5 — Partiellement corrigé
`dureeEstimee` compte maintenant 5 min d'échauffement (`assistant.ts:171`), et la construction remplit jusqu'à la durée demandée : 45 min → 40 à 45 min, 30 min → 30 à 35 min. Le chiffre affiché (« environ 45 min ») est honnête. Restent des séances plus courtes que la durée choisie, sans que l'écran le dise :
- pull confirmé 60 min : 5 exercices, 19 séries, **45 min** ;
- débutante 60 min : **45 min**. C'est voulu (3 séries au plus), mais il faut le dire : « 45 min suffisent à ton niveau » ;
- pull au poids du corps, 45 min : **1 exercice, 15 min** sans barre de traction (rowing australien 4 × 12, rien pour les biceps) ; 2 exercices et 20 min avec la barre pour un débutant.

Dans ces cas, l'assistant devrait prévenir (« Avec ce matériel, 15 min : ajoute des muscles ou du matériel »), ou compléter avec un autre muscle compatible.

### S6 — Non corrigé (mineur)
Délais forfaitaires inchangés (`recommandation.ts:49-54`). L'écran de fin n'affiche toujours que `GROUPES` (`accueil-premier.tsx:181`). Nouveau détail : les muscles déclarés « hier » ne comptent pas comme un jour d'entraînement pour la règle « pas deux jours d'affilée » (`recoPour` ne lit pas `A.avant`). C'est cohérent avec le retrait des muscles du full body, et donc acceptable.

### S7 — Oxa Plan (inchangé, voulu)
Pas de modification de la périodisation. Voir S1, point 3, pour les charges de départ.

### S8 — Non corrigé
`lib/logic/muscles-cibles.ts:41` : `principal = pat(x.pat)`. Les abducteurs (`abd`, `pat: "fh"`) allument toujours les ischios sur la fiche. La génération ne les propose plus (`JAMAIS`), mais ils restent dans la bibliothèque et le composeur.

---

## 3. Régressions et nouveaux problèmes

### R1 — Le « Cardio doux » d'Oxa bloque la musculation — bloquant (logique)
- **Où** : `lib/logic/agenda.ts:175` (tout jour avec un `fait`, de n'importe quelle famille, compte), `recommandation.ts:178` (« Entraîné hier »).
- **Constaté** : débutant 3/sem qui suit le conseil du repos (« Cardio doux », ici 20 min de vélo) : `full`, puis **13 jours de « cardio (P) »**. Chaque cardio rend le lendemain « Entraîné hier », et Oxa propose de nouveau du cardio doux. Même logique pour la course : débutant 3/sem qui court mardi, jeudi et samedi, seulement **2 séances de muscu par semaine**.
- **Pourquoi** : Oxa conseille une action, puis la sanctionne. « Séance quand même » permet d'en sortir, mais la recommandation devient incohérente.
- **Correction** : pour `pauseDe`, ne compter que les jours de muscu (`familleDe === "muscu"`, et les prévus `libre`, `reco` ou `plan`). L'impact de la course sur les jambes est déjà géré par `effortsEndurance`.

### R2 — Avis du composeur faux pour un jour à venir — gênant
- **Où** : `components/repere/avis-seance.tsx:20` (`auj = jourDe(Date.now())`), alors que `L.pour` est connu. Ce chemin est nouveau (`4b9084e` : « Voir la séance » ouvre le composeur au lieu de programmer directement).
- **Constaté** (app lancée, capture `contre-2026-11-10-composeur-jour-a-venir.png`) : push fait aujourd'hui (10), séance push créée pour le vendredi 13. L'avis dit « **Pecs, épaules et triceps récupèrent encore.** Travaillés aujourd'hui : allège-les aujourd'hui… ». Avec `auj = 13`, il n'y a aucun avis.
- **Correction** : `avisSeance(L, { …, auj: L.pour ?? auj })`. Il faudrait aussi y ajouter les prévus d'ici là, comme `recoPour`.

### R3 — Réduction à 30 min qui ampute le mouvement principal — gênant
Voir S4, point 1.

### R4 — L'assistant pour un jour à venir recommande pour aujourd'hui — gênant
- **Où** : `recommandation.tsx:30` et `:37` (`recoPour(etat, auj)`), monté dans l'assistant ouvert par « Je choisis les muscles » pour un jour à venir (`agenda.tsx:118`, `?jour=d`, sans `m`).
- **Constaté** (capture `contre-2026-11-10-assistant-jour-a-venir.png`) : pour le vendredi 13, le bloc affiche « Séance faite aujourd'hui. Ton corps récupère… Demain : dos et biceps. », sans bouton « Appliquer ».
- **Correction** : passer le jour au composant (`Recommandation jour={pour ?? auj}`) et utiliser `recoPour(etat, jour, auj)`.

### R5 — « Demain » ignore le rythme — mineur
`recommandation.ts:239` : `demain()` n'applique pas `pauseDe`. Débutant 3/sem (lundi, mercredi, vendredi) : le samedi, « Tes 3 séances de la semaine sont faites : récupère. **Demain : full body.** ». Le dimanche, de nouveau « récupère ». Même défaut sur l'écran de fin de l'accueil (« Programmer demain »).

### R6 — Retour arrière vers l'assistant après « Enregistrer pour … » — mineur
`composer/page.tsx:158` fait `router.replace("/entrainement")` depuis le composeur : l'assistant reste dans l'historique. Fait constaté : après l'enregistrement, `goBack()` ramène à `/entrainement/assistant/?jour=…&m=pec,tri,epa`, prêt à créer un doublon. Avant `4b9084e`, l'assistant se remplaçait lui-même. Correction : `revenirA("/entrainement", …)`, ou dépiler l'assistant.

### R7 — Conseils d'équilibre masqués sur une séance Oxa — mineur
`avis-seance.ts:219-220`. C'est défendable : la reco et `avisMuscles` (au choix des muscles) traitent déjà l'équilibre, et les conseils reviennent dès qu'un exercice d'un autre muscle entre. Deux limites :
- `gen` est enregistré avec la séance (`composer/page.tsx:120`). Une séance « Pecs · Triceps · Épaules » réutilisée et modifiée des semaines plus tard ne déclenche plus jamais « X séries de poussée, pas de dos cette semaine », alors que ce conseil dépend de la semaine en cours ;
- une séance de l'agenda (« Haut du corps », sans tronc) ouverte par « Modifier » n'a jamais vu `avisMuscles` : le conseil « Pas de lombaires ni de gainage » n'apparaît nulle part.

Correction : ne masquer que tant que la séance n'est pas enregistrée, ou garder le conseil hebdomadaire « tirage » et « poussée ».

---

## 4. Priorités

**Cette semaine**
1. R1 : ne compter que la muscu dans `pauseDe`. Une ligne dans `recoPour`, et ça supprime la boucle cardio et la pénalité des coureurs.
2. R2 et R4 : passer le jour visé à `AvisSeance` et à `Recommandation`.
3. R3 et S4, point 2 : réduction des séries par la fin ; `estPoly` commun avec `avis-seance`.
4. S1 : lest à 0 et répétitions « au max » pour les tractions et les dips d'un débutant ; plancher barre à vide ; `departProfil` dans le repli d'Oxa Plan (`core.ts:485`).
5. S4, point 4 : plus de pompes en appui vertical pour les débutants et les réguliers.

**Ce mois**
6. S2 et S3 : 2 séances/sem = 2 full body ; régulier à 4 séances = haut/bas × 2 ; débutant plafonné à 3 ou 4 full body ; profil vide = 3/sem ; poussée débloquée en split (épaules hors push, plafond testé avec l'apport de la séance).
7. N1 : la séance du jour sur l'écran Entraînement.
8. N6 : `efforts` dans `ContexteAvis`.
9. S4, points 3 et 5 : barre en case 1 pour la force ; deux tirages en haut du corps.
10. S5 : prévenir quand le matériel ne remplit pas la durée choisie.

**Plus tard**
11. N3 : séances générées rangées à part.
12. R5, R6, R7, N9, N10, S6, S8.
