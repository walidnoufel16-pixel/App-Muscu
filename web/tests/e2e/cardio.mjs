/* Cardio guidé, de bout en bout, avec une horloge accélérée :
   Entraînement › Cardio › Fractionné › réglages › Démarrer › pause, passer, fin et bilan ;
   puis une séance cardio créée depuis l'assistant, rangée à part dans Mes séances.
   VIDEO=dossier pour filmer. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8805);
const U = "http://localhost:8805";
const etat = { A: { objectif: 0, regularite: 2, materiel: 0, acc: [] }, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, SEANCES: [], wk: 0, day: 0, FINI: false, ts: Date.now() };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: "block", colorScheme: process.env.SOMBRE ? "dark" : "light",
  ...(process.env.VIDEO ? { recordVideo: { dir: process.env.VIDEO, size: { width: 390, height: 844 } } } : {}),
});
await ctx.addInitScript((s) => { if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); sessionStorage.vu = 1; } }, etat);
await ctx.route(/supabase\.co/, (r) => r.abort());
const pg = await ctx.newPage();
const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };
const etatLu = () => pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")));
await pg.clock.install();
/* fait avancer l'horloge par petits pas, pour que l'écran (et la vidéo) suive */
const avancer = async (s) => { for (let i = 0; i < s; i++) { await pg.clock.runFor(1000); await pg.waitForTimeout(process.env.VIDEO ? 90 : 5); } };

await pg.goto(U + "/entrainement/");
await pg.getByRole("heading", { name: "Cardio" }).waitFor();
ok(true, "section Cardio dans Entraînement");
await pg.getByRole("button", { name: /Fractionné/ }).first().click();
await pg.waitForURL(/\/entrainement\/cardio\/\?f=fractionne/);
ok(await pg.locator('nav[aria-label="Navigation principale"]').count() === 0, "préparation : barre d'onglets masquée");
ok(await pg.getByRole("button", { name: "Entraînement" }).isVisible(), "retour libellé « Entraînement »");

// rameur, sans échauffement ni retour au calme, 2 tours d'effort 60 s / récupération 90 s
await pg.getByRole("button", { name: /Rameur/ }).click();
for (let i = 0; i < 5; i++) await pg.getByRole("button", { name: "Échauffement : moins" }).click();
for (let i = 0; i < 3; i++) await pg.getByRole("button", { name: "Retour au calme : moins" }).click();
while (!(await pg.getByRole("button", { name: "Tours : moins" }).isDisabled())) await pg.getByRole("button", { name: "Tours : moins" }).click();
await pg.waitForTimeout(300);
ok(await pg.getByRole("button", { name: /Démarrer · 4 min/ }).isVisible(), "durée totale recalculée (2 × 60 s + 90 s ≈ 4 min)");
await pg.getByRole("button", { name: /Démarrer/ }).click();
await pg.getByRole("timer").waitFor();
ok(await pg.getByText("Effort", { exact: true }).isVisible(), "minuteur : phase d'effort");
ok(await pg.getByText("1 / 2", { exact: true }).isVisible(), "tour 1 / 2");

await avancer(30);
const avantPause = await pg.locator(".num").filter({ hasText: /^0:\d\d$/ }).first().textContent();
await pg.getByRole("button", { name: "Pause" }).click();
await avancer(20);
const pendantPause = await pg.locator(".num").filter({ hasText: /^0:\d\d$/ }).first().textContent();
ok(avantPause === pendantPause, `pause : le chrono ne bouge pas (${avantPause})`);
await pg.getByRole("button", { name: "Reprendre" }).click();
await pg.getByRole("button", { name: "Passer la phase" }).click();
await pg.waitForTimeout(200);
ok(await pg.getByText("Récupération", { exact: true }).isVisible(), "passer : récupération");

await avancer(160);
await pg.getByText("Séance terminée").waitFor({ timeout: 5000 }).catch(() => {});
ok(await pg.getByText("Séance terminée").isVisible(), "fin : bilan affiché");
const e1 = await etatLu();
ok(e1.CARDIO?.length === 1 && e1.CARDIO[0].m === "ram" && e1.CARDIO[0].f === "fractionne", "séance enregistrée dans l'historique cardio");
await pg.waitForTimeout(process.env.VIDEO ? 1800 : 300);
await pg.getByRole("button", { name: "Terminer" }).click();
await pg.getByRole("button", { name: "Entraînement" }).click();
await pg.waitForURL(/\/entrainement\/$/);
ok(await pg.getByText(/dernière : fractionné, aujourd'hui/).isVisible(), "Entraînement : dernière séance cardio affichée");

// séance cardio créée depuis l'assistant, catégorie à part
await pg.getByText("Créer une séance cardio").click();
await pg.waitForURL(/\/entrainement\/assistant\/\?type=cardio/);
await pg.getByRole("button", { name: /Tabata/ }).click();
await pg.getByPlaceholder(/Tabata/).fill("Tabata du jeudi");
await pg.getByRole("button", { name: "Créer ma séance cardio" }).click();
await pg.waitForURL(/\/entrainement\/$/);
await pg.waitForTimeout(400);
const e2 = await etatLu();
ok(e2.SEANCES_CARDIO?.length === 1 && e2.SEANCES_CARDIO[0].f === "tabata", "séance cardio enregistrée à part");
ok(await pg.getByRole("heading", { name: "Cardio", level: 3 }).isVisible(), "Mes séances : groupe Cardio");
await pg.getByText("Tabata du jeudi", { exact: true }).click();
await pg.waitForURL(/\/entrainement\/cardio\/\?s=0/);
ok(await pg.getByRole("textbox", { name: "Nom de la séance" }).inputValue() === "Tabata du jeudi", "séance enregistrée : nom modifiable");

console.log("erreurs:", JSON.stringify(errs));
await ctx.close(); await b.close(); srv.close();
