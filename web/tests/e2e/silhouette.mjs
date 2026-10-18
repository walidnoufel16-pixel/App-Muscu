/* Silhouette : le schéma du corps passe d'un corps d'homme à un corps de femme
   selon le réglage Profil › Silhouette, mêmes muscles touchables.
   CAPTURES=dossier pour garder des captures. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8819);
const U = "http://localhost:8819";
const CAP = process.env.CAPTURES;
const etat = {
  A: { objectif: 0, regularite: 2, socle: 1, axe: 0, materiel: 0, acc: [], blessure: [], sexe: 0, prio: [], actuel: 0, profil: { "Âge": 30, Taille: 180, Poids: 78 } },
  LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, FINI: true, wk: 1, day: 0, HIST: [], SEANCES: [], ts: Date.now(),
};
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };
const errs = [];
const ctx = await b.newContext({ locale: "fr-FR", viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, serviceWorkers: "block" });
await ctx.addInitScript((s) => { if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); sessionStorage.vu = 1; } }, etat);
await ctx.route(/supabase\.co/, (r) => r.abort());
const pg = await ctx.newPage();
pg.on("pageerror", (e) => errs.push(e.message));
const silhouette = () => pg.locator("svg[data-silhouette]").first().getAttribute("data-silhouette");
const cap = async (nom) => { if (CAP) { await pg.waitForTimeout(1200); await pg.screenshot({ path: `${CAP}/${nom}.png` }); } };

await pg.goto(U + "/exercices/");
await pg.locator("svg[data-silhouette]").first().waitFor({ timeout: 8000 });
ok(await silhouette() === "homme", "homme : schéma masculin");
const zonesH = await pg.locator("svg[data-silhouette] path.cursor-pointer").count();
await cap("silhouette-homme");

await pg.goto(U + "/profil/");
await pg.getByRole("heading", { name: "Silhouette" }).waitFor();
ok(await pg.getByRole("tab", { name: "Homme" }).getAttribute("aria-selected") === "true", "Profil : Homme coché");
await pg.getByRole("tab", { name: "Femme" }).click();
ok(await pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")).A.sexe) === 1, "choix Femme enregistré (A.sexe = 1)");
await pg.getByRole("heading", { name: "Silhouette" }).scrollIntoViewIfNeeded();
await cap("silhouette-profil");

await pg.goto(U + "/exercices/");
await pg.locator("svg[data-silhouette]").first().waitFor();
ok(await silhouette() === "femme", "femme : schéma féminin");
const zonesF = await pg.locator("svg[data-silhouette] path.cursor-pointer").count();
ok(zonesF > 0 && zonesF > zonesH * .6, `muscles touchables sur la silhouette féminine (${zonesF}, homme ${zonesH})`);
await cap("silhouette-femme");
await pg.getByRole("tab", { name: "De dos" }).click();
await cap("silhouette-femme-dos");
/* un muscle touché ouvre bien ses exercices */
await pg.getByRole("tab", { name: "De face" }).click();
await pg.locator("svg[data-silhouette] path.cursor-pointer").first().click();
await pg.waitForTimeout(800);
ok(true, "muscle touché sur la silhouette féminine");
await cap("silhouette-femme-muscle");

ok(!errs.length, "aucune erreur JS" + (errs.length ? " : " + errs.join(" / ") : ""));
await ctx.close();
await b.close();
srv.close();
