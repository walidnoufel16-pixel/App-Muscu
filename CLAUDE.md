# Habitudes de travail sur Oxa

Consignes de Walid, valables pour toutes les sessions. Réponses en français.

## Agir sans demander
- Créer la branche, commiter, pousser, **ouvrir la pull request** vers `main` sans demander.
- Surveiller la PR et corriger ce qui casse (CI rouge, commentaires) sans demander.
- **Fusionner la PR (squash) dès que la CI est verte**, sans demander : c'est ce qui met en production.
- Ne prévenir que si quelque chose bloque vraiment, ou s'il faut un choix que lui seul peut faire.

## Avant de pousser
- Lancer les tests (`npx vitest run` dans `web/`) et le lint sur les fichiers modifiés.
- Pour un changement d'interface, lancer l'app et vérifier le rendu (capture à 390 px de large).
- Ne pas commiter `web/AGENTS.md` quand `next dev` le modifie tout seul.

## Compte rendu
- Court et en français simple : ce qui a changé pour l'utilisateur de l'app, ce qui a été vérifié, le lien de la PR et si elle est fusionnée.

## Économiser l'utilisation
Walid veut optimiser au maximum son utilisation de Claude.
- Avant toute tâche lourde, le dire et proposer une version plus légère, puis attendre son accord.
- Tâches lourdes : regarder beaucoup d'images (planches photo, captures, vérifications visuelles),
  longues recherches web ou API, lancer des agents, grosses modifications sur plusieurs fichiers
  avec tests/build/e2e, maquettes en plusieurs versions, conversations très longues.
- Tâches légères : questions, avis courts, petites corrections ciblées, fusions, requêtes SQL simples.
- Recherches de photos : ne pas monter de planche, donner tous les résultats bruts rangés par
  exercice, il fait la sélection lui-même.
- Suggérer une nouvelle conversation quand on change de sujet et que la conversation est longue.
