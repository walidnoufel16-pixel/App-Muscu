/* Modes Suivi et Guidé (docs/produit/mode-suivi) : nouveau compte sans le mode Guidé (Suivi direct,
   aucun choix de mode), la question d'arrivée quand le Guidé est ouvert (présélection par le lien
   ?mode=suivi), la première séance « Comme dans ton carnet », l'accueil du mode Suivi (récupération,
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
    { d: jour(2), s: "L|0", nom: "Pecs · Épaules · Triceps", vol: 2000, ser: 6, ex: { dc: [70, 1600, 70, 8, 3], el: [10, 400, 10, 12, 3] } },
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
  await pg.getByRole("heading", { name: "Comme dans ton carnet." }).waitFor();
  ok(await pg.getByText("Tu as déjà ton programme ?").count() === 0, "sans accès au Guidé : pas de question, la première séance directement");
  const A = await pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")).A);
  ok(A.mode === "suivi" && A.suiviSeul === true, "compte limité au mode Suivi");
  await pg.goto(U + "/profil/");
  await pg.getByText("Compte et réglages").waitFor();
  ok(await pg.getByRole("tab", { name: "Guidé" }).count() === 0, "Profil : pas de choix de mode");
  await pg.getByRole("button", { name: "Menu" }).first().click();
  await pg.getByText("Plus d'entraînements").waitFor();
  ok(await pg.getByText("Créer une séance pour moi").count() === 0, "menu : pas de séance créée par Oxa");
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
  await pg.getByRole("heading", { name: "Comme dans ton carnet." }).waitFor();
  ok(await pg.getByText("Ta première séance").count() >= 1, "Suivi : pas de questionnaire, la première séance à écrire");
  await pg.getByLabel("Nom de la séance").fill("Jambes");
  await cap(pg, "2-premiere-seance");
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
  const [ctx, pg] = await contexte(avecSeances({ mode: "suivi" }));
  await pg.goto(U + "/entrainement/");
  await pg.getByText("Mes séances", { exact: true }).first().waitFor({ timeout: 8000 });
  const onglets = await pg.getByRole("navigation", { name: "Navigation principale" }).innerText();
  ok(/Séances/.test(onglets) && /Progrès/.test(onglets) && /Profil/.test(onglets) && !/Repas/.test(onglets), "onglets : Séances, Progrès, Profil");
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
  await pg.getByText("Choisis tes exercices").waitFor();
  ok(await pg.locator('[aria-label="Exercices des muscles choisis"] h3').first().innerText() === "Pectoraux", "corps → les exercices des pectoraux, au choix");
  await pg.locator('[aria-label="Exercices des muscles choisis"] button[aria-label^="Ajouter "]').first().click();
  await pg.waitForTimeout(300);
  ok(/1 exercice/i.test(await pg.getByText(/Ta séance · /).innerText()), "un toucher l'ajoute à la séance");
  ok(/ kg/.test(await pg.locator("[data-carte]").first().innerText()), "composeur : la charge proposée, comme en Guidé");
  ok(await pg.getByRole("button", { name: /^Objectif/ }).count() === 0, "aucun réglage en plus");
  await cap(pg, "3b-corps-exercices");
  await pg.goto(U + "/entrainement/");
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
