# Oxa mobile (Flutter)

L'appli iOS et Android d'Oxa. À terme, elle remplace l'appli web ; le site reste une vitrine
avec les liens vers l'App Store et le Play Store.

**Version actuelle : mode Suivi.** « Créer mon compte » comme sur le site : un surnom et une adresse
facultative, compte créé sans mot de passe (connexion anonyme), l'adresse confirmée par un code
(`lib/logique/inscription.dart`, `ecrans/adresse.dart`, aussi depuis Profil pour un compte sans adresse).
Le document rangé à la création est celui du site : mode Suivi verrouillé (`A.suiviSeul`), accueil du site
passé, Mes séances vide ; le compte marche aussi sur le site.
« J'ai déjà un compte » : connexion par code reçu par mail (comptes du site), « Mes
séances » (prochaine séance, dernière fois), puis la séance : charge proposée et pourquoi,
précédent, record, séries à cocher, minuteur de repos. « Terminer la séance » range la séance
dans le compte, comme le site (journaux dans LOG, ligne du jour dans HIST) : elle apparaît dans
Progrès sur le site. La séance en cours est gardée sur le téléphone jusqu'à la fin.
« Nouvelle séance » : un nom, puis les exercices choisis dans le catalogue (recherche, filtre par
muscle, photos). Le crayon de la séance la modifie (nom, exercices ajoutés, retirés, réordonnés) ou la
supprime, avec les mêmes règles que le site (`lib/logique/seances.dart`) : elle apparaît aussi sur le site.
Trois onglets comme sur le site : Séances, Progrès, Profil (pseudo, mode Suivi / Guidé,
déconnexion, suppression du compte par la fonction Edge `oublier`, comme « Tout effacer » du site).

L'accueil Séances (`ecrans/accueil_suivi.dart`, comme `web/components/repere/accueil-suivi.tsx`), au-dessus de
Mes séances, sauf pour un compte qui n'a encore rien fait : la semaine en anneaux (fait, commencé, prévu sur le site,
manqué) avec la série de semaines et l'objectif (`lib/logique/agenda.dart`, une séance en cours ne compte pas),
puis la récupération des muscles en lecture seule, avec sa feuille (`lib/logique/recuperation.dart` : etatGroupes
et efforts d'endurance, mêmes cas de test que le site ; silhouettes `assets/corps.json` copiées par
`outils/exporter-exercices.mjs`). Toucher un jour fait relit ses séances.

Sous Mes séances, le corps pour composer une séance par muscles (`ecrans/corps_du_jour.dart`, comme `CorpsDuJour`
du site) : « Envie d'autre chose ? Choisis tes muscles du jour » (ou « Qu'est-ce que tu travailles aujourd'hui ? »
sans séance), de face ou de dos, teinté par les séries des 7 derniers jours, avec « Pas encore cette semaine ».
Toucher des muscles propose leurs exercices rangés par rôle (Base, Complément, Isolation, Gainage), et ceux qu'on
coche ouvrent la création de séance, préremplie avec le nom des muscles (`lib/logique/muscles_du_jour.dart` :
`roleDe`, `exosParMuscle`, `parRole`, mêmes cas de test que le site). Pas encore : le filtre par matériel du Profil
(tout le matériel est proposé) et le choix de la silhouette (homme par défaut, sauf sexe femme dans le compte).

Progrès (`lib/logique/progres.dart`, mêmes calculs et cas de test que `web/app/progres`) :
la semaine (série de semaines, objectif, séries comparées à la semaine d'avant, calendrier de 4 semaines),
les séries par muscle sur 7 jours, la progression par exercice (charge, séries, 1RM estimé, « Prochaine fois »)
et les records. Toucher un jour du calendrier ouvre ses séances relues comme sur le site (`ecrans/jour.dart`),
avec « Retirer de mon historique » après confirmation (`lib/logique/retirer.dart`, mêmes règles et cas de test
que `retirerDeHistorique`). Pas encore : cardio, poids du corps, défis et badges.

- Même projet Supabase que le site : table `etats`, un document JSON par compte.
- `lib/logique/` : logique pure, reprise de `web/lib/logic/` avec les mêmes cas de test
  (`mode.ts`, la charge proposée de `core.ts`, l'historique de `historique.ts`).
- Pour écrire, l'appli relit le document du compte juste avant et n'y change que ce qu'on vient de faire
  (séance faite, séance créée, modifiée ou supprimée, séance retirée de l'historique).
- `assets/exercices.json` : copie du catalogue du site, à régénérer après chaque changement :
  `node outils/exporter-exercices.mjs` (la CI vérifie qu'elle est à jour). Il copie aussi les textes
  des fiches (`assets/fiches.json`).
- `assets/photos/` et `assets/photos.json` : la vignette de chaque exercice (la même que sur le
  site), en WebP ; `assets/fiche/` : les photos en grand de la fiche (photo unique et duo
  départ / fin qui s'anime, 10,7 Mo). À régénérer après un changement de photos : `python3 -I outils/exporter-photos.py`.
  Les photos Unsplash ne sont pas copiées : l'appli les affiche depuis leurs serveurs.

```bash
flutter test
flutter analyze
flutter run
```

Identifiant de l'appli : `app.oxafit.oxa` (modifiable tant que rien n'est publié).
