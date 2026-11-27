"""Copie les photos des exercices du site vers l'appli mobile, en WebP (Flutter ne lit pas
l'AVIF partout).
Vignettes (assets/photos) : une par exercice, la même que sur le site (web/lib/medias.ts, imgEx) :
- photo unique « ex-<id> » (Pixabay, Pexels) si elle existe, sinon la démonstration « <img>_0 » ;
- photos Unsplash : jamais copiées (règles d'Unsplash), l'appli les affiche depuis leurs serveurs ;
- cadrage horizontal de la vignette (CADRAGE de medias.ts).
Fiche de l'exercice (assets/fiche) : en plus grand, la photo unique et le duo départ / fin qui
s'anime (Duo de web/components/repere/fiche-exercice.tsx), depuis public/img/grand.
Écrit assets/photos/*.webp, assets/fiche/*.webp et assets/photos.json. À relancer après un changement de photos :
  python3 -I outils/exporter-photos.py
"""
import json
import os
import re
import sys

from PIL import Image

ICI = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.join(ICI, "..", "..", "web")
SORTIE = os.path.join(ICI, "..", "assets", "photos")
SORTIE_FICHE = os.path.join(ICI, "..", "assets", "fiche")
HAUTEUR = 240  # vignettes de 40 à 56 points, nettes jusqu'en @3x
LARGEUR_FICHE = 600  # pleine largeur de la fiche ; 10 Mo pour tout le catalogue

src = open(os.path.join(WEB, "lib/data/exercices.ts"), encoding="utf-8").read()
debut = src.index("{", src.index("export const EX:"))
EX = json.loads(src[debut : src.index("\n};", debut) + 2])

medias = open(os.path.join(WEB, "lib/medias.ts"), encoding="utf-8").read()
bloc_photos = medias[medias.index("export const PHOTOS_EX") : medias.index("const CADRAGE")]
UNSPLASH = {
    m[0]: {"u": m[2], "a": m[1]}
    for m in re.findall(r'(\w+): \{ auteur: "([^"]+)", lien: "[^"]+", us: "([^"]+)" \}', bloc_photos)
}
bloc_cadrage = medias[medias.index("const CADRAGE") : medias.index("};", medias.index("const CADRAGE"))]
CADRAGE = {k: int(v) for k, v in re.findall(r"(\w+): (\d+)", bloc_cadrage.split("=", 1)[1])}
if len(UNSPLASH) < 3 or len(CADRAGE) < 20:
    sys.exit("medias.ts a changé de forme : vérifier la lecture des photos Unsplash et du cadrage.")

os.makedirs(SORTIE, exist_ok=True)
os.makedirs(SORTIE_FICHE, exist_ok=True)
carte, faits, faits_fiche = {}, set(), set()


def en_grand(nom):
    """La photo en grand pour la fiche (la petite si la grande manque) ; son nom, ou None."""
    for dossier in ("public/img/grand", "public/img"):
        chemin = os.path.join(WEB, dossier, nom + ".avif")
        if os.path.exists(chemin):
            sortie = nom + ".webp"
            if sortie not in faits_fiche:
                im = Image.open(chemin).convert("RGB")
                if im.width > LARGEUR_FICHE:
                    im = im.resize((LARGEUR_FICHE, round(im.height * LARGEUR_FICHE / im.width)), Image.LANCZOS)
                im.save(os.path.join(SORTIE_FICHE, sortie), "WEBP", quality=70, method=6)
                faits_fiche.add(sortie)
            return sortie
    return None


for id_, e in EX.items():
    entree = {}
    if id_ in UNSPLASH:
        entree = dict(UNSPLASH[id_])
    else:
        unique = os.path.join(WEB, "public/img", f"ex-{id_}.avif")
        demo = os.path.join(WEB, "public/img", f"{e.get('img')}_0.avif") if e.get("img") else None
        chemin = unique if os.path.exists(unique) else demo if demo and os.path.exists(demo) else None
        if not chemin:
            continue
        nom = os.path.basename(chemin).replace(".avif", ".webp")
        if nom not in faits:
            im = Image.open(chemin).convert("RGB")
            if im.height > HAUTEUR:
                im = im.resize((round(im.width * HAUTEUR / im.height), HAUTEUR), Image.LANCZOS)
            im.save(os.path.join(SORTIE, nom), "WEBP", quality=72, method=6)
            faits.add(nom)
        entree = {"f": nom}
    if id_ in CADRAGE:
        entree["x"] = CADRAGE[id_]
    # fiche : photo unique en grand, et le duo départ / fin s'il existe
    if "f" in entree and entree["f"].startswith("ex-"):
        g = en_grand(f"ex-{id_}")
        if g:
            entree["g"] = g
    if e.get("img"):
        a, b = en_grand(f"{e['img']}_0"), en_grand(f"{e['img']}_1")
        if a and b:
            entree["d"] = [a, b]
    carte[id_] = entree

# fichiers qui ne servent plus
for f in os.listdir(SORTIE):
    if f not in faits:
        os.remove(os.path.join(SORTIE, f))
for f in os.listdir(SORTIE_FICHE):
    if f not in faits_fiche:
        os.remove(os.path.join(SORTIE_FICHE, f))

with open(os.path.join(ICI, "..", "assets", "photos.json"), "w", encoding="utf-8") as f:
    json.dump(carte, f, ensure_ascii=False, separators=(",", ":"), sort_keys=True)
    f.write("\n")
taille = sum(os.path.getsize(os.path.join(SORTIE, x)) for x in faits)
taille_fiche = sum(os.path.getsize(os.path.join(SORTIE_FICHE, x)) for x in faits_fiche)
print(f"{len(carte)} exercices illustrés ({len(UNSPLASH)} depuis Unsplash), {len(faits)} vignettes ({taille // 1024} Ko), "
      f"{len(faits_fiche)} photos de fiche ({taille_fiche // 1024} Ko)")
