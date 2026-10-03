/* Exécute l'ancienne app (dist/ de la racine) dans Chromium et enregistre ses
   résultats sur un jeu d'états variés : tests/fixtures/parite.json.
   node tests/genere-fixtures.mjs  (après node ../scripts/build.mjs) */
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const DIST = new URL("../../dist/", import.meta.url).pathname;
const SUPA = process.env.SUPA_UMD;
const srv = createServer((q, r) => { let p = decodeURIComponent(q.url.split("?")[0]); if (p.endsWith("/")) p += "index.html"; const f = join(DIST, p); if (!existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200); r.end(readFileSync(f)); }).listen(8791);
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const pg = await (await b.newContext({ serviceWorkers: "block" })).newPage();
await pg.route("https://cdn.jsdelivr.net/**", (rt) => rt.fulfill({ status: 200, contentType: "text/javascript", body: readFileSync(SUPA) }));
await pg.route(/supabase\.co/, (rt) => rt.abort());
await pg.goto("http://localhost:8791/"); await pg.waitForTimeout(800);
const res = await pg.evaluate(() => {
  const lcg = (s) => () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
  const reset = (o) => { for (const k in o) delete o[k]; };
  const PLAN_IA = { plan: { titre: "T" }, seances: [
    { titre: "Séance 1 – Poussée (pecs)", focus: "f", exercices: [{ id: "dc", series: 4, reps: 6, repos: "2 min 30", role: 1 }, { id: "dm", series: 3, reps: 8, repos: "2 min", role: 1 }, { id: "el", series: 3, reps: 12, repos: "60 s", role: 0 }, { id: "tri", series: 3, reps: 12, repos: "60 s", role: 0 }] },
    { titre: "Jambes", focus: "f", exercices: [{ id: "sq", series: 4, reps: 6, repos: "3 min", role: 1 }, { id: "rm", series: 3, reps: 8, repos: "2 min", role: 1 }, { id: "fe", series: 3, reps: 10, repos: "90 s", role: 0 }, { id: "gai", series: 3, reps: 45, repos: "60 s", role: 0 }] },
  ], bonus: { titre: "Bonus", exercices: [{ id: "cu", series: 3, reps: 12, repos: "60 s", role: 0 }, { id: "nuq", series: 3, reps: 12, repos: "60 s", role: 0 }] } };
  const profils = [
    { A: { materiel: 0, acc: [], socle: 2, axe: 0, regularite: 3 }, PLAN: null },
    { A: { materiel: 2, acc: [0], socle: 1, axe: 1, regularite: 0 }, PLAN: null },
    { A: { materiel: 3, acc: [1], socle: 0, axe: 2, regularite: 1, sport: [1, 7], sportFreq: { 1: 1 } }, PLAN: null },
    { A: { materiel: 1, acc: [], socle: 2, axe: 0, regularite: 2, exclus: ["Bras"] }, PLAN: PLAN_IA },
    { A: { materiel: 0, acc: [0, 1], socle: 2, axe: 0, regularite: 3 }, PLAN: PLAN_IA, SWAPP: { "0|1": "arn" }, SWAP: { "3|1|2": "elp" } },
  ];
  const out = { profils: [], assistant: [], divers: {} };
  for (const pr of profils) {
    reset(A); Object.assign(A, pr.A); PLAN = pr.PLAN; reset(SWAP); Object.assign(SWAP, pr.SWAP || {}); reset(SWAPP); Object.assign(SWAPP, pr.SWAPP || {}); reset(LOG);
    /* journal : semaines 0 à 3 faites sur la séance 0, ressentis variés */
    const W0 = week();
    for (let w = 0; w < 4; w++) (W0[0].x || []).forEach((e, i) => { const id = curId(w, 0, i, e[0]); LOG[key(w, 0, i)] = { done: true, v: 40 + w * 2 + i, reps: 8, feel: (w + i) % 3, ex: id, ts: 1000 + w, series: [{ v: 40 + w * 2 + i, reps: 8, ok: true }] }; });
    const W = week(), r = { A: pr.A, PLAN: pr.PLAN, SWAP: pr.SWAP || {}, SWAPP: pr.SWAPP || {}, LOG: JSON.parse(JSON.stringify(LOG)), week: W, cur: {}, rpe: {}, sug: {}, done: {}, full: {}, esp: [], ctx: {} };
    for (let w = 0; w < 8; w++) { r.full[w] = wkFull(w); W.forEach((s, si) => { r.done[w + "|" + si] = wkDone(w, si); (s.x || []).forEach((e, i) => { const id = curId(w, si, i, e[0]); r.cur[key(w, si, i)] = id; r.rpe[key(w, si, i)] = rpeOf(w, id, e[4]); r.sug[key(w, si, i)] = suggere(w, si, i, id); }); }); }
    W.forEach((_, i) => r.esp.push(espacementDe(W, i)));
    for (const w of [0, 3, 4, 6]) { wk = w; day = 0; (W[0].x || []).forEach((e, i) => { const c = P(i, curId(w, 0, i, e[0])); r.ctx[w + "|" + i] = { k: c.k, id: c.id, n: c.n, base: c.base, why: c.why, repos: c.repos, prev: c.prev }; }); }
    out.profils.push(r);
  }
  /* assistant, avec un hasard reproductible */
  reset(A); Object.assign(A, { materiel: 0, acc: [] });
  const cas = [[["epa", "tri", "abd"], 45, 0, null], [FULLBODY, 30, 0, null], [FULLBODY, 60, 1, null], [["pec", "dos", "qua"], 60, 2, ["m3"]], [MUSC.map((g) => g.k), 45, 3, ["m2", "m3", "kb"]], [["abd"], 30, 0, ["m2", "m3"]]];
  const MR = Math.random;
  cas.forEach(([m, d, o, sel], n) => { selFiltre = sel; Math.random = lcg(42 + n); const ex = construireSeance(m, d, o); out.assistant.push({ m, d, o, sel: sel || selDeclare(), seed: 42 + n, ex, duree: dureeEstimee(ex) }); });
  Math.random = MR; selFiltre = null;
  out.divers.muscles = ["dc", "sq", "russ", "fe", "tri"].map((id) => [id, musclesDe([id])]);
  out.divers.titres = ["Séance 1 – Poussée (pectoraux + épaules)", "Haut du corps A", "Séance 3: Tirage"].map((t) => [t, titreSeance(t)]);
  out.divers.secondes = ["2 min 30", "90 s", "3 min", "", "45 s"].map((t) => [t, secondesDe(t)]);
  out.divers.objCol = [
    [{ objectif: 2 }, { ex: [{ id: "dc", s: 3 }, { id: "rw", s: 3 }, { id: "sq", s: 3 }, { id: "rm", s: 3 }] }],
    [{}, { ex: [{ id: "dc", s: 3 }, { id: "rw", s: 3 }] }],
    [{ objectif: 1 }, { obj: 2, ex: [{ id: "dc", s: 4 }, { id: "rw", s: 4 }, { id: "sq", s: 4 }] }],
    [{ objectif: 1 }, { colObj: 0, ex: [{ id: "gai", s: 3 }] }],
  ].map(([a, s]) => { reset(A); Object.assign(A, a); return [a, s, objCollation(s)]; });
  const L1 = { done: true, feel: 1, series: [{ v: 60, reps: 8 }, { v: 60, reps: 8 }], lest: false };
  const L2 = { done: true, feel: null, series: [{ v: 15, reps: 15, lest: 10 }, { v: 15, reps: 15, lest: 5 }], lest: true };
  out.divers.resume = [[L1, "dc", "kg"], [L2, "russ", ""]].map(([L, id, u]) => [L, id, u, resumeDe(L, EX[id], u)]);
  return out;
});
writeFileSync(new URL("./fixtures/parite.json", import.meta.url), JSON.stringify(res));
console.log("profils", res.profils.length, "assistant", res.assistant.length);
await b.close(); srv.close();
