/* La séance du jour d'Oxa sur Entraînement (rien de prévu ni de fait aujourd'hui) : « Voir la séance »
   ouvre l'aperçu, « Ignorer aujourd'hui » la masque ; version repos quand le rythme l'impose.
   CAPTURES=dossier pour garder des captures. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8841);
const U = "http://localhost:8841";
const deux = (n) => String(n).padStart(2, "0");
const il = (n) => { const d = new Date(); d.setHours(12); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`; };
const push = (d) => ({ d, s: "L|0", nom: "Push", vol: 1000, ser: 10, ex: { dc: [70, 1000, 60, 8, 4], dh: [30, 500, 60, 10, 3], tri: [20, 300, 60, 10, 3] } });
const etat = (H) => ({ A: { objectif: 0, materiel: 0, acc: [], regularite: 2, objHebdo: 3, accueil: true, miseEnRoute: true }, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, SEANCES: [{ nom: "Push", ex: [{ id: "dc", s: 4, r: 8, p: "2 min" }] }], wk: 0, day: 0, FINI: false, HIST: H, ts: Date.now() });
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };
const cap = async (pg, n) => { if (process.env.CAPTURES) { await pg.waitForTimeout(600); await pg.screenshot({ path: `${process.env.CAPTURES}/${n}.png` }); } };
const errs = [];
async function page(H) {
  const ctx = await b.newContext({ locale: "fr-FR", viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, serviceWorkers: "block" });
  await ctx.addInitScript((s) => { if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); localStorage.setItem("palier.pseudo.v1", "Walid"); localStorage.setItem("repere.visite", "1"); sessionStorage.vu = 1; } }, etat(H));
  await ctx.route(/supabase\.co/, (r) => r.abort());
  const pg = await ctx.newPage(); pg.on("pageerror", (e) => errs.push(e.message));
  await pg.goto(U + "/entrainement/");
  return [ctx, pg];
}
{
  const [ctx, pg] = await page([push(il(3))]);
  await pg.getByText("Ta séance du jour").waitFor({ timeout: 8000 });
  ok(await pg.getByRole("button", { name: "Voir la séance" }).isVisible() && await pg.getByRole("button", { name: "Ignorer aujourd'hui" }).isVisible(), "séance du jour : Voir la séance, Ignorer aujourd'hui");
  await cap(pg, "seance-du-jour");
  await pg.getByRole("button", { name: "Voir la séance" }).click();
  await pg.waitForURL(/composer/);
  ok(await pg.getByRole("button", { name: "Commencer" }).isVisible(), "Voir la séance → l'aperçu, avec Commencer");
  await pg.goBack();
  await pg.getByText("Ta séance du jour").waitFor();
  await pg.getByRole("button", { name: "Ignorer aujourd'hui" }).click();
  await pg.waitForTimeout(300);
  ok(!(await pg.getByText("Ta séance du jour").count()), "Ignorer aujourd'hui : la carte disparaît");
  await pg.reload(); await pg.waitForTimeout(1500);
  ok(!(await pg.getByText("Ta séance du jour").count()), "… et reste masquée aujourd'hui");
  await ctx.close();
}
{
  const [ctx, pg] = await page([push(il(1))]);
  await pg.getByText("Repos aujourd'hui").waitFor({ timeout: 8000 });
  ok(await pg.getByRole("button", { name: "Cardio doux" }).isVisible() && await pg.getByRole("button", { name: "Séance quand même" }).isVisible() && await pg.getByRole("button", { name: "Ignorer aujourd'hui" }).isVisible(), "repos imposé par le rythme : Cardio doux, Séance quand même, Ignorer");
  await cap(pg, "repos-du-jour");
  await ctx.close();
}
ok(!errs.length, "aucune erreur JS " + errs.join(" | "));
await b.close(); srv.close();
