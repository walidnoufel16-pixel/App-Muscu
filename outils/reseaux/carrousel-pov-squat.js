// Modèle « La science dit » (toutes slides sombres). Lancer : NODE_PATH=$(npm root -g) node outils/reseaux/carrousel-science-courbatures.js
// Pour un nouveau sujet : copier le fichier, changer O et le tableau S.
// Carrousel « POV : c'était combien la dernière fois ? » (squat) · 4 slides 1080×1350, sombres, capture de l'app sur la dernière.
const { chromium } = require("playwright");
const fs = require("fs");
const RACINE = "/home/user/App-Muscu";
const O = `${RACINE}/docs/reseaux/semaine-3/carrousel-pov-squat`;
fs.mkdirSync(O, { recursive: true });
const LOGO = fs.readFileSync(`${RACINE}/docs/reseaux/photo-profil-oxa.png`).toString("base64");
const nb = (t = "") => t.replace(/ ([?!:;%»])/g, "&nbsp;$1").replace(/« /g, "«&nbsp;");

const CAPTURE = process.env.CAPTURE; // capture de l'app (compte de démonstration), découpée sur la carte « Squat barre »
const S = [
  { couv: 1, k: "POV", t: "T'arrives au <em>squat</em> et… c'était combien la dernière fois&nbsp;? 🤔", s: "Sois honnête 😅" },
  { t: "«&nbsp;77,5&nbsp;? 80&nbsp;?… Bon, je mets <em>77,5</em>.&nbsp;»", a: "Toi, tu fais comment&nbsp;? 👇" },
  { t: "Résultat&nbsp;: <em>3&nbsp;semaines</em> à la même charge.", p: "Sans même le savoir." },
  { fin: 1, t: "Avec Oxa, ta charge d'avant et <em>ton&nbsp;max</em> s'affichent tout seuls.", img: CAPTURE, q: "Ça t'est déjà arrivé&nbsp;? 👇" },
];

const css = `*{margin:0;box-sizing:border-box}
body{width:1080px;height:1350px;font-family:'Inter Display',Inter,'Noto Color Emoji',sans-serif;overflow:hidden;position:relative;color:#fff;
background:radial-gradient(120% 70% at 50% 0%,#17322f 0%,#0d0f13 55%,#0a0a0c 100%)}
em{font-style:normal;color:#2dd4bf}
.num{font-size:38px;font-weight:800;color:#2dd4bf;letter-spacing:1px;text-transform:uppercase;margin-bottom:28px}
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
.cta span{background:#fff;color:#0a0a0c;padding:20px 40px;border-radius:999px}`;

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } });
  for (let i = 0; i < S.length; i++) {
    const x = S[i];
    const haut = `<div class="marque"><img src="data:image/png;base64,${LOGO}">Oxa</div><div class="page">${i + 1}/${S.length}</div>`;
    let corps;
    if (x.couv) corps = `<div class="bloc"><div class="etiq">${nb(x.k)}</div><h1>${nb(x.t)}</h1><div class="trait"></div><p class="s">${nb(x.s)}</p></div><div class="src" style="font-size:32px">@oxafit.app</div><div class="glisse">Glisse →</div>`;
    else if (x.fin) corps = `<div class="bloc" style="bottom:190px;top:170px"><h2 style="font-size:56px">${nb(x.t)}</h2>${x.img ? `<img src="data:image/png;base64,${fs.readFileSync(x.img).toString("base64")}" style="margin-top:28px;width:660px;align-self:center;border-radius:32px;box-shadow:0 30px 80px rgba(0,0,0,.6)">` : `<p class="p" style="margin-top:44px">${nb(x.p)}</p>`}<div class="q" style="margin-top:30px;padding:30px 40px">${nb(x.q)}</div></div><div class="cta"><div style="color:#a1a1aa">Lien dans la bio</div><span>oxafit.app</span></div>`;
    else corps = `<div class="bloc">${x.n ? `<div class="num">${x.n}</div>` : ""}<h2>${nb(x.t)}</h2><p class="p">${nb(x.p)}</p>${x.a ? `<p class="a">${nb(x.a)}</p>` : ""}${x.suite ? `<p class="suite">${nb(x.suite)}</p>` : ""}</div>${x.src ? `<div class="src">${nb(x.src)}</div>` : ""}<div class="glisse">${i === S.length - 2 ? "Partage-le 📤" : "→"}</div>`;
    await pg.setContent(`<html><head><meta charset="utf-8"><style>${css}</style></head><body>${haut}${corps}</body></html>`);
    await pg.waitForTimeout(150);
    await pg.screenshot({ path: `${O}/${i + 1}.png` });
  }
  await b.close();
})();
