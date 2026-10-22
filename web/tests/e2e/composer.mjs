/* Composer une séance exercice par exercice : la feuille d'ajout ouvre le corps d'abord,
   une zone touchée montre la musculation puis le soin & mobilité ; la séance se range en
   parties (soin, musculation, cardio) dans l'ordre choisi, jusque dans le lecteur.
   CAPTURES=dossier pour garder des captures. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8822);
const U = "http://localhost:8822";
const CAP = process.env.CAPTURES;
const etat = (seances = []) => ({
  A: { objectif: 0, regularite: 2, socle: 1, axe: 0, materiel: 0, acc: [], blessure: [], sexe: 0, prio: [], actuel: 0, profil: { "Âge": 30, Taille: 180, Poids: 78 } },
  LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, FINI: true, wk: 0, day: 0, HIST: [], SEANCES: seances, ts: Date.now(),
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
const cap = async (pg, nom) => { if (CAP) { await pg.waitForTimeout(900); await pg.screenshot({ path: `${CAP}/${nom}.png` }); } };
const titres = (pg) => pg.locator("[data-titre-partie]").evaluateAll((l) => l.map((x) => x.dataset.titrePartie));

{
  const [ctx, pg] = await contexte(etat());
  await pg.goto(U + "/entrainement/");
  await pg.getByText("Composer exercice par exercice").click();
  await pg.waitForURL(/\/entrainement\/composer\/?$/);
  await pg.getByRole("button", { name: "Exercice", exact: true }).click();
  const feuille = pg.getByRole("dialog");
  await feuille.getByText("Ajouter un exercice").first().waitFor();
  const onglets = await feuille.getByRole("tablist", { name: "Affichage de la bibliothèque" }).getByRole("tab").allTextContents();
  ok(onglets.join(",") === "Corps,Liste", `feuille : Corps puis Liste (${onglets})`);
  ok(await feuille.getByRole("tab", { name: "Corps" }).getAttribute("aria-selected") === "true", "le corps est ouvert par défaut");

  /* épaules : musculation, puis soin & mobilité */
  await pg.waitForTimeout(800); // fin de l'animation de la feuille
  { const m = feuille.getByRole("button", { name: "Mon matériel déclaré" }); if (await m.count()) await m.click(); } // rien n'est coché au départ
  await feuille.locator("path", { has: pg.locator("title", { hasText: "Épaule avant" }) }).first().click({ force: true });
  const muscu = feuille.getByRole("region", { name: "Musculation" }), soin = feuille.getByRole("region", { name: "Soin & mobilité" });
  await soin.waitFor();
  ok(await soin.getByText("Cercles de bras").count() === 1 && await soin.getByText("Bras croisé devant la poitrine").count() === 1, "épaules : cercles de bras et étirement dans Soin & mobilité");
  ok(await muscu.getByText("Cercles de bras").count() === 0 && await muscu.getByRole("button", { name: /^Ajouter / }).count() > 0, "épaules : la musculation sans exercice de soin");
  await soin.scrollIntoViewIfNeeded();
  await cap(pg, "composer-epaules");

  /* soin, puis muscu, puis un bloc cardio */
  await soin.getByRole("button", { name: /^Ajouter Bras croisé/ }).click();
  await muscu.getByRole("button", { name: /^Ajouter / }).first().click();
  await soin.getByRole("button", { name: /^Ajouter Cercles de bras/ }).click();
  await feuille.getByRole("button", { name: /^Terminé/ }).click();
  await pg.waitForTimeout(500);
  await pg.getByRole("button", { name: "Bloc cardio", exact: true }).click();
  await pg.getByRole("button", { name: "OK", exact: true }).click();
  await pg.waitForTimeout(500);
  ok((await titres(pg)).join(",") === "soin,muscu,cardio", `trois parties dans l'ordre d'ajout (${await titres(pg)})`);
  const soinCartes = await pg.locator('[data-partie="soin"] [data-carte]').count();
  ok(soinCartes === 2, `les deux exercices de soin regroupés, même ajoutés à des moments différents (${soinCartes})`);
  await cap(pg, "composer-parties");

  await pg.getByRole("button", { name: "Monter la partie Cardio" }).click();
  await pg.waitForTimeout(300);
  ok((await titres(pg)).join(",") === "soin,cardio,muscu", "↑ sur Cardio : le cardio passe avant la musculation");

  await pg.locator("#nom").fill("Mixte");
  await pg.getByRole("button", { name: "Enregistrer la séance" }).click();
  await pg.waitForURL(/\/entrainement\/?$/);
  await pg.getByRole("button", { name: /^Mixte \d/ }).click();
  await pg.waitForURL(/seance/);
  await pg.locator("[data-titre-partie]").first().waitFor({ timeout: 8000 });
  ok((await titres(pg)).join(",") === "soin,cardio,muscu", "pendant la séance : les mêmes parties, dans le même ordre");
  await cap(pg, "seance-parties");
  await ctx.close();
}

{
  /* Une séance d'une seule partie : pas de titre de partie. */
  const [ctx, pg] = await contexte(etat([{ nom: "Push", ex: [{ id: "dc", s: 3, r: 8, p: "2 min" }, { id: "dmh", s: 3, r: 10, p: "90 s" }] }]));
  await pg.goto(U + "/entrainement/seance?l=0");
  await pg.getByText("Développé couché barre").first().waitFor({ timeout: 8000 });
  ok(await pg.locator("[data-titre-partie]").count() === 0, "séance de musculation seule : pas de titre de partie");
  await ctx.close();
}

{
  /* En anglais : titres de partie traduits. */
  const [ctx, pg] = await contexte(etat([{ nom: "Mix", ex: [{ id: "elrot", s: 2, r: 15, p: "30 s" }, { id: "dc", s: 3, r: 8, p: "2 min" }] }]), "en");
  await pg.goto(U + "/entrainement/seance?l=0");
  await pg.locator("[data-titre-partie]").first().waitFor({ timeout: 8000 });
  const t = await pg.locator("[data-titre-partie] h3").allTextContents();
  ok(t.every((x) => !/[éèàçêûôîœ]|Soin|Musculation/.test(x)), `EN : titres de partie traduits (${t.join(" | ")})`);
  await ctx.close();
}

{
  /* Séance entamée puis modifiée : chaque exercice garde ses propres séries. */
  const auj = Date.now();
  const J = (ex, v) => ({ v, ex, nb: 3, ts: auj, done: true, feel: null, reps: 10, series: [0, 1, 2].map(() => ({ v, reps: 10, ok: true })) });
  const s = { nom: "Bras", ex: [{ id: "cuban", s: 3, r: 10, p: "90 s" }, { id: "tricor", s: 3, r: 10, p: "90 s" }, { id: "dipt", s: 3, r: 10, p: "90 s" }] };
  const e = { ...etat([s]), LOG: { "L|0|0": J("cuban", 4), "L|0|1": J("tricor", 9) } };
  const [ctx, pg] = await contexte(e);
  await pg.goto(U + "/entrainement/seance?l=0");
  await pg.getByRole("button", { name: "Modifier" }).click();
  await pg.waitForURL(/composer/);
  /* retirer le 1er exercice, ajouter un exercice de soin et remonter sa partie en tête */
  await pg.locator('[data-carte="cuban"] button[aria-expanded]').first().click();
  await pg.getByRole("button", { name: "Retirer" }).first().click();
  await pg.getByRole("button", { name: "Exercice", exact: true }).click();
  await pg.waitForTimeout(800);
  { const m = pg.getByRole("dialog").getByRole("button", { name: "Mon matériel déclaré" }); if (await m.count()) await m.click(); }
  await pg.getByRole("dialog").locator("path", { has: pg.locator("title", { hasText: "Épaule avant" }) }).first().click({ force: true });
  await pg.getByRole("dialog").getByRole("region", { name: "Soin & mobilité" }).getByRole("button", { name: /^Ajouter Cercles de bras/ }).click();
  await pg.getByRole("dialog").getByRole("button", { name: /^Terminé/ }).click();
  await pg.waitForTimeout(400);
  await pg.getByRole("button", { name: "Monter la partie Soin & mobilité" }).click();
  await pg.getByRole("button", { name: "Enregistrer la séance" }).click();
  await pg.waitForURL(/seance/);
  const st = await pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")));
  const ids = st.SEANCES[0].ex.map((x) => x.id), L = st.LOG;
  ok(ids.join(",") === "cbras,tricor,dipt", `séance modifiée : ${ids}`);
  ok(!L["L|0|0"] && L["L|0|1"]?.ex === "tricor" && L["L|0|1"].series[0].v === 9 && !L["L|0|2"], "les séries du triceps l'ont suivi, les dips et le soin sont vierges");
  ok(L["L|0|a0"]?.ex === "cuban", "le cuban press retiré : séries mises de côté, pas effacées");
  ok(st.SEANCES[0].ex.every((x) => x.o === undefined), "rien de temporaire enregistré");
  await ctx.close();
}

ok(!errs.length, "aucune erreur JS" + (errs.length ? " : " + errs.join(" / ") : ""));
await b.close();
srv.close();
