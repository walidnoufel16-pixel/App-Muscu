import html
e=html.escape
V1=("Vidéo 1 · Ta séance est prête","video-1-seance-prete.mp4",
"""Tu sais jamais quoi faire à la salle ? 🤔
Touche les muscles que tu veux travailler : Oxa te sort la séance. Exercices, séries et charges, avec ton matériel.

Tu travailles quoi demain ? 👇
#muscu #musculation #salledesport #programmemuscu #gym""",
"Ta séance de muscu prête en quelques touches #shorts",
"Touche les muscles à travailler, Oxa compose ta séance avec tes charges. 👉 https://oxafit.app/?src=youtube #muscu #musculation",
"Le nom de l'app : Oxa, lien dans la bio 👆")
V2=("Vidéo 2 · Pourquoi 62,5 kg ?","video-2-pourquoi-cette-charge.mp4",
"""Ton app te dit quel poids prendre… mais jamais pourquoi.
Oxa écrit la raison sous chaque charge : 12 répétitions sur toutes tes séries ? +2,5 kg, et tu repars à 8. Sur un petit muscle, le palier est plus petit.

Tu montes en charge comment, toi ? 👇
#surchargeprogressive #muscu #musculation #progression #gym""",
"Quand ajouter du poids à la salle ? #shorts",
"La double progression, expliquée sous chaque charge. 👉 https://oxafit.app/?src=youtube #muscu #surchargeprogressive",
"La règle : une répétition de plus à chaque séance, et au haut de la fourchette, le plus petit palier. 💾")
V3=("Vidéo 3 · Tu fais assez de séries pour tes pecs ?","video-3-bilan-semaine.mp4",
"""Tu fais assez de séries pour tes pecs ?
Une séance pecs par semaine avec 2 exercices de 3 séries : 6 séries. La cible d'un pratiquant régulier : 12, par muscle et par semaine.
Chaque lundi, Oxa te montre où tu en es.

Et toi, combien ? Dis-le en commentaire 👇
#muscu #musculation #hypertrophie #programmemuscu #gym""",
"Combien de séries pour les pecs par semaine ? #shorts",
"8 en débutant, 12 en régulier, 16 en avancé. Ton bilan chaque lundi. 👉 https://oxafit.app/?src=youtube #muscu #musculation",
"Les repères : 8 séries par muscle et par semaine en débutant, 12 en régulier, 16 en avancé.")
C1=("Carrousel 1 · Combien de séries par muscle ?","dossier carrousel-1-series, images 1 à 6",
"""Combien de séries par muscle chaque semaine ? 📊

Débutant : 8 · Régulier : 12 · Avancé : 16
Des séries difficiles, par muscle et par semaine. Coupe-les en 2 séances, et réduis si tes charges baissent.

💾 Enregistre-le pour ta prochaine séance
Et dis-moi en commentaire : tu en fais combien pour tes pecs ?

#musculation #muscu #programmemuscu #conseilmuscu #hypertrophie #gym #salledesport""",
"#musculation #muscu #programmemuscu #conseilmuscu #gym")
C2=("Carrousel 2 · Quand ajouter du poids ?","dossier carrousel-2-surcharge, images 1 à 6",
"""Quand ajouter du poids à la salle ? La double progression 🏋️

1. Une fourchette, par exemple 8 à 12 répétitions
2. Des répétitions avant les kilos
3. À 12 partout : +2,5 kg, et retour à 8
4. Après une pause : −10 % (10 jours) ou −20 % (21 jours et plus)

💾 Enregistre-le, et envoie-le à ton binôme de salle

#surchargeprogressive #musculation #muscu #progression #conseilmuscu #debutantmuscu #gym""",
"#surchargeprogressive #musculation #muscu #progression #gym")
def box(lbl,txt): return f"<div class=lbl>{e(lbl)}</div><pre>{e(txt)}</pre>"
def video(jour,heure,v,fait=False):
  t,f,cap,yt,ytd,pin=v
  return f"""<section class="jour{' fait' if fait else ''}"><div class=tete><span class=date>{jour}</span><span class=h>{heure}</span>{'<span class=ok>✓ publiée</span>' if fait else ''}</div>
<h2>{e(t)}</h2><p class=fic>Fichier : {e(f)} · TikTok, Instagram Reels et YouTube Shorts · ajoute un son tendance</p>
{box("TikTok et Instagram Reels : légende",cap)}{box("YouTube Shorts : titre",yt)}{box("YouTube Shorts : description",ytd)}{box("Commentaire à épingler (TikTok et Instagram)",pin)}</section>"""
def carrousel(jour,heure,c):
  t,f,cap,tt=c
  return f"""<section class=jour><div class=tete><span class=date>{jour}</span><span class=h>{heure}</span></div>
<h2>{e(t)}</h2><p class=fic>{e(f)} · Instagram (Publication, plusieurs images dans l'ordre) et TikTok en mode photo · pas de YouTube</p>
{box("Instagram : légende",cap)}{box("TikTok (mode photo) : même texte, avec seulement ces hashtags à la fin",tt)}</section>"""
corps=video("Vendredi 6 novembre","18 h 30",V1,True)+carrousel("Samedi 7 novembre","11 h",C1)+video("Dimanche 8 novembre","18 h 30",V2)+carrousel("Lundi 9 novembre","12 h 30",C2)+video("Mardi 10 novembre","18 h 30",V3)
doc=f"""<html><head><meta charset=utf-8><style>
@page{{size:A4;margin:14mm 14mm 16mm}}
body{{font-family:Inter,'Noto Color Emoji',sans-serif;color:#0a0a0c;font-size:11.5pt;line-height:1.45}}
h1{{font-family:'Inter Display',Inter;font-size:24pt;margin:0}} .sous{{color:#52525b;margin:4px 0 14px}}
table{{border-collapse:collapse;width:100%;margin:8px 0 14px;font-size:10.5pt}} td,th{{border-bottom:1px solid #e4e4e7;padding:6px 8px;text-align:left}} th{{background:#f4f4f5}}
.jour{{break-inside:avoid-page;border:1px solid #e4e4e7;border-radius:12px;padding:12px 14px;margin:12px 0}}
.jour.fait{{opacity:.55}} .tete{{display:flex;gap:10px;align-items:center}} .date{{font-weight:800;color:#0d9488;text-transform:uppercase;letter-spacing:.06em;font-size:10pt}}
.h{{background:#0a0a0c;color:#fff;border-radius:99px;padding:1px 9px;font-size:9.5pt;font-weight:700}} .ok{{color:#0d9488;font-weight:700;font-size:9.5pt}}
h2{{font-family:'Inter Display',Inter;font-size:15pt;margin:6px 0 2px}} .fic{{color:#71717a;font-size:9.5pt;margin:0 0 6px}}
.lbl{{font-size:9pt;font-weight:700;color:#3f3f46;margin-top:8px;text-transform:uppercase;letter-spacing:.05em}}
pre{{white-space:pre-wrap;font-family:Inter,'Noto Color Emoji',sans-serif;background:#f4f4f5;border-radius:8px;padding:8px 10px;margin:3px 0 0;font-size:10.5pt}}
ul{{margin:4px 0 0 0;padding-left:18px}} .note{{background:#ecfdf5;border-radius:10px;padding:10px 12px;font-size:10.5pt}}
</style></head><body>
<h1>Pack 1 · légendes et calendrier</h1>
<p class=sous>Version à jour : lancement le vendredi 6 novembre (remplace l'ancienne version qui commençait le lundi). TikTok @oxafit.app · Instagram @oxafit.app · YouTube @oxafit</p>
<table><tr><th>Jour</th><th>Quoi</th><th>Où</th><th>Heure</th></tr>
<tr><td>Ven 6 ✓</td><td>Vidéo 1 · Ta séance est prête</td><td>TikTok, Reels, Shorts</td><td>18 h 30</td></tr>
<tr><td>Sam 7</td><td>Carrousel 1 · Combien de séries</td><td>Instagram, TikTok photo</td><td>11 h</td></tr>
<tr><td>Dim 8</td><td>Vidéo 2 · Pourquoi 62,5 kg</td><td>TikTok, Reels, Shorts</td><td>18 h 30</td></tr>
<tr><td>Lun 9</td><td>Carrousel 2 · Quand ajouter du poids</td><td>Instagram, TikTok photo</td><td>12 h 30</td></tr>
<tr><td>Mar 10</td><td>Vidéo 3 · Assez de séries ?</td><td>TikTok, Reels, Shorts</td><td>18 h 30</td></tr></table>
<div class=note><b>À chaque publication</b><ul>
<li><b>Vidéos</b> : elles sont muettes, ajoute un son tendance sans paroles (volume du son à 30-50 %). Garde la première image comme miniature.</li>
<li><b>Carrousels</b> : utilise les nouvelles couvertures (image 1 redressée, envoyée le 7 novembre).</li>
<li><b>Lien en bio</b> : oxafit.app/?src=tiktok, /?src=instagram, /?src=youtube.</li>
<li><b>Première heure</b> : réponds à tous les commentaires. Pack 2 à partir du mercredi 11.</li></ul></div>
{corps}
<section class=jour><h2>Répondre aux commentaires (5 min par jour)</h2><ul>
<li>Réponds à tous les commentaires dans la première heure.</li>
<li>Une question technique : 1 ou 2 phrases, puis « je fais une vidéo là-dessus ». Envoie-la-moi.</li>
<li>On te demande le nom de l'app : « Oxa, lien dans la bio 👆 ».</li>
<li>Jamais de promesse de résultat chiffré ni de conseil médical (une douleur : « vois un pro de santé »).</li>
<li>Dimanche : envoie-moi les captures des statistiques de chaque réseau.</li></ul></section>
</body></html>"""
open('/tmp/pack/leg/legendes.html','w').write(doc)
