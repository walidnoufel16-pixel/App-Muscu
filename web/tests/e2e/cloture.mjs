/* « Ajouter à mon suivi » : une séance libre finie est rangée dans Progrès et repart vierge ;
   « Précédent » montre la dernière fois que l'exercice figure dans Progrès.
   CAPTURES=dossier pour garder des captures. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8825);
const U = "http://localhost:8825";
const CAP = process.env.CAPTURES;
const PUSH = { nom: "Push", ex: [{ id: "dmh", s: 2, r: 10, p: "60 s" }, { id: "tri", s: 2, r: 12, p: "60 s" }] };
const etat = (seances, extra = {}) => ({
  A: { objectif: 0, regularite: 2, socle: 1, axe: 0, materiel: 0, acc: [], blessure: [], sexe: 0, prio: [], actuel: 0, profil: { "Âge": 30, Taille: 180, Poids: 78 } },
  LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, FINI: true, wk: 0, day: 0, HIST: [], SEANCES: seances, ts: Date.now(), ...extra,
});
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };
const errs = [];
async function contexte(e, langue, visiteSeance = false) {
  const ctx = await b.newContext({ locale: "fr-FR", viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, serviceWorkers: "block" });
  await ctx.addInitScript(([s, l, v]) => {
    if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); if (l) localStorage.setItem("repere.langue.v1", l); if (!v) localStorage.setItem("repere.visite.seance", "1"); localStorage.setItem("repere.visite.creer", "1"); localStorage.setItem("repere.visite.creer", "1"); sessionStorage.vu = 1; }
  }, [e, langue, visiteSeance]);
  await ctx.route(/supabase\.co/, (r) => r.abort());
  const pg = await ctx.newPage();
  pg.on("pageerror", (x) => errs.push(x.message));
  return [ctx, pg];
}
const cap = async (pg, nom) => { if (CAP) { await pg.waitForTimeout(900); await pg.screenshot({ path: `${CAP}/${nom}.png` }); } };
const etatLu = (pg) => pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")));

{
  /* Première séance sur l'appareil : la visite de la séance, 5 bulles posées sur la vraie séance */
  const [ctx, pg] = await contexte(etat([PUSH]), null, true);
  await pg.goto(U + "/entrainement/seance?l=0");
  const bulle = pg.locator('[role="dialog"][aria-modal="true"]');
  const titres = [];
  for (let k = 0; k < 5; k++) {
    await bulle.locator("h3").waitFor({ timeout: 6000 }).catch(() => {});
    if (!(await bulle.count())) break;
    titres.push(await bulle.locator("h3").innerText());
    await bulle.getByRole("button", { name: /^(Suivant|C'est parti)$/ }).click();
    await pg.waitForTimeout(450);
  }
  ok(JSON.stringify(titres) === JSON.stringify(["Note ta série", "Valide-la", "Ajuste ton repos", "Remplace un exercice", "Regarde comment faire"]), "visite de la séance : " + titres.join(", "));
  await pg.reload();
  await pg.waitForTimeout(1800);
  ok(await bulle.count() === 0, "visite de la séance : une seule fois");
  await ctx.close();
}

{
  /* Menu ☰ › Visites guidées › « Ta séance » : une démonstration, rien n'est enregistré */
  const [ctx, pg] = await contexte(etat([PUSH]), null, true);
  await pg.goto(U + "/entrainement/");
  await pg.waitForTimeout(1500);
  const avant = await etatLu(pg);
  await pg.getByRole("button", { name: "Menu" }).first().click();
  await pg.getByRole("button", { name: /^Visites guidées/ }).click();
  const feuille = pg.getByRole("dialog").filter({ hasText: "Visites guidées" });
  await feuille.getByText("Ta séance", { exact: true }).waitFor();
  ok(await feuille.getByText("Créer ta séance", { exact: true }).count() === 1 && await feuille.getByText("Découvrir l'app", { exact: true }).count() === 1, "Visites guidées : les 3 visites listées");
  /* dans l'ordre : Découvrir l'app, Créer ta séance, Ta séance */
  await feuille.getByRole("button", { name: /^(Lancer|Revoir)$/ }).nth(2).click();
  await pg.waitForURL(/demo=1/);
  await pg.getByText("essaie tout, rien n'est enregistré.").waitFor();
  const bulle = pg.locator('[role="dialog"][aria-modal="true"]');
  await bulle.locator("h3").waitFor({ timeout: 6000 });
  ok((await bulle.locator("h3").innerText()) === "Note ta série", "démonstration : la visite de la séance démarre");
  await bulle.getByRole("button", { name: "Passer" }).click();
  await pg.getByRole("button", { name: /^Valider la série 1/ }).first().click();
  await pg.waitForTimeout(500);
  await pg.getByRole("button", { name: "Quitter" }).click();
  await pg.waitForURL(/\/entrainement\/?$/);
  await pg.waitForTimeout(800);
  const apres = await etatLu(pg);
  ok(apres.SEANCES.length === avant.SEANCES.length && JSON.stringify(apres.LOG) === JSON.stringify(avant.LOG) && (apres.HIST || []).length === (avant.HIST || []).length, "démonstration : rien d'enregistré (séances, séries, historique)");
  await pg.reload(); await pg.waitForTimeout(1200);
  const relu = await etatLu(pg);
  ok(relu.SEANCES.length === avant.SEANCES.length, "démonstration : rien après rechargement non plus");
  await ctx.close();
}

{
  /* Séance finie : le bilan propose « Ajouter à mon suivi », puis Progrès ; la séance repart vierge. */
  const [ctx, pg] = await contexte(etat([PUSH]));
  await pg.goto(U + "/entrainement/seance?l=0");
  await pg.locator('[data-ex="dmh"]').first().waitFor({ timeout: 8000 });
  ok(await pg.getByRole("region", { name: "Ajouter à mon suivi" }).count() === 0, "rien de validé : pas de carte de suivi");
  for (const id of ["dmh", "tri"]) {
    const c = pg.locator(`[data-ex="${id}"]`).first();
    if ((await c.locator("button[aria-expanded]").first().getAttribute("aria-expanded")) !== "true") await c.locator("button[aria-expanded]").first().click();
    await c.getByRole("button", { name: "Tout valider" }).click();
    /* l'exercice terminé reste ouvert sur la question du ressenti : la réponse, puis « Continuer » */
    await c.getByRole("button", { name: "Juste" }).click();
    await c.getByRole("button", { name: "Continuer" }).click();
    await pg.waitForTimeout(900);
  }
  const bilan = pg.getByRole("dialog");
  await bilan.getByRole("button", { name: "Terminer" }).waitFor({ timeout: 8000 });
  ok(await bilan.getByRole("button", { name: "Plus tard" }).count() === 0, "bilan d'une séance libre : un seul bouton « Terminer », rangement automatique");
  await cap(pg, "cloture-bilan");
  const avant = (await etatLu(pg)).HIST.length;
  await bilan.getByRole("button", { name: "Terminer" }).click();
  await pg.waitForURL(/\/progres\/?$/);
  ok(true, "le bouton ouvre Progrès");
  await pg.waitForTimeout(800);
  const st = await etatLu(pg);
  ok(!Object.keys(st.LOG).some((k) => /^L\|0\|\d+$/.test(k)) && Object.keys(st.LOG).some((k) => /^L\|0\|a/.test(k)), "journaux mis de côté (L|0|aN)");
  ok(st.HIST.length === avant && st.HIST.at(-1).s === "L|0" && st.HIST.at(-1).ser === 4, `Progrès : la séance, 4 séries (${st.HIST.at(-1)?.ser})`);
  await cap(pg, "cloture-progres");

  /* rouverte : vierge, « Précédent » rempli */
  await pg.goto(U + "/entrainement/seance?l=0");
  await pg.locator('[data-ex="dmh"]').first().waitFor({ timeout: 8000 });
  { const l = pg.locator('[data-ex="dmh"] button[aria-expanded]').first(); if ((await l.getAttribute("aria-expanded")) !== "true") await l.click().catch(() => {}); }
  await pg.getByRole("button", { name: "Valider la série 1" }).first().waitFor();
  ok(await pg.getByRole("button", { name: /^Décocher la série/ }).count() === 0, "séance rouverte : aucune case cochée");
  const prec = await pg.locator('[data-ex="dmh"]').innerText();
  ok(/× 10/.test(prec), "« Précédent » : les séries de la séance enregistrée" + (/× 10/.test(prec) ? "" : " → " + prec.replace(/\n/g, " | ")));
  await cap(pg, "cloture-vierge");
  await ctx.close();
}

{
  /* Séance entamée, sans bilan : la carte en bas, la confirmation, puis Progrès. */
  const [ctx, pg] = await contexte(etat([PUSH]));
  await pg.goto(U + "/entrainement/seance?l=0");
  await pg.locator('[data-ex="dmh"]').first().waitFor({ timeout: 8000 });
  { const l = pg.locator('[data-ex="dmh"] button[aria-expanded]').first(); if ((await l.getAttribute("aria-expanded")) !== "true") await l.click().catch(() => {}); }
  await pg.getByRole("button", { name: "Valider la série 1" }).first().click();
  const carte = pg.getByRole("region", { name: "Ajouter à mon suivi" });
  await carte.waitFor();
  await carte.scrollIntoViewIfNeeded();
  await cap(pg, "cloture-carte");
  await carte.getByRole("button", { name: "Ajouter à mon suivi" }).click();
  const conf = pg.getByRole("alertdialog").or(pg.getByRole("dialog"));
  await conf.getByText(/2 exercices ne sont pas terminés/).waitFor();
  ok(true, "confirmation : 2 exercices pas terminés");
  await conf.getByRole("button", { name: "Ajouter", exact: true }).click();
  await pg.waitForURL(/\/progres\/?$/);
  const st = await etatLu(pg);
  ok(st.HIST.at(-1)?.ser === 1 && !st.LOG["L|0|0"], "seule la série validée compte, la séance repart vierge");
  await ctx.close();
}

{
  /* Programme : le bilan garde « Terminer ». En anglais : « Add to my log ». */
  const [ctx, pg] = await contexte(etat([PUSH]), "en");
  await pg.goto(U + "/entrainement/seance?l=0");
  await pg.locator('[data-ex="dmh"]').first().waitFor({ timeout: 8000 });
  { const l = pg.locator('[data-ex="dmh"] button[aria-expanded]').first(); if ((await l.getAttribute("aria-expanded")) !== "true") await l.click().catch(() => {}); }
  await pg.getByRole("button", { name: /^Complete set 1|^Validate set 1|set 1/ }).first().click();
  const carte = pg.getByRole("region", { name: "Add to my log" });
  await carte.waitFor({ timeout: 8000 });
  ok(!/[éèàç]/.test(await carte.innerText()), "EN : carte de suivi en anglais");
  await ctx.close();
}

ok(!errs.length, "aucune erreur JS" + (errs.length ? " : " + errs.join(" / ") : ""));
await b.close();
srv.close();
