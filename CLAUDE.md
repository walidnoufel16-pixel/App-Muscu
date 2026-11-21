# Habitudes de travail sur Oxa

Consignes de Walid, valables pour toutes les sessions. Réponses en français.

## Agir sans demander
- Créer la branche, commiter, pousser, **ouvrir la pull request** vers `main` sans demander.
- Surveiller la PR et corriger ce qui casse (CI rouge, commentaires) sans demander.
- Ne prévenir que si quelque chose bloque vraiment, ou s'il faut un choix que lui seul peut faire.

## App test (préproduction) puis production
- L'app test (service Render `repere-test`, https://repere-test.onrender.com) se déploie depuis la branche
  de travail de la session : chaque push y part en une minute.
- **Changement visible** (écran, texte, parcours) : pousser, ouvrir la PR, dire à Walid que c'est sur
  l'app test, et **attendre son « ok » après son test sur iPhone** avant de fusionner (squash).
- **Changement invisible** (correctif technique, tests, lint, docs, base de données sans effet à
  l'écran) : fusionner (squash) dès que la CI est verte, sans attendre.
- Regrouper les petits changements d'un même sujet dans une seule PR.

## Économiser les échanges
- Ne pas vérifier le déploiement Render après chaque fusion (il réussit en une minute) ; seulement si
  Walid le demande ou si quelque chose cloche.
- Répondre en une ligne aux notifications GitHub (PR créée, CI verte, fusion).
- Quand la conversation devient longue, proposer à Walid d'ouvrir une nouvelle session.

## Avant de pousser
- Lancer les tests (`npx vitest run` dans `web/`) et le lint sur les fichiers modifiés.
- Pour un changement d'interface, lancer l'app et vérifier le rendu (capture à 390 px de large).
- Ne pas commiter `web/AGENTS.md` quand `next dev` le modifie tout seul.

## Compte rendu
- Court et en français simple : ce qui a changé pour l'utilisateur de l'app, ce qui a été vérifié, le lien de la PR et si elle est fusionnée.
