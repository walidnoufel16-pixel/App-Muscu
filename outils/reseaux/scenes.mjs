import { chromium } from "@playwright/test";
import { readFileSync } from "node:fs";
const S = "/tmp/claude-0/-home-user-App-Muscu/ed83b37f-7825-50b5-8dda-5e94ab5aca5b/scratchpad/pack";
const LOGO = readFileSync("/home/user/App-Muscu/docs/reseaux/photo-profil-oxa.png").toString("base64");
const b64 = (f) => readFileSync(`${S}/brut/${f}.png`).toString("base64");
// [image, haut, bas (px CSS sur 844), texte, petit, tap {x,y} en px CSS]
const V = {
  seance: [
    ["a1-accueil", 0, 560, "Tu sais jamais <em>quoi faire</em> à la salle ?", ""],
    ["b1-recup", 250, 844, "Oxa sait quels muscles ont <em>récupéré</em>", "D'après tes séances des 14 derniers jours"],
    ["a6-corps", 100, 700, "Touche ce que tu veux <em>travailler</em>", "", { x: 165, y: 282 }],
    ["b3-composer-bas", 120, 700, "Ta séance est prête.<br><em>Charges comprises.</em>", "Avec ton matériel, dans ton temps"],
    ["fin"],
  ],
  pourquoi: [
    ["d1-rowing-ferme", 90, 400, "Ton app te dit quel poids prendre.<br><em>Mais pourquoi ?</em>", ""],
    ["d1-rowing-ouvert", 90, 520, "Oxa te l'explique.<br><em>À chaque charge.</em>", "Réussi ? On ajoute. Sinon, on consolide."],
    ["d2-facepull-ouvert", 104, 520, "Retour de pause ?<br><em>−10 %</em> pour repartir en douceur", ""],
    ["d3-rotation-ouvert", 90, 540, "Jamais fait ?<br>Estimé d'après un <em>exercice proche</em>", ""],
    ["fin"],
  ],
  semaine: [
    ["c1-progres", 60, 440, "Chaque lundi,<br><em>ton bilan</em> de la semaine", ""],
    ["e1-bilan-feuille", 330, 844, "Tes séries par muscle,<br>face à <em>ta cible</em>", ""],
    ["c2-progres-bas", 210, 760, "Ce que tu as <em>vraiment</em> travaillé", "Les 7 derniers jours"],
    ["b1-recup", 250, 844, "Et ce qui doit encore <em>récupérer</em>", ""],
    ["fin"],
  ],
};
const css = `*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;background:radial-gradient(120% 70% at 50% 0%,#17322f 0%,#0d0f13 55%,#0a0a0c 100%);font-family:'Inter Display',Inter,sans-serif;color:#fff;overflow:hidden;position:relative}
h1{position:absolute;left:80px;right:80px;top:170px;font-size:84px;line-height:1.08;font-weight:800;letter-spacing:-2px}h1 em{font-style:normal;color:#2dd4bf}
p.s{position:absolute;left:80px;right:80px;font-size:38px;color:#a1a1aa}
.ecran{position:absolute;left:50%;transform:translateX(-50%);width:900px;border-radius:48px;overflow:hidden;box-shadow:0 40px 120px rgba(0,0,0,.6),0 0 0 2px rgba(255,255,255,.08)}
.ecran img{display:block;width:100%}
.tap{position:absolute;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.35);border:6px solid #fff;transform:translate(-50%,-50%)}
.pied{position:absolute;bottom:90px;left:0;right:0;text-align:center;font-size:34px;color:#71717a;font-weight:600}`;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
for (const [v, sc] of Object.entries(V)) {
  for (let i = 0; i < sc.length; i++) {
    const [img, h, bas, t, sous, tap] = sc[i];
    let html;
    if (img === "fin") {
      html = `<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px;text-align:center">
        <img src="data:image/png;base64,${LOGO}" style="width:300px;border-radius:68px">
        <div style="font-size:120px;font-weight:800;letter-spacing:-3px;line-height:1">Oxa</div>
        <div style="font-size:52px;color:#2dd4bf;font-weight:600">Ton coach de poche</div>
        <div style="margin-top:60px;font-size:46px;font-weight:700;background:#fff;color:#0a0a0c;padding:26px 56px;border-radius:999px">oxafit.app</div>
        <div style="font-size:34px;color:#a1a1aa">Lien dans la bio</div></div>`;
    } else {
      const ech = 900 / 390, hauteur = (bas - h) * ech;
      html = `<h1 id="t">${t}</h1>${sous ? `<p class="s" id="s">${sous}</p>` : ""}
        <div class="ecran" id="e" style="height:${hauteur}px"><img src="data:image/png;base64,${b64(img)}" style="margin-top:${-h * ech}px">
        ${tap ? `<div class="tap" style="left:${tap.x * ech}px;top:${(tap.y - h) * ech}px"></div>` : ""}</div>
        <div class="pied">oxafit.app</div>
`;
    }
    await p.setContent(`<html><head><style>${css}</style></head><body>${html}</body></html>`); await p.waitForTimeout(150);
    if (img !== "fin") await p.evaluate(() => {
      const t = document.getElementById("t"), s = document.getElementById("s"), e = document.getElementById("e");
      let y = t.getBoundingClientRect().bottom;
      if (s) { s.style.top = (y + 22) + "px"; y = s.getBoundingClientRect().bottom; }
      const dispo = 1920 - 190 - (y + 60), h = e.getBoundingClientRect().height;
      if (h > dispo) { e.style.height = dispo + "px"; e.style.top = (y + 60) + "px"; }
      else e.style.top = (y + 60 + (dispo - h) / 2 * 0.5) + "px";
    });
    await p.screenshot({ path: `${S}/scenes/${v}-${i + 1}.png` });
  }
}
await b.close();
