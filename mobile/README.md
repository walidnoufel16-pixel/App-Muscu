# Oxa mobile (Flutter)

L'appli iOS et Android d'Oxa. À terme, elle remplace l'appli web ; le site reste une vitrine
avec les liens vers l'App Store et le Play Store.

**Version actuelle : mode Suivi.** Connexion par code reçu par mail (comptes du site), « Mes
séances » (prochaine séance, dernière fois), puis la séance : charge proposée et pourquoi,
précédent, record, séries à cocher, minuteur de repos. « Terminer la séance » range la séance
dans le compte, comme le site (journaux dans LOG, ligne du jour dans HIST) : elle apparaît dans
Progrès sur le site. La séance en cours est gardée sur le téléphone jusqu'à la fin.
« Nouvelle séance » : un nom, puis les exercices choisis dans le catalogue (recherche, filtre par
muscle, photos). Le crayon de la séance la modifie (nom, exercices ajoutés, retirés, réordonnés) ou la
supprime, avec les mêmes règles que le site (`lib/logique/seances.dart`) : elle apparaît aussi sur le site.
Trois onglets comme sur le site : Séances, Progrès (à venir), Profil (pseudo, mode Suivi / Guidé,
déconnexion, suppression du compte par la fonction Edge `oublier`, comme « Tout effacer » du site).

- Même projet Supabase que le site : table `etats`, un document JSON par compte.
- `lib/logique/` : logique pure, reprise de `web/lib/logic/` avec les mêmes cas de test
  (`mode.ts`, la charge proposée de `core.ts`, l'historique de `historique.ts`).
- Pour écrire, l'appli relit le document du compte juste avant et n'y change que ce qu'on vient de faire
  (séance faite, séance créée, modifiée ou supprimée).
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
