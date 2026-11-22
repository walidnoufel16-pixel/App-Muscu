// Images 1080×1920 de la vidéo « conversation » : Léa partage sa séance Jambes à Inès.
const { chromium } = require("playwright");
const fs = require("fs");
const D = __dirname + "/img"; fs.mkdirSync(D, { recursive: true });
const B = (f) => fs.readFileSync(f).toString("base64");
const LOGO = B("/home/user/App-Muscu/docs/reseaux/photo-profil-oxa.png");
const css = `*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;position:relative;overflow:hidden;font-family:'Inter Display',Inter,'Noto Color Emoji',sans-serif;color:#fff;background:#0a0a0c}
.fond{position:absolute;inset:0;background:radial-gradient(120% 60% at 50% 25%,#17322f 0%,#0d0f13 55%,#0a0a0c 100%)}
em{font-style:normal;color:#2dd4bf}
/* conversation */
.tete{position:absolute;left:0;right:0;top:230px;height:150px;display:flex;align-items:center;gap:26px;padding:0 60px;border-bottom:2px solid rgba(255,255,255,.08)}
.chev{font-size:64px;color:#2dd4bf;font-weight:300;margin-right:6px}
.av{width:100px;height:100px;border-radius:50%;background:#2dd4bf;color:#0a0a0c;display:grid;place-items:center;font-size:48px;font-weight:800}
.nom{font-size:48px;font-weight:800}.statut{font-size:32px;color:#2dd4bf;font-weight:600;margin-top:4px}
.fil{position:absolute;left:50px;right:50px;bottom:440px;display:flex;flex-direction:column;gap:22px}
.b{max-width:780px;padding:28px 38px;border-radius:44px;font-size:52px;line-height:1.22;font-weight:600}
.recu{align-self:flex-start;background:#2a2d33;border-bottom-left-radius:12px}
.envoye{align-self:flex-end;background:#2dd4bf;color:#0a0a0c;border-bottom-right-radius:12px}
.code{font-size:44px}.code b{display:block;font-size:90px;letter-spacing:12px;margin:8px 0 6px}.code small{font-size:34px;font-weight:600;opacity:.8}
.saisie{align-self:flex-end;background:#2dd4bf;padding:34px 44px;border-radius:44px;border-bottom-right-radius:12px;display:flex;gap:16px}.saisie i{width:22px;height:22px;border-radius:50%;background:#0a0a0c;opacity:.6}
.barre{position:absolute;left:50px;right:50px;top:1520px;height:110px;border-radius:55px;background:#1c1f24;display:flex;align-items:center;padding:0 44px;font-size:40px;color:#71717a}
.acc{position:absolute;left:80px;right:170px;top:470px;font-size:84px;line-height:1.05;font-weight:800;letter-spacing:-2.5px}
/* écrans de l'app */
.bloc{position:absolute;left:80px;right:170px;top:250px}
h1{font-size:88px;line-height:1.04;font-weight:800;letter-spacing:-2.6px}
.p{margin-top:26px;font-size:50px;font-weight:600;color:#d4d4d8}
.carte{position:absolute;left:70px;right:70px;top:720px;border-radius:44px;overflow:hidden;box-shadow:0 40px 120px rgba(0,0,0,.6),0 0 0 3px rgba(255,255,255,.08);background:#f2f2f4}
.carte img{display:block;width:100%}
.tap{position:absolute;width:120px;height:120px;border-radius:50%;background:rgba(45,212,191,.35);border:6px solid #2dd4bf;transform:translate(-50%,-50%)}
.q{margin-top:70px;padding:44px 48px;border-radius:40px;background:rgba(45,212,191,.12);border:4px solid rgba(45,212,191,.55);font-size:62px;font-weight:800;line-height:1.15}
.logo{display:flex;align-items:center;gap:22px;font-size:46px;font-weight:800;margin-bottom:70px}.logo img{width:96px;border-radius:22px}
.cta{position:absolute;left:80px;right:170px;bottom:330px;display:flex;justify-content:space-between;align-items:center;font-size:40px;font-weight:700;color:#a1a1aa}.cta span{background:#fff;color:#0a0a0c;padding:22px 44px;border-radius:999px}`;
const M = {
  i1: '<div class="b recu">Elle était trop bien ta séance jambes 🔥</div>',
  i2: '<div class="b recu">Tu me l\'envoies&nbsp;?</div>',
  tape: '<div class="saisie"><i></i><i></i><i></i></div>',
  l1: '<div class="b envoye">Attends 😏</div>',
  l2: '<div class="b envoye code">Ma séance « Jambes » sur Oxa<b>K7P2X</b><small>oxafit.app/?s=K7P2X</small></div>',
  i3: '<div class="b recu">Reçue ✅ Même séance jeudi&nbsp;?</div>',
  l3: '<div class="b envoye">Deal 💪</div>',
};
const conv = (ids, acc) => `<div class="fond"></div>${acc ? '<div class="acc">Ton <em>binôme</em> te demande ta séance&nbsp;?</div>' : ""}<div class="tete"><span class="chev">‹</span><div class="av">I</div><div><div class="nom">Inès</div><div class="statut">en ligne</div></div></div><div class="fil">${ids.map((k) => M[k]).join("")}</div><div class="barre">Message…</div>`;
async function decoupe(pg, f, y0, y1) {
  await pg.setViewportSize({ width: 1170, height: y1 - y0 });
  await pg.setContent(`<html><body style="margin:0"><img src="data:image/png;base64,${B(f)}" style="display:block;margin-top:${-y0}px"></body></html>`);
  await pg.waitForTimeout(100); const out = `${D}/_${f.split("/").pop()}`; await pg.screenshot({ path: out }); return out;
}
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage();
  const liste = await decoupe(pg, __dirname + "/brut/1-liste.png", 380, 1300);
  const code = await decoupe(pg, __dirname + "/brut/2-code.png", 1380, 2290);
  const recue = await decoupe(pg, __dirname + "/brut/5-recue-seance.png", 90, 1640);
  const img = (f) => `data:image/png;base64,${B(f)}`;
  const k = 940 / 1170;
  const app = (h, carte, extra = "", p = "", st = "") => `<div class="fond"></div><div class="bloc"><h1>${h}</h1>${p ? `<p class="p">${p}</p>` : ""}</div><div class="carte" style="${st}"><img src="${img(carte)}">${extra}</div>`;
  const V = {
    c1: conv(["i1"], 1), c2: conv(["i1", "i2"], 1), c3: conv(["i1", "i2", "tape"], 1), c4: conv(["i1", "i2", "l1"], 1),
    a1: app("Un code. <em>5&nbsp;caractères.</em>", liste),
    a2: app("Un code. <em>5&nbsp;caractères.</em>", liste, `<div class="tap" style="left:${1050 * k}px;top:${736 * k}px"></div>`),
    a3: app("Tu <em>l'envoies.</em>", code),
    c5: conv(["i1", "i2", "l1", "l2"]),
    a4: app("Elle a ta séance… <em>à&nbsp;sa&nbsp;façon.</em>", recue, "", "Mêmes exercices. Ses charges, son repos&nbsp;: elle adapte tout.", "left:170px;right:170px;top:660px"),
    c6: conv(["l1", "l2", "i3"]), c7: conv(["l1", "l2", "i3", "l3"]),
    fin: `<div class="fond"></div><div class="bloc" style="top:430px"><div class="logo"><img src="data:image/png;base64,${LOGO}">Oxa</div><h1>Partage ta séance en <em>1&nbsp;seconde</em>.</h1><div class="q">Identifie ton partenaire de salle <em>👇</em></div></div><div class="cta"><div>Lien dans la bio</div><span>oxafit.app</span></div>`,
  };
  await pg.setViewportSize({ width: 1080, height: 1920 });
  for (const [n, h] of Object.entries(V)) {
    await pg.setContent(`<html><head><meta charset="utf-8"><style>${css}</style></head><body>${h}</body></html>`);
    await pg.waitForTimeout(150); await pg.screenshot({ path: `${D}/${n}.png` });
  }
  await b.close();
})();
