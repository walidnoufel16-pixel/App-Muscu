# Scénarios e2e à réécrire

Ces scénarios testent des écrans qui ont changé (refonte de l'accueil Entraînement, des rubriques,
du menu et de Repas). Ils ne font pas partie de la suite de la CI (`tous.mjs` › `SUITE`) tant
qu'ils ne sont pas remis à jour. Ce ne sont pas des bugs de l'app : l'écran attendu n'existe plus.
Une fois réécrit, un scénario rejoint `SUITE`.

| Scénario | Ce qui a changé (premier blocage relevé le 6 novembre 2026) |
|---|---|
| admin | onglet « Programme » disparu |
| animations | liste de séances par rubrique |
| cardio | titre « Mes séances » (rubrique) |
| combinee | bouton « Partager » |
| composer | « Composer exercice par exercice » renommé |
| compte | deux boutons « Commencer » |
| course | onglet « Course » remplacé par Oxa Run |
| defis | « Créer un défi » (menu réduit) |
| entrainement | onglet « Séances libres » disparu |
| extras | compteur de protéines |
| forme | forme du jour (radios) |
| langue | « Mon matériel déclaré » |
| liste-chrono | message de matériel |
| migration | sert l'ancien dossier dist/ |
| motivation | « Plus tard » après le bilan |
| progres | quatre onglets, calendrier, volume |
| repas | quatre onglets, préférences repliées |
| silhouette | silhouette remplacée par le profil sportif |
| soin | « Pour ta zone sensible » |
| street | onglet « Programme » |
| trx | bouton « TRX » |
| captures | outil de captures (hors CI) |
