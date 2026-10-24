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
const etatLu = (pg) => pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")));

{
  /* Séance finie : le bilan propose « Ajouter à mon suivi », puis Progrès ; la séance repart vierge. */
  const [ctx, pg] = await contexte(etat([PUSH]));
  await pg.goto(U + "/entrainement/seance?l=0");
  await pg.locator('[data-ex="dmh"]').first().waitFor({ timeout: 8000 });
  ok(await pg.getByRole("region", { name: "Ajouter à mon suivi" }).count() === 0, "rien de validé : pas de carte de suivi");
  for (const id of ["dmh", "tri"]) {
    const c = pg.locator(`[data-ex="${id}"]`).first();
    if ((await c.locator("button[aria-expanded]").getAttribute("aria-expanded")) !== "true") await c.locator("button[aria-expanded]").click();
    await c.getByRole("button", { name: "Tout valider" }).click();
    await pg.waitForTimeout(900);
  }
  const bilan = pg.getByRole("dialog");
  await bilan.getByRole("button", { name: "Ajouter à mon suivi" }).waitFor({ timeout: 8000 });
  ok(await bilan.getByRole("button", { name: "Plus tard" }).count() === 1, "bilan d'une séance libre : « Ajouter à mon suivi » et « Plus tard »");
  await cap(pg, "cloture-bilan");
  const avant = (await etatLu(pg)).HIST.length;
  await bilan.getByRole("button", { name: "Ajouter à mon suivi" }).click();
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
  await pg.locator('[data-ex="dmh"] button[aria-expanded]').first().click().catch(() => {});
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
  await pg.locator('[data-ex="dmh"] button[aria-expanded]').first().click().catch(() => {});
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
  await pg.locator('[data-ex="dmh"] button[aria-expanded]').first().click().catch(() => {});
  await pg.getByRole("button", { name: /^Complete set 1|^Validate set 1|set 1/ }).first().click();
  const carte = pg.getByRole("region", { name: "Add to my log" });
  await carte.waitFor({ timeout: 8000 });
  ok(!/[éèàç]/.test(await carte.innerText()), "EN : carte de suivi en anglais");
  await ctx.close();
}

ok(!errs.length, "aucune erreur JS" + (errs.length ? " : " + errs.join(" / ") : ""));
await b.close();
srv.close();
