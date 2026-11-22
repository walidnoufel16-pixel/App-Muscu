// Images 1080×1920 de la vidéo « Ton binôme te demande ta séance ? ».
const { chromium } = require("playwright");
const fs = require("fs");
const D = __dirname + "/img"; fs.mkdirSync(D, { recursive: true });
const B = (f) => fs.readFileSync(__dirname + "/" + f).toString("base64");
const LOGO = fs.readFileSync("/home/user/App-Muscu/docs/reseaux/photo-profil-oxa.png").toString("base64");
const css = `*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;position:relative;overflow:hidden;font-family:'Inter Display',Inter,sans-serif;color:#fff}
.fond{position:absolute;inset:0;background:radial-gradient(120% 60% at 50% 25%,#17322f 0%,#0d0f13 55%,#0a0a0c 100%)}
em{font-style:normal;color:#2dd4bf}
.bloc{position:absolute;left:80px;right:170px;top:250px}
h1{font-size:88px;line-height:1.04;font-weight:800;letter-spacing:-2.6px}
.p{margin-top:26px;font-size:50px;font-weight:600;color:#d4d4d8}
.carte{position:absolute;left:70px;right:70px;top:720px;border-radius:44px;overflow:hidden;box-shadow:0 40px 120px rgba(0,0,0,.6),0 0 0 3px rgba(255,255,255,.08);background:#f2f2f4}
.carte img{display:block;width:100%}
.tap{position:absolute;width:120px;height:120px;border-radius:50%;background:rgba(45,212,191,.35);border:6px solid #2dd4bf;transform:translate(-50%,-50%)}
.q{margin-top:70px;padding:44px 48px;border-radius:40px;background:rgba(45,212,191,.12);border:4px solid rgba(45,212,191,.55);font-size:62px;font-weight:800;line-height:1.15}
.logo{display:flex;align-items:center;gap:22px;font-size:46px;font-weight:800;margin-bottom:70px}.logo img{width:96px;border-radius:22px}
.cta{position:absolute;left:80px;right:170px;bottom:330px;display:flex;justify-content:space-between;align-items:center;font-size:40px;font-weight:700;color:#a1a1aa}.cta span{background:#fff;color:#0a0a0c;padding:22px 44px;border-radius:999px}`;
// découpe d'une capture 1170 px de large (y en px de capture) dans un canevas
async function decoupe(pg, f, y0, y1) {
  await pg.setViewportSize({ width: 1170, height: y1 - y0 });
  await pg.setContent(`<html><body style="margin:0"><img src="data:image/png;base64,${B(f)}" style="display:block;margin-top:${-y0}px"></body></html>`);
  await pg.waitForTimeout(100);
  const out = `${D}/_${f.split("/").pop()}`; await pg.screenshot({ path: out }); return out;
}
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage();
  const liste = await decoupe(pg, "brut/1-liste.png", 380, 1300);
  const code = await decoupe(pg, "brut/2-code.png", 1230, 2290);
  const recue = await decoupe(pg, "brut/5-recue-seance.png", 120, 930);
  const img = (f) => `data:image/png;base64,${fs.readFileSync(f).toString("base64")}`;
  const k = 940 / 1170; // échelle capture → carte
  const V = {
    p1: { transp: 1, h: "Ton <em>binôme</em> te demande ta séance&nbsp;?" },
    p2a: { h: "Un code. <em>5&nbsp;caractères.</em>", carte: liste },
    p2b: { h: "Un code. <em>5&nbsp;caractères.</em>", carte: liste, tap: [1053 * k, 275 * k] },
    p3: { h: "Tu <em>l'envoies.</em>", carte: code },
    p4: { h: "Il a <em>exactement</em> ta séance.", p: "Mêmes exercices, mêmes séries.", carte: recue },
  };
  await pg.setViewportSize({ width: 1080, height: 1920 });
  for (const [n, x] of Object.entries(V)) {
    const carte = x.carte ? `<div class="carte"><img src="${img(x.carte)}">${x.tap ? `<div class="tap" style="left:${x.tap[0]}px;top:${x.tap[1]}px"></div>` : ""}</div>` : "";
    await pg.setContent(`<html><head><meta charset="utf-8"><style>${css}</style></head><body style="background:${x.transp ? "transparent" : "#0a0a0c"}">${x.transp ? "" : '<div class="fond"></div>'}<div class="bloc"><h1>${x.h}</h1>${x.p ? `<p class="p">${x.p}</p>` : ""}</div>${carte}</body></html>`);
    await pg.waitForTimeout(150); await pg.screenshot({ path: `${D}/${n}.png`, omitBackground: !!x.transp });
  }
  await pg.setContent(`<html><head><meta charset="utf-8"><style>${css}</style></head><body><div class="fond"></div><div class="bloc" style="top:430px"><div class="logo"><img src="data:image/png;base64,${LOGO}">Oxa</div><h1>Partage ta séance en <em>1 seconde</em>.</h1><div class="q">Identifie ton partenaire de salle <em>👇</em></div></div><div class="cta"><div>Lien dans la bio</div><span>oxafit.app</span></div></body></html>`);
  await pg.waitForTimeout(150); await pg.screenshot({ path: `${D}/p5.png` });
  await b.close();
})();
