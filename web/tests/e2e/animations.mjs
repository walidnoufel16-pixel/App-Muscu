/* Parcours d'une séance du plan, filmé : séries validées, record, minuteur,
   enchaînement des exercices, bilan final ; puis l'ouverture d'une séance libre.
   VIDEO=dossier pour garder la vidéo, REDUIT=1 pour le mode « réduire les animations ». */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8804);
const etat = {
  A: { objectif: 0, regularite: 3, socle: 2, axe: 0, materiel: 0, acc: [], sexe: 0, sport: [], sportFreq: {} },
  LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null,
  SEANCES: [{ nom: "Épaules · Triceps", ex: [{ id: "dmh", s: 3, r: 10, p: "2 min" }, { id: "dipt", s: 3, r: 10, p: "2 min" }, { id: "el", s: 3, r: 12, p: "90 s" }] }],
  wk: 2, day: 0, FINI: true, ts: Date.now(),
};
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: "dark", serviceWorkers: "block",
  reducedMotion: process.env.REDUIT ? "reduce" : "no-preference",
  ...(process.env.VIDEO ? { recordVideo: { dir: process.env.VIDEO, size: { width: 390, height: 844 } } } : {}),
});
await ctx.addInitScript((s) => { if (!localStorage.getItem("palier.state.v1")) localStorage.setItem("palier.state.v1", JSON.stringify(s)); }, etat);
await ctx.route(/supabase\.co/, (r) => r.abort());
const pg = await ctx.newPage();
const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };

/* Historique des semaines 1 et 2 sur le premier exercice de la séance, pour qu'un record soit possible. */
await pg.goto("http://localhost:8804/entrainement/seance/");
await pg.waitForSelector("#ex-2\\|0\\|0");
await pg.evaluate(() => {
  const s = JSON.parse(localStorage.getItem("palier.state.v1")), ex = document.getElementById("ex-2|0|0").dataset.ex;
  for (const w of [0, 1]) s.LOG[`${w}|0|0`] = { done: true, v: 20, reps: 8, feel: 1, ex, ts: 1000 + w, series: [{ v: 20, reps: 8, ok: true }] };
  localStorage.setItem("palier.state.v1", JSON.stringify(s));
});
await pg.reload();
await pg.waitForTimeout(1200); // frise + cartes qui arrivent

const cartes = pg.locator('[id^="ex-2|0|"]');
const nb = await cartes.count();
ok(nb >= 3, `${nb} exercices dans la séance`);
await cartes.first().locator("button").first().click();
await pg.waitForTimeout(500);
const valides = () => pg.getByRole("button", { name: /^Valider la série/ });

// première série : charge montée au-dessus de l'historique → record
const champ = pg.getByRole("textbox", { name: /série 1$/ }).first();
await champ.fill("200"); await champ.blur();
await pg.waitForTimeout(600);
await valides().first().click();
await pg.waitForTimeout(900);
ok(await pg.getByText("Record", { exact: true }).isVisible().catch(() => false), "badge Record affiché");
ok(await pg.getByRole("timer").isVisible(), "minuteur de repos lancé");
await pg.getByRole("button", { name: "Régler le repos" }).click();
await pg.waitForTimeout(900);
ok(await pg.getByRole("button", { name: "Ajouter 15 secondes" }).isVisible(), "réglages ±15 s dépliés");
await pg.getByRole("button", { name: "Régler le repos" }).click();

// séries suivantes : l'exercice se termine, le suivant s'ouvre tout seul
while (await valides().count() && (await cartes.first().getByRole("button", { name: /^Valider la série/ }).count())) {
  await cartes.first().getByRole("button", { name: /^Valider la série/ }).first().click();
  await pg.waitForTimeout(450);
}
await pg.waitForTimeout(1300);
ok(await cartes.nth(1).locator("[aria-expanded=true]").count() === 1, "l'exercice suivant s'est ouvert");

// les autres d'un coup, jusqu'au bilan
for (let i = 1; i < nb; i++) {
  await pg.waitForTimeout(400);
  const tout = cartes.nth(i).getByRole("button", { name: "Tout valider" });
  if (await tout.count()) await tout.click();
  await pg.waitForTimeout(1100);
}
await pg.getByText("Séance terminée").waitFor({ timeout: 4000 }).catch(() => {});
ok(await pg.getByText("Séance terminée").isVisible(), "bilan de fin de séance");
await pg.waitForTimeout(2200);
const records = await pg.locator(".num").filter({ hasText: /^1$/ }).count();
ok(records >= 1, "bilan : au moins un record compté");
await pg.getByRole("button", { name: "Terminer" }).click();
await pg.waitForTimeout(600);

// séances libres : les vignettes deviennent l'en-tête
await pg.goto("http://localhost:8804/entrainement/");
await pg.waitForTimeout(900);
await pg.getByText("Épaules · Triceps", { exact: true }).click();
await pg.waitForTimeout(1200);
ok(/\/entrainement\/seance\/\?l=0/.test(pg.url()), "séance libre ouverte");
console.log("erreurs:", JSON.stringify(errs));
await ctx.close(); await b.close(); srv.close();
