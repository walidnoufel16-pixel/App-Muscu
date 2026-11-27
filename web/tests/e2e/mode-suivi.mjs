/* Modes Suivi et Guidé (docs/produit/mode-suivi) : nouveau compte sans le mode Guidé (Suivi direct,
   aucun choix de mode), la question d'arrivée quand le Guidé est ouvert (présélection par le lien
   ?mode=suivi), la première séance (écran « Crée ta séance »), l'accueil du mode Suivi (récupération,
   corps → exercices au choix), la séance sans charge proposée, le changement de mode dans Profil, et la
   carte unique des comptes d'avant.
   CAPTURES=dossier pour garder des captures (390 px de large). */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8837);
const U = "http://localhost:8837";
const CAP = process.env.CAPTURES;
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };
const errs = [];
const cap = async (pg, nom) => { if (CAP) { await pg.waitForTimeout(700); await pg.screenshot({ path: `${CAP}/${nom}.png` }); } };
const jour = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
async function contexte(etat, extra = {}) {
  const ctx = await b.newContext({ locale: "fr-FR", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: "block" });
  await ctx.addInitScript(([s, x]) => {
    if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); localStorage.setItem("palier.pseudo.v1", "Alex"); for (const [k, v] of Object.entries(x)) localStorage.setItem(k, v); sessionStorage.vu = 1; }
  }, [etat, extra]);
  await ctx.route(/supabase\.co/, (r) => r.abort());
  const pg = await ctx.newPage();
  pg.on("pageerror", (x) => errs.push(x.message));
  return [ctx, pg];
}
const neuf = { A: { materiel: 0, acc: [], blessure: [], prio: [] }, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, FINI: false, wk: 0, day: 0, HIST: [], SEANCES: [], ts: Date.now() };
const ts = (d) => new Date(d + "T18:00").getTime();
const avecSeances = (A) => ({
  ...neuf, A: { ...neuf.A, accueil: true, objHebdo: 3, sexe: 0, ...A },
  SEANCES: [
    { nom: "Pecs · Épaules · Triceps", ex: [{ id: "dc", s: 3, r: 8, p: "2 min" }, { id: "el", s: 3, r: 12, p: "60 s" }] },
    { nom: "Jambes", ex: [{ id: "sq", s: 4, r: 8, p: "2 min 30" }] },
  ],
  HIST: [
    { d: jour(8), s: "L|1", nom: "Jambes", vol: 3200, ser: 4, ex: { sq: [80, 3200, 80, 10, 4] } },
    { d: jour(2), s: "L|0", nom: "Pecs · Épaules · Triceps", vol: 2000, ser: 6, ex: { dc: [70, 1600, 70, 8, 3], el: [10, 400, 10, 12, 3] }, det: [{ id: "dc", s: [[70, 8], [70, 8], [70, 8]] }, { id: "el", s: [[10, 12], [10, 12], [10, 12]] }] },
  ],
  LOG: {
    "L|1|a0": { ex: "sq", done: true, feel: null, ts: ts(jour(8)), series: [{ v: 80, reps: 10, ok: true }, { v: 80, reps: 9, ok: true }, { v: 80, reps: 8, ok: true }, { v: 75, reps: 8, ok: true }] },
  },
});

/* 0. nouveau compte, mode Guidé pas ouvert par l'admin : pas de question, Suivi seulement */
{
  const [ctx, pg] = await contexte(neuf, { "repere.source": "tiktok" });
  await pg.goto(U + "/entrainement/");
  await pg.waitForURL(/\/entrainement\/composer/, { timeout: 10000 });
  /* première séance : un écran plein, sans feuille par-dessus ni question homme ou femme */
  await pg.getByRole("heading", { name: "Crée ta séance" }).waitFor({ timeout: 10000 });
  await pg.waitForTimeout(1200);
  ok(await pg.getByRole("dialog", { name: "Ajouter un exercice" }).count() === 0 && await pg.getByText("Sur quel corps afficher tes muscles ?").count() === 0, "première séance : écran plein, ni feuille ni question homme ou femme");
  ok(await pg.getByText("Choisis ton matériel disponible").count() === 1 && await pg.getByRole("dialog").count() === 0, "le matériel d'abord, et aucune visite ni bulle par-dessus");
  await cap(pg, "0-premiere-seance");
  ok(await pg.getByText("Tu as déjà ton programme ?").count() === 0, "sans accès au Guidé : pas de question, la première séance directement");
  const A = await pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")).A);
  ok(A.mode === "suivi" && A.suiviSeul === true, "compte limité au mode Suivi");
  await pg.goto(U + "/profil/");
  await pg.getByText("Compte et réglages").waitFor();
  ok(await pg.getByRole("tab", { name: "Guidé" }).count() === 0, "Profil : pas de choix de mode");
  await pg.getByRole("button", { name: "Menu" }).first().click();
  await pg.getByText("Plus d'entraînements").waitFor();
  ok(await pg.getByText("Street workout").count() === 1 && await pg.getByText("Course à pied").count() === 1, "menu : Street workout et Course");
  ok(await pg.getByText("Créer une séance pour moi").count() === 0 && await pg.getByText("Importer une séance avec un code").count() === 0, "menu : ni séance créée par Oxa ni import");
  await ctx.close();
}

/* 1. mode Guidé ouvert, lien des réseaux (?mode=suivi) : la question, Suivi présélectionné, puis la première séance */
{
  const [ctx, pg] = await contexte(neuf, { "repere.guide": "1" });
  await pg.goto(U + "/?mode=suivi&src=tiktok");
  await pg.waitForTimeout(600);
  await pg.goto(U + "/entrainement/");
  const dlg = pg.getByRole("dialog");
  await dlg.getByText("Tu as déjà ton programme ?").waitFor({ timeout: 8000 });
  ok(await dlg.getByRole("radio", { name: /Oui, je veux suivre mes séances/ }).getAttribute("aria-checked") === "true", "lien ?mode=suivi : Suivi présélectionné");
  ok(await dlg.getByText("coach", { exact: false }).count() === 0, "jamais « coach » dans l'interface");
  await cap(pg, "1-question");
  await dlg.getByRole("button", { name: "Continuer" }).click();
  await pg.waitForURL(/\/entrainement\/composer/);
  /* « Crée ta séance » : le matériel, les muscles, les exercices courants à cocher */
  await pg.getByRole("heading", { name: "Crée ta séance" }).waitFor({ timeout: 8000 });
  await pg.getByRole("button", { name: "Quadriceps", exact: true }).click();
  const quad = pg.locator('section[aria-label="Quadriceps"]');
  await quad.waitFor();
  ok(await quad.getByRole("checkbox").count() <= 6 && /Voir les \d+ autres/.test(await quad.innerText()), "les exercices courants d'abord (6 au plus), « Voir les autres »");
  await quad.getByRole("checkbox", { name: /^Squat barre/ }).first().click();
  await cap(pg, "2-premiere-seance");
  ok(await pg.getByRole("button", { name: "Commencer · 1 exercice" }).isEnabled(), "un exercice coché : « Commencer · 1 exercice »");
  await pg.getByRole("button", { name: "Régler séries et repos avant" }).click();
  await pg.getByRole("heading", { name: "Quadriceps", exact: true }).waitFor();
  ok(await pg.getByText("Ta première séance").count() >= 1 && /1 exercice/i.test(await pg.getByText(/Ta séance · /).innerText()), "Suivi : pas de questionnaire ; la séance porte le nom de ses muscles");
  const A = await pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")).A);
  ok(A.mode === "suivi" && !A.accueil, "mode Suivi enregistré, profil sportif non demandé");
  await ctx.close();
}

/* 2. sans lien : rien de présélectionné ; « Non, guide-moi » mène au parcours d'avant */
{
  const [ctx, pg] = await contexte(neuf, { "repere.source": "insta", "repere.guide": "1" });
  await pg.goto(U + "/entrainement/");
  const dlg = pg.getByRole("dialog");
  await dlg.getByText("Tu as déjà ton programme ?").waitFor({ timeout: 8000 });
  ok(await dlg.getByRole("button", { name: "Continuer" }).isDisabled(), "sans lien : Continuer attend un choix");
  await dlg.getByRole("radio", { name: /Non, guide-moi/ }).click();
  await dlg.getByRole("button", { name: "Continuer" }).click();
  await dlg.getByText("Commencer · 1 min").waitFor();
  ok(true, "Guidé : le profil sportif d'avant");
  await ctx.close();
}

/* 3. l'accueil du mode Suivi, la séance sans charge proposée */
{
  const [ctx, pg] = await contexte(avecSeances({ mode: "suivi" }), { "repere.visite.creer": "1" });
  await pg.goto(U + "/entrainement/");
  await pg.getByText("Mes séances", { exact: true }).first().waitFor({ timeout: 8000 });
  const onglets = await pg.getByRole("navigation", { name: "Navigation principale" }).innerText();
  ok(/Séances/.test(onglets) && /Repas/.test(onglets) && /Progrès/.test(onglets) && !/Profil/.test(onglets), "onglets : Séances, Repas, Progrès (Profil par l'avatar)");
  ok(await pg.getByRole("button", { name: "Profil", exact: true }).count() >= 1, "Profil accessible par l'avatar");
  const carte = pg.locator("[data-seance-prochaine]");
  ok(/Jambes/.test(await carte.innerText()) && /Dernière fois .* · squat barre 80 × 10/.test(await carte.innerText()), "prochaine : Jambes, « Dernière fois … · squat barre 80 × 10 »");
  ok(await pg.getByText("Récupération").count() >= 1, "récupération, comme en Guidé");
  ok(await pg.getByText("Oxa te propose").count() === 0 && await pg.getByText("Plus d'entraînements").count() === 0, "ni séance proposée ni rubriques sur l'accueil");
  await cap(pg, "3-accueil-suivi");
  /* la feuille de récupération, sans « Séance avec les muscles prêts » */
  await pg.getByText("Récupération").first().click();
  await pg.getByRole("dialog").getByText("D'après tes séances des 14 derniers jours.").waitFor();
  ok(await pg.getByText("Séance avec les muscles prêts").count() === 0, "récupération : pas de séance construite par Oxa");
  await pg.keyboard.press("Escape");
  await pg.waitForTimeout(500);
  /* le corps : toucher les pectoraux propose leurs exercices */
  const corps = pg.locator('svg[aria-label="Schéma du corps"]').first();
  await corps.scrollIntoViewIfNeeded();
  await corps.locator("path", { has: pg.locator("title", { hasText: "Pectoraux" }) }).first().click();
  await pg.getByRole("button", { name: /Choisir mes exercices · Pectoraux/ }).click();
  await pg.waitForURL(/\/entrainement\/composer/);
  /* la feuille s'ouvre avec les pectoraux déjà touchés ; on ajoute les triceps sur le corps */
  const feuille = pg.getByRole("dialog", { name: "Ajouter un exercice" });
  await feuille.locator('section[aria-label="Pectoraux"]').waitFor({ timeout: 8000 });
  ok(/Plusieurs muscles, le plus lourd : en premier/.test(await feuille.locator('section[aria-label="Pectoraux"]').innerText()), "Base, Complément, Isolation : une ligne d'explication");
  await feuille.locator('svg[aria-label="Schéma du corps"] path', { has: pg.locator("title", { hasText: "Triceps" }) }).first().click();
  await feuille.locator('section[aria-label="Triceps"]').waitFor();
  ok(await feuille.locator("section[aria-label] h3").count() === 2, "plusieurs muscles : les exercices de chacun, dessous");
  await cap(pg, "3a-feuille-muscles");
  if (process.env.CAPTURES) { await feuille.locator('section[aria-label="Pectoraux"]').scrollIntoViewIfNeeded(); await cap(pg, "3a2-feuille-exercices"); }
  await feuille.locator('section[aria-label="Pectoraux"] button[aria-label^="Ajouter "]').first().click();
  await feuille.locator('section[aria-label="Triceps"] button[aria-label^="Ajouter "]').first().click();
  await feuille.getByRole("button", { name: /^Terminé/ }).click();
  await pg.waitForTimeout(500);
  /* la feuille refermée (animation finie) : la page redevient accessible */
  await pg.getByRole("button", { name: "Juste aujourd'hui, sans l'enregistrer" }).waitFor({ timeout: 8000 });
  ok(/2 exercices/i.test(await pg.getByText(/Ta séance · /).innerText()), "un toucher par exercice l'ajoute à la séance");
  ok(await pg.getByRole("button", { name: "Enregistrer", exact: true }).count() === 1 && await pg.getByRole("button", { name: "Commencer", exact: true }).count() === 1 && await pg.getByRole("button", { name: "Juste aujourd'hui, sans l'enregistrer" }).count() === 1, "trois choix : Enregistrer, Commencer, Juste aujourd'hui");
  ok(/ kg/.test(await pg.locator("[data-carte]").first().innerText()), "composeur : la charge proposée, comme en Guidé");
  ok(await pg.getByRole("button", { name: /^Objectif/ }).count() === 0, "aucun réglage en plus");
  await cap(pg, "3b-corps-exercices");
  const avant = await pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")).SEANCES.length);
  await pg.getByRole("button", { name: "Juste aujourd'hui, sans l'enregistrer" }).click();
  await pg.waitForURL(/\/entrainement\/seance/);
  const S = await pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")).SEANCES);
  ok(S.length === avant + 1 && S.at(-1).auto === true, "Juste aujourd'hui : la séance se lance, hors de Mes séances");
  await pg.goto(U + "/entrainement/");
  await pg.locator("[data-seance-prochaine]").waitFor();
  ok(!(await pg.locator('section[aria-label="Mes séances"]').innerText()).includes(S.at(-1).nom), "elle n'apparaît pas dans Mes séances");
  await pg.locator("[data-seance-prochaine]").waitFor();
  await pg.locator("[data-seance-prochaine]").getByRole("button", { name: "Commencer" }).click();
  await pg.waitForURL(/\/entrainement\/seance/);
  await pg.locator('[data-ex="sq"]').first().waitFor();
  if (!(await pg.locator('input[aria-label="kg série 1"]').count())) await pg.locator('[data-ex="sq"] button').first().click();
  await pg.locator('input[aria-label="kg série 1"]').waitFor();
  const kg = await Promise.all([1, 2, 3, 4].map((n) => pg.locator(`input[aria-label="kg série ${n}"]`).inputValue()));
  const reps = await Promise.all([1, 2, 3, 4].map((n) => pg.locator(`input[aria-label="répétitions série ${n}"]`).inputValue()));
  /* la charge suivante, proposée comme en Guidé : la même dans chaque case, au moins celle de la dernière fois */
  ok(new Set(kg).size === 1 && +kg[0].replace(",", ".") >= 80 && new Set(reps).size === 1 && +reps[0] > 0, "cases préremplies avec la proposition : " + kg.join("/") + " × " + reps.join("/"));
  ok(await pg.getByText(/Pourquoi .* kg/).count() === 1, "« Pourquoi x kg ? » affiché");
  ok(await pg.getByText("RPE", { exact: false }).count() === 0, "pas d'effort (RPE) conseillé");
  ok(await pg.getByText("Comment tu te sens", { exact: false }).count() === 0, "pas de « Comment tu te sens ? »");
  ok(await pg.getByText("Précédent").count() >= 1, "colonne « Précédent » gardée");
  await cap(pg, "4-seance-suivi");
  await ctx.close();
}

/* 3 ter. première fois sur un exercice, en mode Suivi : rien à suivre, la case KG part vide */
{
  const [ctx, pg] = await contexte({ ...neuf, A: { ...neuf.A, accueil: true, mode: "suivi", sexe: 0 }, SEANCES: [{ nom: "Jambes", ex: [{ id: "sq", s: 3, r: 8, p: "2 min" }] }] });
  await pg.goto(U + "/entrainement/seance/?l=0");
  await pg.locator('[data-ex="sq"]').first().waitFor({ timeout: 8000 });
  if (!(await pg.locator('input[aria-label="kg série 1"]').count())) await pg.locator('[data-ex="sq"] button').first().click();
  await pg.locator('input[aria-label="kg série 1"]').waitFor();
  const kg = await pg.locator('input[aria-label="kg série 1"]').inputValue(), reps = await pg.locator('input[aria-label="répétitions série 1"]').inputValue();
  ok(kg === "" && reps === "8", "première fois : case KG vide, répétitions de la séance (" + JSON.stringify([kg, reps]) + ")");
  ok(await pg.getByText(/Pourquoi .* kg/).count() === 0, "première fois : pas de « Pourquoi x kg ? »");
  await pg.locator('input[aria-label="kg série 1"]').fill("60");
  await pg.locator('input[aria-label="kg série 1"]').blur();
  await pg.waitForTimeout(300);
  ok(await pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")).LOG["L|0|0"]?.series?.[0]?.v) === 60, "la charge notée est gardée");
  await cap(pg, "4b-premiere-fois");
  await ctx.close();
}

/* 3 quater. Repas en mode Suivi : les recettes seulement, selon les préférences */
{
  const [ctx, pg] = await contexte(avecSeances({ mode: "suivi" }));
  await pg.goto(U + "/repas/");
  await pg.getByText("Des repas pensés pour ton entraînement").waitFor({ timeout: 8000 });
  ok(await pg.getByText("7 · Ton budget courses").count() === 0, "préférences : sans budget courses");
  await pg.getByRole("button", { name: "C'est parti" }).click();
  await pg.getByText(/recettes? pour toi/).waitFor();
  ok(await pg.getByRole("tab", { name: "Aujourd'hui" }).count() === 0 && await pg.getByRole("tab", { name: "Ma semaine" }).count() === 0, "ni Aujourd'hui ni Ma semaine : les recettes seulement");
  await pg.goto(U + "/repas/?v=semaine");
  await pg.getByText(/recettes? pour toi/).waitFor();
  ok(await pg.getByText("Ma semaine", { exact: true }).count() === 0, "un lien vers Ma semaine mène aux recettes");
  await cap(pg, "7-repas-recettes");
  await ctx.close();
}

/* 3 quinquies. la visite guidée du mode Suivi : ses propres bulles, puis la prochaine séance */
{
  const [ctx, pg] = await contexte({ ...avecSeances({ mode: "suivi" }), HIST: [], LOG: {} });
  await pg.goto(U + "/entrainement/");
  /* elle ne démarre plus d'elle-même : le bouton « Découvrir l'app » la propose */
  await pg.getByRole("button", { name: /^Découvrir l'app/ }).waitFor({ timeout: 8000 });
  await pg.waitForTimeout(1500);
  ok(await pg.getByText("Faire la visite · 30 s").count() === 0, "visite : pas de feuille qui s'ouvre toute seule");
  await pg.getByRole("button", { name: /^Découvrir l'app/ }).click();
  await pg.getByText("Noter tes séances").waitFor({ timeout: 8000 });
  ok(await pg.getByText("Ta séance du jour, prête selon tes muscles récupérés").count() === 0, "visite Suivi : pas de séance du jour promise");
  await cap(pg, "8-visite-bienvenue");
  await pg.getByRole("button", { name: "Faire la visite · 30 s" }).click();
  const vus = [];
  for (let i = 0; i < 10; i++) {
    const d = pg.locator('[role="dialog"][aria-modal="true"]').filter({ has: pg.getByRole("button", { name: "Suivant" }) });
    if (!(await d.count())) { await pg.waitForTimeout(1500); if (!(await d.count())) break; }
    vus.push(await d.getAttribute("aria-label"));
    if (i === 0) await cap(pg, "8b-visite-bulle");
    await d.getByRole("button", { name: "Suivant" }).click();
    await pg.waitForTimeout(700);
  }
  ok(vus[0] === "Tes séances, comme dans ton carnet" && vus.includes("Choisis tes muscles") && vus.includes("Des recettes pour toi") && !vus.includes("Tes séances à toi"), "bulles du mode Suivi : " + vus.join(" › "));
  await pg.getByText("Ta prochaine séance t'attend").waitFor();
  await pg.getByRole("button", { name: "Commencer", exact: true }).last().click();
  await pg.waitForURL(/\/entrainement\/seance/);
  ok(true, "fin de la visite : « Commencer » ouvre la prochaine séance");
  await ctx.close();
}

/* 4. Profil : changer de mode, sans rien perdre */
{
  const [ctx, pg] = await contexte(avecSeances({ mode: "suivi" }));
  await pg.goto(U + "/profil/");
  await pg.getByRole("tab", { name: "Guidé" }).click();
  await pg.waitForTimeout(300);
  const onglets = await pg.getByRole("navigation", { name: "Navigation principale" }).innerText();
  ok(/Repas/.test(onglets) && /Entraînement/.test(onglets), "Guidé : les onglets d'avant reviennent");
  const e = await pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")));
  ok(e.A.mode === "guide" && e.SEANCES.length === 2 && e.HIST.length === 2, "changement sans perte de données");
  await pg.getByRole("tab", { name: "Suivi" }).click();
  await cap(pg, "5-profil-mode");
  await ctx.close();
}

/* 5. compte d'avant le réglage : Guidé, avec une carte unique qui propose le mode Suivi */
{
  const [ctx, pg] = await contexte(avecSeances({}));
  await pg.goto(U + "/entrainement/");
  await pg.getByRole("button", { name: "Passer en Suivi" }).waitFor({ timeout: 8000 });
  await cap(pg, "6-carte-suivi");
  await pg.getByRole("button", { name: "Passer en Suivi" }).click();
  await pg.locator("[data-seance-prochaine]").waitFor();
  ok(true, "la carte fait passer en Suivi");
  await pg.reload();
  await pg.locator("[data-seance-prochaine]").waitFor();
  ok(await pg.getByRole("button", { name: "Passer en Suivi" }).count() === 0, "la carte ne revient pas");
  await ctx.close();
}

ok(!errs.length, "aucune erreur de page" + (errs.length ? " : " + errs.slice(0, 3).join(" | ") : ""));
await b.close();
srv.close();
