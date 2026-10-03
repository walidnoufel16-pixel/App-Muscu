/* Un état enregistré par l'ancienne app doit s'ouvrir à l'identique. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../../dist/", import.meta.url).pathname, 8802);
const ancien = {
  A: { objectif: 1, regularite: 2, socle: 1, axe: 0, materiel: 2, acc: [0], sport: 3, sportFreq: 1, blessure: 1, prefs: { Dos: [2] }, profil: { Âge: 30, Taille: 180, Poids: 80 } },
  LOG: { "0|0|0": { done: true, v: 40, reps: 6, feel: 0, ex: "dh", ts: 5, series: [{ v: 40, reps: 6, ok: true }] }, "L|0|0": { done: true, v: 15, reps: 15, ex: "russ", ts: 9, lest: true, series: [{ v: 15, reps: 15, lest: 10 }] } },
  SWAP: {}, SWAPP: { "0|1": "rw2" }, PLAN: null,
  SEANCES: [{ nom: "Abdos <b>", ex: [{ id: "russ", s: 3, r: 15, p: "60 s" }] }], wk: 1, day: 0, FINI: true, ts: Date.now(),
};
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({ serviceWorkers: "block" });
await ctx.addInitScript((s) => { if (!sessionStorage.x) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); localStorage.setItem("repere-theme", "dark"); sessionStorage.x = 1; } }, ancien);
await ctx.route(/supabase\.co/, (r) => r.abort());
const pg = await ctx.newPage();
const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
await pg.goto("http://localhost:8802/"); await pg.waitForTimeout(1500);
const r = { url: pg.url(), sombre: await pg.evaluate(() => document.documentElement.classList.contains("dark")), titre: await pg.textContent("h1") };
r.etat = await pg.evaluate(() => { const s = JSON.parse(localStorage.getItem("palier.state.v1")); return { sport: s.A.sport, sportFreq: s.A.sportFreq, blessure: s.A.blessure, nom: s.SEANCES[0].nom, log: Object.keys(s.LOG), wk: s.wk, swapp: s.SWAPP }; });
await pg.goto("http://localhost:8802/entrainement/"); await pg.waitForTimeout(800);
r.seance = await pg.textContent("main");
r.seance = r.seance.includes("Abdos b") ? "ok" : r.seance.slice(0, 120);
console.log(JSON.stringify(r), "erreurs:", JSON.stringify(errs));
await b.close(); srv.close();
