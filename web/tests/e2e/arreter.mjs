/* Arrêter une séance commencée par erreur : depuis la séance et depuis le bandeau « Séance en cours ».
   Les séries s'effacent, rien n'entre dans Progrès, la séance enregistrée reste.
   CAPTURES=dossier pour garder des captures. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8833);
const U = "http://localhost:8833";
const CAP = process.env.CAPTURES;
const t = Date.now() - 5 * 60_000;
const jour = (() => { const d = new Date(t); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; })();
const etat = {
  A: { objectif: 0, regularite: 2, objHebdo: 3, materiel: 0, acc: [], blessure: [], prio: [], miseEnRoute: true },
  SWAP: {}, SWAPP: {}, PLAN: null, FINI: false, wk: 0, day: 0, ts: Date.now(),
  SEANCES: [{ nom: "Push", ex: [{ id: "dc", s: 3, r: 8, p: "2 min" }, { id: "dm", s: 3, r: 10, p: "90 s" }] }],
  LOG: { "L|0|0": { ex: "dc", done: false, nb: 3, feel: null, ts: t, series: [{ v: 60, reps: 8, ok: true }, { v: 60, reps: 8 }, { v: 60, reps: 8 }] } },
  HIST: [{ d: jour, s: "L|0", nom: "Push", vol: 480, ser: 1, ts: t, ex: { dc: [60, 480, 60, 8, 1] } }],
};
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };
const errs = [];
async function contexte() {
  const ctx = await b.newContext({ locale: "fr-FR", viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, serviceWorkers: "block" });
  await ctx.addInitScript((s) => {
    if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); localStorage.setItem("palier.pseudo.v1", "Walid"); localStorage.setItem("repere.visite", "1"); sessionStorage.vu = 1; }
  }, etat);
  await ctx.route(/supabase\.co/, (r) => r.abort());
  const pg = await ctx.newPage();
  pg.on("pageerror", (x) => errs.push(x.message));
  return [ctx, pg];
}
const cap = async (pg, nom) => { if (CAP) { await pg.waitForTimeout(600); await pg.screenshot({ path: `${CAP}/${nom}.png` }); } };
const lire = (pg) => pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")));
const bandeau = (pg) => pg.getByText("Séance en cours", { exact: true });

/* 1. depuis la séance */
{
  const [ctx, pg] = await contexte();
  await pg.goto(U + "/entrainement/seance/?l=0");
  const bouton = pg.getByRole("button", { name: "Arrêter la séance" });
  await bouton.waitFor({ timeout: 8000 });
  await bouton.scrollIntoViewIfNeeded();
  await cap(pg, "bouton");
  await bouton.click();
  await pg.getByText("Arrêter « Push » ?").waitFor();
  await cap(pg, "confirmation");
  /* « Continuer » : rien ne bouge */
  await pg.getByRole("button", { name: "Continuer" }).click();
  await pg.waitForTimeout(500);
  let E = await lire(pg);
  ok(!!E.LOG["L|0|0"] && E.HIST.length === 1, "« Continuer » ne change rien");
  await bouton.click();
  await pg.getByRole("alertdialog").or(pg.getByRole("dialog")).getByRole("button", { name: "Arrêter la séance" }).click();
  await pg.waitForURL(/\/entrainement\/?$/, { timeout: 5000 }).catch(() => {});
  ok(/\/entrainement\/?$/.test(new URL(pg.url()).pathname), "retour sur Entraînement");
  await pg.waitForTimeout(800);
  E = await lire(pg);
  ok(!E.LOG["L|0|0"], "séries effacées");
  ok(!(E.HIST || []).some((l) => l.d === jour), "rien dans Progrès");
  ok(E.SEANCES.length === 1 && E.SEANCES[0].ex.length === 2, "la séance enregistrée reste");
  ok(await bandeau(pg).count() === 0, "plus de bandeau « Séance en cours »");
  await ctx.close();
}

/* 2. depuis le bandeau */
{
  const [ctx, pg] = await contexte();
  await pg.goto(U + "/repas/");
  await bandeau(pg).waitFor({ timeout: 8000 });
  await cap(pg, "bandeau");
  await pg.getByRole("button", { name: "Arrêter la séance" }).click();
  await pg.getByText("Arrêter « Push » ?").waitFor();
  await pg.getByRole("dialog").getByRole("button", { name: "Arrêter la séance" }).click();
  await pg.waitForTimeout(800);
  const E = await lire(pg);
  ok(!E.LOG["L|0|0"] && !(E.HIST || []).some((l) => l.d === jour), "arrêtée depuis le bandeau");
  ok(await bandeau(pg).count() === 0, "le bandeau disparaît");
  ok(new URL(pg.url()).pathname.startsWith("/repas"), "on reste sur Repas");
  await ctx.close();
}

ok(errs.length === 0, "aucune erreur de page " + errs.join(" | "));
await b.close();
srv.close();
