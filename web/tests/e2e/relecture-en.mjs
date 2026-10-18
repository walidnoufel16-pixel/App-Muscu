/* Relecture en anglais : parcourt tous les écrans de l'app en anglais, relève
   chaque ligne qui contient encore du français et prend une capture par écran.
   CAPTURES=dossier pour garder les captures. Ne contacte aucun serveur. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8817);
const U = "http://localhost:8817";
const CAP = process.env.CAPTURES;
const deux = (n) => String(n).padStart(2, "0");
const jour = (t) => { const d = new Date(t); return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`; };
const J = 864e5, maint = Date.now();
const HIST = [];
for (let w = 0; w < 6; w++) for (const [dj, s, ex] of [[w * 7 + 2, "L|0", { dc: [70 + w, 1440, 60 + w * 2.5, 8, 3] }], [w * 7 + 4, "L|0", { sq: [90 + w, 1800, 80 + w * 5, 6, 3] }]])
  HIST.push({ d: jour(maint - dj * J), s, nom: "Push", vol: 1500, ser: 3, ex, min: 45 });
const etat = {
  A: { objectif: 0, regularite: 2, socle: 1, axe: 0, materiel: 0, acc: [], blessure: [0], sexe: 0, prio: [0], actuel: 0, sport: [1], sportFreq: { 1: 1 },
    profil: { "Âge": 30, Taille: 180, Poids: 78 }, poids: [[jour(maint - 20 * J), 79], [jour(maint - 2 * J), 78]], langue: "en" },
  LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, FINI: true, wk: 2, day: 0, HIST,
  SEANCES: [{ nom: "Push", ex: [{ id: "dc", s: 3, r: 8, p: "2 min" }, { id: "el", s: 3, r: 12, p: "60 s" }] }],
  CARDIO: [{ nom: "Rowing", f: "tabata", m: "ram", min: 20, effort: 7, ts: maint - 3 * J }],
  SORTIES: [{ d: jour(maint - 5 * J), km: 8.2, sec: 2700, rpe: 4 }],
  COURSE: { obj: "10k", date: jour(maint + 50 * J), debut: jour(maint - 9 * J), jours: 3, renfo: 1, ref: null, pauses: [], ajust: {}, cree: jour(maint - 9 * J) },
  ts: Date.now(),
};
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({ locale: "en-GB", viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, serviceWorkers: "block" });
/* le programme sur 8 semaines est en pause dans l'app : on le rallume pour le tester */
await ctx.addInitScript(() => localStorage.setItem("repere.programme", "1"));
await ctx.addInitScript((s) => { localStorage.setItem("repere.langue.v1", "en"); if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); sessionStorage.vu = 1; } }, etat);
await ctx.route(/supabase\.co/, (r) => r.abort());
const pg = await ctx.newPage();
const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
const restes = async () => (await pg.evaluate(() => document.body.innerText)).split("\n").map((l) => l.trim())
  .filter((l) => l && l !== "Français" && (/[éèàçêûôîœ]|\b(séance|semaine|avec|pour|sans|ton|tes|ta|une|des|les|du)\b/i.test(l.replace(/Repère|REPÈRE/g, "")) || /\d,\d(?!\d)|\bJ-\d/.test(l)));
const tous = {};
async function ecran(chemin, nom, action) {
  await pg.goto(U + chemin);
  await pg.waitForTimeout(1300);
  if (action) { try { await action(); await pg.waitForTimeout(900); } catch (e) { console.log("  (action " + nom + " : " + e.message.split("\n")[0] + ")"); } }
  const r = await restes();
  tous[nom] = r;
  console.log((r.length ? "RESTE " : "OK    ") + nom + (r.length ? " → " + r.slice(0, 8).join(" | ") : ""));
  if (CAP) await pg.screenshot({ path: `${CAP}/${nom}.png`, fullPage: true });
}
await ecran("/entrainement/", "01-accueil");
await ecran("/entrainement/programme/", "02-programme");
await ecran("/entrainement/", "03-seance", () => pg.getByRole("link", { name: /Get started/ }).or(pg.getByRole("button", { name: /Get started/ })).first().click());
await ecran("/entrainement/", "04-echauffement", async () => { await pg.getByRole("link", { name: /Get started/ }).or(pg.getByRole("button", { name: /Get started/ })).first().click(); await pg.waitForTimeout(1200); await pg.getByRole("tab", { name: "Warm-up" }).click(); });
await ecran("/entrainement/", "05-collation", async () => { await pg.getByRole("link", { name: /Get started/ }).or(pg.getByRole("button", { name: /Get started/ })).first().click(); await pg.waitForTimeout(1200); await pg.getByRole("tab", { name: "Snack" }).click(); });
await ecran("/entrainement/assistant/", "06-assistant-muscu");
await ecran("/entrainement/assistant/?type=cardio", "07-assistant-cardio");
await ecran("/entrainement/assistant/?type=mixte", "08-assistant-combinee");
await ecran("/entrainement/assistant/?type=course", "09-assistant-course");
await ecran("/entrainement/cardio/", "10-cardio");
await ecran("/entrainement/composer/", "11-composer");
await ecran("/entrainement/course/", "12-course");
await ecran("/progres/", "13-progres");
await ecran("/progres/bilan/", "14-bilan");
await ecran("/exercices/", "15-exercices");
await ecran("/exercices/", "16-liste", () => pg.getByRole("tab", { name: "List" }).click());
await ecran("/profil/", "17-profil");
await ecran("/questionnaire/", "18-questionnaire");
await ecran("/plan/synthese/", "19-synthese");
await ecran("/bienvenue/", "20-bienvenue");
console.log("Erreurs JS :", errs.length ? errs.join(" / ") : "aucune");
console.log("Écrans avec restes :", Object.values(tous).filter((r) => r.length).length, "/", Object.keys(tous).length);
await b.close(); srv.close();
