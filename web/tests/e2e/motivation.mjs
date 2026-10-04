/* Motivation : série de semaines, badges notés sans fête au premier lancement,
   bilan enrichi (comparaison, semaine), puis un badge fêté après le bilan.
   CAPTURES=dossier pour garder des captures. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8809);
const U = "http://localhost:8809";
const deux = (n) => String(n).padStart(2, "0");
const jour = (d) => `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
const lundi = new Date(); lundi.setHours(12, 0, 0, 0); lundi.setDate(lundi.getDate() - ((lundi.getDay() + 6) % 7));
const j = (semaines, jours) => { const d = new Date(lundi); d.setDate(d.getDate() - 7 * semaines + jours); return jour(d); };
const L = (d, s = "L|0") => ({ d, s, nom: "Push", vol: 1000, ser: 3, ex: { dc: [70, 1000, 60, 8, 3] } });
const HIST = [L(j(4, 0)), L(j(4, 2)), L(j(3, 0)), L(j(3, 2)), L(j(2, 0)), L(j(2, 2)), L(j(1, 0)), L(j(1, 2)), L(jour(new Date()), "L|1")];
const etat = {
  A: { objectif: 0, materiel: 0, acc: [], objHebdo: 2 }, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null,
  SEANCES: [{ nom: "Push", ex: [{ id: "dc", s: 3, r: 8, p: "2 min" }] }, { nom: "Autre", ex: [{ id: "sq", s: 3, r: 8, p: "2 min" }] }],
  wk: 0, day: 0, FINI: false, HIST, ts: Date.now(),
};
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, serviceWorkers: "block" });
await ctx.addInitScript((s) => { if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); sessionStorage.vu = 1; } }, etat);
await ctx.route(/supabase\.co/, (r) => r.abort());
const pg = await ctx.newPage();
const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };
const etatLu = () => pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")));
const cap = async (n) => { if (process.env.CAPTURES) await pg.screenshot({ path: `${process.env.CAPTURES}/${n}.png` }); };

await pg.goto(U + "/entrainement/");
await pg.getByText(/semaines d'affilée/).waitFor();
ok(await pg.getByText("4 semaines d'affilée").isVisible(), "série : 4 semaines d'affilée");
ok(await pg.getByText("1/2 cette semaine").isVisible(), "1 séance sur 2 cette semaine");
await pg.waitForTimeout(600);
ok(await pg.getByText("Nouveau badge").count() === 0, "premier lancement : pas de fête pour les badges déjà mérités");
const e0 = await etatLu();
ok(e0.A.badges?.s1 && e0.A.badges?.w4 && !e0.A.badges?.s10, "badges déjà mérités notés (s1, w4)");
await cap("entrainement");

// séance « Push » : tout valider → bilan enrichi
await pg.getByText("Push", { exact: true }).click();
await pg.waitForURL(/seance\/\?l=0/);
await pg.waitForTimeout(1000);
await pg.locator('[id="ex-L|0|0"] button[aria-expanded]').first().click();
await pg.getByRole("button", { name: "Tout valider" }).click();
await pg.getByText("Séance terminée").waitFor({ timeout: 5000 });
await pg.waitForTimeout(1500);
ok(await pg.getByText(/% de tonnage/).isVisible(), "bilan : comparaison avec la dernière fois");
ok(await pg.getByText("Objectif de la semaine atteint").isVisible(), "bilan : objectif de la semaine atteint");
ok(await pg.getByText("Nouveau badge").count() === 0, "le badge attend la fin du bilan");
await cap("bilan");
await pg.getByRole("button", { name: "Terminer" }).click();
await pg.getByText("Nouveau badge").waitFor({ timeout: 4000 }).catch(() => {});
await pg.waitForTimeout(900);
await cap("badge");
const fetes = [];
while (await pg.getByText("Nouveau badge").isVisible().catch(() => false)) {
  fetes.push(await pg.getByRole("dialog").locator("h2").textContent());
  await pg.getByRole("button", { name: "Super" }).click();
  await pg.waitForTimeout(700);
}
ok(fetes.includes("Lancé"), `badges fêtés un par un : ${fetes.join(", ")}`);
const e1 = await etatLu();
ok(!!e1.A.badges.s10, "badge noté");

// Progrès : badges et réglage de l'objectif
await pg.goto(U + "/progres/");
await pg.getByText(/^Badges · \d+ sur \d+/).waitFor();
ok(await pg.getByText(/Joker du mois/).isVisible(), "joker affiché");
await pg.getByRole("button", { name: "Objectif : plus" }).click();
await pg.waitForTimeout(200);
ok((await etatLu()).A.objHebdo === 3, "objectif réglé à 3 par semaine");
await pg.getByRole("button", { name: /Club des 100 · squat/ }).click();
ok(await pg.getByRole("dialog").getByText(/sur 100/).isVisible(), "badge à venir : progression affichée");
await pg.keyboard.press("Escape");

// reprise après une longue pause
await pg.evaluate(() => {
  const s = JSON.parse(localStorage.getItem("palier.state.v1"));
  s.HIST = s.HIST.map((l) => ({ ...l, d: "2025-01-0" + (1 + (l.d.charCodeAt(9) % 8)) }));
  localStorage.setItem("palier.state.v1", JSON.stringify(s));
});
await pg.goto(U + "/entrainement/");
await pg.getByText("Content de te revoir").waitFor({ timeout: 4000 }).catch(() => {});
ok(await pg.getByText("Content de te revoir").isVisible(), "reprise : message d'encouragement");

console.log("erreurs:", JSON.stringify(errs));
await ctx.close(); await b.close(); srv.close();
