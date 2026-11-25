# Deux modes : Suivi et Guidé

Décidé avec Walid le 25 novembre 2026. Une seule app, mêmes données, on change de mode à tout moment dans Profil.
Raison : sur les réseaux, Oxa est présentée comme **l'app pour suivre ses séances** (voir `docs/reseaux/`). Les habitués de
la salle, qui ont déjà leur programme, doivent pouvoir noter leurs séances sans questionnaire ni séance proposée.
Le mode qui aide à s'entraîner s'appelle **« Guidé »** : jamais « coach » dans l'interface (ne pas vexer les vrais coachs).

Maquettes (390 × 844, ×2) dans ce dossier : `1-question.png`, `2-premiere-seance.png`, `3-accueil-suivi.png`
(script : `maquettes.js`, images d'exercices de `web/public/img/`). Ce sont des maquettes HTML, pas l'app : le style final
reprend les composants existants.

## 1. Le réglage
- `A.mode = "suivi" | "guide"`.
- Comptes existants : `"guide"` par défaut, avec une carte unique sur l'accueil qui propose de passer en Suivi.

## 2. La question d'arrivée (après la bienvenue, à la place du questionnaire)
« **Tu as déjà ton programme ?** »
- **Mode Suivi** · « Oui, je veux suivre mes séances » · « Tu notes tes séries. Oxa garde ta charge d'avant, ton max, ta
  récup et tes progrès. »
- **Mode Guidé** · « Non, guide-moi » · « Quelques questions, puis Oxa te prépare tes séances selon ta récup et ton matériel. »
- « Tu pourras changer à tout moment dans Profil. »

Guidé = parcours actuel (questionnaire, séance prête). Suivi = pas de questionnaire : on arrive sur
« Ta première séance · Comme dans ton carnet » (nom, ajout d'exercices avec séries, répétitions et repos ;
Enregistrer / Commencer).

## 3. L'accueil en mode Suivi
- La semaine : séances faites / objectif, semaines d'affilée.
- Mes séances, avec « Commencer » sur la prochaine et « Dernière fois jeudi · squat 80 × 10 ». « + Nouvelle séance ».
- **Récupération gardée** (décision de Walid), en carte courte : muscles prêts / demain, « Voir » vers le détail.
- Onglets : Séances, Progrès, Profil. Repas, Street, Course et la création automatique de séance restent accessibles
  depuis le menu, pas sur l'accueil.

## 4. La séance en mode Suivi
- Gardé : la colonne « Précédent », la pastille « Ton record », le minuteur de repos, l'historique et Progrès.
- **Charge proposée gardée** (décision de Walid du 26 nov., remplace celle du 25) : Oxa propose la charge suivante
  (« ↑ 5 kg », « Pourquoi 85 kg ? », carte « Prochaine fois » dans Progrès). L'utilisateur la suit ou non : **aucun
  réglage ni case en plus**, il corrige simplement la charge s'il veut faire autre chose.
- Champs préremplis avec **la charge proposée** (on valide d'une touche si on la suit) ; la colonne « Précédent »
  montre la dernière fois. Première séance : champs vides.
- Toujours retirés en mode Suivi : « Comment tu te sens ? » et l'effort (RPE) conseillé.

## 5. Profil
Choix du mode (Suivi / Guidé), changement sans perte de données.

## 6. Lien direct
`oxafit.app/?mode=suivi` (avec `?src=…`) présélectionne le mode Suivi à l'arrivée : les liens des réseaux mènent
directement à ce qui y est promis.

## 7. Admin
Nombre de comptes par mode, et part de ceux qui ont fait au moins une séance, par mode.

## 8. Partage par code
Disponible dans les deux modes.

## Fin du chantier
Tests sur la logique du mode, rendu vérifié à 390 px, puis PR et fusion comme d'habitude.
