const { chromium } = require("playwright");
const fs = require("fs");
const D = __dirname, B = (f) => fs.readFileSync(f).toString("base64");
const LOGO = B("/home/user/App-Muscu/docs/reseaux/photo-profil-oxa.png");
const css = `*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;position:relative;overflow:hidden;font-family:'Inter Display',Inter,'Noto Color Emoji',sans-serif;color:#fff;
background:radial-gradient(110% 55% at 30% 18%,#1d4a44 0%,#11201f 45%,#0a0a0c 100%)}
em{font-style:normal;color:#2dd4bf}
.haut{position:absolute;left:64px;right:64px;top:250px;display:flex;align-items:center;gap:28px}
.haut img{width:118px;border-radius:28px;box-shadow:0 10px 40px rgba(45,212,191,.25)}
.pill{background:#2dd4bf;color:#0a0a0c;font-weight:800;font-size:34px;padding:12px 30px;border-radius:999px}
h1{position:absolute;left:64px;right:100px;top:410px;font-size:86px;line-height:1.03;font-weight:900;letter-spacing:-3px}
.cols{position:absolute;left:48px;right:48px;top:650px;display:flex;gap:28px;align-items:flex-start}
.c1{flex:1}.c2{flex:1}.c1 .cap{background:#f2f2f4}
.col{flex:1;display:flex;flex-direction:column;gap:18px}
.et{display:flex;align-items:center;gap:16px;font-size:40px;font-weight:800}
.n{flex:none;width:54px;height:54px;border-radius:50%;background:#2dd4bf;color:#0a0a0c;display:grid;place-items:center;font-size:30px;font-weight:900}
.cap{border-radius:30px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.6),0 0 0 3px rgba(45,212,191,.35);background:#fff}
.cap img{display:block;width:100%}
.txt{font-size:30px;line-height:1.3;color:#d4d4d8;font-weight:500}
.bas{position:absolute;left:64px;right:64px;top:1610px;display:flex;justify-content:space-between;align-items:center}
.url{background:#e4e4e7;color:#0a0a0c;font-weight:900;font-size:44px;padding:20px 40px;border-radius:999px}
.bio{text-align:right;font-size:32px;color:#d4d4d8;font-weight:700}.bio small{display:block;font-weight:500;color:#a1a1aa;font-size:28px}`;
const html = `<div class="haut"><img src="data:image/png;base64,${LOGO}"><div class="pill">Suivi de séance</div></div>
<h1>Note ta séance.<br><em>Oxa s'en souvient.</em></h1>
<div class="cols">
 <div class="col c1"><div class="et"><div class="n">1</div>Tes séances</div><div class="cap"><img src="data:image/png;base64,${B(D + "/cap-mes-seances.png")}"></div><p class="txt">Ton programme, comme dans ton carnet.</p></div>
 <div class="col c2"><div class="et"><div class="n">2</div>À la salle</div><div class="cap"><img src="data:image/png;base64,${B(D + "/cap-seance.png")}"></div><p class="txt">Ta charge d'avant, 🏆 ton max, une touche par série.</p></div>
</div>
<div class="bas"><div class="url">oxafit.app</div><div class="bio">Lien dans la bio<small>Ton carnet de muscu, en mieux</small></div></div>`;
(async () => { const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.setContent(`<html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}</body></html>`); await pg.waitForTimeout(200);
  await pg.screenshot({ path: D + "/epinglee-2-creer-suivre.png" }); await b.close(); })();
