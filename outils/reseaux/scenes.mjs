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
   Plan de fin : { fin: 1, t, s, d } (logo, texte, oxafit.app, « Lien dans la bio »).
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
    { img: "s0-dc-ferme", h: 205, bas: 640, d: 2.6, t: "Ton app te dit quel poids prendre.<br><em>Mais pourquoi ?</em>",
      surligne: [{ x: 214, y: 274, w: 60, h: 28, at: 0.9 }] },
    { img: "s0-dc-ouvert", h: 205, bas: 650, d: 3.8, t: "60 kg × 12 partout ?<br><em>+2,5 kg.</em>",
      s: "Et tu repars à 8 répétitions. Oxa te l'écrit.", surligne: [{ x: 24, y: 349, w: 330, h: 44, at: 0.6 }] },
    { img: "s0-el-ouvert", h: 515, bas: 844, d: 3.4, t: "Petit muscle,<br><em>petit palier : +1 kg.</em>",
      s: "Chaque exercice a sa règle. Et sa raison.", surligne: [{ x: 26, y: 665, w: 330, h: 44, at: 0.6 }] },
    { fin: 1, d: 2.6, t: "Chaque charge,<br><em>avec sa raison.</em>" },
  ],
  semaine: [
    { img: "bilan", h: 169, bas: 520, d: 2.6, t: "Tu fais <em>assez de séries</em> pour tes pecs ?",
      surligne: [{ x: 20, y: 307, w: 345, h: 30, at: 0.9 }] },
    { img: "bilan", h: 169, bas: 520, d: 3.4, t: "Ici, <em>6 séries.</em><br>La cible : 12.",
      s: "Par muscle et par semaine (niveau régulier)", surligne: [{ x: 14, y: 266, w: 214, h: 28, at: 0.5, jusqua: 1.6 }, { x: 20, y: 307, w: 345, h: 30, at: 1.7 }] },
    { img: "progres", h: 105, bas: 312, d: 3, t: "Chaque lundi :<br><em>bilan et records.</em>",
      surligne: [{ x: 14, y: 240, w: 362, h: 30, at: 0.8 }] },
    { fin: 1, d: 3, t: "Et toi, combien de séries pour tes pecs ?", s: "Dis-le en commentaire" },
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
@keyframes pop{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:none}}`;
const an = (nom, dur, at = 0, fill = "both", ease = "cubic-bezier(.2,.8,.2,1)") => `${nom} ${dur}s ${ease} ${at}s 1 normal ${fill}`;
const guides = GUIDES ? `<div class="g" style="left:0;right:0;top:0;height:200px"></div><div class="g" style="left:0;right:0;bottom:0;height:250px"></div><div class="g" style="right:0;width:150px;top:200px;bottom:250px"></div>` : "";

function plan(x, premier) {
  if (x.fin) return `<div style="position:absolute;left:170px;right:170px;top:${HAUT}px;bottom:290px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px;text-align:center">
    <img src="data:image/png;base64,${LOGO}" style="width:250px;border-radius:58px;animation:${an("pop", 0.45)}">
    <div style="font-size:76px;font-weight:800;letter-spacing:-2px;line-height:1.08;animation:${an("entre", 0.4, 0.15)}">${nb(x.t)}</div>
    ${x.s ? `<div style="font-size:46px;color:#c9c9d1;font-weight:600;animation:${an("entre", 0.4, 0.3)}">${nb(x.s)}</div>` : ""}
    <div style="margin-top:40px;font-size:46px;font-weight:700;background:#fff;color:#0a0a0c;padding:24px 56px;border-radius:999px;animation:${an("entre", 0.4, 0.45)}">oxafit.app</div>
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
