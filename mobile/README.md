# Oxa mobile (Flutter)

L'appli iOS et Android d'Oxa. À terme, elle remplace l'appli web ; le site reste une vitrine
avec les liens vers l'App Store et le Play Store.

**Version actuelle : mode Suivi, lecture seule.** Connexion par code reçu par mail (comptes du
site), puis « Mes séances » avec la prochaine séance et la dernière fois. Rien n'est encore écrit
dans le compte : la séance en cours arrive à l'étape suivante.

- Même projet Supabase que le site : table `etats`, un document JSON par compte.
- `lib/logique/` : logique pure, reprise de `web/lib/logic/` avec les mêmes cas de test.
- `assets/exercices.json` : copie du catalogue du site, à régénérer après chaque changement :
  `node outils/exporter-exercices.mjs` (la CI vérifie qu'elle est à jour).

```bash
flutter test
flutter analyze
flutter run
```

Identifiant de l'appli : `app.oxafit.oxa` (modifiable tant que rien n'est publié).
