/* Langue : passage en anglais depuis Profil, parcours des écrans principaux sans
   texte d'interface resté en français, choix gardé après fermeture, retour au
   français. Téléphone en anglais sans choix : l'app démarre en anglais.
   Exercices, muscles, fiches et référentiels compris.
   CAPTURES=dossier pour garder des captures. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8816);
const U = "http://localhost:8816";
const CAP = process.env.CAPTURES;
const deux = (n) => String(n).padStart(2, "0");
const jour = (t) => { const d = new Date(t); return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`; };
const J = 864e5, maint = Date.now();
const HIST = [5, 12, 19].map((dj, i) => ({ d: jour(maint - dj * J), s: "L|0", nom: "Push", vol: 1440 + i * 60, ser: 3, ex: { dc: [70 + i, 1440 + i * 60, 60 + i * 2.5, 8, 3] }, min: 45 }));
const etat = {
  A: { objectif: 0, regularite: 2, socle: 1, axe: 0, materiel: 0, acc: [], blessure: [4], sexe: 0, prio: [], actuel: 0, profil: { "Âge": 30, Taille: 180, Poids: 78 } },
  LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, FINI: true, wk: 1, day: 0, HIST,
  SEANCES: [{ nom: "Push", ex: [{ id: "dc", s: 3, r: 8, p: "2 min" }] }],
  CARDIO: [{ nom: "Rameur", f: "tabata", m: "ram", min: 20, effort: 7, ts: maint - 3 * J }],
  ts: Date.now(),
};
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };
const errs = [];

/* Mots d'interface français qu'aucun texte anglais ne contient. */
const FR = /\b(séances?|semaines?|aujourd'hui|ton|ta|tes|pour|avec|sans|cette|Entraînement|Réglages|Langue|Apparence|Confidentialité|Progrès|Exercices|Commencer|Terminer|Valider|Enregistrer|Retour|Annuler|charge|répétitions|séries|repos|faite|prochaine)\b/i;
async function restes(pg) {
  /* Un accent français suffit à trahir un texte non traduit (hors nom de l'app). */
  const t = await pg.evaluate(() => document.body.innerText);
  return t.split("\n").map((l) => l.trim()).filter((l) => l !== "Français" && (FR.test(l) || /[éèàçêûôîœ]/i.test(l.replace(/Repère|REPÈRE/g, ""))));
}
async function ecran(pg, chemin, nom, attendu) {
  await pg.goto(U + chemin);
  await pg.waitForTimeout(1200);
  if (attendu) await pg.getByText(attendu).first().waitFor({ timeout: 8000 }).catch(() => {});
  const r = await restes(pg);
  ok(!r.length, `${nom} : aucun texte d'interface en français${r.length ? " → " + r.slice(0, 6).join(" | ") : ""}`);
  if (CAP) await pg.screenshot({ path: `${CAP}/en-${nom}.png` });
}

{
  const ctx = await b.newContext({ locale: "fr-FR", viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, serviceWorkers: "block" });
  /* le programme sur 8 semaines est en pause dans l'app : on le rallume pour le tester */
  await ctx.addInitScript(() => localStorage.setItem("repere.programme", "1"));
  await ctx.addInitScript((s) => { if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); sessionStorage.vu = 1; } }, etat);
  await ctx.route(/supabase\.co/, (r) => r.abort());
  const pg = await ctx.newPage();
  pg.on("pageerror", (e) => errs.push(e.message));

  await pg.goto(U + "/profil/");
  await pg.getByRole("heading", { name: "Langue" }).waitFor();
  ok(await pg.evaluate(() => document.documentElement.lang) === "fr", "téléphone en français : app en français");
  await Promise.all([pg.waitForEvent("load"), pg.getByRole("tab", { name: "English" }).click()]);
  await pg.getByRole("heading", { name: "Language" }).waitFor();
  ok(await pg.evaluate(() => document.documentElement.lang) === "en", "English choisi : l'app se recharge en anglais");
  ok(await pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")).A.langue) === "en", "choix noté dans le compte (A.langue)");

  await ecran(pg, "/entrainement/", "accueil", "Workout");
  await ecran(pg, "/entrainement/programme/", "programme");
  await ecran(pg, "/progres/", "progres", "Progress");
  await ecran(pg, "/exercices/", "exercices");
  await ecran(pg, "/profil/", "profil", "Language");
  await ecran(pg, "/entrainement/assistant/", "assistant");
  await ecran(pg, "/entrainement/cardio/", "cardio");
  await ecran(pg, "/questionnaire/", "questionnaire");

  /* Bibliothèque : recherche en anglais et fiche détaillée. */
  await pg.goto(U + "/exercices/");
  await pg.getByRole("tab", { name: "List" }).click();
  await pg.getByPlaceholder("Search for an exercise…").fill("bench");
  await pg.getByText("Barbell bench press").first().click();
  await pg.getByText("Lie on the bench", { exact: false }).first().waitFor({ timeout: 8000 });
  await pg.waitForTimeout(800);
  const rf = await restes(pg);
  ok(!rf.length, `fiche : nom, muscles et conseils en anglais${rf.length ? " → " + rf.slice(0, 6).join(" | ") : ""}`);
  if (CAP) await pg.screenshot({ path: `${CAP}/en-fiche.png` });

  /* La séance du jour : ouverte depuis l'accueil. */
  await pg.goto(U + "/entrainement/");
  await pg.getByRole("tab", { name: /^Program/ }).click();
  await pg.waitForTimeout(1200);
  const seance = pg.getByRole("link", { name: /Get started/ }).or(pg.getByRole("button", { name: /Get started/ })).first();
  ok(await seance.count() > 0, "séance du jour : bouton « Get started »");
  if (await seance.count()) {
    await seance.click();
    await pg.waitForTimeout(1500);
    const r = await restes(pg);
    ok(!r.length, `séance : aucun texte d'interface en français${r.length ? " → " + r.slice(0, 6).join(" | ") : ""}`);
    if (CAP) await pg.screenshot({ path: `${CAP}/en-seance.png` });
  }

  /* Fermeture puis réouverture : toujours en anglais. */
  await pg.close();
  const pg2 = await ctx.newPage();
  await pg2.goto(U + "/profil/");
  await pg2.getByRole("heading", { name: "Language" }).waitFor();
  ok(true, "langue gardée après fermeture");
  await Promise.all([pg2.waitForEvent("load"), pg2.getByRole("tab", { name: "Français" }).click()]);
  await pg2.getByRole("heading", { name: "Langue" }).waitFor();
  ok(await pg2.evaluate(() => document.documentElement.lang) === "fr", "retour au français");
  await ctx.close();
}

{
  /* Liste déroulante de la langue en haut des quatre onglets, dans les deux sens. */
  const ctx = await b.newContext({ locale: "fr-FR", viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, serviceWorkers: "block" });
  /* le programme sur 8 semaines est en pause dans l'app : on le rallume pour le tester */
  await ctx.addInitScript(() => localStorage.setItem("repere.programme", "1"));
  await ctx.addInitScript((s) => { if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); sessionStorage.vu = 1; } }, etat);
  await ctx.route(/supabase\.co/, (r) => r.abort());
  const pg = await ctx.newPage();
  pg.on("pageerror", (e) => errs.push(e.message));
  let partout = true;
  for (const c of ["/entrainement/", "/exercices/", "/progres/", "/profil/"]) {
    await pg.goto(U + c);
    await pg.waitForTimeout(1000);
    partout &&= (await pg.getByRole("button", { name: "Langue : Français" }).count()) === 1;
  }
  ok(partout, "liste de langue sur les quatre onglets");
  await pg.goto(U + "/progres/");
  await pg.getByRole("heading", { name: "Progrès" }).waitFor();
  await pg.waitForTimeout(1200);
  await pg.getByRole("button", { name: "Langue : Français" }).click();
  await pg.getByRole("menuitemradio", { name: "English" }).waitFor();
  ok(await pg.getByRole("menuitemradio", { name: "Français" }).getAttribute("aria-checked") === "true", "menu ouvert : français coché");
  if (CAP) await pg.screenshot({ path: `${CAP}/langue-menu.png` });
  await pg.keyboard.press("Escape");
  ok(await pg.getByRole("menu").count() === 0, "Échap referme le menu");
  await pg.getByRole("button", { name: "Langue : Français" }).click();
  await Promise.all([pg.waitForEvent("load"), pg.getByRole("menuitemradio", { name: "English" }).click()]);
  await pg.waitForFunction(() => document.documentElement.lang === "en" && document.querySelector("h1")?.textContent === "Progress");
  ok(await pg.getByRole("button", { name: "Language: English" }).count() === 1, "English choisi : l'app passe en anglais");
  ok(await pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")).A.langue) === "en", "choix noté dans le compte");
  await pg.waitForTimeout(1200);
  if (CAP) await pg.screenshot({ path: `${CAP}/langue-en.png` });
  await pg.getByRole("button", { name: "Language: English" }).click();
  await Promise.all([pg.waitForEvent("load"), pg.getByRole("menuitemradio", { name: "Français" }).click()]);
  await pg.waitForFunction(() => document.documentElement.lang === "fr" && document.querySelector("h1")?.textContent === "Progrès");
  ok(true, "Français choisi : retour au français");
  await ctx.close();
}

{
  /* Téléphone en anglais, aucun choix fait : l'app démarre en anglais. */
  const ctx = await b.newContext({ locale: "en-US", viewport: { width: 393, height: 852 }, serviceWorkers: "block" });
  /* le programme sur 8 semaines est en pause dans l'app : on le rallume pour le tester */
  await ctx.addInitScript(() => localStorage.setItem("repere.programme", "1"));
  await ctx.route(/supabase\.co/, (r) => r.abort());
  const pg = await ctx.newPage();
  pg.on("pageerror", (e) => errs.push(e.message));
  await pg.goto(U + "/");
  await pg.waitForTimeout(1500);
  ok(await pg.evaluate(() => document.documentElement.lang) === "en", "téléphone en anglais : app en anglais");
  const r = await restes(pg);
  ok(!r.length, `bienvenue : aucun texte en français${r.length ? " → " + r.slice(0, 6).join(" | ") : ""}`);
  if (CAP) await pg.screenshot({ path: `${CAP}/en-bienvenue.png` });
  await ctx.close();
}

ok(!errs.length, "aucune erreur JS" + (errs.length ? " : " + errs.join(" / ") : ""));
await b.close();
srv.close();
