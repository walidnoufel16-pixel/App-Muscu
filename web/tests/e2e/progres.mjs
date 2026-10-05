/* Écran Progrès : historique de 10 semaines (courbes, calendrier, carte du corps,
   records, poids), puis une série validée qui s'ajoute à l'historique en direct,
   et un ancien état sans historique reconstruit depuis le journal.
   CAPTURES=dossier pour garder des captures, SOMBRE=1 pour le thème sombre. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8807);
const U = "http://localhost:8807";
const deux = (n) => String(n).padStart(2, "0");
const jour = (t) => { const d = new Date(t); return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`; };
const J = 864e5, maint = Date.now();
const HIST = [];
for (let w = 9; w >= 0; w--) {
  for (const [dj, nom, ex] of [
    [w * 7 + 5, "Push", { dc: [0, 0, 60 + (9 - w) * 2.5, 8], dmh: [0, 0, 20 + (9 - w), 10], dipt: [0, 0, 0, 10 + (9 - w)] }],
    [w * 7 + 3, "Jambes", { sq: [0, 0, 80 + (9 - w) * 5, 6], fe: [0, 0, 16, 10] }],
  ]) {
    if (dj < 1) continue;
    const L = {};
    let vol = 0, ser = 0;
    for (const [id, [, , v, r]] of Object.entries(ex)) {
      const rm = id === "dipt" ? 0 : Math.round(v * (1 + Math.min(r, 12) / 30) * 10) / 10, vo = id === "dipt" ? 0 : v * r * 3;
      L[id] = [rm, vo, v, r, 3]; vol += vo; ser += 3;
    }
    HIST.push({ d: jour(maint - dj * J), s: nom === "Push" ? "L|0" : "L|1", nom, vol, ser, ex: L, min: 50 });
  }
}
HIST.sort((a, b) => (a.d < b.d ? -1 : 1));
const CARDIO = [3, 10, 12, 20, 26, 40].map((d, i) => ({ nom: "Rameur", f: i % 2 ? "tabata" : "norvegien", m: "ram", min: 20 + i * 3, effort: 7, ts: maint - d * J }));
const etat = {
  A: { objectif: 0, materiel: 0, acc: [], profil: { Poids: 80 }, poids: [[jour(maint - 50 * J), 81.4], [jour(maint - 30 * J), 80.6], [jour(maint - 9 * J), 79.9]] },
  LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null,
  SEANCES: [{ nom: "Push", ex: [{ id: "dc", s: 3, r: 8, p: "2 min" }] }, { nom: "Jambes", ex: [{ id: "sq", s: 3, r: 6, p: "2 min" }] }],
  wk: 0, day: 0, FINI: false, HIST, CARDIO, ts: Date.now(),
};
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, serviceWorkers: "block", colorScheme: process.env.SOMBRE ? "dark" : "light" });
await ctx.addInitScript((s) => { if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); sessionStorage.vu = 1; } }, etat);
await ctx.route(/supabase\.co/, (r) => r.abort());
const pg = await ctx.newPage();
const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };
const etatLu = () => pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")));
const cap = async (n) => { if (process.env.CAPTURES) await pg.screenshot({ path: `${process.env.CAPTURES}/${n}.png`, fullPage: true }); };
const deborde = () => pg.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);

await pg.goto(U + "/entrainement/");
await pg.locator("nav a").first().waitFor();
ok(await pg.locator("nav a").count() === 4, "quatre onglets");
await pg.locator("nav a", { hasText: "Progrès" }).click();
await pg.waitForURL(/\/progres\/$/);
await pg.getByRole("heading", { name: "Progrès" }).first().waitFor();
await pg.waitForTimeout(1200);
ok(await pg.locator('nav a[aria-current="page"]').textContent() === "Progrès", "onglet Progrès actif");
ok(await pg.getByText("Cette semaine", { exact: true }).isVisible(), "bloc Cette semaine");
ok(await pg.getByText(/jours d'entraînement/).isVisible(), "calendrier d'activité");
ok(await pg.getByText("Pectoraux", { exact: true }).isVisible(), "volume par muscle");
ok(await pg.getByText(/^Records · \d+/).isVisible(), "records listés");
ok(await pg.getByText("Squat barre").first().isVisible().catch(() => false) || await pg.getByText(/Squat/).first().isVisible(), "un record de squat");
ok(!(await deborde()), "aucun débordement horizontal (393 px)");
await cap("progres");

// changer d'exercice dans la courbe
await pg.locator("#par-exercice").click();
await pg.getByRole("dialog").getByText("Développé couché barre").click();
await pg.waitForTimeout(400);
ok(await pg.locator("#par-exercice").textContent().then((t) => t.includes("Développé couché barre")), "courbe : exercice choisi");
ok(await pg.getByText("1RM estimé (formule d'Epley)").isVisible(), "courbe en 1RM estimé");

// détail d'un jour
await pg.locator('button[aria-label*="musculation"]').last().click();
await pg.getByRole("dialog").waitFor();
ok(await pg.getByRole("dialog").getByText(/séries/).first().isVisible(), "détail du jour");
await pg.keyboard.press("Escape");
await pg.waitForTimeout(400);

// pesée
await pg.getByLabel("Poids du jour en kg").fill("79,4");
await pg.getByRole("button", { name: "Noter" }).click();
await pg.waitForTimeout(300);
const e1 = await etatLu();
ok(e1.A.poids.at(-1)[1] === 79.4 && e1.A.profil.Poids === 79, "pesée enregistrée");

// séance libre : une série validée s'ajoute à l'historique du jour
const avant = (await etatLu()).HIST.length;
await pg.goto(U + "/entrainement/seance/?l=0");
await pg.waitForSelector("#ex-L\\|0\\|0");
await pg.waitForTimeout(1000);
await pg.locator('[id="ex-L|0|0"] button[aria-expanded]').first().click();
await pg.getByRole("button", { name: /^Valider la série/ }).first().waitFor();
await pg.getByRole("button", { name: /^Valider la série/ }).first().click();
await pg.waitForTimeout(400);
const e2 = await etatLu();
const l = e2.HIST.find((x) => x.d === jour(Date.now()) && x.s === "L|0");
ok(e2.HIST.length === avant + 1 && l && l.ser === 1 && l.ex.dc, "série validée : ligne du jour ajoutée");
await pg.getByRole("button", { name: /^Valider la série/ }).first().click();
await pg.waitForTimeout(400);
ok((await etatLu()).HIST.find((x) => x.d === jour(Date.now()) && x.s === "L|0").ser === 2, "deuxième série : même ligne mise à jour");

// fiche : lien vers la progression
await pg.goto(U + "/exercices/");
await pg.getByRole("tab", { name: "Liste" }).click();
await pg.getByPlaceholder(/Rechercher/).fill("couché");
await pg.getByText("Développé couché barre", { exact: true }).first().click();
await pg.getByRole("button", { name: /Ma progression sur/ }).click();
await pg.waitForURL(/\/progres\/\?ex=dc/);
await pg.waitForTimeout(500);
ok(await pg.locator("#par-exercice").textContent().then((t) => t.includes("Développé couché barre")), "fiche → progression de l'exercice");

// ancien état sans historique : reconstruit depuis le journal
await pg.evaluate(() => {
  const s = JSON.parse(localStorage.getItem("palier.state.v1"));
  delete s.HIST;
  s.LOG = { "L|0|0": { done: true, feel: 1, ex: "dc", ts: Date.now() - 3 * 864e5, series: [{ v: 70, reps: 6, ok: true }] } };
  localStorage.setItem("palier.state.v1", JSON.stringify(s));
});
await pg.reload();
await pg.waitForTimeout(800);
ok(await pg.getByText(/^Records/).count() === 0 && await pg.getByText("Cette semaine", { exact: true }).isVisible(), "historique reconstruit depuis le journal");
ok((await pg.evaluate(() => JSON.stringify(localStorage.getItem("palier.state.v1")).length)) < 256 * 1024, "état sous la limite serveur");

console.log("erreurs:", JSON.stringify(errs));
await ctx.close(); await b.close(); srv.close();
