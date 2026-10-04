/* Forme du jour et zones sensibles : un check-in « fatigué » baisse la charge
   proposée et l'explique ; une douleur signalée marque les exercices à ménager ;
   les zones se règlent dans le profil. CAPTURES=dossier pour garder des captures. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8810);
const U = "http://localhost:8810";
const etat = {
  A: { objectif: 0, materiel: 0, acc: [], blessure: [4] }, SWAP: {}, SWAPP: {}, PLAN: null,
  LOG: { "L|9|0": { done: true, feel: 1, ex: "dc", ts: Date.now() - 4 * 864e5, v: 60, reps: 8, series: [{ v: 60, reps: 8, ok: true }] } },
  SEANCES: [{ nom: "Push", ex: [{ id: "dc", s: 3, r: 8, p: "2 min" }, { id: "dmh", s: 3, r: 10, p: "90 s" }] }],
  wk: 0, day: 0, FINI: false, ts: Date.now(),
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

await pg.goto(U + "/entrainement/seance/?l=0");
await pg.getByText("Comment tu te sens ?").waitFor();
ok(true, "check-in proposé avant la séance");
await cap("checkin");
await pg.getByRole("radiogroup", { name: "Sommeil" }).getByRole("radio", { name: "Mauvais" }).click();
await pg.getByRole("radiogroup", { name: "Énergie" }).getByRole("radio", { name: "À plat" }).click();
await pg.getByRole("radiogroup", { name: "Courbatures" }).getByRole("radio", { name: "Fortes" }).click();
await pg.getByRole("button", { name: "Épaules", exact: true }).click();
await pg.getByRole("button", { name: "C'est parti" }).click();
await pg.waitForTimeout(300);
ok(await pg.getByText(/Forme du jour/).first().isVisible() && await pg.getByText("basse", { exact: true }).isVisible(), "résumé : forme basse");
ok((await etatLu()).A.forme.douleur.join() === "0", "douleur aux épaules enregistrée");
ok(await pg.locator('[id="ex-L|0|1"]').getByText("À ménager").isVisible(), "développé haltères épaules : à ménager");
ok(await pg.locator('[id="ex-L|0|0"]').getByText("À ménager").count() === 0, "développé couché : pas marqué");

await pg.locator('[id="ex-L|0|0"] button[aria-expanded]').first().click();
await pg.waitForTimeout(400);
ok(await pg.getByText(/Forme du jour basse : −5 kg/).isVisible(), "raison affichée : forme basse, −5 kg");
const champ = pg.getByRole("textbox", { name: /série 1$/ }).first();
ok(await champ.inputValue() === "55", `charge proposée 55 kg au lieu de 60 (${await champ.inputValue()})`);
await cap("charge");
await pg.locator('[id="ex-L|0|1"] button[aria-expanded]').first().click();
await pg.waitForTimeout(400);
ok(await pg.getByText(/charge modérée, amplitude sans douleur/).isVisible(), "conseil de zone sensible");

// « Passer » masque le check-in pour la journée
await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem("palier.state.v1")); delete s.A.forme; s.LOG = {}; localStorage.setItem("palier.state.v1", JSON.stringify(s)); });
await pg.reload();
await pg.getByText("Comment tu te sens ?").waitFor();
await pg.getByRole("button", { name: "Passer" }).click();
await pg.reload();
await pg.waitForTimeout(1200);
ok(await pg.getByText("Comment tu te sens ?").count() === 0, "passer : plus de check-in aujourd'hui");

// profil : zones à ménager
await pg.goto(U + "/profil/");
await pg.getByText("Zones à ménager").waitFor();
await pg.getByRole("button", { name: "Genoux", exact: true }).click();
await pg.waitForTimeout(200);
ok(JSON.stringify((await etatLu()).A.blessure) === "[2]", "zone Genoux enregistrée (« rien à signaler » retiré)");

console.log("erreurs:", JSON.stringify(errs));
await ctx.close(); await b.close(); srv.close();
