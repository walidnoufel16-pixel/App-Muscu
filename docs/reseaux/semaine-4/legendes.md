# Semaine 4 : légendes

Premier pack orienté **suivi des séances** et **recherche de testeurs** (voir le positionnement dans `../README.md`).
Écrans : compte de démonstration « Alex », aucune donnée réelle. Pas de vidéo de personnes.

Calendrier conseillé :
| Jour | Contenu | Réseaux |
|---|---|---|
| Mardi 24 nov., 18 h 30 | Carrousel « On cherche 30 testeurs » (à épingler sur le profil) | TikTok (photo), Instagram |
| Jeudi 26 nov., 18 h 30 | Vidéo « Ta charge de la dernière fois ? » | TikTok, Instagram Reels, YouTube Shorts |
| Samedi 28 nov., 18 h | Carrousel « La science dit » · Noter ses séances, ça sert vraiment ? | TikTok (photo), Instagram |

Pour tous : répondre aux commentaires dans la première heure. À chaque « TEST », envoyer le lien en message privé :
`https://oxafit.app/?src=tiktok-test` (TikTok) ou `https://oxafit.app/?src=insta-test` (Instagram).
Bio conseillée pendant la campagne : « On cherche des testeurs 👇 » au-dessus du lien.

À valider par Walid avant de publier : le chiffre « 30 testeurs » et la durée « 2 semaines » (ce sont des propositions).

## Carrousel · On cherche 30 testeurs
Dossier : `carrousel-testeurs/` (6 images 1080×1350, sombres ; images 3 et 4 : la colonne « Précédent » d'une
séance et Ma progression par exercice). Script : `outils/reseaux/carrousel-testeurs.js`.

**Légende (TikTok et Instagram)**
```
On cherche 30 testeurs pour Oxa, notre app de suivi de muscu 🏋️
Tu notes tes séries pendant la séance. Oxa retient tout : ta charge de la dernière fois, tes records, ta progression exercice par exercice.
C'est gratuit, sur iPhone et Android.
Tu veux tester ? Commente TEST 👇 et on t'envoie le lien.
#musculation #salledesport #appmuscu #suiviseance #testeurs
```

## Vidéo · Ta charge de la dernière fois ?
Fichier : `video-derniere-fois.mp4` (11,6 s, 1080×1920, muet : ajouter un son tendance à la publication).
Déroulé : accroche « Ta charge de la dernière fois ? Aucune idée. » (texte en mouvement dès la 1re image) ;
séance Squat barre, colonne « Précédent » encadrée (« Oxa s'en souvient ») ; Ma progression par exercice,
« De 75 kg × 8 à 77,5 kg × 10 » encadré (« Et te montre si tu progresses ») ; fin « Ton carnet de muscu,
dans ta poche · On cherche des testeurs ». Plans : `outils/reseaux/scenes.mjs` (vidéo `derniere-fois`).

**Légende**
```
Ta charge de la semaine dernière ? Aucune idée 😅
Avec Oxa, tu notes tes séries pendant la séance et l'app s'en souvient : la prochaine fois, ta charge et tes répétitions sont déjà là. Et tu vois si tu progresses.
On cherche des testeurs : commente TEST 👇
#musculation #salledesport #gymtok #suiviseance #progression
```

## Carrousel « La science dit » · Noter ses séances, ça sert vraiment ?
Dossier : `carrousel-noter/` (6 images 1080×1350, toutes sombres). Script : `outils/reseaux/carrousel-science-noter.js`.
Sources : ACSM, position officielle sur la progression en musculation (Med Sci Sports Exerc 2009) ;
Glass & Stanton, JSCR 2004 (charges choisies seules par des débutants, environ 40 à 60 % du maximum) ;
Halperin et al., Sports Med 2022 (méta-analyse : on sous-estime les répétitions qu'il reste) ;
Michie et al., Health Psychol 2009 (122 études : le suivi de soi rend les programmes plus efficaces).

**Légende (TikTok et Instagram)**
```
Noter ses séances, ça sert vraiment ? Oui 📒
Sans trace, tu ne sais pas quand monter. Et les études montrent qu'on choisit souvent trop léger et qu'on se croit au bout trop tôt. Tes chiffres de la dernière fois corrigent ton impression.
💾 Enregistre-le pour ta prochaine séance.
Toi, tu notes tes séances ? Oui ou non 👇
#musculation #lasciencedit #salledesport #progression #suiviseance
```
