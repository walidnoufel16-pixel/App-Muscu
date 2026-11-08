/* Captures de l'app pour le contenu, avec le compte de démonstration (demo.mjs).
   Prérequis : cd web && npm run build (l'app servie depuis web/out/).
   Usage (depuis web/, le script copié dans tests/e2e/ pour trouver serveur.mjs) :
     node ../outils/reseaux/demo.mjs 2026-11-09 > /tmp/pack/etat-demo.json
     cp ../outils/reseaux/captures.mjs tests/e2e/_captures.mjs
     DATE=2026-11-09 NODE_PATH=$(npm root -g) node tests/e2e/_captures.mjs ; rm tests/e2e/_captures.mjs
   Sortie : $PACK/brut/*.png en 1170×2532 (390×844 × 3). Noms :
     accueil, accueil-bas, recup (feuille récupération), corps-vide (assistant, rien de coché, même cadrage que
     corps : à enchaîner avec un tap animé), corps (assistant, pecs-triceps-épaules cochés),
     composer, composer-bas, progres, progres-bas, bilan (feuille de la semaine),
     repas-semaine (Repas › Ma semaine : budget tenu, jour par jour), repas-recette-haut (fiche recette : photo,
     protéines, ingrédients ; le crédit photo Unsplash est visible, à rogner), repas-recette (la même fiche
     descendue jusqu'à « Le conseil nutrition »), courses (liste de courses ouverte, prix par article),
     proteines (anneau du jour 42 / 150 g et idées repas), proteines-ajout (feuille d'ajout en un geste),
     proteines-scanner (même feuille, boutons Scanner et Chercher), street (test d'entrée et progrès),
     street-programme (programme Force conseillé d'après le test), course (plan 10 km : J-41, niveau,
     allures, semaine en cours), course-bas (tout le plan, semaines faites), soin (routine Épaules),
     s<séance>-<exercice>-ferme / -ouvert (chaque exercice de chaque séance, carte fermée puis ouverte avec son « pourquoi »).
   Jamais d'Oxa Plan (8 semaines) ni de son bandeau « Bientôt disponible ». */
import { chromium } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";
import { servir } from "./serveur.mjs";
const PACK = process.env.PACK || "/tmp/pack", D = `${PACK}/brut/`, DATE = process.env.DATE || new Date().toISOString().slice(0, 10);
const ETAT = process.env.ETAT || `${PACK}/etat-demo.json`, SOMBRE = process.env.SOMBRE === "1";
mkdirSync(D, { recursive: true });
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8902);
const U = "http://localhost:8902";
const etat = JSON.parse(readFileSync(ETAT, "utf8"));
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({ locale: "fr-FR", viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, serviceWorkers: "block", colorScheme: SOMBRE ? "dark" : "light" });
await ctx.addInitScript((s) => { if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); localStorage.setItem("palier.pseudo.v1", "Alex"); localStorage.setItem("repere.visite", "1"); sessionStorage.vu = 1; } }, etat);
await ctx.route(/supabase\.co/, (r) => r.abort());
const pg = await ctx.newPage();
const erreurs = []; pg.on("pageerror", (e) => erreurs.push(e.message));
await pg.clock.install({ time: new Date(DATE + "T09:00:00") });
const W = (t = 800) => pg.waitForTimeout(t), shot = (n) => pg.screenshot({ path: D + n + ".png" });
const essai = async (nom, f) => { try { await f(); } catch (e) { console.log("échec", nom, e.message.split("\n")[0]); } };

await essai("accueil", async () => {
  await pg.goto(U + "/entrainement/"); await W(2000); await shot("accueil");
  await pg.mouse.wheel(0, 500); await W(600); await shot("accueil-bas");
});
await essai("recup", async () => {
  await pg.goto(U + "/entrainement/"); await W(1500);
  await pg.getByRole("button", { name: /Récupération/ }).first().click(); await W(1200); await shot("recup");
});
await essai("corps-vide", async () => {
  await pg.goto(U + "/entrainement/assistant/"); await W(2000);
  const t = pg.getByText("De face", { exact: true }).first(), bb = await t.boundingBox();
  await pg.evaluate((y) => scrollTo(0, scrollY + y - 120), bb.y); await W(600); await shot("corps-vide");
});
await essai("assistant", async () => {
  await pg.goto(U + "/entrainement/assistant/?m=pec,tri,epa"); await W(2000);
  const t = pg.getByText("De face", { exact: true }).first(), bb = await t.boundingBox();
  await pg.evaluate((y) => scrollTo(0, scrollY + y - 120), bb.y); await W(600); await shot("corps");
  for (const m of ["Haltères", "Barre", "Machines", "Poids du corps"]) { await pg.getByRole("button", { name: m, exact: true }).first().click().catch(() => {}); await W(150); }
  await pg.getByRole("button", { name: "Ajuster" }).click(); await W(2000); await shot("composer");
  await pg.mouse.wheel(0, 350); await W(500); await shot("composer-bas");
});
await essai("progres", async () => {
  await pg.goto(U + "/progres/"); await W(1800); await shot("progres");
  await pg.mouse.wheel(0, 600); await W(600); await shot("progres-bas");
  await pg.mouse.wheel(0, -2000); await W(400);
  await pg.getByRole("button", { name: "Ta semaine" }).click(); await W(1200); await shot("bilan");
});
/* Repas : la semaine et son budget, une fiche recette (jusqu'au conseil nutrition), la liste de courses */
await essai("repas-semaine", async () => {
  await pg.goto(U + "/repas/?v=semaine"); await W(2000); await shot("repas-semaine");
});
await essai("repas-recette", async () => {
  await pg.goto(U + "/repas/?v=semaine"); await W(1800);
  await pg.getByRole("button", { name: /^Lundi/ }).first().click(); await W(600);
  await pg.locator('section[aria-label="Lundi"] button').nth(1).click(); await W(1500); await shot("repas-recette-haut");
  /* la fiche défile dans sa feuille : on la descend jusqu'au bout, où est le conseil */
  await pg.getByText("Le conseil nutrition", { exact: true }).evaluate((e) => { const d = e.closest(".overflow-y-auto"); d.scrollTop = d.scrollHeight; }); await W(700);
  await shot("repas-recette");
});
await essai("courses", async () => {
  await pg.goto(U + "/repas/?v=semaine"); await W(1800);
  await pg.getByRole("button", { name: /Ma liste de courses/ }).click(); await W(1500); await shot("courses");
});
/* Protéines : l'anneau du jour (Repas › Aujourd'hui), puis la feuille d'ajout avec le scanner */
await essai("proteines", async () => {
  await pg.goto(U + "/repas/?v=jour"); await W(2000);
  const carte = pg.getByRole("button", { name: /de protéines/ }).first(), bb = await carte.boundingBox();
  await pg.evaluate((y) => scrollTo(0, scrollY + y - 330), bb.y); await W(600); await shot("proteines");
  await carte.click(); await W(1500); await shot("proteines-ajout");
  await pg.getByRole("button", { name: "Scanner", exact: true }).evaluate((e) => e.scrollIntoView({ block: "center" })); await W(600);
  await shot("proteines-scanner");
});
/* Street : test d'entrée (deux tests, progrès) et programme conseillé */
await essai("street", async () => {
  await pg.goto(U + "/entrainement/rubrique/?v=street&o=programmes"); await W(2000); await shot("street");
  const c = pg.getByText("Conseillé d'après ton test", { exact: true }).first(), bb = await c.boundingBox();
  await pg.evaluate((y) => scrollTo(0, scrollY + y - 110), bb.y); await W(600); await shot("street-programme");
});
/* Course : le plan 10 km (niveau, allures, semaine en cours), puis tout le plan */
await essai("course", async () => {
  await pg.goto(U + "/entrainement/course/"); await W(2200); await shot("course");
  const t = pg.getByText("Tout le plan", { exact: true }).first(), bb = await t.boundingBox();
  await pg.evaluate((y) => scrollTo(0, scrollY + y - 110), bb.y); await W(600); await shot("course-bas");
});
/* Soin & mobilité : la routine d'une zone (épaules) */
await essai("soin", async () => {
  await pg.goto(U + "/entrainement/rubrique/?v=soin&o=epaules"); await W(2000); await shot("soin");
});
for (let i = 0; i < (etat.SEANCES || []).length; i++) {
  for (const { id } of etat.SEANCES[i].ex) {
    await essai(`s${i}-${id}`, async () => {
      await pg.goto(U + "/entrainement/seance/?l=" + i); await W(1300);
      const c = pg.locator(`[id^="ex-"]`).nth(etat.SEANCES[i].ex.findIndex((e) => e.id === id));
      const bt = c.locator("button[aria-expanded]").first();
      if ((await bt.getAttribute("aria-expanded")) === "true") { await bt.click(); await W(400); }
      const bb = await c.boundingBox(); await pg.evaluate((y) => scrollTo(0, scrollY + y - 110), bb.y); await W(400);
      await shot(`s${i}-${id}-ferme`);
      await bt.click(); await W(700); await shot(`s${i}-${id}-ouvert`);
    });
  }
}
console.log(erreurs.length ? "erreurs de page : " + erreurs.join(" | ") : "captures faites dans " + D);
await b.close(); srv.close();
