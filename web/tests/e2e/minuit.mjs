/* Une séance finie le soir puis complétée après minuit reste une seule séance, sur son jour. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8823);
const U = "http://localhost:8823";
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };
const t = (iso) => new Date(iso).getTime();
const J = (ex, ts) => ({ v: 10, ex, nb: 3, ts, done: true, feel: null, reps: 10, series: [0, 1, 2].map(() => ({ v: 10, reps: 10, ok: true })) });
const etat = {
  A: { objectif: 0, materiel: 0, acc: [], blessure: [] },
  LOG: { "L|0|0": J("fp", t("2026-10-21T19:33")), "L|0|1": J("tricor", t("2026-10-21T20:14")) },
  SWAP: {}, SWAPP: {}, PLAN: null, FINI: true, wk: 0, day: 0,
  HIST: [{ d: "2026-10-21", s: "L|0", nom: "Épaules", vol: 600, ser: 6, ex: { fp: [13, 300, 10, 10, 3], tricor: [13, 300, 10, 10, 3] }, min: 44 }],
  SEANCES: [{ nom: "Épaules", ex: [{ id: "fp", s: 3, r: 10, p: "90 s" }, { id: "tricor", s: 3, r: 10, p: "90 s" }, { id: "dipt", s: 3, r: 10, p: "90 s" }] }],
  ts: t("2026-10-21T20:15"),
};
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({ locale: "fr-FR", timezoneId: "Europe/Paris", viewport: { width: 393, height: 852 }, serviceWorkers: "block" });
await ctx.addInitScript((s) => { if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); sessionStorage.vu = 1; } }, etat);
await ctx.route(/supabase\.co/, (r) => r.abort());
const pg = await ctx.newPage();
const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
await pg.clock.setFixedTime(new Date("2026-10-22T00:18:00+02:00"));
await pg.goto(U + "/entrainement/seance?l=0");
await pg.locator('[id="ex-L|0|2"] button[aria-expanded]').first().click();
await pg.getByRole("button", { name: "Tout valider" }).click();
await pg.waitForTimeout(800);
const H = await pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")).HIST);
ok(H.length === 1 && H[0].d === "2026-10-21", `une seule séance, le 21 (${H.map((l) => l.d)})`);
ok(H[0].ser === 9 && !!H[0].ex.dipt, "les dips validés à 0 h 18 rejoignent la séance du 21");
ok(H[0].min === 44, "la durée de la séance est gardée");
ok(!errs.length, "aucune erreur JS" + (errs.length ? " : " + errs.join(" / ") : ""));
await b.close();
srv.close();
