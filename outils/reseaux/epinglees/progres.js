// Maquettes des 2 publications épinglées (1080×1920), même style que « Oxa n'est pas sur les stores ».
const { chromium } = require("playwright");
const fs = require("fs");
const D = __dirname;
const B = (f) => fs.readFileSync(f).toString("base64");
const LOGO = B("/home/user/App-Muscu/docs/reseaux/photo-profil-oxa.png");
const css = `*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;position:relative;overflow:hidden;font-family:'Inter Display',Inter,'Noto Color Emoji',sans-serif;color:#fff;
background:radial-gradient(110% 55% at 30% 18%,#1d4a44 0%,#11201f 45%,#0a0a0c 100%)}
em{font-style:normal;color:#2dd4bf}
.haut{position:absolute;left:64px;right:64px;top:250px;display:flex;align-items:center;gap:28px}
.haut img{width:118px;border-radius:28px;box-shadow:0 10px 40px rgba(45,212,191,.25)}
.pill{background:#2dd4bf;color:#0a0a0c;font-weight:800;font-size:34px;padding:12px 30px;border-radius:999px}
h1{position:absolute;left:64px;right:120px;top:410px;font-size:90px;line-height:1.02;font-weight:900;letter-spacing:-3px}
.sous{position:absolute;left:64px;right:120px;top:640px;font-size:38px;line-height:1.3;color:#d4d4d8;font-weight:500}
.cap{position:absolute;left:50%;transform:translateX(-50%);width:580px;top:640px;border-radius:36px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.6),0 0 0 3px rgba(45,212,191,.35)}
.cap img{display:block;width:100%}
.pts{position:absolute;left:64px;right:64px;top:1270px;display:flex;flex-direction:column;gap:14px}
.pt{display:flex;align-items:center;gap:22px;background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.07);border-radius:26px;padding:16px 26px}
.n{flex:none;width:52px;height:52px;border-radius:50%;background:#2dd4bf;color:#0a0a0c;display:grid;place-items:center;font-size:32px;font-weight:900}
.pt b{display:block;font-size:36px;font-weight:800}.pt span{display:block;font-size:30px;color:#a1a1aa;margin-top:2px;font-weight:500}
.bas{position:absolute;left:64px;right:64px;top:1610px;display:flex;justify-content:space-between;align-items:center}
.url{background:#e4e4e7;color:#0a0a0c;font-weight:900;font-size:44px;padding:20px 40px;border-radius:999px}
.bio{text-align:right;font-size:32px;color:#d4d4d8;font-weight:700}.bio small{display:block;font-weight:500;color:#a1a1aa;font-size:28px}`;
const page = (p) => `<div class="haut"><img src="data:image/png;base64,${LOGO}"><div class="pill">${p.pill}</div></div>
<h1>${p.titre}</h1>
<div class="cap" style="${p.capStyle || ""}"><img src="data:image/png;base64,${B(D + "/" + p.cap)}"></div>
<div class="pts">${p.pts.map((x, i) => `<div class="pt"><div class="n">${i + 1}</div><div><b>${x[0]}</b></div></div>`).join("")}</div>
<div class="bas"><div class="url">oxafit.app</div><div class="bio">Lien dans la bio<small>${p.bio}</small></div></div>`;
const P = {
  "epinglee-2-seance": { pill: "Suivi de séance", titre: "Note ta séance<br><em>sans y penser.</em>", sous: "Fini le carnet et les notes&nbsp;: Oxa garde tes charges, tes répétitions et ton max.", cap: "cap-seance.png",
    pts: [["Ta charge d'avant s'affiche", "Tu sais tout de suite quoi battre."], ["Une touche par série", "Charge et répétitions déjà remplies."], ["🏆 Ton max toujours visible", ""]], bio: "Ta séance suivie en 1 touche" },
  "epinglee-3-progres": { pill: "Tes progrès", titre: "Tu progresses&nbsp;?<br><em>Oxa te le montre.</em>", sous: "Chaque série validée s'ajoute à ton historique, sans rien faire de plus.", cap: "cap-progres.png",
    pts: [["La courbe de chaque exercice", "De 75 kg × 8 à 80 kg × 10, en un coup d'œil."], ["La prochaine charge, proposée", ""], ["Tes records et ta régularité", "Semaines d'affilée, calendrier, records."]], bio: "Tes progrès, d'un coup d'œil" },
};
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (const [n, p] of Object.entries(P)) {
    await pg.setContent(`<html><head><meta charset="utf-8"><style>${css}</style></head><body>${page(p)}</body></html>`);
    await pg.waitForTimeout(200); await pg.screenshot({ path: `${D}/${n}.png` });
  }
  await b.close();
})();
