/* TRX : matériel à cocher (filtre et Profil), exercices aux sangles dans la loupe,
   le schéma du corps, la fiche et la feuille d'ajout ; en anglais aussi.
   CAPTURES=dossier pour garder des captures. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8823);
const U = "http://localhost:8823";
const CAP = process.env.CAPTURES;
const etat = (A = {}) => ({
  A: { objectif: 0, regularite: 2, socle: 1, axe: 0, materiel: 0, acc: [2], blessure: [], sexe: 0, prio: [], actuel: 0, profil: { "Âge": 30, Taille: 180, Poids: 78 }, ...A },
  LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, FINI: true, wk: 0, day: 0, HIST: [], SEANCES: [], ts: Date.now(),
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
const cap = async (pg, nom) => { if (CAP) { await pg.waitForTimeout(1000); await pg.screenshot({ path: `${CAP}/${nom}.png` }); } };
const etatLu = (pg) => pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")));
const pecs = (pg, l = pg) => l.locator("path", { has: pg.locator("title", { hasText: "Pectoraux" }) }).first();

{
  /* Salle complète, « Aucun des deux » au questionnaire : pas de TRX tant qu'on ne le coche pas. */
  const [ctx, pg] = await contexte(etat());
  await pg.goto(U + "/exercices/");
  const puce = pg.getByRole("button", { name: "TRX", exact: true });
  await puce.waitFor({ timeout: 8000 });
  await pg.getByRole("button", { name: "Mon matériel déclaré" }).click();
  ok(await puce.getAttribute("aria-pressed") === "false", "matériel déclaré sans TRX : puce TRX décochée");
  await pg.getByPlaceholder("Rechercher un exercice…").fill("TRX");
  await pg.waitForTimeout(300);
  ok(await pg.getByText("Tirage TRX").count() === 0, "sans les sangles : aucun exercice TRX");

  /* la puce TRX seule : seulement les exercices aux sangles */
  await pg.getByPlaceholder("Rechercher un exercice…").fill("");
  const cochee = pg.getByRole("button", { pressed: true, name: /^(Poids du corps|Barre de traction|Haltères|Barre|Machines|Kettlebell|Élastiques)$/ });
  while (await cochee.count()) await cochee.first().click();
  await puce.click();
  await pg.getByPlaceholder("Rechercher un exercice…").fill("pompes");
  await pg.getByText("Pompes TRX").first().waitFor();
  ok(await pg.getByText("Pompes", { exact: true }).count() === 0, "TRX seul, « pompes » : les pompes TRX, pas les pompes au sol");
  await pg.getByPlaceholder("Rechercher un exercice…").fill("tirage");
  ok(await pg.getByText("Tirage TRX").count() > 0, "TRX seul, « tirage » : tirage TRX");
  await cap(pg, "trx-recherche");

  /* le schéma du corps : pectoraux → pompes et écarté TRX */
  await pg.getByPlaceholder("Rechercher un exercice…").fill("");
  await pg.waitForTimeout(400);
  await pecs(pg).click({ force: true });
  await pg.getByText("Écarté TRX").first().waitFor();
  ok(await pg.getByText("Pompes TRX").count() > 0, "pectoraux avec TRX : pompes et écarté TRX");
  await cap(pg, "trx-pectoraux");

  /* la fiche, avec sa photo */
  await pg.getByText("Pompes TRX").first().click();
  const fiche = pg.getByRole("dialog");
  await fiche.getByText(/Dos à l'ancrage/).waitFor();
  const img = await fiche.locator("img").first().getAttribute("src");
  ok(/Suspended_Push-Up/.test(img || ""), `fiche Pompes TRX : réglage des sangles et photo (${img})`);
  await cap(pg, "trx-fiche");
  await ctx.close();
}

{
  /* Profil › Mon matériel : TRX coché, repris par « Mon matériel déclaré » et ajouté à une séance. */
  const [ctx, pg] = await contexte(etat());
  await pg.goto(U + "/profil/");
  const trx = pg.getByRole("button", { name: "TRX", exact: true });
  await trx.waitFor({ timeout: 8000 });
  await trx.click();
  ok((await etatLu(pg)).A.trx === true && (await etatLu(pg)).A.acc.join() === "2", "Profil : TRX noté à part (A.trx), « Aucun des deux » intact");
  await cap(pg, "trx-profil");
  await pg.goto(U + "/entrainement/");
  await pg.getByText("Composer exercice par exercice").click();
  await pg.waitForURL(/\/entrainement\/composer\/?$/);
  await pg.getByRole("button", { name: "Exercice", exact: true }).click();
  const feuille = pg.getByRole("dialog");
  await feuille.getByText("Ajouter un exercice").first().waitFor();
  await pg.waitForTimeout(800);
  await feuille.getByRole("button", { name: "Mon matériel déclaré" }).click();
  ok(await feuille.getByRole("button", { name: "TRX", exact: true }).getAttribute("aria-pressed") === "true", "« Mon matériel déclaré » coche le TRX");
  await pecs(pg, feuille).click({ force: true });
  await feuille.getByRole("region", { name: "Musculation" }).getByRole("button", { name: /^Ajouter Pompes TRX/ }).click();
  await feuille.getByRole("button", { name: /^Terminé/ }).click();
  await pg.waitForTimeout(500);
  ok(await pg.locator('[data-carte="trxpu"]').count() === 1, "Pompes TRX ajoutées à la séance");
  await ctx.close();
}

{
  /* En anglais : noms anglais. */
  const [ctx, pg] = await contexte(etat({ trx: true }), "en");
  await pg.goto(U + "/exercices/");
  await pg.getByRole("button", { name: "My declared equipment" }).click();
  await pg.getByPlaceholder(/Search/).fill("TRX");
  await pg.getByText("TRX row", { exact: true }).first().waitFor({ timeout: 8000 });
  const t = await pg.evaluate(() => document.body.innerText);
  ok(!/Tirage TRX|Pompes TRX|Écarté|Gainage TRX/.test(t), "EN : exercices TRX en anglais");
  await cap(pg, "trx-en");
  await ctx.close();
}

ok(!errs.length, "aucune erreur JS" + (errs.length ? " : " + errs.join(" / ") : ""));
await b.close();
srv.close();
