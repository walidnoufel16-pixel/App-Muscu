/* Carrousels Instagram (et mode photo TikTok) en 1080×1350, à partir des captures de l'app (captures.mjs).
   Usage (depuis web/, le script copié dans tests/e2e/) :
     cp ../outils/reseaux/carrousels.mjs tests/e2e/_carrousels.mjs
     PACK=/tmp/pack SORTIE=../docs/reseaux/semaine-N NODE_PATH=$(npm root -g) node tests/e2e/_carrousels.mjs [nom …] ; rm tests/e2e/_carrousels.mjs
   Sans nom : tous les carrousels du tableau C (attention à ne pas réécrire un carrousel déjà publié).
   Le tableau C : un carrousel = 6 slides.
     { couv: 1, t, s, img: [capture, haut, bas] }  couverture = la promesse, avec un bout d'écran de l'app (facultatif)
     { couv: 1, k, t, s }  sans img : couverture texte seul, très grande, centrée. À préférer (stats du 8 novembre
       2026) : une phrase vécue ou une tension, lisible en miniature de grille. k = petite étiquette facultative.
     { n: "01", t, l: [puces] }  ou  { n, t, tab: [[libellé, valeur]], s2 }  une idée par slide
     { fin: 1, t, s, img: [capture, haut, bas] }  Oxa le fait pour toi + capture + « Lien dans la bio »
   haut et bas en px CSS de la capture (390 × 844). Espaces insécables avant ? ! : ; % ajoutées automatiquement.
   Regarde chaque slide produite : rien de coupé, pas de mot seul sur une ligne. */
import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";
// dossier de travail : brut/ (captures de l'app)
const S = process.env.PACK || "/tmp/pack";
// lancé depuis web/ ; SORTIE = dossier de la semaine, par ex. ../docs/reseaux/semaine-2
const O = process.env.SORTIE || `${process.cwd()}/../docs/reseaux/semaine-1`;
const LOGO = readFileSync(`${process.cwd()}/../docs/reseaux/photo-profil-oxa.png`).toString("base64");
const nb = (t = "") => t.replace(/ ([?!:;%»])/g, "&nbsp;$1").replace(/« /g, "«&nbsp;");
const ecran = (f, h, bas, cl = "") => { const e = 860 / 390; return `<div class="ecran ${cl}" style="height:${(bas - h) * e}px"><img src="data:image/png;base64,${readFileSync(`${S}/brut/${f}.png`).toString("base64")}" style="margin-top:${-h * e}px"></div>`; };
// Les carrousels de la semaine 1 (compte démo « Alex »). Réécris le contenu pour chaque nouveau carrousel.
const C = {
  "carrousel-1-progresser": [
    { couv: 1, t: "Ce qui fait <em>vraiment</em> progresser à la salle", s: "Et ce qui compte moins qu'on croit.", img: ["accueil", 105, 325] },
    { n: "01", t: "Savoir quoi faire <em>en arrivant</em>", l: ["Tu arrives avec tes exercices et tes charges, déjà prêts.", "Fini les 20 minutes à errer entre les machines.", "Tu notes chaque série : la prochaine fois, tu sais quoi battre."] },
    { n: "02", t: "Revenir <em>chaque semaine</em>", l: ["Vise 2 ou 3 séances par semaine,&nbsp;et&nbsp;tiens-les.", "Mieux vaut 6 semaines tenues qu'une semaine à fond, puis plus rien.", "Une semaine ratée ? Tu reprends lundi, sans rattraper."] },
    { n: "03", t: "Laisser <em>récupérer</em>", l: ["Un muscle travaillé : environ 2&nbsp;jours&nbsp;de&nbsp;repos.", "Jambes et dos, après une grosse séance : plutôt 3.", "Et une assiette prévue d'avance, avec des protéines à chaque repas."] },
    { n: "04", t: "Ce qui compte <em>moins</em> qu'on&nbsp;croit", l: ["Le programme parfait : le meilleur, c'est celui que tu tiens.", "Finir chaque série à l'échec.", "Compter tes séries au détail près."] },
    { fin: 1, t: "Oxa te dit quoi faire.<br><em>Toi, tu reviens.</em>", s: "Ta séance, tes muscles prêts, ta semaine tenue.", img: ["progres", 105, 312] },
  ],
  "carrousel-2-surcharge": [
    { couv: 1, k: "La règle de la double progression", t: "Bloqué<br>au <em>même poids</em><br>depuis des<br>semaines ?", s: "Quand ajouter des kilos, et combien." },
    { n: "01", t: "Choisis une <em>fourchette</em>", l: ["Par exemple 8 à 12 répétitions.", "Prends une charge que tu tiens 8 fois proprement.", "Garde 1 à 2 répétitions en réserve."] },
    { n: "02", t: "Ajoute des <em>répétitions</em>, pas des kilos", l: ["Même charge, une répétition de plus quand tu peux.", "Séance après séance : 8, 9, 10, 11, 12.", "La technique reste propre jusqu'au bout."] },
    { n: "03", t: "À 12 partout : <em>+2,5 kg</em>", l: ["Toutes tes séries à 12 ? Ajoute le plus petit palier.", "2,5 kg à la barre, 1 à 2 kg aux haltères.", "Et tu repars à 8 répétitions."] },
    { n: "04", t: "Après une pause : <em>redescends</em>", tab: [["10 jours sans l'exercice", "−10 %"], ["21 jours et plus", "−20 %"]], s2: "Puis la double progression reprend." },
    { fin: 1, t: "Oxa fait le calcul.<br><em>Et t'explique pourquoi.</em>", s: "Chaque charge proposée vient avec sa raison.", img: ["s0-dc-ouvert", 218, 472] },
  ],
};
const css = `*{margin:0;box-sizing:border-box}body{width:1080px;height:1350px;font-family:'Inter Display',Inter,sans-serif;overflow:hidden;position:relative}
.sombre{background:radial-gradient(120% 70% at 50% 0%,#17322f 0%,#0d0f13 55%,#0a0a0c 100%);color:#fff}.clair{background:#f2f2f4;color:#0a0a0c}
em{font-style:normal;color:#2dd4bf}.clair em{color:#0d9488}
.marque{position:absolute;top:70px;left:80px;display:flex;align-items:center;gap:18px;font-size:34px;font-weight:700}.marque img{width:64px;border-radius:15px}
.page{position:absolute;top:82px;right:80px;font-size:30px;color:#a1a1aa;font-weight:600}
h1{font-size:96px;line-height:1.05;font-weight:800;letter-spacing:-2.5px}h2{font-size:74px;line-height:1.08;font-weight:800;letter-spacing:-1.8px}
.num{font-size:40px;font-weight:800;color:#0d9488;margin-bottom:22px}
.bloc{position:absolute;left:80px;right:80px;top:250px}.centre{top:0;bottom:120px;display:flex;flex-direction:column;justify-content:center}
ul{list-style:none;margin-top:64px;display:flex;flex-direction:column;gap:30px}li{font-size:46px;line-height:1.3;padding-left:52px;position:relative;color:#3f3f46}li:before{content:"";position:absolute;left:0;top:18px;width:22px;height:22px;border-radius:50%;background:#2dd4bf}
.tab{margin-top:64px;background:#fff;border-radius:36px;overflow:hidden}.tab div{display:flex;justify-content:space-between;padding:40px 44px;font-size:48px;border-top:2px solid #ececf0}.tab div:first-child{border-top:0}.tab b{color:#0d9488}
.s2{margin-top:30px;font-size:38px;line-height:1.3;color:#71717a}
.glisse{position:absolute;bottom:72px;right:80px;font-size:32px;font-weight:700;color:#0d9488}.sombre .glisse{color:#2dd4bf}
.couv-ecran{position:absolute;left:110px;right:110px;top:180px;}.couv-ecran .ecran{width:auto;margin:0;box-shadow:0 30px 90px rgba(0,0,0,.6),0 0 0 2px rgba(255,255,255,.1)}
.etiq{align-self:flex-start;font-size:36px;font-weight:800;color:#0a0a0c;background:#2dd4bf;padding:12px 30px;border-radius:999px;margin-bottom:44px}.trait{width:220px;height:14px;border-radius:7px;background:#2dd4bf;margin-top:48px}
.s{margin-top:34px;font-size:44px;color:#a1a1aa;line-height:1.3}
.ecran{margin:56px auto 0;width:860px;border-radius:40px;overflow:hidden;box-shadow:0 30px 90px rgba(0,0,0,.5)}.ecran img{width:100%;display:block}
.cta{position:absolute;bottom:80px;left:80px;right:80px;display:flex;justify-content:space-between;align-items:center;font-size:36px;font-weight:700}.cta span{background:#fff;color:#0a0a0c;padding:20px 40px;border-radius:999px}`;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const p = await b.newPage({ viewport: { width: 1080, height: 1350 } });
const noms = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(C);
for (const nom of noms) {
  const sl = C[nom];
  mkdirSync(`${O}/${nom}`, { recursive: true });
  for (let i = 0; i < sl.length; i++) {
    const x = sl[i], marque = `<div class="marque"><img src="data:image/png;base64,${LOGO}">Oxa</div><div class="page">${i + 1}/${sl.length}</div>`;
    let body;
    if (x.couv && !x.img) body = `<body class="sombre">${marque}<div class="bloc centre" style="bottom:90px">${x.k ? `<div class="etiq">${nb(x.k)}</div>` : ""}<h1 style="font-size:116px;letter-spacing:-3.5px">${nb(x.t)}</h1><div class="trait"></div><p class="s" style="font-size:50px;color:#c9c9d1">${nb(x.s)}</p></div><div class="cta"><div style="color:#71717a">@oxafit.app</div></div><div class="glisse">Glisse →</div></body>`;
    else if (x.couv) body = `<body class="sombre">${marque}${x.img ? `<div class="couv-ecran">${ecran(...x.img)}</div>` : ""}<div class="bloc" style="top:auto;bottom:150px"><h1>${nb(x.t)}</h1><p class="s">${nb(x.s)}</p></div><div class="cta"><div style="color:#71717a">@oxafit.app</div></div><div class="glisse">Glisse →</div></body>`;
    else if (x.fin) body = `<body class="sombre">${marque}<div class="bloc" style="top:190px"><h2>${nb(x.t)}</h2><p class="s" style="font-size:40px;margin-top:22px">${nb(x.s)}</p>${ecran(...x.img)}</div><div class="cta"><div style="color:#a1a1aa">Lien dans la bio</div><span>oxafit.app</span></div></body>`;
    else body = `<body class="clair">${marque}<div class="bloc centre"><div class="num">${x.n}</div><h2>${nb(x.t)}</h2>${x.l ? `<ul>${x.l.map((y) => `<li>${nb(y)}</li>`).join("")}</ul>` : ""}${x.tab ? `<div class="tab">${x.tab.map(([a, c]) => `<div><span>${nb(a)}</span><b>${nb(c)}</b></div>`).join("")}</div><p class="s2">${nb(x.s2)}</p>` : ""}</div>${i === sl.length - 2 ? `<div class="glisse">💾 Enregistre-le</div>` : `<div class="glisse">→</div>`}</body>`;
    await p.setContent(`<html><head><style>${css}</style></head>${body}</html>`); await p.waitForTimeout(120);
    await p.screenshot({ path: `${O}/${nom}/${i + 1}.png` });
  }
}
await b.close();
