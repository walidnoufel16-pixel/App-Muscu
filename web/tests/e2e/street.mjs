/* Séances libres d'abord : programme sur 8 semaines grisé, matériel « Ma salle »
   (machines disponibles), barre de traction, onglet Street workout et ses programmes.
   CAPTURES=dossier pour garder des captures. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8820);
const U = "http://localhost:8820";
const CAP = process.env.CAPTURES;
const etat = (materiel) => ({
  A: { objectif: 0, regularite: 2, socle: 1, axe: 0, materiel, acc: [], blessure: [], sexe: 0, prio: [], actuel: 0, profil: { "Âge": 30, Taille: 180, Poids: 78 } },
  LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, FINI: true, wk: 1, day: 0, HIST: [], SEANCES: [], ts: Date.now(),
});
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };
const errs = [];
async function contexte(e, langue) {
  const ctx = await b.newContext({ locale: "fr-FR", viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, serviceWorkers: "block" });
  await ctx.addInitScript(([s, l]) => {
    if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); if (l) localStorage.setItem("repere.langue.v1", l); sessionStorage.vu = 1; }
  }, [e, langue]);
  await ctx.route(/supabase\.co/, (r) => r.abort());
  const pg = await ctx.newPage();
  pg.on("pageerror", (x) => errs.push(x.message));
  return [ctx, pg];
}
const cap = async (pg, nom) => { if (CAP) { await pg.waitForTimeout(1200); await pg.screenshot({ path: `${CAP}/${nom}.png` }); } };
const etatLu = (pg) => pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")));

{
  /* Salle complète : programme grisé, Ma salle, Street. */
  const [ctx, pg] = await contexte(etat(0));
  await pg.goto(U + "/entrainement/");
  await pg.getByRole("tab", { name: "Programme" }).click();
  await pg.getByText("Bientôt disponible").first().waitFor({ timeout: 8000 });
  ok(await pg.getByText("Programme sur 8 semaines").count() > 0, "Entraînement : programme sur 8 semaines grisé");
  ok(await pg.getByText("Commencer le questionnaire").count() === 0, "Entraînement : plus de bouton vers le questionnaire");
  await cap(pg, "street-accueil");
  await pg.goto(U + "/questionnaire/");
  await pg.waitForURL(/\/entrainement\/?$/, { timeout: 8000 });
  ok(true, "le questionnaire renvoie aux séances libres");

  /* Ma salle : la presse disparaît quand on dit qu'on ne l'a pas */
  await pg.goto(U + "/exercices/");
  /* rien n'est coché au départ : aucun exercice tant qu'on n'a pas choisi son matériel */
  ok(await pg.getByRole("button", { pressed: true }).filter({ hasText: /^(Poids du corps|Haltères|Barre|Machines)$/ }).count() === 0, "matériel : rien de coché au départ");
  ok(await pg.getByText("Sélectionne au moins un matériel pour voir des exercices.").isVisible(), "matériel : message pour choisir");
  ok((await pg.getByRole("tablist", { name: "Rubrique" }).getByRole("tab").allTextContents()).join(",") === "Corps,Street,Course,Soin", "rubriques : Corps, Street, Course, Soin");
  await pg.getByRole("button", { name: "Haltères", exact: true }).click();
  ok(await pg.getByText("Presse à cuisses").count() === 0, "haltères seuls : pas de presse");
  await pg.getByRole("button", { name: "Mon matériel déclaré" }).click();
  ok(await pg.getByText("Presse à cuisses").count() > 0, "liste complète : presse à cuisses avec la salle");
  await pg.getByRole("button", { name: /Ma salle/ }).click();
  await pg.getByRole("heading", { name: "Ma salle" }).or(pg.getByText("Ma salle").nth(1)).first().waitFor();
  await pg.waitForTimeout(600);
  await cap(pg, "street-ma-salle");
  await pg.getByRole("button", { name: "Presse à cuisses", exact: true }).click();
  ok((await etatLu(pg)).A.sansPostes?.includes("presse"), "presse notée absente (A.sansPostes)");
  await pg.keyboard.press("Escape");
  await pg.waitForTimeout(600);
  ok(await pg.getByText("Presse à cuisses").count() === 0, "Liste : la presse a disparu");

  /* Street : programme débutant ajouté à Mes séances */
  await pg.goto(U + "/exercices/");
  await pg.getByRole("tab", { name: "Street" }).click();
  await pg.getByRole("heading", { name: "Programmes" }).waitFor();
  ok(await pg.getByText("Muscle-up").count() > 0, "Street : les figures (muscle-up)");
  await cap(pg, "street-onglet");
  /* aperçu : voir les séances sans les ajouter */
  await pg.getByRole("button", { name: /^Voir la séance A/ }).first().click();
  const apercu = pg.getByRole("dialog");
  await apercu.getByText("Tractions scapulaires").first().waitFor();
  ok(await apercu.locator("img").count() >= 3, "aperçu de la séance A : exercices avec photos");
  const exA = await apercu.getByRole("list").first().innerText();
  await apercu.getByRole("tab", { name: "B" }).click();
  await pg.waitForTimeout(300);
  ok(await apercu.getByRole("list").first().innerText() !== exA, "séance B : d'autres exercices");
  await cap(pg, "street-apercu");
  ok((await etatLu(pg)).SEANCES.filter((s) => s.street).length === 0, "rien n'est ajouté à Mes séances en regardant");
  await pg.keyboard.press("Escape");
  await pg.waitForTimeout(500);
  await pg.getByRole("button", { name: "Ajouter à mes séances" }).first().click();
  await pg.waitForURL(/seance\/?\?l=0/, { waitUntil: "commit" });
  await pg.getByText("Tractions scapulaires").first().waitFor({ timeout: 8000 });
  ok(true, "programme débutant : séance A ouverte");
  ok((await etatLu(pg)).SEANCES.filter((s) => s.street?.startsWith("debutant")).length === 3, "trois séances ajoutées (A, B, C)");
  await cap(pg, "street-seance");
  await pg.goto(U + "/entrainement/");
  await pg.getByRole("button", { name: /^Street workout/ }).waitFor({ timeout: 8000 });
  ok(true, "Mes séances : groupe Street workout");
  await pg.getByRole("button", { name: /^Street workout/ }).scrollIntoViewIfNeeded();
  await cap(pg, "street-mes-seances");

  /* Profil : mon matériel */
  await pg.goto(U + "/profil/");
  await pg.getByRole("heading", { name: "Mon matériel" }).waitFor();
  ok(await pg.getByText("Bientôt disponible").count() > 0, "Profil : programme grisé");
  await pg.getByRole("heading", { name: "Mon matériel" }).scrollIntoViewIfNeeded();
  await cap(pg, "street-profil");
  await ctx.close();
}

{
  /* Poids du corps seul : pas de tractions sans barre, puis avec. */
  const [ctx, pg] = await contexte(etat(3));
  await pg.goto(U + "/exercices/");
  await pg.getByRole("button", { name: "Mon matériel déclaré" }).click();
  await pg.waitForTimeout(500);
  ok(await pg.getByText("Tractions pronation").count() === 0, "sans barre de traction : pas de tractions");
  await pg.getByRole("button", { name: "Barre de traction", exact: true }).click();
  await pg.waitForTimeout(500);
  ok(await pg.getByText("Tractions pronation").count() > 0, "barre de traction cochée : les tractions apparaissent");
  await ctx.close();
}

{
  /* En anglais : onglet Street sans français. */
  const [ctx, pg] = await contexte(etat(0), "en");
  await pg.goto(U + "/exercices/");
  await pg.getByRole("tab", { name: "Street" }).click();
  await pg.getByRole("heading", { name: "Programmes" }).waitFor();
  const t = await pg.evaluate(() => document.body.innerText);
  const fr = t.split("\n").filter((l) => /[éèàçêûôîœ]/i.test(l.replace(/Repère|REPÈRE|Français/g, "")));
  ok(!fr.length, `EN : onglet Street sans français${fr.length ? " → " + fr.slice(0, 5).join(" | ") : ""}`);
  await cap(pg, "street-en");
  await ctx.close();
}

ok(!errs.length, "aucune erreur JS" + (errs.length ? " : " + errs.join(" / ") : ""));
await b.close();
srv.close();
