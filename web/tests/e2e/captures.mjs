/* Captures d'écran clair / sombre d'une page, avec un état de démonstration. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const OUT = new URL("../../out/", import.meta.url).pathname;
const DEST = process.env.DEST || "/tmp";
const pages = (process.env.PAGES || "/entrainement/").split(",");
const srv = servir(OUT, 8800);
const demo = {
  A: { objectif: 0, regularite: 3, socle: 2, axe: 0, materiel: 0, acc: [], sexe: 0, sport: [1], sportFreq: { 1: 1 } },
  LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, SEANCES: [{ nom: "Épaules · Triceps · Abdos", ex: [{ id: "dmh", s: 3, r: 10, p: "2 min" }, { id: "dipt", s: 3, r: 10, p: "2 min" }, { id: "el", s: 3, r: 12, p: "90 s" }, { id: "gai", s: 3, r: 45, p: "60 s" }], obj: 0 }],
  wk: 2, day: 0, FINI: true, ts: Date.now(),
};
// semaine 1 et 2 faites sur la séance 0, semaine 3 en cours
for (let w = 0; w < 2; w++) for (let i = 0; i < 5; i++) demo.LOG[`${w}|0|${i}`] = { done: true, v: 40 + w * 2.5, reps: 8, feel: 1, ex: ["dc", "tr", "dm", "el", "tri"][i], ts: 1000 + w, series: [{ v: 40 + w * 2.5, reps: 8, ok: true }, { v: 40 + w * 2.5, reps: 8, ok: true }, { v: 40 + w * 2.5, reps: 8, ok: true }] };
demo.LOG["2|0|0"] = { done: false, v: 45, reps: 6, feel: null, ex: "dc", ts: 2000, series: [{ v: 45, reps: 6, ok: true }, { v: 45, reps: 6, ok: true }, { v: 45, reps: 6, ok: false }, { v: 45, reps: 6, ok: false }] };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
for (const mode of ["light", "dark"]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: mode, serviceWorkers: "block" });
  await ctx.addInitScript((s) => { if (!localStorage.getItem("palier.state.v1")) localStorage.setItem("palier.state.v1", JSON.stringify(s)); }, demo);
  await ctx.route(/supabase\.co/, (r) => r.abort());
  const pg = await ctx.newPage();
  const errs = []; pg.on("pageerror", (e) => errs.push(e.message)); pg.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  for (const p of pages) {
    await pg.goto("http://localhost:8800" + p); await pg.waitForTimeout(900);
    if (process.env.ACTION) await eval(process.env.ACTION);
    const nom = p.replace(/\//g, "_") || "racine";
    await pg.screenshot({ path: `${DEST}/n${nom}-${mode}.png`, fullPage: !!process.env.FULL });
  }
  console.log(mode, "erreurs:", JSON.stringify(errs.filter((e) => !/supabase|ERR_FAILED|Failed to load resource/.test(e))));
  await ctx.close();
}
await b.close(); srv.close();
