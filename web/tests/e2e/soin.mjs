/* Soin & mobilité : onglet de la bibliothèque rangé par zone, pictogrammes,
   routine lancée en un geste et rangée dans Mes séances (groupe Soin),
   carte suggérée quand une gêne d'épaule est déclarée, échauffement facultatif.
   En français puis en anglais. CAPTURES=dossier pour garder des captures. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8818);
const U = "http://localhost:8818";
const CAP = process.env.CAPTURES;
const etat = (langue, blessure) => ({
  A: { objectif: 0, regularite: 2, socle: 1, axe: 0, materiel: 0, acc: [], blessure, sexe: 0, prio: [], actuel: 0, profil: { "Âge": 30, Taille: 180, Poids: 78 }, ...(langue ? { langue } : {}) },
  LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, FINI: true, wk: 1, day: 0, HIST: [],
  SEANCES: [{ nom: "Push", ex: [{ id: "dc", s: 3, r: 8, p: "2 min" }] }],
  ts: Date.now(),
});
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };
const errs = [];
async function contexte(e) {
  const ctx = await b.newContext({ locale: "fr-FR", viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, serviceWorkers: "block" });
  await ctx.addInitScript((s) => {
    if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); if (s.A.langue) localStorage.setItem("repere.langue.v1", s.A.langue); sessionStorage.vu = 1; }
  }, e);
  await ctx.route(/supabase\.co/, (r) => r.abort());
  const pg = await ctx.newPage();
  pg.on("pageerror", (x) => errs.push(x.message));
  return [ctx, pg];
}
const cap = async (pg, nom) => { if (CAP) { await pg.waitForTimeout(1200); await pg.screenshot({ path: `${CAP}/${nom}.png` }); } };

{
  /* Gêne d'épaule déclarée : suggestion sur l'accueil, routine lancée, rangée dans Soin. */
  const [ctx, pg] = await contexte(etat(null, [0]));
  await pg.goto(U + "/entrainement/");
  await pg.getByText("Pour ta zone sensible").waitFor({ timeout: 8000 });
  ok(await pg.getByText("Ta routine coiffe des rotateurs").count() === 1, "accueil : routine coiffe suggérée pour l'épaule");
  ok(await pg.getByText("Mobilité des hanches").count() > 0, "accueil : les autres routines en dessous");
  ok(await pg.getByText("Ne remplace pas l'avis d'un kiné", { exact: false }).count() > 0, "avertissement kiné visible");
  await pg.getByText("Pour ta zone sensible").scrollIntoViewIfNeeded();
  await cap(pg, "soin-accueil");

  await pg.getByText("Ta routine coiffe des rotateurs").click();
  await pg.waitForURL(/seance\/?\?l=1/, { waitUntil: "commit" });
  await pg.getByText("Wall slides").first().waitFor({ timeout: 8000 });
  ok(true, "routine ouverte dans le lecteur de séance");
  await cap(pg, "soin-routine");
  await pg.getByRole("tab", { name: "Échauffement" }).click();
  await pg.getByText("avant de toucher aux charges").waitFor();
  ok(await pg.getByText("En option, pour ta zone sensible").count() === 0, "pas d'échauffement de soin dans la routine elle-même");
  ok(await pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")).SEANCES[1]?.soin) === "epaules", "routine ajoutée à Mes séances avec sa zone");

  await pg.goto(U + "/entrainement/");
  await pg.getByText("Ta routine coiffe des rotateurs").click();
  await pg.waitForURL(/seance\/?\?l=1/, { waitUntil: "commit" });
  ok(await pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")).SEANCES.length) === 2, "relancer la routine ne la duplique pas");

  await pg.goto(U + "/entrainement/");
  await pg.getByRole("button", { name: /^Soin/ }).waitFor({ timeout: 8000 });
  ok(true, "Mes séances : groupe Soin");

  /* Séance « Push » : échauffement avec la routine d'épaule en option. */
  await pg.goto(U + "/entrainement/seance?l=0");
  await pg.getByRole("tab", { name: "Échauffement" }).click();
  await pg.getByText("En option, pour ta zone sensible").waitFor({ timeout: 8000 });
  ok(true, "séance de musculation : routine d'épaule proposée à l'échauffement");
  await pg.getByText("En option, pour ta zone sensible").scrollIntoViewIfNeeded();
  await cap(pg, "soin-echauffement");

  /* Bibliothèque : onglet Soin & mobilité. */
  await pg.goto(U + "/exercices/");
  await pg.getByRole("tab", { name: "Soin & mobilité" }).click();
  await pg.getByRole("heading", { name: "Épaules et coiffe des rotateurs" }).waitFor();
  ok(await pg.getByRole("heading", { name: "Nuque et haut du dos" }).count() === 1, "onglet Soin : sept zones");
  ok(await pg.locator('img[src*="/img/picto/"]').count() > 0, "pictogrammes affichés");
  const n = await pg.evaluate(() => document.body.innerText.match(/Bibliothèque · (\d+) exercices/i)?.[1]);
  ok(Number(n) > 231, `compteur de la bibliothèque à jour (${n})`);
  await cap(pg, "soin-bibliotheque");
  await pg.getByText("Sleeper stretch").first().click();
  await pg.getByText("Exécution", { exact: false }).first().waitFor({ timeout: 8000 }).catch(() => {});
  await cap(pg, "soin-fiche");
  await ctx.close();
}

{
  /* Sans gêne : pas de carte suggérée, routines quand même proposées. */
  const [ctx, pg] = await contexte(etat(null, [4]));
  await pg.goto(U + "/entrainement/");
  await pg.getByText("Soin & mobilité").first().waitFor({ timeout: 8000 });
  ok(await pg.getByText("Pour ta zone sensible").count() === 0, "sans gêne : aucune suggestion");
  await pg.goto(U + "/entrainement/seance?l=0");
  await pg.getByRole("tab", { name: "Échauffement" }).click();
  await pg.getByText("avant de toucher aux charges").waitFor();
  ok(await pg.getByText("En option, pour ta zone sensible").count() === 0, "sans gêne : échauffement inchangé");
  await ctx.close();
}

{
  /* En anglais. */
  const [ctx, pg] = await contexte(etat("en", [1]));
  await pg.goto(U + "/entrainement/");
  await pg.getByText("For your sensitive area").waitFor({ timeout: 8000 });
  ok(await pg.getByText("Your lower back routine").count() === 1, "EN : routine bas du dos suggérée");
  await pg.getByText("For your sensitive area").scrollIntoViewIfNeeded();
  await cap(pg, "soin-en-accueil");
  await pg.goto(U + "/exercices/");
  await pg.getByRole("tab", { name: "Care & mobility" }).click();
  await pg.getByRole("heading", { name: "Shoulders and rotator cuff" }).waitFor();
  const t = await pg.evaluate(() => document.body.innerText);
  const fr = t.split("\n").filter((l) => /[éèàçêûôîœ]/i.test(l.replace(/Repère|REPÈRE|Français/g, "")));
  ok(!fr.length, `EN : onglet Soin sans français${fr.length ? " → " + fr.slice(0, 5).join(" | ") : ""}`);
  await cap(pg, "soin-en-bibliotheque");
  await ctx.close();
}

ok(!errs.length, "aucune erreur JS" + (errs.length ? " : " + errs.join(" / ") : ""));
await b.close();
srv.close();
