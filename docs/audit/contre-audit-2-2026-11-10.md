# Contre-audit n°2 : 10 novembre 2026

Branche `claude/app-muscu-deployment-plan-7398r6`, commit `fe1787d`, comparé à `4b9084e`. Références : `bilan-2026-11-10.md` et `contre-audit-2026-11-10.md`.

Méthode :
- lecture de `git diff 4b9084e..fe1787d` ;
- un test vitest temporaire (supprimé). Il simule 21 jours avec `recoPour` en suivant le conseil (cardio doux les jours de repos, coureur), appelle `recoDuJour` pour « demain », `avisSeance` (jour visé, efforts, `idx`) et `construireSeance` (30 min, poids du corps) ;
- l'app construite (`npm run build`) et deux scripts Playwright temporaires (supprimés). Parcours testés : assistant ouvert pour un jour à venir, composeur, « Enregistrer pour », retour arrière, « Mes séances » avec seulement des séances `auto`, « Créer et commencer » puis « Garder », « Ajuster » puis « Enregistrer », modification d'une séance `auto` depuis l'agenda. Le test e2e existant `menu-jour.mjs` passe (18/18) ;
- la suite vitest passe : 44 fichiers, 478 tests.

Captures : `contre2-2026-11-10-mes-seances-vide.png`, `contre2-2026-11-10-assistant-jour-a-venir.png`, `contre2-2026-11-10-variante-seance-auto.png`.

## Tableau récapitulatif

| Point | État | Preuve en une ligne |
|---|---|---|
| R1 Rythme : seule la muscu compte | **Corrigé** (un reste mineur) | Débutant 3/sem avec cardio doux les jours de repos : 9 séances de muscu en 21 jours (avant : 1 en 14). Coureur mar/jeu/sam : full body lun/mer/ven. Reste : une routine de **soin** compte comme muscu (« Entraîné hier » après 10 min de mobilité). |
| R2 Avis du composeur au jour de la séance | **Corrigé** (un reste mineur) | Push fait le 10, séance push pour le 13 : `avisSeance` donne `[]` ; pour le 10 : « Pecs, épaules et triceps récupèrent encore. » Reste : les séances **prévues** d'ici là ne comptent pas. |
| R3 Réduction à 30 min depuis la fin | **Corrigé** | Push confirmé 30 min : couché 4×8, épaules 4×8, puis dips 2×8 ou barre au front 3×12 (avant : couché 2×8). |
| R3 Curls hors polyarticulaires | **Corrigé** | Curls en 3×12, repos 45 à 60 s (avant : 3×8, repos 2 min 30). |
| R3 Pompes en appui vertical | **Non corrigé dans les faits** | Retirées des cases, mais elles reviennent par `secours` au poids du corps : **50 %** des exercices d'épaules pour un débutant (45 tirages sur 90). |
| R4 Reco de l'assistant pour un jour à venir | **Corrigé** | « MA RECOMMANDATION POUR VEN 13 · Dos et biceps · Appliquer » (capture). |
| R5 « Demain » respecte le rythme | **Corrigé** | Samedi après lun/mer/ven (3/sem) : `demain` vide. Jeudi : demain full body. Dimanche : demain (lundi) full body. Même résultat sans historique (`recoDuJour`, début). |
| R6 Retour arrière après « Enregistrer pour » | **Corrigé** | Parcours réel (case du 13 → « Je choisis les muscles » → « Voir la séance » → « Enregistrer pour ») : le retour arrière quitte Entraînement, sans repasser par l'assistant. |
| R7 Équilibre masqué seulement avant enregistrement | **Corrigé** | Même séance push, deux push dans la semaine : `idx: null` → aucun conseil ; `idx: 3` → « 12 séries de poussée, et pas de dos cette semaine. » |
| N3 Séances d'Oxa hors de « Mes séances » | **Partiellement** : objectif atteint, mais deux régressions | Le marquage `auto` marche (assistant, agenda, composeur, « Garder »). **Régressions** : « Mes séances » vide et sans message, et le bloc « Créer » disparaît (N3-a). La case « Garder » est ignorée par « Enregistrer » (N3-b). Voir la partie 2. |
| N6 Avis du composeur avec course, cardio et 48 h | **Corrigé** (libellé à revoir) | « Hier : quadriceps, ischios » → « Quadriceps et ischios récupèrent encore. » Sortie de 18 km la veille → quadriceps, ischios, mollets. Texte : « garde **ce muscle** » au singulier pour 3 muscles. |
| N9 Libellés | **Partiellement, avec une régression** | « ces 7 derniers jours » et « Pecs, épaules et triceps » : bon. Mais l'accord au singulier donne « **Pecs récupère** : retiré de ta séance », « Épaules récupère », « Quadriceps récupère » : 8 groupes sur 9 ont un nom pluriel. |
| N1, N10, S6, S8 | Non traités (voulu) | Fichiers non touchés par `fe1787d` (`accueil-entrainement.tsx`, `muscles-cibles.ts`, délais de `recommandation.ts`). |
| Restes S1, S2, S3, S4 (3 à 5), S5 | Non traités (voulu) | Inchangés. Simulation : confirmé 5/sem → 1 push pour 2 pull par semaine ; pull confirmé « 60 min » → 40 à 45 min. |

**Nouveaux problèmes introduits par `fe1787d`**

| # | Gravité | Problème |
|---|---|---|
| N3-a | **gênant** | « Mes séances » avec seulement des séances `auto` : un titre, l'astuce « Fais glisser une séance… » et rien d'autre. Le message « Aucune séance enregistrée » et le bloc « Créer une séance » ne s'affichent plus. |
| N9-a | gênant (texte visible partout) | « Pecs récupère », « Épaules récupère : retiré de ta séance » : le pluriel dépend du nombre de groupes, pas du nom. Le test `rythme.test.ts` fige même « Pecs récupère : retiré de ta séance. » |
| R3-a | gênant (sécurité) | Pompes en appui vertical toujours proposées au poids du corps, via `secours`. |
| N3-b | mineur | Case « Garder aussi dans Mes séances » décochée, puis « Enregistrer » : la séance est gardée quand même. La case ne sert que pour « Commencer ». |
| N3-c | mineur | « Modifier » depuis l'agenda une séance `auto` : « Une variante garde « Dos · Biceps » telle qu'elle est… », alors que cette séance n'est visible nulle part. Pas de case « Garder » sur ce chemin. |
| N3-d | mineur | Textes devenus faux : « La séance reste dans Mes séances » (retirer de l'historique) ; « Tout effacer » annonce « N séances composées » en comptant les cachées. |
| N3-e | mineur | Les séances `auto` ne sont jamais supprimées ni supprimables (une par séance programmée ou lancée). |
| N6-a | mineur | « … garde ce muscle pour une prochaine séance » au singulier, quel que soit le nombre de muscles ; « séance d'avant Oxa » est obscur. |

---

## 1. Vérification des corrections

### R1 : Corrigé (un reste mineur)
`lib/logic/agenda.ts:175` ne compte plus que `famille === "muscu"` (faits) et `familleDe(p.quoi) === "muscu"` (prévus).

Simulation sur 21 jours à partir du lundi 2 novembre. Chaque jour, on suit `recoPour`. Un jour de repos, on enregistre 20 min de vélo « doux » :
- débutant 3/sem : `full P full P full P P`, trois semaines de suite, **9 séances** (avant : 1 en 14 jours) ;
- régulier 4/sem : 12 séances ; confirmé 5/sem : 15 séances ;
- coureur débutant 3/sem (8 km RPE 5 mardi, jeudi, samedi) : full body lundi, mercredi, vendredi, repos dimanche (« Tes 3 séances de muscu de la semaine sont faites »). Avant : 2 séances par semaine.

Reste (mineur) : `faitsParJour` (`agenda.ts:72`) range toute ligne de `HIST` en « muscu », y compris une routine de soin (« Soin genoux », exercices `soin`). Constaté : soin hier → `type: "repos"`, « Entraîné hier : à 3 séances par semaine, un jour de repos entre deux séances. » 10 min de mobilité ne justifient pas un jour de repos. Correction : ignorer les lignes dont tous les exercices sont `soin` (ou la séance `SEANCES[i].soin`).

Remarque de coach, pas une régression : chez ce coureur, les jambes travaillent 6 jours sur 7 (full body avec squat lun/mer/ven, course mar/jeu/sam). À 8 km facile, c'est tenable. Mais ce cas relève de S2/S3 : un « haut du corps » le lendemain d'une sortie dure serait plus logique qu'un full body.

### R2 : Corrigé (un reste mineur)
`components/repere/avis-seance.tsx:24` : `auj = L.pour ?? aujReel`. Constaté avec `avisSeance` (push de 12 séries fait le 10) :
- séance push jugée pour le 10 : « Pecs, épaules et triceps récupèrent encore. » ;
- pour le 11 : même titre, « Travaillés hier… » ;
- pour le 13 : aucun avis.

Restes, tous deux mineurs :
- les séances prévues entre aujourd'hui et le jour J ne comptent pas (`avisSeance` ne reçoit que `HIST`), alors que `recoPour` les compte. Une séance push prévue jeudi, puis une séance push composée pour vendredi : aucun avis ;
- le « quand » est relatif au jour J. Composée le 10 pour le 11, la séance faite aujourd'hui est annoncée « Travaillés **hier** ». Ça peut surprendre ; « Travaillés la veille » lèverait l'ambiguïté.

### R3 : Corrigé pour la réduction et les curls ; non corrigé pour les pompes en appui vertical
**Réduction** (`assistant.ts:146`, `[...res].reverse()`). Push confirmé 30 min, quatre tirages : le développé couché reste à 4×8 dans les quatre cas. C'est le dernier exercice (dips 2×8, ou barre au front 3×12) qui est réduit. Full body régulier 30 min : principal 3×8, puis 2×8 sur les autres polyarticulaires. C'est acceptable à 30 min.

**estPoly** (`assistant.ts:123`) : les curls (`pat2: "avb"`) passent en isolation, 3×12, repos 45 à 60 s. Le pull confirmé 30 min tient désormais 4 exercices (tirage vertical 4×8, rowing 3×10, deux curls 3×12) au lieu de curls à 2 min 30 de repos.

**Pompes en appui vertical : pas réglé dans les faits.** `pv3` a été retiré de la case 1 des épaules (`assistant.ts:55`). Mais au poids du corps seul, aucune case des épaules n'a de candidat. La construction passe alors par `secours` (`assistant.ts:108-114`), qui prend tous les exercices du schéma `pv`, `pv3` compris : il n'est ni dans `JAMAIS` ni marqué `horsIA`. Sur 15 tirages × 3 choix de muscles × 2 matériels (poids du corps, avec ou sans barre de traction) :

| Niveau | Pompes pike | Pompes en appui vertical |
|---|---|---|
| Débutant | 45 (3×12) | **45 (3×12)** |
| Régulier | 48 (3 ou 4×12) | **42 (3 ou 4×12)** |

Une séance d'épaules sur deux, un débutant à la maison reçoit 3 séries de 12 pompes en équilibre sur les mains. C'est infaisable, et risqué pour la nuque et les épaules. **Correction** : ajouter `pv3` à `JAMAIS` (ou le marquer `horsIA`), ou bien le filtrer dans `secours` pour les niveaux 1 et 2.

### R4 : Corrigé
`recommandation.tsx:39-40` et `assistant/page.tsx:183` (`jour={pour}`). Constaté dans l'app (capture `contre2-2026-11-10-assistant-jour-a-venir.png`) : push fait aujourd'hui (mardi 10), assistant ouvert pour le vendredi 13. On voit « MA RECOMMANDATION POUR VEN 13 · Dos et biceps · Pas travaillés ces 7 derniers jours », avec « Appliquer ».

### R5 : Corrigé
`recommandation.ts:240-244` et `:268`. Débutant 3/sem :

| Jour | Type | « Demain » |
|---|---|---|
| Samedi, après lun/mer/ven | repos (quota) | — (avant : « full body ») |
| Vendredi, 3e séance faite | fait | — |
| Mercredi, séance faite | fait | — (jeudi : « Entraîné hier ») |
| Jeudi, repos après mercredi | repos | Full body |
| Dimanche, après lun/mer/ven | repos | Full body (lundi, nouvelle semaine) |

Régulier 4/sem, lundi et mardi faits : `demain` vide (« deux jours d'affilée »). Sans historique, `recoDuJour` se comporte de la même façon.

### R6 : Corrigé
`composer/page.tsx:162` : `revenirA("/entrainement", …)`. Parcours réel dans l'app : case du ven 13 → « Je choisis les muscles » → « Appliquer » → « Voir la séance » → « Enregistrer pour ven 13 ». Le retour arrière quitte Entraînement (l'entrée suivante était hors de l'app), sans repasser par l'assistant ni le composeur.

Le retour arrière ne marche que si l'assistant a été ouvert par la navigation de l'app. Avec une URL saisie directement (`page.goto`), on revient à l'assistant. C'est normal : `revenirA` lit la pile de l'app.

### R7 : Corrigé
`avis-seance.ts:223` : `oxa = !!L.gen && L.idx == null && …`. Même séance push générée, deux séances push dans la semaine : brouillon neuf (`idx: null`), aucun conseil d'équilibre ; séance enregistrée et rouverte (`idx: 3`), « 12 séries de poussée, et pas de dos cette semaine. »

### N3 : Partiellement (l'objectif est atteint, mais il y a des régressions)
Ce qui marche, vérifié dans l'app et par `menu-jour.mjs` :
- aperçu de l'agenda → « Ajouter le … » : `auto: true` (`agenda.tsx:249`) ;
- assistant → « Créer et commencer » : `auto: true` (`assistant/page.tsx:125`). La séance affiche « Garder », et après un appui la séance apparaît dans « Mes séances » (toast « Gardée dans Mes séances ») ;
- composeur pour un jour à venir : `auto` sauf si la case est cochée ;
- composeur sans jour : « Enregistrer » garde la séance, « Commencer » la marque `auto` ;
- la feuille « Programmer une séance » ne liste pas les séances `auto` (`agenda.tsx:502`) ;
- l'index ne bouge pas : la séance `auto` reste à sa place dans `SEANCES`. L'agenda (`quoi.i`), le journal (`L|i|j`), l'historique (`L|i`) et « Refaire » la retrouvent. Le partage n'est possible qu'une fois la séance gardée (il passe par « Mes séances »), ce qui est cohérent.

Les régressions sont détaillées dans la partie 2 (N3-a à N3-e).

### N6 : Corrigé (libellé à revoir)
`avis-seance.tsx:27` passe `effortsEndurance(SORTIES, CARDIO, A.avant)`, et `avis-seance.ts:80-89` en tient compte. Constaté le 10, séance quadriceps, ischios, mollets :
- « Hier : quadriceps, ischios » (accueil) → « Quadriceps et ischios récupèrent encore. » Avant : aucun avis ;
- sortie de 18 km RPE 7 la veille → « Quadriceps, ischios et mollets récupèrent encore. » ;
- 40 min de fractionné sur tapis la veille → récupéré le 10, aucun avis. C'est cohérent avec les délais de `effortsEndurance`.

Libellé : voir N6-a.

### N9 : Partiellement, avec une régression
Corrigé : « Pas travaillés ces 7 derniers jours. » (`recommandation.ts:214`), « Pecs, épaules et triceps » (`:82`), « séances de muscu » (`:176`).

Régression : voir N9-a.

---

## 2. Nouveaux problèmes introduits par `fe1787d`

### N3-a : « Mes séances » vide et muette, bloc « Créer » perdu (gênant)
- **Où** : `app/entrainement/rubrique/page.tsx:42` (`aDesSeances = !!SEANCES.length || …`) et `components/repere/mes-seances.tsx:71` (`vide = !etat.SEANCES.length && !cardio.length`). Ces deux tests comptent les séances `auto`, que la liste filtre désormais (`mes-seances.tsx:38`).
- **Constaté** (capture `contre2-2026-11-10-mes-seances-vide.png`) : un utilisateur qui n'a fait que des séances d'Oxa (le parcours conseillé) ouvre « Mes séances ». Il voit le titre, l'astuce « Fais glisser une séance vers la gauche pour la supprimer. », puis « Ou travaille autre chose aujourd'hui ? ». Pas de séance, pas de message « Aucune séance enregistrée… », et `FeuilleImport` à la place du bloc `CreerSeance`.
- **Pourquoi c'est un problème** : l'écran donne l'impression d'un bug (« où sont passées mes séances ? »). Le chemin « créer une séance » de cet écran disparaît. Rien n'explique que les séances d'Oxa sont dans l'agenda et qu'on peut les garder.
- **Correction** : un seul compteur, « séances visibles » (`SEANCES.filter(s => !s.auto)`), utilisé dans `aDesSeances` et dans `vide`. Ajouter une ligne d'aide quand des séances `auto` existent : « Les séances construites par Oxa restent dans ton agenda. Touche Garder pendant la séance pour les retrouver ici. » L'astuce de balayage ne doit s'afficher que s'il y a au moins une ligne.

### N9-a : accord au singulier faux pour 8 groupes sur 9 (gênant)
- **Où** : `recommandation.ts:219` et `:237`, `avis-seance.ts:86` et `:242`, `accueil-premier.tsx:186`. Le choix singulier ou pluriel se fait sur le **nombre de groupes** (`tp(recup.length, …)`). Or les noms sont presque tous au pluriel : Pecs, Épaules, Biceps, Triceps, Quadriceps, Ischios, Mollets, Abdos (`nomGroupe`, `recommandation.ts:39-41`). Seul « Dos » est singulier.
- **Constaté** : `recoDuJour` après « Hier : pecs, triceps » renvoie « **Pecs récupère : retiré de ta séance.** ». Le test `rythme.test.ts:72` l'attend tel quel. De même, « Épaules récupère encore. » et « Quadriceps récupère de la séance d'hier. » Avant `fe1787d`, seul « Dos récupèrent » était faux ; maintenant ce sont tous les autres.
- **Correction** : pluriel par défaut, singulier seulement pour un groupe unique `dos` (et `tra`, `lom` selon le nom). Par exemple `const sing = l.length === 1 && l[0] === "dos"`. Adapter `rythme.test.ts:72` en conséquence.

### R3-a : pompes en appui vertical par `secours` (gênant, sécurité)
Voir R3 ci-dessus : 50 % des exercices d'épaules au poids du corps pour un débutant.

### N3-b : la case « Garder aussi dans Mes séances » est ignorée par « Enregistrer » (mineur)
- **Où** : `composer/page.tsx:266-276`. Pour une séance d'Oxa sans jour (« Ajuster »), la case s'affiche au-dessus de « Enregistrer » et « Commencer ». Mais « Enregistrer » appelle `enregistrer(false, true)` : la séance est gardée, que la case soit cochée ou non.
- **Constaté** : case décochée + « Enregistrer » → « Quadriceps · Fessiers et ischios » sans `auto`, visible dans « Mes séances ».
- **Correction** : n'afficher la case qu'avec « Enregistrer pour … ». Sans jour, la paire de boutons suffit (« Enregistrer » = la garder, « Commencer » = séance du jour). Ou bien faire respecter la case par « Enregistrer », mais il faut choisir un seul sens.

### N3-c : modifier depuis l'agenda une séance `auto` (mineur)
- **Où** : `composer/page.tsx:127-131`, avec `L.agenda` et `L.idx != null`.
- **Constaté** (capture `contre2-2026-11-10-variante-seance-auto.png`) : « Pour ce jour, ou pour de bon ? Une variante garde « Dos · Biceps » telle qu'elle est… ». Cette séance n'existe nulle part ailleurs que ce jour-là : la question n'a pas de sens. « Une variante » crée une seconde séance cachée et laisse la première orpheline. Sur ce chemin, il n'y a ni case ni bouton « Garder » (case seulement si `L.pour`).
- **Correction** : si `L.auto`, ne pas poser la question (modifier la séance elle-même) et afficher la case « Garder aussi dans Mes séances ».

### N3-d : textes devenus faux (mineur)
- `app/progres/page.tsx:414` et `components/repere/agenda.tsx:413` : « La séance reste dans Mes séances. ». C'est faux pour une séance `auto`.
- `app/profil/page.tsx:76` (« Tout effacer ») : « 12 séances composées » compte les séances cachées, alors que « Mes séances » en montre 0.
- Commentaires obsolètes : `agenda.tsx:223`, `agenda.tsx:246` et `assistant/page.tsx:120` disent encore « enregistrée dans Mes séances ».

### N3-e : séances `auto` jamais nettoyées (mineur)
Chaque séance programmée ou lancée via Oxa ajoute une entrée à `SEANCES` : environ 150 à 250 par an pour quelqu'un qui suit Oxa 3 à 5 fois par semaine. Avant, l'utilisateur pouvait les supprimer depuis « Mes séances » ; maintenant elles sont invisibles et insupprimables. Le volume reste faible (quelques centaines de Ko synchronisés), mais rien ne les retire, même quand le prévu est retiré de l'agenda. Correction possible, plus tard : purger les `auto` sans prévu à venir et sans journal ni ligne d'historique depuis plus de 8 semaines. Attention : `supprimerSeance` décale les index (`L|i`, `quoi.i`), donc cette purge doit passer par le même recalage.

Risque existant, pas nouveau, mais à garder en tête pour cette purge : quand on supprime une séance visible, les séances suivantes (souvent `auto`, aux noms répétés comme « Full body » ou « Dos · Biceps ») changent d'index. L'agenda les retrouve alors par leur nom (`indexLibre`, `agenda.tsx:46`), donc parfois la mauvaise (la première « Dos · Biceps »).

### N6-a : libellé de l'avis « efforts » (mineur)
`avis-seance.ts:87` : « Course, cardio ou séance d'avant Oxa : allège, ou garde **ce muscle** pour une prochaine séance. ». Affiché sous « Quadriceps, ischios et mollets récupèrent encore. » Il faut le pluriel (« ces muscles », via `tp`). « Séance d'avant Oxa » est obscur ; « séance déclarée à l'accueil » est plus clair. Le texte pourrait aussi nommer la cause connue (« Ta sortie de 18 km d'hier »).

---

## 3. Points volontairement non traités : état
- **N1** (reco du jour sur l'accueil), **N10** (chemins vers la feuille), **S6** (délais forfaitaires, trapèzes et lombaires absents de l'écran de fin), **S8** (abducteurs sur le schéma) : inchangés.
- **S1** (lest des tractions, barres sous 20 kg, charges de départ d'Oxa Plan) : inchangé (`core.ts` non touché).
- **S2** (débutant à 5 séances ou plus, profil vide, push/pull en split) : inchangé. La simulation confirmé 5/sem donne toujours 1 push pour 2 pull par semaine (`full epaabd jambes pull push`, puis `jambes epaabd pull jambes push`).
- **S3** (2 et 4 séances) : inchangé.
- **S4**, points 3 à 5 : inchangés.
- **S5** : inchangé. Pull confirmé « 60 min » → 40 à 45 min ; séance générée pour le ven 13 avec 45 min déclarées → « environ 30 min ».

---

## 4. Priorités

**Cette semaine**
1. N3-a : compter les séances visibles dans `aDesSeances` et `vide`, et ajouter une ligne d'explication sur les séances d'Oxa.
2. N9-a : pluriel par défaut, singulier seulement pour « Dos » ; corriger le test `rythme.test.ts:72`.
3. R3-a : `pv3` dans `JAMAIS` (ou filtré dans `secours` pour les niveaux 1 et 2).

**Ce mois**
4. N3-b et N3-c : une seule règle pour la case « Garder » ; pas de question « variante » pour une séance `auto`.
5. N3-d et N6-a : textes.
6. R1 (reste) : une routine de soin ne compte pas comme jour de muscu. R2 (reste) : les séances prévues dans l'avis du composeur.

**Plus tard**
7. N3-e : purge des séances `auto` anciennes, avec le recalage des index.
8. Les points laissés de côté : S1, S2, S3, S4, S5, N1, N10, S6, S8.
