import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";
// dossier de travail : brut/ (captures de l'app), scenes/ (plans générés)
const S = process.env.PACK || "/tmp/pack";
// lancé depuis web/ ; SORTIE = dossier de la semaine, par ex. ../docs/reseaux/semaine-2
const O = process.env.SORTIE || `${process.cwd()}/../docs/reseaux/semaine-1`;
const LOGO = readFileSync(`${process.cwd()}/../docs/reseaux/photo-profil-oxa.png`).toString("base64");
const ecran = (f, h, bas) => { const e = 860 / 390; return `<div class="ecran" style="height:${(bas - h) * e}px"><img src="data:image/png;base64,${readFileSync(`${S}/brut/${f}.png`).toString("base64")}" style="margin-top:${-h * e}px"></div>`; };
// Exemple : les carrousels de la semaine 1. Réécris le contenu pour chaque nouveau carrousel.
const C = {
  "carrousel-1-series": [
    { couv: 1, t: "Combien de séries par muscle <em>chaque semaine</em> ?", s: "La réponse dépend de ton niveau. Glisse →" },
    { n: "01", t: "Compte seulement les séries <em>difficiles</em>", l: ["Une série qui compte s'arrête à 1 à 3 répétitions de l'échec.", "L'échauffement ne compte pas.", "Un exercice compte pour son muscle principal, et un peu pour les autres."] },
    { n: "02", t: "Les repères <em>par niveau</em>", tab: [["Débutant", "8 séries"], ["Régulier", "12 séries"], ["Avancé", "16 séries"]], s2: "par muscle et par semaine, pour progresser sans t'épuiser" },
    { n: "03", t: "Coupe-les en <em>2 séances</em>", l: ["12 séries de pecs ? Mieux vaut 2 × 6 qu'une seule séance à 12.", "Chaque muscle travaillé 2 fois par semaine progresse plus vite.", "Laisse 48 h entre deux séances du même muscle."] },
    { n: "04", t: "Plus n'est pas <em>toujours</em> mieux", l: ["Tes charges baissent d'une semaine à l'autre ?", "Tu es courbaturé avant chaque séance ?", "Retire 2 à 4 séries par muscle pendant une semaine."] },
    { fin: 1, t: "Oxa compte <em>pour toi</em>", s: "Tes séries par muscle, face à ta cible, chaque lundi.", img: ["bilan", 330, 610] },
  ],
  "carrousel-2-surcharge": [
    { couv: 1, t: "Prendre du poids à la salle <em>sans se blesser</em>", s: "La méthode de la double progression. Glisse →" },
    { n: "01", t: "Choisis une <em>fourchette</em>", l: ["Par exemple 8 à 12 répétitions.", "Prends une charge que tu tiens 8 fois proprement.", "Garde 1 à 2 répétitions en réserve."] },
    { n: "02", t: "Ajoute des <em>répétitions</em>, pas des kilos", l: ["Même charge, une répétition de plus quand tu peux.", "Séance après séance : 8, 9, 10, 11, 12.", "La technique reste propre jusqu'au bout."] },
    { n: "03", t: "À 12 partout : <em>+2,5 kg</em>", l: ["Toutes tes séries à 12 ? Ajoute le plus petit palier.", "2,5 kg à la barre, 1 à 2 kg aux haltères.", "Et tu repars à 8 répétitions."] },
    { n: "04", t: "Après une pause : <em>redescends</em>", tab: [["10 jours sans l'exercice", "−10 %"], ["21 jours et plus", "−20 %"]], s2: "Tu retrouves ton niveau en 2 à 3 séances, sans te blesser." },
    { fin: 1, t: "Oxa fait le calcul. <em>Et t'explique pourquoi.</em>", s: "Chaque charge proposée vient avec sa raison.", img: ["s1-rw-ouvert", 96, 330] },
  ],
};
const css = `*{margin:0;box-sizing:border-box}body{width:1080px;height:1350px;font-family:'Inter Display',Inter,sans-serif;overflow:hidden;position:relative}
.sombre{background:radial-gradient(120% 70% at 50% 0%,#17322f 0%,#0d0f13 55%,#0a0a0c 100%);color:#fff}.clair{background:#f2f2f4;color:#0a0a0c}
em{font-style:normal;color:#2dd4bf}.clair em{color:#0d9488}
.marque{position:absolute;top:70px;left:80px;display:flex;align-items:center;gap:18px;font-size:34px;font-weight:700}.marque img{width:64px;border-radius:15px}
.page{position:absolute;top:82px;right:80px;font-size:30px;color:#a1a1aa;font-weight:600}
h1{font-size:96px;line-height:1.05;font-weight:800;letter-spacing:-2.5px}h2{font-size:74px;line-height:1.08;font-weight:800;letter-spacing:-1.8px}
.num{font-size:40px;font-weight:800;color:#0d9488;margin-bottom:22px}
.bloc{position:absolute;left:80px;right:80px;top:260px}
ul{list-style:none;margin-top:64px;display:flex;flex-direction:column;gap:30px}li{font-size:42px;line-height:1.3;padding-left:52px;position:relative;color:#3f3f46}li:before{content:"";position:absolute;left:0;top:18px;width:22px;height:22px;border-radius:50%;background:#2dd4bf}
.tab{margin-top:64px;background:#fff;border-radius:36px;overflow:hidden}.tab div{display:flex;justify-content:space-between;padding:38px 44px;font-size:46px;border-top:2px solid #ececf0}.tab div:first-child{border-top:0}.tab b{color:#0d9488}
.s2{margin-top:30px;font-size:36px;color:#71717a}
.s{margin-top:34px;font-size:44px;color:#a1a1aa;line-height:1.3}
.ecran{margin:56px auto 0;width:860px;border-radius:40px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.5)}.ecran img{width:100%;display:block}
.cta{position:absolute;bottom:80px;left:80px;right:80px;display:flex;justify-content:space-between;align-items:center;font-size:36px;font-weight:700}.cta span{background:#fff;color:#0a0a0c;padding:20px 40px;border-radius:999px}`;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
for (const [nom, sl] of Object.entries(C)) {
  mkdirSync(`${O}/${nom}`, { recursive: true });
  for (let i = 0; i < sl.length; i++) {
    const x = sl[i], marque = `<div class="marque"><img src="data:image/png;base64,${LOGO}">Oxa</div><div class="page">${i + 1}/${sl.length}</div>`;
    let body;
    if (x.couv) body = `<body class="sombre">${marque}<div class="bloc" style="top:auto;bottom:220px"><h1>${x.t}</h1><p class="s">${x.s}</p></div><div class="cta"><div style="color:#71717a">@oxafit.app</div></div></body>`;
    else if (x.fin) body = `<body class="sombre">${marque}<div class="bloc" style="top:200px"><h2>${x.t}</h2><p class="s" style="font-size:38px;margin-top:22px">${x.s}</p>${ecran(...x.img)}</div><div class="cta"><div style="color:#a1a1aa">Lien dans la bio</div><span>oxafit.app</span></div></body>`;
    else body = `<body class="clair">${marque}<div class="bloc"><div class="num">${x.n}</div><h2>${x.t}</h2>${x.l ? `<ul>${x.l.map((y) => `<li>${y}</li>`).join("")}</ul>` : ""}${x.tab ? `<div class="tab">${x.tab.map(([a, c]) => `<div><span>${a}</span><b>${c}</b></div>`).join("")}</div><p class="s2">${x.s2}</p>` : ""}</div></body>`;
    await p.setContent(`<html><head><style>${css}</style></head>${body}</html>`); await p.waitForTimeout(120);
    await p.screenshot({ path: `${O}/${nom}/${i + 1}.png` });
  }
}
await b.close();
