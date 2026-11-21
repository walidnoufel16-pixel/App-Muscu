// Calques de texte 1080×1920 (fond transparent) pour le Reel « Soulever lourd ».
const { chromium } = require("playwright");
const fs = require("fs");
const D = __dirname + "/calques2";
fs.mkdirSync(D, { recursive: true });
const LOGO = fs.readFileSync("/home/user/App-Muscu/docs/reseaux/photo-profil-oxa.png").toString("base64");
const nb = (t = "") => t.replace(/ ([?!:;%»])/g, "&nbsp;$1");
const C = {
  p1a: { h: "Soulever lourd va me rendre <em>trop musclée</em> ?" },
  p1b: { h: "Soulever lourd va me rendre <em>trop musclée</em> ?", gros: "Non." },
  p2: { h: "Lourd ou léger : ton muscle grossit <em>pareil</em>.", p: "Ce qui compte, c'est l'effort. Pas le poids.", src: "Lopez et al., 2021 · méta-analyse" },
  p3: { h: "Lourd te rend surtout <em>plus forte</em>.", src: "Schoenfeld et al. · méta-analyse" },
  p4: { h: "Prendre beaucoup de muscle, ça prend <em>des années</em>.", p: "Jamais par accident." },
  p5: { fin: 1 },
};
const css = `*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;background:transparent;font-family:'Inter Display',Inter,sans-serif;color:#fff;position:relative;overflow:hidden}
em{font-style:normal;color:#2dd4bf}
.ombre{position:absolute;left:0;right:0;top:0;height:1150px;background:linear-gradient(180deg,rgba(5,6,8,.88) 0%,rgba(5,6,8,.72) 55%,rgba(5,6,8,0) 100%)}
.bloc{position:absolute;left:80px;right:170px;top:250px}
h1{font-size:84px;line-height:1.04;font-weight:800;letter-spacing:-2.6px;text-shadow:0 4px 30px rgba(0,0,0,.5)}
.p{margin-top:28px;font-size:48px;line-height:1.25;font-weight:600;color:#e4e4e7;text-shadow:0 3px 20px rgba(0,0,0,.6)}
.gros{margin-top:22px;font-size:140px;font-weight:900;letter-spacing:-6px;color:#2dd4bf;line-height:1}
.src{position:absolute;left:80px;top:1595px;}.bas .src{bottom:auto;top:250px}.src{font-size:32px;font-weight:600;color:#fff;background:rgba(0,0,0,.55);padding:10px 22px;border-radius:999px}
.bas .ombre{top:auto;bottom:0;height:1100px;background:linear-gradient(0deg,rgba(5,6,8,.9) 0%,rgba(5,6,8,.75) 50%,rgba(5,6,8,0) 100%)}.bas .bloc{top:auto;bottom:380px}.bas .gros{font-size:150px;margin-top:30px}
.fin{position:absolute;inset:0;background:radial-gradient(120% 70% at 50% 0%,#17322f 0%,#0d0f13 55%,#0a0a0c 100%)}
.fin .bloc{top:430px}
.logo{display:flex;align-items:center;gap:22px;font-size:46px;font-weight:800;margin-bottom:70px}.logo img{width:96px;border-radius:22px}
.q{margin-top:70px;padding:44px 48px;border-radius:40px;background:rgba(45,212,191,.12);border:4px solid rgba(45,212,191,.55);font-size:66px;font-weight:800;line-height:1.15}
.cta{position:absolute;left:80px;right:170px;bottom:330px;display:flex;justify-content:space-between;align-items:center;font-size:40px;font-weight:700;color:#a1a1aa}.cta span{background:#fff;color:#0a0a0c;padding:22px 44px;border-radius:999px}`;
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (const [k, x] of Object.entries(C)) {
    const corps = x.fin
      ? `<div class="fin"><div class="bloc"><div class="logo"><img src="data:image/png;base64,${LOGO}">Oxa</div><h1>Oxa adapte tes charges à <em>ton niveau</em>.</h1><div class="q">Tu soulèves lourd&nbsp;?<br><em>Oui ou non 👇</em></div></div><div class="cta"><div>Lien dans la bio</div><span>oxafit.app</span></div></div>`
      : `<div class="bloc"><h1>${nb(x.h)}</h1>${x.p ? `<p class="p">${nb(x.p)}</p>` : ""}${x.gros ? `<div class="gros">${x.gros}</div>` : ""}</div>${x.src ? `<div class="src">${x.src}</div>` : ""}`;
    await pg.setContent(`<html><head><meta charset="utf-8"><style>${css}</style></head><body class="${x.bas ? 'bas' : ''}">${corps}</body></html>`);
    await pg.waitForTimeout(120);
    await pg.screenshot({ path: `${D}/${k}.png`, omitBackground: true });
  }
  await b.close();
})();
