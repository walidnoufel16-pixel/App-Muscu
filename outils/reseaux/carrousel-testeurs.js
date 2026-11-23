// Modèle « La science dit » (toutes slides sombres). Lancer : NODE_PATH=$(npm root -g) node outils/reseaux/carrousel-testeurs.js
// Pour un nouveau sujet : copier le fichier, changer O et le tableau S.
// Carrousel « On cherche des testeurs » · 6 slides 1080×1350, toutes sombres, deux avec un bout d'écran de l'app.
// Captures : PACK=… (captures.mjs, plus progression-sq : Progrès › Ma progression par exercice, ?ex=sq).
const { chromium } = require("playwright");
const fs = require("fs");
const RACINE = "/home/user/App-Muscu";
const O = `${RACINE}/docs/reseaux/semaine-4/carrousel-testeurs`;
fs.mkdirSync(O, { recursive: true });
const LOGO = fs.readFileSync(`${RACINE}/docs/reseaux/photo-profil-oxa.png`).toString("base64");
const nb = (t = "") => t.replace(/ ([?!:;%»])/g, "&nbsp;$1").replace(/« /g, "«&nbsp;");

const PACK = process.env.PACK || "/tmp/pack";
/* bout d'écran : capture 390 px de large (×3), de h à bas en px CSS, affiché sur l px de large (920 par défaut) */
const ecran = (f, h, bas, l = 920) => { const e = l / 390; return `<div class="ecran" style="width:${l}px;${l < 920 ? "align-self:center;" : ""}height:${(bas - h) * e}px"><img src="data:image/png;base64,${fs.readFileSync(`${PACK}/brut/${f}.png`).toString("base64")}" style="width:${l}px;margin-top:${-h * e}px"></div>`; };
const S = [
  { couv: 1, k: "On recrute", t: "On cherche <em>30&nbsp;testeurs</em> pour notre app de muscu.", s: "C'est gratuit. Glisse →" },
  { t: "Ton <em>carnet de muscu</em>, dans ta poche.", p: "Tu notes tes séries pendant la séance. Oxa garde tout, séance après séance." },
  { t: "Tu vois <em>ta dernière fois</em>.", img: ["s2-sq-ouvert", 298, 490] },
  { t: "Et <em>si tu progresses</em>.", img: ["progression-sq", 184, 556, 680] },
  { t: "Ce qu'on te <em>demande</em>.", l: ["Note tes séances pendant 2&nbsp;semaines.", "Dis-nous ce qui coince : Menu › Donner mon avis.", "Tes idées peuvent entrer dans l'app."], suite: "Partant ? →" },
  { fin: 1, t: "Tu veux <em>tester</em> ?", p: "Gratuit, sur iPhone et Android, sans passer par un store.", q: "Commente <em>TEST</em> 👇<br>on t'envoie le lien" },
];

const css = `*{margin:0;box-sizing:border-box}
body{width:1080px;height:1350px;font-family:'Inter Display',Inter,sans-serif;overflow:hidden;position:relative;color:#fff;
background:radial-gradient(120% 70% at 50% 0%,#17322f 0%,#0d0f13 55%,#0a0a0c 100%)}
em{font-style:normal;color:#2dd4bf}
.marque{position:absolute;top:70px;left:80px;display:flex;align-items:center;gap:18px;font-size:34px;font-weight:700}
.marque img{width:64px;border-radius:15px}
.page{position:absolute;top:82px;right:80px;font-size:30px;color:#71717a;font-weight:600}
.bloc{position:absolute;left:80px;right:80px;top:0;bottom:150px;display:flex;flex-direction:column;justify-content:center}
.etiq{align-self:flex-start;font-size:38px;font-weight:800;color:#0a0a0c;background:#2dd4bf;padding:12px 32px;border-radius:999px;margin-bottom:48px}
h1{font-size:118px;line-height:1.03;font-weight:800;letter-spacing:-3.5px}
h2{font-size:88px;line-height:1.06;font-weight:800;letter-spacing:-2.2px}
.trait{width:200px;height:14px;border-radius:7px;background:#2dd4bf;margin:56px 0 0}
.s{margin-top:40px;font-size:52px;color:#d4d4d8;font-weight:600}
.p{margin-top:56px;font-size:52px;line-height:1.3;color:#d4d4d8;font-weight:500}
.a{margin-top:44px;font-size:52px;line-height:1.25;color:#2dd4bf;font-weight:700}
.suite{margin-top:44px;font-size:44px;color:#a1a1aa;font-weight:600}
.q{margin-top:64px;padding:40px 44px;border-radius:36px;background:rgba(45,212,191,.12);border:3px solid rgba(45,212,191,.5);font-size:54px;line-height:1.2;font-weight:800}
.src{position:absolute;left:80px;bottom:78px;font-size:28px;color:#71717a;font-weight:500}
.glisse{position:absolute;bottom:72px;right:80px;font-size:36px;font-weight:700;color:#2dd4bf}
.cta{position:absolute;bottom:72px;left:80px;right:80px;display:flex;justify-content:space-between;align-items:center;font-size:36px;font-weight:700}
.cta span{background:#fff;color:#0a0a0c;padding:20px 40px;border-radius:999px}
.ecran{margin-top:56px;border-radius:40px;overflow:hidden;background:#f2f2f4;box-shadow:0 30px 90px rgba(0,0,0,.6),0 0 0 2px rgba(255,255,255,.1)}.ecran img{display:block}
ul{margin-top:52px;list-style:none}li{font-size:50px;line-height:1.25;color:#d4d4d8;font-weight:600;padding-left:64px;position:relative;margin-top:30px}li:before{content:'✓';position:absolute;left:0;color:#2dd4bf;font-weight:800}`;

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  for (let i = 0; i < S.length; i++) {
    const x = S[i];
    const haut = `<div class="marque"><img src="data:image/png;base64,${LOGO}">Oxa</div><div class="page">${i + 1}/${S.length}</div>`;
    let corps;
    if (x.couv) corps = `<div class="bloc"><div class="etiq">${nb(x.k)}</div><h1>${nb(x.t)}</h1><div class="trait"></div><p class="s">${nb(x.s)}</p></div><div class="src" style="font-size:32px">@oxafit.app</div><div class="glisse">Glisse →</div>`;
    else if (x.fin) corps = `<div class="bloc" style="bottom:170px"><h2 style="font-size:80px">${nb(x.t)}</h2><p class="p" style="margin-top:44px">${nb(x.p)}</p><div class="q">${nb(x.q)}</div></div><div class="cta"><div style="color:#a1a1aa">Lien dans la bio</div><span>oxafit.app</span></div>`;
    else corps = `<div class="bloc"><h2>${nb(x.t)}</h2>${x.p ? `<p class="p">${nb(x.p)}</p>` : ""}${x.a ? `<p class="a">${nb(x.a)}</p>` : ""}${x.img ? ecran(...x.img) : ""}${x.l ? `<ul>${x.l.map((y) => `<li>${nb(y)}</li>`).join("")}</ul>` : ""}${x.suite ? `<p class="suite">${nb(x.suite)}</p>` : ""}</div>${x.src ? `<div class="src">${nb(x.src)}</div>` : ""}<div class="glisse">${i === S.length - 2 ? "Dernière étape →" : "→"}</div>`;
    await pg.setContent(`<html><head><meta charset="utf-8"><style>${css}</style></head><body>${haut}${corps}</body></html>`);
    await pg.waitForTimeout(150);
    await pg.screenshot({ path: `${O}/${i + 1}.png` });
  }
  await b.close();
})();
