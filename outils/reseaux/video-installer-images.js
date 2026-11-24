// Images 1080×1920 de la vidéo « Comment télécharger l'application Oxa ? » (installation sans store).
// Lancer : NODE_PATH=$(npm root -g) node outils/reseaux/video-installer-images.js <dossier de sortie>
const { chromium } = require("playwright");
const fs = require("fs");
const D = process.argv[2]; fs.mkdirSync(D, { recursive: true });
const LOGO = fs.readFileSync(__dirname + "/../../docs/reseaux/photo-profil-oxa.png").toString("base64");
const css = `*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;position:relative;overflow:hidden;font-family:'Inter Display',Inter,'Noto Color Emoji',sans-serif;color:#fff;
background:radial-gradient(110% 55% at 30% 20%,#1d4a44 0%,#11201f 45%,#0a0a0c 100%)}
em{font-style:normal;color:#2dd4bf}
.logo{position:absolute;left:80px;top:250px;display:flex;align-items:center;gap:22px;font-size:42px;font-weight:800}.logo img{width:96px;border-radius:24px}
h1{position:absolute;left:80px;right:150px;top:420px;font-size:104px;line-height:1.02;font-weight:900;letter-spacing:-3.5px}
.s{position:absolute;left:80px;right:150px;top:900px;font-size:56px;line-height:1.2;font-weight:700;color:#e4e4e7}
.t{position:absolute;left:80px;right:150px;top:400px;font-size:96px;line-height:1.02;font-weight:900;letter-spacing:-3px}
.t small{display:block;font-size:46px;font-weight:700;color:#a1a1aa;letter-spacing:0;margin-top:14px}
.et{position:absolute;left:80px;right:150px;top:720px;display:flex;flex-direction:column;gap:30px}
.e{display:flex;align-items:center;gap:30px;padding:34px 38px;border-radius:36px;background:rgba(255,255,255,.05);border:3px solid rgba(255,255,255,.07);font-size:54px;font-weight:700;opacity:.35}
.e.on{opacity:1;background:rgba(45,212,191,.12);border-color:rgba(45,212,191,.55)}
.n{flex:none;width:84px;height:84px;border-radius:50%;background:#2dd4bf;color:#0a0a0c;display:grid;place-items:center;font-size:46px;font-weight:900}
.e b{color:#2dd4bf}
.ecran{position:absolute;left:150px;right:230px;top:640px;height:560px;border-radius:56px;background:#1c1f24;border:4px solid rgba(255,255,255,.1);display:grid;grid-template-columns:repeat(4,1fr);gap:26px;padding:56px 44px;align-content:start}
.app{display:flex;flex-direction:column;align-items:center;gap:12px;font-size:28px;color:#d4d4d8}
.app i{display:block;width:132px;height:132px;border-radius:32px}
.app.oxa i{background:url(data:image/png;base64,${LOGO}) center/cover;box-shadow:0 0 0 5px #2dd4bf,0 0 60px rgba(45,212,191,.7)}
.fin{position:absolute;left:80px;right:150px;top:1290px;font-size:64px;line-height:1.12;font-weight:900;letter-spacing:-1.5px}
.url{position:absolute;left:80px;top:1560px;background:#fff;color:#0a0a0c;font-weight:900;font-size:50px;padding:22px 48px;border-radius:999px}`;
const logo = `<div class="logo"><img src="data:image/png;base64,${LOGO}">Oxa</div>`;
const etapes = (titre, sous, l, k) => `${logo}<div class="t">${titre}<small>${sous}</small></div><div class="et">${l.map((x, i) => `<div class="e${i < k ? " on" : ""}"><div class="n">${i + 1}</div><div>${x}</div></div>`).join("")}</div>`;
const IOS = ["Tape <b>oxafit.app</b>", "Touche <b>Partager</b>&nbsp;⬆️", "<b>Sur l'écran d'accueil</b>, puis Ajouter"];
const AND = ["Tape <b>oxafit.app</b>", "Touche le menu <b>⋮</b>", "<b>Installer l'application</b>"];
const apps = (oxa) => ["#3b82f6", "#f59e0b", oxa ? "oxa" : "#a855f7", "#22c55e", "#ef4444", "#64748b", "#ec4899", "#14b8a6"]
  .map((c, i) => c === "oxa" ? `<div class="app oxa"><i></i>Oxa</div>` : `<div class="app"><i style="background:${c};opacity:.85"></i>${["Météo", "Notes", "Photos", "Messages", "Agenda", "Réglages", "Musique", "Cartes"][i]}</div>`).join("");
const V = {
  a1: `${logo}<h1>Comment télécharger l'application <em>Oxa</em>&nbsp;? 📲</h1>`,
  a2: `${logo}<h1>Comment télécharger l'application <em>Oxa</em>&nbsp;? 📲</h1><p class="s">Pas (encore) sur les stores… mais <em>3&nbsp;gestes</em> suffisent.</p>`,
  i1: etapes("iPhone", "dans Safari", IOS, 1), i2: etapes("iPhone", "dans Safari", IOS, 2), i3: etapes("iPhone", "dans Safari", IOS, 3),
  d1: etapes("Android", "dans Chrome", AND, 1), d2: etapes("Android", "dans Chrome", AND, 2), d3: etapes("Android", "dans Chrome", AND, 3),
  f1: `${logo}<div class="t">Et voilà.</div><div class="ecran">${apps(false)}</div>`,
  f2: `${logo}<div class="t">Et voilà.</div><div class="ecran">${apps(true)}</div><p class="fin">Oxa s'ouvre comme une vraie app, <em>même hors connexion.</em></p><div class="url">oxafit.app</div>`,
};
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (const [n, h] of Object.entries(V)) {
    await pg.setContent(`<html><head><meta charset="utf-8"><style>${css}</style></head><body>${h}</body></html>`);
    await pg.waitForTimeout(150); await pg.screenshot({ path: `${D}/${n}.png` });
  }
  await b.close();
})();
