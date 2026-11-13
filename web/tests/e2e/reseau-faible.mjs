/* Réseau qui traîne (une barre, une salle en sous-sol) : l'app ne doit pas attendre le réseau
   indéfiniment. Les pages et les données de navigation viennent du cache après quelques secondes. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
let delai = 0;
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8861, { lent: () => delai });
const U = "http://localhost:8861";
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };
const ctx = await b.newContext({ locale: "fr-FR", viewport: { width: 393, height: 852 } });
await ctx.addInitScript(() => { if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify({ A: { objectif: 0, accueil: true, miseEnRoute: true, objHebdo: 3 }, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, SEANCES: [], wk: 0, day: 0, FINI: false, HIST: [{ d: "2026-11-02", s: "L|0", nom: "Push", vol: 1, ser: 1, ex: { dc: [60, 1, 1, 8, 3] } }], ts: Date.now() })); localStorage.setItem("palier.pseudo.v1", "W"); localStorage.setItem("repere.visite", "1"); sessionStorage.vu = 1; } });
await ctx.route(/supabase\.co/, (r) => r.abort());
const pg = await ctx.newPage();
await pg.goto(U + "/entrainement/");
await pg.waitForFunction(() => navigator.serviceWorker.ready.then(() => true), null, { timeout: 30000 });
await pg.waitForTimeout(5000);
await pg.reload(); await pg.waitForTimeout(1500); // page contrôlée par le service worker
delai = 30000;
let t0 = Date.now();
await pg.getByRole("link", { name: /Progrès/ }).first().click().catch(() => pg.getByText("Progrès").last().click());
const vu = await pg.getByRole("heading", { name: "Progrès" }).first().waitFor({ timeout: 12000 }).then(() => true, () => false);
ok(vu && Date.now() - t0 < 8000, `réseau qui traîne : l'onglet Progrès s'ouvre (${Date.now() - t0} ms)`);
/* le cas vu sur téléphone : « Programmer une séance » › « Je choisis les muscles » */
await pg.getByRole("link", { name: /Entraînement/ }).first().click().catch(() => {});
await pg.getByRole("button", { name: /^Programmer( une séance)?$/ }).first().waitFor({ timeout: 10000 });
await pg.getByRole("button", { name: /^Programmer( une séance)?$/ }).first().click();
await pg.getByRole("dialog").getByText("Je choisis les muscles").click();
t0 = Date.now();
const vu3 = await pg.getByText("Créer une séance pour moi").first().waitFor({ timeout: 15000 }).then(() => true, () => false);
ok(vu3 && Date.now() - t0 < 9000, `réseau qui traîne : « Je choisis les muscles » ouvre l'assistant (${Date.now() - t0} ms)`);
t0 = Date.now();
await pg.goto(U + "/repas/", { timeout: 15000 }).catch(() => {});
const vu2 = await pg.getByRole("heading", { level: 1 }).first().waitFor({ timeout: 12000 }).then(() => true, () => false);
ok(vu2 && Date.now() - t0 < 8000, `réseau qui traîne : une page rechargée vient du cache (${Date.now() - t0} ms)`);
await b.close(); srv.close(); process.exit();
