/* Plans animés des vidéos courtes (1080×1920, 30 images/s) à partir des captures de l'app (captures.mjs).
   Usage (depuis web/, le script copié dans tests/e2e/) :
     cp ../outils/reseaux/scenes.mjs tests/e2e/_scenes.mjs
     PACK=/tmp/pack NODE_PATH=$(npm root -g) node tests/e2e/_scenes.mjs [nom …] ; rm tests/e2e/_scenes.mjs
     PACK=/tmp/pack ../outils/reseaux/video.sh <nom> <sortie.mp4>
   Sans nom : toutes les vidéos du tableau V. GUIDES=1 dessine en rouge les zones masquées par l'interface
   de TikTok / Reels / Shorts (pour vérifier un cadrage, jamais pour publier).
   Sortie : $PACK/scenes/<nom>/f0001.jpg … (les images de la vidéo) et $PACK/scenes/<nom>-<i>.png
   (un aperçu par plan, quand tout est affiché : à regarder avant de livrer).

   Le tableau V : une vidéo = une liste de plans, coupés net (pas de fondu). Un plan :
     img      capture de $PACK/brut (sans .png)
     h, bas   haut et bas du recadrage, en px CSS de la capture (390 × 844). Si le recadrage est plus haut
              que la place disponible, l'écran défile doucement du haut vers le bas pendant le plan.
     t        texte du plan (<em> = turquoise). Une idée, 8 mots au plus : c'est aussi le sous-titrage,
              les vidéos se regardent sans le son.
     s        sous-titre facultatif (gris, plus petit)
     d        durée en s. Repère : 0,3 s par mot affiché + 1 s, jamais moins de 2 s.
     tap      [{ x, y, at }] doigt animé (px CSS de la capture, at en s depuis le début du plan)
     apres    { img, at } capture qui remplace img en fondu à at (l'état après le tap), même cadrage
     surligne [{ x, y, w, h, at, jusqua }] cadre turquoise + pénombre autour (px CSS de la capture)
     suite    1 : même écran que le plan d'avant (pas d'entrée animée de l'écran) ; garde le même nombre
              de lignes de texte pour que l'écran ne saute pas à la coupe
   Plan d'accroche : { accroche: 1, t, k, s, d } texte seul, très grand, plein écran sombre, sans capture.
     t   la phrase choc ou la situation vécue, 8 mots au plus, coupée à la main avec <br> (2 à 4 lignes ; la police
         réduit d'elle-même si une ligne dépasse 820 px, le texte ne va jamais sous les boutons : « Tu ajoutes<br>du poids<br><em>au feeling ?</em> »)
     k   petite étiquette au-dessus, facultative (« Épisode 2 »)
     s   ligne grise dessous, facultative
     Lisible dès la 1re image (c'est la miniature), et en mouvement dès la 1re demi-seconde : le texte
     grandit (zoom), un trait turquoise se trace dessous. 1,6 à 2 s, puis l'écran de l'app arrive
     au plan suivant, comme réponse.
   Plan de fin : { fin: 1, t, s, ep, appel, d } (logo, ep = « Épisode 2 » facultatif, texte, appel =
     « Suis Oxa pour l'épisode 3 » facultatif, oxafit.app, « Lien dans la bio »).
   Format qui retient (stats du 8 novembre 2026) : accroche plein écran, 8 à 10 s au total, une série
   numérotée et un appel clair à la fin.
   Zones sûres en 1080 × 1920 : rien d'important à moins de 230 px du haut, 290 px du bas et 170 px de la
   droite (boutons j'aime / commentaire / partage). Le 1er plan est affiché dès la 1re image :
   l'accroche se lit dès la première seconde et sur la miniature. Les espaces avant ? ! : ; % sont
   rendues insécables automatiquement. */
import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync, rmSync } from "node:fs";
const S = process.env.PACK || "/tmp/pack", FPS = 30, GUIDES = process.env.GUIDES === "1";
const LOGO = readFileSync(`${process.cwd()}/../docs/reseaux/photo-profil-oxa.png`).toString("base64");
const b64 = (f) => readFileSync(`${S}/brut/${f}.png`).toString("base64");

// Les vidéos de la semaine 1 (compte démo « Alex », DATE=2026-11-09). Réécris-les pour chaque semaine,
// en relevant les coordonnées sur les captures de $PACK/brut (px CSS : px de l'image / 3).
const V = {
  seance: [
    { img: "corps-vide", h: 120, bas: 660, d: 2.3, t: "Tu sais jamais <em>quoi faire</em> à la salle ?" },
    { img: "corps-vide", h: 120, bas: 660, d: 2.6, t: "Touche les muscles<br>à <em>travailler</em>", suite: 1,
      tap: [{ x: 172, y: 282, at: 0.55 }, { x: 246, y: 272, at: 1.15 }], apres: { img: "corps", at: 1.3 } },
    { img: "composer-bas", h: 110, bas: 770, d: 4.2, t: "Ta séance est prête.<br><em>Charges comprises.</em>",
      s: "Exercices, séries, charges. Avec ton matériel.",
      surligne: [{ x: 110, y: 205, w: 136, h: 30, at: 0.7, jusqua: 2.1 }] },
    { fin: 1, d: 2.6, t: "Touche un muscle.<br><em>Ta séance est prête.</em>" },
  ],
  pourquoi: [
    { accroche: 1, d: 1.8, k: "Épisode 2", t: "Tu ajoutes<br>du poids<br><em>au feeling ?</em>" },
    { img: "s0-dc-ouvert", h: 205, bas: 650, d: 3.3, t: "Oxa te dit<br><em>pourquoi 42,5 kg.</em>",
      s: "40 kg × 12 sur toutes tes séries : +2,5 kg, et tu repars à 8.", surligne: [{ x: 24, y: 349, w: 330, h: 44, at: 0.6 }] },
    { img: "s0-el-ouvert", h: 515, bas: 724, d: 2.0, t: "Petit muscle :<br><em>+1 kg seulement.</em>",
      surligne: [{ x: 26, y: 665, w: 330, h: 44, at: 0.35 }] },
    { fin: 1, d: 2.4, ep: "Épisode 2", t: "Chaque charge,<br><em>avec sa raison.</em>", appel: "Suis Oxa pour l'épisode 3" },
  ],
  regularite: [
    { accroche: 1, d: 1.8, k: "Épisode 3", t: "Une semaine<br>à fond.<br><em>Puis plus rien ?</em>" },
    { img: "accueil", h: 105, bas: 325, d: 3.0, t: "Ce qui paie :<br><em>revenir.</em>", s: "Muscles prêts ? Tu y retournes.",
      surligne: [{ x: 26, y: 120, w: 160, h: 28, at: 0.5, jusqua: 1.4 }, { x: 18, y: 245, w: 355, h: 72, at: 1.5 }] },
    { img: "progres", h: 105, bas: 312, d: 2.4, t: "Lundi : objectif tenu.<br><em>Et 14 records.</em>",
      surligne: [{ x: 28, y: 243, w: 276, h: 24, at: 0.4 }] },
    { fin: 1, d: 2.4, ep: "Épisode 3", t: "La régularité<br><em>bat l'intensité.</em>", appel: "Suis Oxa pour la suite" },
  ],
};

const ECH = 840 / 390, HAUT = 230, BAS = 1920 - 290;
const nb = (t = "") => t.replace(/ ([?!:;%»])/g, "&nbsp;$1").replace(/« /g, "«&nbsp;");
const css = `*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;background:radial-gradient(120% 70% at 50% 0%,#17322f 0%,#0d0f13 55%,#0a0a0c 100%);font-family:'Inter Display',Inter,sans-serif;color:#fff;overflow:hidden;position:relative}
em{font-style:normal;color:#2dd4bf}
h1{position:absolute;left:70px;width:840px;top:${HAUT}px;font-size:86px;line-height:1.07;font-weight:800;letter-spacing:-2px}
p.s{position:absolute;left:70px;width:840px;font-size:44px;line-height:1.25;color:#c9c9d1;font-weight:500}
.ecran{position:absolute;left:70px;width:840px;border-radius:44px;overflow:hidden;background:#f2f2f4;box-shadow:0 40px 120px rgba(0,0,0,.6),0 0 0 2px rgba(255,255,255,.1)}
.zoom{position:absolute;inset:0;transform-origin:50% 40%}.pile{position:absolute;left:0;top:0;width:840px}.pile img{display:block;width:840px}
.apres{position:absolute;left:0;top:0}
.surl{position:absolute;border:7px solid #2dd4bf;border-radius:20px;box-shadow:0 0 0 4000px rgba(10,10,12,.42),0 0 46px rgba(45,212,191,.75)}
.tap{position:absolute;width:130px;height:130px;margin:-65px 0 0 -65px;border-radius:50%;background:rgba(255,255,255,.45);border:7px solid #fff;box-shadow:0 8px 30px rgba(0,0,0,.35)}
.anneau{position:absolute;width:130px;height:130px;margin:-65px 0 0 -65px;border-radius:50%;border:6px solid #2dd4bf}
.g{position:absolute;background:rgba(255,0,0,.28);z-index:9}
@keyframes entre{from{opacity:0;transform:translateY(46px)}to{opacity:1;transform:none}}
@keyframes ecranEntre{from{opacity:0;transform:translateY(140px) scale(.96)}to{opacity:1;transform:none}}
@keyframes pousse{from{transform:scale(1)}to{transform:scale(1.035)}}
@keyframes fondu{from{opacity:0}to{opacity:1}}
@keyframes sort{from{opacity:1}to{opacity:0}}
@keyframes surl{from{opacity:0;transform:scale(1.18)}to{opacity:1;transform:none}}
@keyframes tap{0%{opacity:0;transform:scale(1.6)}25%{opacity:1;transform:scale(1)}40%{transform:scale(.82)}60%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1)}}
@keyframes anneau{0%{opacity:0;transform:scale(.6)}1%{opacity:.95;transform:scale(.6)}100%{opacity:0;transform:scale(2.6)}}
@keyframes serre{from{transform:scale(.88)}to{transform:scale(1)}}
@keyframes vit{from{transform:scale(1)}to{transform:scale(1.02)}}
@keyframes trace{from{transform:scaleX(.4)}to{transform:scaleX(1)}}
@keyframes pop{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:none}}`;
const an = (nom, dur, at = 0, fill = "both", ease = "cubic-bezier(.2,.8,.2,1)") => `${nom} ${dur}s ${ease} ${at}s 1 normal ${fill}`;
const guides = GUIDES ? `<div class="g" style="left:0;right:0;top:0;height:200px"></div><div class="g" style="left:0;right:0;bottom:0;height:250px"></div><div class="g" style="right:0;width:150px;top:200px;bottom:250px"></div>` : "";

function plan(x, premier) {
  /* accroche : visible entière dès l'image 0 (pas d'opacité 0), le mouvement vient du zoom et du trait */
  if (x.accroche) return `<div style="position:absolute;left:70px;width:840px;top:${HAUT}px;bottom:290px;display:flex;flex-direction:column;justify-content:center">
    <div style="transform-origin:0 50%;animation:${an("serre", 0.6, 0, "both", "cubic-bezier(.15,.85,.25,1)")},${an("vit", x.d - 0.6, 0.6, "forwards", "linear")}">
    ${x.k ? `<div style="display:inline-block;font-size:44px;font-weight:800;color:#0a0a0c;background:#2dd4bf;padding:12px 30px;border-radius:999px;margin-bottom:46px">${nb(x.k)}</div>` : ""}
    <div id="a" style="font-size:120px;line-height:1.04;font-weight:800;letter-spacing:-4px;white-space:nowrap">${nb(x.t)}</div>
    <div style="height:14px;border-radius:7px;background:#2dd4bf;margin-top:52px;width:360px;transform-origin:0 50%;animation:${an("trace", 0.5, 0, "both", "cubic-bezier(.3,.7,.2,1)")}"></div>
    ${x.s ? `<div style="font-size:50px;line-height:1.25;color:#c9c9d1;font-weight:600;margin-top:44px">${nb(x.s)}</div>` : ""}</div></div>`;
  if (x.fin) return `<div style="position:absolute;left:170px;right:170px;top:${HAUT}px;bottom:290px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px;text-align:center">
    <img src="data:image/png;base64,${LOGO}" style="width:${x.ep ? 210 : 250}px;border-radius:${x.ep ? 50 : 58}px;animation:${an("pop", 0.45)}">
    ${x.ep ? `<div style="font-size:42px;font-weight:800;color:#0a0a0c;background:#2dd4bf;padding:10px 30px;border-radius:999px;animation:${an("pop", 0.4, 0.1)}">${nb(x.ep)}</div>` : ""}
    <div style="font-size:76px;font-weight:800;letter-spacing:-2px;line-height:1.08;animation:${an("entre", 0.4, 0.15)}">${nb(x.t)}</div>
    ${x.s ? `<div style="font-size:46px;color:#c9c9d1;font-weight:600;animation:${an("entre", 0.4, 0.3)}">${nb(x.s)}</div>` : ""}
    ${x.appel ? `<div style="font-size:52px;font-weight:800;line-height:1.15;color:#2dd4bf;animation:${an("entre", 0.4, 0.4)}">${nb(x.appel)}</div>` : ""}
    <div style="margin-top:${x.appel ? 10 : 40}px;font-size:46px;font-weight:700;background:#fff;color:#0a0a0c;padding:24px 56px;border-radius:999px;animation:${an("entre", 0.4, 0.45)}">oxafit.app</div>
    <div style="font-size:38px;color:#a1a1aa;font-weight:600;animation:${an("entre", 0.4, 0.55)}">Lien dans la bio</div></div>`;
  const e = (n) => (premier ? "" : `animation:${n}`);
  const surl = (x.surligne || []).map((r) => `<div class="surl" style="left:${(r.x - 4) * ECH}px;top:${(r.y - x.h - 4) * ECH}px;width:${(r.w + 8) * ECH}px;height:${(r.h + 8) * ECH}px;animation:${an("surl", 0.3, r.at)}${r.jusqua ? "," + an("sort", 0.25, r.jusqua, "forwards", "linear") : ""}"></div>`).join("");
  const taps = (x.tap || []).map((t) => `<div class="tap" style="left:${t.x * ECH}px;top:${(t.y - x.h) * ECH}px;animation:${an("tap", 0.7, t.at, "both", "ease-out")}"></div><div class="anneau" style="left:${t.x * ECH}px;top:${(t.y - x.h) * ECH}px;animation:${an("anneau", 0.6, t.at + 0.2, "both", "ease-out")}"></div>`).join("");
  return `<h1 id="t" style="${e(an("entre", 0.38))}">${nb(x.t)}</h1>${x.s ? `<p class="s" id="s" style="${e(an("entre", 0.38, 0.12))}">${nb(x.s)}</p>` : ""}
    <div class="ecran" id="e" style="height:${(x.bas - x.h) * ECH}px;${x.suite ? "" : e(an("ecranEntre", 0.45, 0.1))}"><div class="zoom" style="animation:${an("pousse", x.d, 0, "both", "linear")}"><div class="pile" id="p">
      <img src="data:image/png;base64,${b64(x.img)}" style="margin-top:${-x.h * ECH}px">
      ${x.apres ? `<img class="apres" src="data:image/png;base64,${b64(x.apres.img)}" style="margin-top:${-x.h * ECH}px;animation:${an("fondu", 0.2, x.apres.at, "both", "linear")}">` : ""}
      ${surl}${taps}</div></div></div>`;
}

const noms = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(V);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
for (const v of noms) {
  const dos = `${S}/scenes/${v}`; rmSync(dos, { recursive: true, force: true }); mkdirSync(dos, { recursive: true });
  let f = 0;
  for (let i = 0; i < V[v].length; i++) {
    const x = V[v][i];
    await p.setContent(`<html><head><style>${css}</style></head><body>${plan(x, i === 0)}${guides}</body></html>`);
    await p.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((im) => im.decode().catch(() => {}))); });
    /* mise en page : sous-titre sous le texte, écran dans la place restante, défilement s'il dépasse */
    await p.evaluate((d) => {
      const t = document.getElementById("t"), s = document.getElementById("s"), e = document.getElementById("e");
      const a = document.getElementById("a"); /* accroche : la police réduit jusqu'à tenir dans 820 px (840 après le zoom) */
      const large = () => { const r = document.createRange(); r.selectNodeContents(a); return r.getBoundingClientRect().width; };
      if (a) for (let fs = 120; large() > 820 && fs > 72; fs -= 4) a.style.fontSize = fs - 4 + "px";
      if (!e) return;
      let y = t.getBoundingClientRect().bottom;
      if (s) { s.style.top = y + 24 + "px"; y = s.getBoundingClientRect().bottom; }
      const haut = y + 56, dispo = 1630 - haut, h = e.offsetHeight;
      if (h > dispo) {
        e.style.height = dispo + "px"; e.style.top = haut + "px";
        document.getElementById("p").animate([{ transform: "translateY(0)" }, { transform: `translateY(${dispo - h}px)` }],
          { duration: Math.max(600, (d - 1.4) * 1000), delay: 900, easing: "ease-in-out", fill: "both" });
      } else e.style.top = haut + (dispo - h) * 0.35 + "px";
    }, x.d);
    const n = Math.round(x.d * FPS), apercu = Math.max(0, n - 10);
    for (let k = 0; k < n; k++) {
      await p.evaluate((ms) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = ms; }), (k * 1000) / FPS);
      await p.screenshot({ path: `${dos}/f${String(++f).padStart(4, "0")}.jpg`, type: "jpeg", quality: 92 });
      if (k === apercu) await p.screenshot({ path: `${S}/scenes/${v}-${i + 1}.png` });
    }
  }
  console.log(v, f, "images", (f / FPS).toFixed(1), "s");
}
await b.close();
