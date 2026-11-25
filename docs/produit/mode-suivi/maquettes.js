// Maquettes du parcours « mode Suivi / mode Guidé » (3 écrans iPhone 390×844, rendus à ×2).
const { chromium } = require("playwright");
const fs = require("fs");
const D = __dirname, I = "/home/user/App-Muscu/web/public/img/";
const img = (f) => `data:image/avif;base64,${fs.readFileSync(I + f).toString("base64")}`;
const LOGO = fs.readFileSync("/home/user/App-Muscu/docs/reseaux/photo-profil-oxa.png").toString("base64");
const SQ = img("ex-sq.avif"), RDL = img("Romanian_Deadlift_0.avif"), LC = img("Lying_Leg_Curls_0.avif"), MOL = img("Standing_Calf_Raises_0.avif"), DC = img("Barbell_Bench_Press_-_Medium_Grip_0.avif");
const css = `*{margin:0;box-sizing:border-box}body{width:390px;height:844px;overflow:hidden;font-family:Inter,'Noto Color Emoji',sans-serif;background:#f2f2f4;color:#0a0a0c;position:relative}
.teal{color:#0d9488}.pad{padding:0 16px}
.top{height:54px}.eyebrow{font-size:11.5px;letter-spacing:.1em;text-transform:uppercase;color:#71717a;font-weight:600}
h1{font-size:30px;font-weight:800;letter-spacing:-.6px;line-height:1.1}
.card{background:#fff;border-radius:20px;padding:14px}
.btn{display:flex;align-items:center;justify-content:center;height:50px;border-radius:999px;font-weight:700;font-size:16px}
.plate{background:#14b8a6;color:#fff}.soft{background:#e7f8f5;color:#0f766e}
.tab{position:absolute;left:12px;right:12px;bottom:18px;height:64px;border-radius:24px;background:rgba(255,255,255,.95);box-shadow:0 8px 30px rgba(0,0,0,.08);display:flex;justify-content:space-around;align-items:center;font-size:11.5px;font-weight:600;color:#71717a}
.tab div{display:flex;flex-direction:column;align-items:center;gap:3px}.tab .on{color:#0a0a0c}.ico{font-size:20px}
.ph{width:44px;height:44px;border-radius:12px;object-fit:cover;border:2px solid #fff;margin-left:-12px;background:#ddd}.ph:first-child{margin-left:0}
.row{display:flex;align-items:center;gap:12px}
.note{position:absolute;left:0;right:0;bottom:-2px}`;
const S = {
  "1-question": `<div class="top"></div><div class="pad">
    <div class="row" style="gap:10px;margin-top:10px"><img src="data:image/png;base64,${LOGO}" style="width:40px;border-radius:11px"><b style="font-size:17px">Oxa</b></div>
    <h1 style="margin-top:34px">Tu as déjà<br>ton programme&nbsp;?</h1>
    <p style="margin-top:10px;color:#52525b;font-size:15px;line-height:1.4">Oxa s'adapte à toi. Tu pourras changer à tout moment dans Profil.</p>
    <div class="card" style="margin-top:26px;border:2.5px solid #14b8a6;padding:18px">
      <span style="font-size:11px;font-weight:800;background:#14b8a6;color:#fff;border-radius:999px;padding:4px 10px">MODE SUIVI</span>
      <p style="margin-top:10px;font-size:19px;font-weight:800">Oui, je veux suivre mes séances</p>
      <p style="margin-top:6px;font-size:14px;color:#52525b;line-height:1.4">Tu notes tes séries. Oxa garde ta charge d'avant, ton max, ta récup et tes progrès.</p>
    </div>
    <div class="card" style="margin-top:12px;padding:18px;border:2.5px solid transparent">
      <span style="font-size:11px;font-weight:800;background:#e4e4e7;color:#3f3f46;border-radius:999px;padding:4px 10px">MODE GUIDÉ</span>
      <p style="margin-top:10px;font-size:19px;font-weight:800">Non, guide-moi</p>
      <p style="margin-top:6px;font-size:14px;color:#52525b;line-height:1.4">Quelques questions, puis Oxa te prépare tes séances selon ta récup et ton matériel.</p>
    </div>
    <div class="btn plate" style="position:absolute;left:16px;right:16px;bottom:34px">Continuer</div></div>`,
  "2-premiere-seance": `<div class="top"></div><div class="pad">
    <p class="teal" style="font-size:15px;font-weight:600">‹ Retour</p>
    <p class="eyebrow" style="margin-top:16px">Ta première séance</p>
    <h1 style="margin-top:4px">Comme dans<br>ton carnet.</h1>
    <div class="card" style="margin-top:16px;padding:12px 14px;font-size:17px;font-weight:700">Jambes <span style="float:right;color:#a1a1aa;font-weight:500;font-size:14px">nom ✎</span></div>
    <div class="card" style="margin-top:10px;padding:4px 14px">
      ${[[SQ, "Squat barre", "4 × 8 · repos 2 min 30"], [RDL, "Soulevé de terre roumain", "3 × 10 · repos 2 min"], [LC, "Leg curl allongé", "3 × 12 · repos 90 s"]].map(([p, n, d]) => `<div class="row" style="padding:10px 0;border-bottom:1px solid #f0f0f2"><img src="${p}" style="width:46px;height:46px;border-radius:12px;object-fit:cover"><div style="flex:1"><b style="font-size:15px">${n}</b><p style="font-size:13px;color:#71717a;margin-top:2px">${d}</p></div><span style="color:#a1a1aa">⋮⋮</span></div>`).join("")}
      <p class="teal" style="padding:13px 0;font-size:15px;font-weight:700">＋ Ajouter un exercice</p>
    </div>
    <p style="margin-top:12px;font-size:13px;color:#71717a;line-height:1.4">Séries, répétitions et repos se modifient en un geste. Tes charges, tu les notes pendant la séance.</p>
    <div style="position:absolute;left:16px;right:16px;bottom:34px;display:flex;gap:8px"><div class="btn soft" style="flex:1">Enregistrer</div><div class="btn plate" style="flex:1.4">Commencer</div></div></div>`,
  "3-accueil-suivi": `<div class="top"></div><div class="pad">
    <div class="row" style="justify-content:space-between"><span style="font-size:22px">☰</span><span style="width:34px;height:34px;border-radius:50%;background:#e4e4e7;display:grid;place-items:center;font-weight:700">A</span></div>
    <h1 style="margin-top:10px">Salut Alex 👋</h1>
    <div class="card" style="margin-top:12px;padding:12px 14px">
      <div class="row" style="justify-content:space-between"><span class="eyebrow">Cette semaine</span><b style="font-size:13px">2 / 3 · 🔥 6 sem.</b></div>
      <div style="display:flex;justify-content:space-between;margin-top:10px">${["L", "M", "M", "J", "V", "S", "D"].map((j, i) => `<div style="text-align:center;font-size:11px;color:#71717a">${j}<div style="width:30px;height:30px;border-radius:50%;margin-top:4px;${i === 0 || i === 2 ? "background:#14b8a6" : i === 3 ? "border:2.5px solid #14b8a6" : "border:2px solid #e4e4e7"}"></div></div>`).join("")}</div>
    </div>
    <p class="eyebrow" style="margin:16px 0 8px">Mes séances</p>
    <div class="card" style="padding:12px 14px;border:2px solid #14b8a6">
      <div class="row"><div style="display:flex">${[SQ, RDL, MOL].map((p) => `<img class="ph" src="${p}">`).join("")}</div><div style="flex:1"><b style="font-size:16px">Jambes</b><p style="font-size:12.5px;color:#71717a">Dernière fois jeudi · squat 80 × 10</p></div></div>
      <div class="btn plate" style="margin-top:10px;height:44px">Commencer</div>
    </div>
    <div class="card" style="margin-top:8px;padding:10px 14px"><div class="row"><div style="display:flex">${[DC, SQ].map((p) => `<img class="ph" src="${p}">`).join("")}</div><div style="flex:1"><b style="font-size:15px">Pecs · Épaules · Triceps</b><p style="font-size:12.5px;color:#71717a">Dernière fois lundi</p></div><span style="color:#a1a1aa">›</span></div></div>
    <p class="teal" style="margin-top:10px;font-size:14.5px;font-weight:700">＋ Nouvelle séance</p>
    <div class="card" style="margin-top:12px;padding:12px 14px">
      <div class="row" style="justify-content:space-between"><span class="eyebrow">Récupération</span><span class="teal" style="font-size:13px;font-weight:700">Voir ›</span></div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;font-size:12.5px;font-weight:600">
        <span style="background:#e7f8f5;color:#0f766e;border-radius:999px;padding:5px 10px">● Pecs prêts</span><span style="background:#e7f8f5;color:#0f766e;border-radius:999px;padding:5px 10px">● Dos prêt</span><span style="background:#fef3c7;color:#92400e;border-radius:999px;padding:5px 10px">● Quadriceps demain</span></div>
    </div></div>
    <div class="tab"><div class="on"><span class="ico">🏋️</span>Séances</div><div><span class="ico">📈</span>Progrès</div><div><span class="ico">👤</span>Profil</div></div>`,
};
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  for (const [n, h] of Object.entries(S)) {
    await pg.setContent(`<html><head><meta charset="utf-8"><style>${css}</style></head><body>${h}</body></html>`);
    await pg.waitForTimeout(300); await pg.screenshot({ path: `${D}/${n}.png` });
  }
  await b.close();
})();
