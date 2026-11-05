/* Agenda : « Recommandation d'Oxa » propose la séance tout de suite (full body sans historique,
   la proposition du jour avec historique), et « Programmer pour plus tard » crée le prévu.
   CAPTURES=dossier pour garder des captures. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8811);
const U = "http://localhost:8811";
const deux = (n) => String(n).padStart(2, "0");
const jour = (d) => `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
const il = (n) => { const d = new Date(); d.setHours(12); d.setDate(d.getDate() - n); return jour(d); };
const base = { A: { objectif: 0, materiel: 0, acc: [] }, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, SEANCES: [], wk: 0, day: 0, FINI: false, HIST: [], ts: Date.now() };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };

async function page(etat, sombre) {
  const ctx = await b.newContext({ locale: "fr-FR", viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, serviceWorkers: "block", colorScheme: sombre ? "dark" : "light" });
  await ctx.addInitScript((s) => { if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); sessionStorage.vu = 1; } }, etat);
  await ctx.route(/supabase\.co/, (r) => r.abort());
  const pg = await ctx.newPage();
  pg.errs = []; pg.on("pageerror", (e) => pg.errs.push(e.message));
  await pg.goto(U + "/entrainement/");
  await pg.getByText("Mon agenda").waitFor();
  await pg.getByRole("button", { name: "Programmer" }).first().click();
  await pg.getByText("Recommandation d'Oxa").waitFor();
  return pg;
}
const cap = async (pg, n) => { if (process.env.CAPTURES) await pg.screenshot({ path: `${process.env.CAPTURES}/${n}.png` }); };

// sans historique
let pg = await page(base, true);
ok(await pg.getByText("Full body pour démarrer").isVisible(), "sous-titre : Full body pour démarrer");
await cap(pg, "liste-sombre");
await pg.getByText("Recommandation d'Oxa").click();
await pg.getByText("Je te recommande : full body").waitFor();
ok(true, "toucher → la proposition s'affiche");
await cap(pg, "reco-sombre");
await pg.getByRole("button", { name: /Créer cette séance/ }).click();
await pg.waitForURL(/assistant\/?\?m=/);
ok(/m=pec/.test(pg.url()), "Créer cette séance → assistant avec les muscles " + pg.url().split("?")[1]);
ok(!pg.errs.length, "aucune erreur JS " + pg.errs.join(" | "));
await pg.context().close();

// avec historique : pecs/triceps hier
const H = [{ d: il(1), s: "L|0", nom: "Push", vol: 1000, ser: 10, ex: { dc: [70, 1000, 60, 8, 4], dh: [30, 500, 60, 10, 3], tri: [20, 300, 60, 10, 3] } }];
pg = await page({ ...base, HIST: H }, false);
await pg.getByText("Recommandation d'Oxa").click();
const t1 = await pg.getByRole("heading", { name: /Je te recommande/ }).textContent();
ok(!/pecs/i.test(t1), "avec historique : " + t1);
await cap(pg, "reco-clair");
if (await pg.getByRole("button", { name: "Autre idée" }).count()) {
  await pg.getByRole("button", { name: "Autre idée" }).click();
  ok((await pg.getByRole("heading", { name: /Je te recommande/ }).textContent()) !== t1, "Autre idée change la proposition");
}
await pg.getByRole("button", { name: "Programmer pour plus tard" }).click();
await pg.getByRole("button", { name: "Programmer", exact: true }).click();
await pg.waitForTimeout(500);
const e = await pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")));
ok(e.AGENDA?.some((p) => p.quoi.t === "reco"), "Programmer pour plus tard → prévu reco");
ok(!pg.errs.length, "aucune erreur JS " + pg.errs.join(" | "));
await b.close(); srv.close();
