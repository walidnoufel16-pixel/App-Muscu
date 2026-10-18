# Pictogrammes « Soin & mobilité » : silhouettes simples, départ (0) et arrivée (1).
# Usage : python3 -I scripts/pictos.py public/img/picto
import sys, os
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
FOND, SOL, CORPS, LOIN, ACC = "#23272e", "#3b414b", "#e9ecf0", "#8f98a4", "#5b82ff"
W = 9  # épaisseur des membres

def ligne(pts, c, w=W, op=1):
    d = " ".join(f"{x},{y}" for x, y in pts)
    return f'<polyline points="{d}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" opacity="{op}"/>'

def svg(p):
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="600" height="400">',
         f'<rect width="300" height="200" fill="{FOND}"/>']
    s += p.get("decor", [])
    if p.get("sol", True): s.append(f'<rect x="0" y="180" width="300" height="20" fill="{SOL}"/>')
    for pts in p.get("loin", []): s.append(ligne(pts, LOIN))
    if "tronc" in p: s.append(ligne(p["tronc"], CORPS, 11))
    for pts in p.get("pres", []): s.append(ligne(pts, CORPS))
    for pts in p.get("acc", []): s.append(ligne(pts, ACC))
    for pts in p.get("elas", []): s.append(ligne(pts, ACC, 3))
    if "tete" in p:
        x, y = p["tete"]; s.append(f'<circle cx="{x}" cy="{y}" r="11" fill="{CORPS}"/>')
    for (x1, y1, x2, y2) in p.get("fleche", []):
        import math
        a = math.atan2(y2 - y1, x2 - x1)
        hx1, hy1 = x2 - 9 * math.cos(a - 0.5), y2 - 9 * math.sin(a - 0.5)
        hx2, hy2 = x2 - 9 * math.cos(a + 0.5), y2 - 9 * math.sin(a + 0.5)
        s.append(f'<path d="M{x1},{y1} L{x2},{y2} M{hx1:.1f},{hy1:.1f} L{x2},{y2} L{hx2:.1f},{hy2:.1f}" stroke="{ACC}" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>')
    s.append("</svg>")
    return "\n".join(s)

MUR = lambda x: f'<rect x="{x}" y="0" width="{300-x}" height="180" fill="#2e333b"/>'
POTEAU = lambda x: f'<rect x="{x}" y="20" width="10" height="160" rx="3" fill="#4a515c"/>'
BANC = lambda x1, x2, y: f'<rect x="{x1}" y="{y}" width="{x2-x1}" height="{180-y}" rx="4" fill="#3f4652"/>'

P = {}
# Wall slides (vue de face, dos au mur) : bras en W puis en Y.
def wall(bras):
    jambes = [[(144, 112), (142, 145), (141, 178)], [(156, 112), (158, 145), (159, 178)]]
    return {"decor": ['<rect x="60" y="0" width="180" height="180" fill="#2e333b"/>'], "tete": (150, 44),
            "tronc": [(150, 60), (150, 112)], "pres": jambes + bras}
P["wallsl"] = [wall([[(138, 64), (116, 70), (118, 44)], [(162, 64), (184, 70), (182, 44)]]),
               wall([[(138, 64), (122, 40), (112, 16)], [(162, 64), (178, 40), (188, 16)]])]
P["wallsl"][1]["fleche"] = [(100, 60, 100, 30), (200, 60, 200, 30)]
# Y-T-W allongé sur le ventre : bras posés, puis décollés.
def ytw(main):
    return {"tete": (58, 160), "tronc": [(74, 165), (165, 168)],
            "pres": [[(165, 168), (215, 170), (262, 172)], [(78, 165), (52, main[0]), (28, main[1])]],
            "loin": [[(165, 168), (215, 171), (262, 173)]]}
P["ytw"] = [ytw((172, 174)), ytw((150, 132))]
P["ytw"][1]["fleche"] = [(20, 160, 20, 130)]
# Sleeper stretch : allongé sur le côté, avant-bras qui pivote vers le sol.
def sleep(main):
    return {"tete": (52, 152), "tronc": [(70, 160), (165, 164)],
            "pres": [[(165, 164), (210, 166), (260, 170)], [(82, 162), (82, 128), main]],
            "loin": [[(150, 160), (110, 132), (100, 132)]]}
P["sleep"] = [sleep((110, 128)), sleep((106, 154))]
P["sleep"][1]["fleche"] = [(122, 120, 122, 150)]
# Pompes scapulaires : planche bras tendus, omoplates qui s'écartent.
def pscap(dy):
    return {"tete": (236, 92 - dy), "tronc": [(218, 104 - dy), (122, 118 - dy / 2)],
            "pres": [[(122, 118 - dy / 2), (80, 146), (40, 172)], [(218, 104 - dy), (216, 140), (216, 176)]],
            "loin": [[(122, 118 - dy / 2), (82, 148), (44, 174)], [(212, 104 - dy), (206, 140), (204, 176)]]}
P["pscap"] = [pscap(0), pscap(10)]
P["pscap"][1]["fleche"] = [(170, 80, 170, 64)]
# 90/90 : assis, les deux genoux basculent d'un côté à l'autre.
def h9090(s):
    return {"tete": (150, 82), "tronc": [(150, 98), (150, 160)],
            "pres": [[(150, 160), (150 + 48 * s, 140), (150 + 62 * s, 175)], [(150, 104), (122, 140), (110, 172)]],
            "loin": [[(150, 162), (150 + 30 * s, 172), (150 - 20 * s, 176)], [(150, 104), (178, 140), (190, 172)]]}
P["h9090"] = [h9090(1), h9090(-1)]
P["h9090"][1]["fleche"] = [(200, 120, 105, 120)]
# Clamshell : allongé sur le côté, le genou du dessus s'ouvre.
def clam(gy):
    return {"tete": (52, 140), "tronc": [(70, 150), (165, 158)],
            "pres": [[(165, 156), (208, gy), (196, 168)], [(76, 150), (60, 162), (44, 160)]],
            "loin": [[(165, 162), (210, 168), (196, 176)]],
            "elas": [[(208, gy), (210, 168)]]}
P["clam"] = [clam(160), clam(118)]
P["clam"][1]["fleche"] = [(232, 156, 232, 122)]
# Gainage Copenhague : appui avant-bras, pied du dessus sur un banc, hanches qui montent.
def copen(py):
    return {"decor": [BANC(228, 290, 118)], "tete": (52, 132 + (py - 140) / 3), "tronc": [(70, 140 + (py - 140) / 3), (155, py)],
            "pres": [[(155, py), (200, 122 + (py - 130) / 3), (248, 116)], [(70, 142 + (py - 140) / 3), (72, 176), (110, 176)]],
            "loin": [[(155, py + 4), (195, 150), (220, 172)]]}
P["copen"] = [copen(168), copen(132)]
P["copen"][1]["fleche"] = [(150, 176, 150, 146)]
# Bird dog : à quatre pattes, bras et jambe opposés qui s'allongent.
def bird(ext):
    main = [(110, 110), (80, 104), (46, 98)] if ext else [(110, 110), (106, 142), (110, 176)]
    pied = [(192, 114), (238, 110), (284, 104)] if ext else [(192, 114), (194, 176), (240, 176)]
    return {"tete": (90, 96), "tronc": [(110, 108), (192, 114)], "pres": [main, pied],
            "loin": [[(114, 110), (114, 142), (118, 176)], [(188, 116), (190, 176), (236, 176)]]}
P["birdd"] = [bird(False), bird(True)]
# Curl-up de McGill : allongé, tête et épaules décollent à peine.
def mcgill(dy):
    return {"tete": (54, 158 - dy), "tronc": [(72, 164 - dy), (160, 170)],
            "pres": [[(160, 170), (205, 128), (226, 176)], [(76, 164 - dy), (110, 174), (140, 174)]],
            "loin": [[(160, 172), (215, 174), (262, 175)]]}
P["mcgill"] = [mcgill(0), mcgill(9)]
P["mcgill"][1]["fleche"] = [(40, 140, 40, 124)]
# Spanish squat : élastique derrière les genoux, on s'assoit vers l'arrière, tibias verticaux.
def spsq(b):
    if not b:
        return {"decor": [POTEAU(270)], "tete": (150, 38), "tronc": [(150, 54), (150, 108)],
                "pres": [[(150, 108), (152, 143), (150, 178)], [(150, 60), (176, 82), (196, 82)]],
                "loin": [[(150, 108), (148, 143), (146, 178)]], "elas": [[(156, 140), (270, 140)]]}
    return {"decor": [POTEAU(270)], "tete": (140, 70), "tronc": [(140, 86), (118, 134)],
            "pres": [[(118, 134), (166, 136), (164, 178)], [(140, 92), (172, 108), (196, 108)]],
            "loin": [[(118, 136), (162, 140), (158, 178)]], "elas": [[(170, 136), (270, 140)]]}
P["spsq"] = [spsq(0), spsq(1)]
# Extension terminale du genou : élastique derrière le genou, on verrouille la jambe.
def tke(kx):
    return {"decor": [POTEAU(270)], "tete": (140, 38), "tronc": [(140, 54), (140, 108)],
            "pres": [[(140, 108), (kx, 143), (140, 178)], [(140, 60), (148, 90), (152, 116)]],
            "loin": [[(140, 108), (122, 140), (104, 172)]], "elas": [[(kx + 6, 143), (270, 143)]]}
P["tke"] = [tke(158), tke(142)]
P["tke"][1]["fleche"] = [(176, 128, 160, 128)]
# Step-down lent : sur une marche, le pied libre descend en contrôle.
def stepd(b):
    if not b:
        return {"decor": [BANC(110, 205, 130)], "tete": (160, 14), "tronc": [(160, 28), (160, 70)],
                "pres": [[(160, 70), (162, 100), (160, 130)], [(160, 34), (180, 50), (196, 50)]],
                "loin": [[(160, 70), (170, 96), (176, 122)]]}
    return {"decor": [BANC(110, 205, 130)], "tete": (150, 38), "tronc": [(152, 52), (150, 92)],
            "pres": [[(150, 92), (180, 106), (165, 130)], [(152, 58), (174, 74), (190, 74)]],
            "loin": [[(150, 94), (200, 132), (218, 176)]]}
P["stepd"] = [stepd(0), stepd(1)]
P["stepd"][1]["fleche"] = [(236, 132, 236, 168)]
# Mobilité de cheville au mur : le genou avance vers le mur, talon au sol.
def chev(kx):
    return {"decor": [MUR(262)], "tete": (186, 48), "tronc": [(188, 64), (176, 112)],
            "pres": [[(176, 112), (kx, 140), (226, 178)], [(190, 70), (230, 84), (260, 86)]],
            "loin": [[(176, 114), (148, 146), (116, 178)]]}
P["chevmur"] = [chev(220), chev(256)]
P["chevmur"][1]["fleche"] = [(222, 124, 250, 124)]
# Flexion excentrique du poignet : avant-bras posé, le poignet descend lentement.
def tyler(hy):
    return {"decor": [BANC(40, 180, 128)], "sol": True,
            "pres": [[(30, 30), (70, 118), (176, 118), (205, hy)]],
            "acc": [[(196, hy - 12), (214, hy + 12)]]}
P["tyler"] = [tyler(96), tyler(146)]
P["tyler"][1]["fleche"] = [(232, 100, 232, 140)]
# Étirement des fléchisseurs du poignet : bras tendu, l'autre main tire les doigts vers soi.
def flexp(b):
    return {"tete": (150, 40), "tronc": [(150, 56), (150, 112)],
            "pres": [[(150, 62), (195, 64), (236, 66), (250, 66) if not b else (244, 44)], [(150, 112), (152, 145), (150, 178)]],
            "loin": [[(150, 66), (190, 80), (228, 70) if not b else (238, 50)], [(150, 112), (146, 145), (144, 178)]]}
P["flexpoi"] = [flexp(0), flexp(1)]
# Rentrée du menton : la tête recule sans pencher.
def chin(hx):
    return {"tete": (hx, 48), "tronc": [(hx - 8, 64), (146, 112)],
            "pres": [[(146, 112), (148, 145), (146, 178)], [(146, 70), (150, 100), (156, 124)]],
            "loin": [[(146, 112), (142, 145), (140, 178)]]}
P["chin"] = [chin(170), chin(154)]
P["chin"][1]["fleche"] = [(190, 30, 170, 30)]
# Open book : allongé sur le côté, le bras du dessus s'ouvre vers l'arrière.
def openb(h):
    return {"tete": (52, 150), "tronc": [(70, 158), (160, 162)],
            "pres": [[(160, 160), (200, 132), (238, 162)], [(80, 156)] + h],
            "loin": [[(160, 166), (204, 140), (240, 170)], [(78, 162), (110, 170), (138, 172)]]}
P["openb"] = [openb([(110, 166), (140, 166)]), openb([(70, 122), (54, 92)])]
P["openb"][1]["fleche"] = [(130, 140, 90, 100)]

for k, (a, b) in P.items():
    for i, p in enumerate((a, b)):
        open(os.path.join(OUT, f"{k}_{i}.svg"), "w").write(svg(p))
print(len(P), "pictogrammes")
