/* Cardio guidé, de bout en bout, avec une horloge accélérée. Un seul chemin :
   Créer une séance pour moi › Cardio › réglages › Créer et démarrer › pause,
   passer, fin et bilan ; la séance est rangée dans le groupe Cardio de Mes séances.
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
await pg.getByRole("heading", { name: "Mes séances" }).waitFor();
ok(await pg.getByRole("heading", { name: "Cardio", exact: true }).count() === 0, "Entraînement : pas de rubrique Cardio à part");
ok(await pg.getByText("Créer une séance cardio").count() === 0, "Mes séances : pas de raccourci cardio");

// le seul chemin : Créer une séance pour moi › Cardio
await pg.getByText("Créer une séance pour moi").click();
await pg.waitForURL(/\/entrainement\/assistant\/$/);
await pg.getByRole("tab", { name: "Cardio" }).click();
await pg.getByRole("button", { name: /Rameur/ }).click();
for (let i = 0; i < 5; i++) await pg.getByRole("button", { name: "Échauffement : moins" }).click();
for (let i = 0; i < 3; i++) await pg.getByRole("button", { name: "Retour au calme : moins" }).click();
while (!(await pg.getByRole("button", { name: "Tours : moins" }).isDisabled())) await pg.getByRole("button", { name: "Tours : moins" }).click();
await pg.getByPlaceholder(/Fractionné/).fill("Rameur du mardi");
await pg.getByRole("button", { name: "Créer et démarrer" }).click();
await pg.waitForURL(/\/entrainement\/cardio\/\?s=0&go=1/);
await pg.getByRole("timer").waitFor();
ok(await pg.getByText("Effort", { exact: true }).isVisible(), "créer et démarrer : minuteur lancé, phase d'effort");
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
ok(e1.SEANCES_CARDIO?.length === 1 && e1.SEANCES_CARDIO[0].nom === "Rameur du mardi", "séance cardio enregistrée");
ok(e1.CARDIO?.length === 1 && e1.CARDIO[0].m === "ram", "séance faite ajoutée à l'historique");
await pg.waitForTimeout(process.env.VIDEO ? 1800 : 300);
await pg.getByRole("button", { name: "Terminer" }).click();

// retour : l'assistant a été remplacé, on revient à Entraînement
ok(await pg.getByRole("button", { name: "Entraînement" }).waitFor({ timeout: 3000 }).then(() => true, () => false), "retour libellé « Entraînement » (l'assistant n'est pas dans l'historique)");
await pg.getByRole("button", { name: "Entraînement" }).click();
await pg.waitForURL(/\/entrainement\/$/);
ok(await pg.getByRole("button", { name: /^Cardio 1/ }).isVisible(), "Mes séances : groupe Cardio");
await pg.getByText("Rameur du mardi", { exact: true }).click();
await pg.waitForURL(/\/entrainement\/cardio\/\?s=0$/);
ok(await pg.getByRole("textbox", { name: "Nom de la séance" }).inputValue() === "Rameur du mardi", "séance rouverte : nom modifiable");
ok(await pg.getByRole("button", { name: /Démarrer/ }).isVisible(), "séance rouverte : prête à démarrer");

// « Enregistrer » seul : retour à Entraînement
await pg.goto(U + "/entrainement/assistant/?type=cardio");
await pg.getByRole("button", { name: /Tabata/ }).click();
await pg.getByRole("button", { name: "Enregistrer", exact: true }).click();
await pg.waitForURL(/\/entrainement\/$/);
await pg.waitForTimeout(300);
ok((await etatLu()).SEANCES_CARDIO.length === 2, "enregistrer sans démarrer");

// nouveau format : 4×4 norvégien (10 min d'échauffement, puis 4 min d'effort)
await pg.goto(U + "/entrainement/assistant/?type=cardio");
await pg.getByRole("button", { name: /4×4 norvégien/ }).click();
await pg.getByRole("button", { name: "Créer et démarrer" }).click();
await pg.getByRole("timer").waitFor();
ok(await pg.getByText("Échauffement", { exact: true }).isVisible() && await pg.getByText("10:00").isVisible(), "4×4 : échauffement de 10 min");
await avancer(601);
ok(await pg.getByText("Effort", { exact: true }).isVisible() && await pg.getByText("RPE 8-9").isVisible(), "4×4 : effort de 4 min à RPE 8-9");
await pg.getByRole("button", { name: "Arrêter" }).click();
await pg.getByRole("button", { name: "Arrêter" }).last().click();
await pg.waitForTimeout(500);

// ancienne adresse de départ rapide
await pg.goto(U + "/entrainement/cardio/?f=tabata");
await pg.waitForURL(/\/entrainement\/assistant\/\?type=cardio/, { timeout: 5000 }).catch(() => {});
ok(/assistant\/\?type=cardio/.test(pg.url()), "ancienne adresse ?f= : vers l'assistant, côté Cardio");

console.log("erreurs:", JSON.stringify(errs));
await ctx.close(); await b.close(); srv.close();
