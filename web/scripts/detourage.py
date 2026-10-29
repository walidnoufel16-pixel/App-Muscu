# Photos d'exercices détourées : la personne et son matériel, sans le fond de salle, posés sur
# le bleu des photos de l'app (FOND). Originaux en 850 px repris de free-exercise-db (domaine
# public), détourés par BiRefNet (rembg, modèle birefnet-general-lite), puis exportés en AVIF :
# public/img/grand/ (850 px) et public/img/ (420 px). Les fichiers déjà faits sont sautés.
# Prérequis : python3 -m venv v && v/bin/pip install "rembg[cpu]" pillow pillow-avif-plugin
# Lancement : v/bin/python scripts/detourage.py [CACHE] [Nom_A Nom_B …]
# DETOURAGE_OUT : écrire ailleurs que dans public/img (même rangement : grand/ pour les 850 px).
import os, sys, urllib.request, urllib.parse
from PIL import Image
import pillow_avif  # noqa: F401  (AVIF pour Pillow)
from rembg import new_session, remove

ICI = os.path.dirname(os.path.abspath(__file__))
PUB = os.environ.get("DETOURAGE_OUT") or os.path.join(ICI, "..", "public", "img")
ORIG = os.path.join(ICI, "..", "medias", "originaux")
DEPOT = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/"
FOND = (184, 201, 247)
CACHE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ICI, "..", "medias", "cache-850")
SEULES = sys.argv[2:]
os.makedirs(CACHE, exist_ok=True)
os.makedirs(os.path.join(PUB, "grand"), exist_ok=True)


def original(f):
    """Original en 850 px (téléchargé une fois, gardé dans CACHE)."""
    dest = os.path.join(CACHE, f)
    if not os.path.exists(dest):
        nom, n = f[:-4].rsplit("_", 1)
        urllib.request.urlretrieve(f"{DEPOT}{urllib.parse.quote(nom)}/{n}.jpg", dest)
    return Image.open(dest).convert("RGB")


def poser(im, session):
    """La personne et le matériel sur le fond bleu ; le bord du détourage est adouci."""
    d = remove(im, session=session)
    a = d.getchannel("A").point(lambda v: 0 if v < 24 else min(255, int((v - 24) * 255 / 200)))
    d.putalpha(a)
    b = Image.new("RGBA", d.size, FOND + (255,))
    b.alpha_composite(d)
    return b.convert("RGB")


session = new_session("birefnet-general-lite")
liste = sorted(f for f in os.listdir(ORIG) if f.endswith(".jpg") and (not SEULES or any(f.startswith(n + "_") for n in SEULES)))
faites = 0
for f in liste:
    grand, petit = os.path.join(PUB, "grand", f[:-4] + ".avif"), os.path.join(PUB, f[:-4] + ".avif")
    marque = os.path.join(CACHE, f[:-4] + ".fait")
    if os.path.exists(marque):
        continue
    try:
        im = poser(original(f), session)
    except Exception as e:  # original introuvable : on le signale, la photo actuelle reste
        print("échec", f, e, flush=True)
        continue
    im.save(grand, quality=60, speed=4)
    p = im.copy(); p.thumbnail((420, 420), Image.LANCZOS); p.save(petit, quality=60, speed=4)
    open(marque, "w").close()
    faites += 1
    print(f"{faites} {f}", flush=True)
print(f"fini : {faites} photos détourées", flush=True)
