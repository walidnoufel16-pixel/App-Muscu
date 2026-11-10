/* Le menu du jour (plus de « Oxa te propose ») : l'accueil n'affiche pas de proposition ; le bouton +
   (ou un jour) ouvre créer pour moi / composer / importer et Mes séances ; « Ajouter aujourd'hui »
   programme la séance (la carte « Aujourd'hui · prévue » apparaît), « Programmer un autre jour » passe
   par la feuille Programmer ; l'assistant ouvert pour un jour à venir crée et programme ce jour-là.
   CAPTURES=dossier pour garder des captures. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8811);
const U = "http://localhost:8811";
const deux = (n) => String(n).padStart(2, "0");
const jour = (d) => `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
const il = (n) => { const d = new Date(); d.setHours(12); d.setDate(d.getDate() - n); return jour(d); };
const H = [{ d: il(1), s: "L|0", nom: "Push", vol: 1000, ser: 10, ex: { dc: [70, 1000, 60, 8, 4], dh: [30, 500, 60, 10, 3], tri: [20, 300, 60, 10, 3] } }];
const SEANCES = [{ nom: "Push", ex: [{ id: "dc", s: 4, r: 8, p: "2 min" }, { id: "dh", s: 3, r: 10, p: "90 s" }] }];
const base = { A: { objectif: 0, materiel: 0, acc: [] }, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, SEANCES, wk: 0, day: 0, FINI: false, HIST: H, ts: Date.now() };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };
const cap = async (pg, n) => { if (process.env.CAPTURES) await pg.screenshot({ path: `${process.env.CAPTURES}/${n}.png` }); };
const etat = (pg) => pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")));

const ctx = await b.newContext({ locale: "fr-FR", viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, serviceWorkers: "block" });
await ctx.addInitScript((s) => { if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); localStorage.setItem("repere.visite", "1"); sessionStorage.vu = 1; } }, base);
await ctx.route(/supabase\.co/, (r) => r.abort());
const pg = await ctx.newPage();
const errs = []; pg.on("pageerror", (e) => errs.push(e.message));

// l'accueil : plus de proposition
await pg.goto(U + "/entrainement/");
await pg.getByRole("button", { name: "Nouvelle séance" }).waitFor();
await pg.waitForTimeout(800);
ok(!(await pg.getByText("Oxa te propose").count()) && !(await pg.getByText("Repos ou cardio léger").count()), "accueil sans « Oxa te propose » ni « Repos ou cardio léger »");
await cap(pg, "accueil");

// le menu du jour
await pg.getByRole("button", { name: "Nouvelle séance" }).click();
const dlg = pg.getByRole("dialog");
await dlg.getByText("Je choisis les muscles").waitFor();
ok(await dlg.getByText("Exercice par exercice").isVisible() && await dlg.getByText("Avec un code").isVisible(), "feuille : je choisis les muscles, exercice par exercice, importer");
ok(await dlg.getByText("Oxa choisit pour toi").isVisible() && await dlg.getByText("Conseillée").isVisible(), "feuille : Oxa choisit pour toi, une proposition conseillée");
ok(!(await dlg.getByRole("button", { name: /^Push/ }).count()), "Mes séances replié au départ");
await dlg.getByRole("button", { name: /^Mes séances/ }).click();
await dlg.getByRole("button", { name: /^Push/ }).click();
await dlg.getByRole("button", { name: "Ajouter aujourd'hui" }).waitFor();
ok(await dlg.getByRole("button", { name: "Modifier" }).isVisible() && await dlg.getByRole("button", { name: "Autre jour" }).isVisible(), "toucher une séance : l'aperçu, Ajouter aujourd'hui / Modifier / Autre jour");
ok(await dlg.getByText("Développé couché").first().isVisible() && await dlg.getByText(/4 × 8/).isVisible(), "aperçu : les exercices avec séries × répétitions");
await cap(pg, "apercu");
await cap(pg, "menu");
await dlg.getByRole("button", { name: "Ajouter aujourd'hui" }).click();
await pg.getByText("Aujourd'hui · prévue").waitFor();
await pg.waitForTimeout(900);
let e = await etat(pg);
ok(e.AGENDA?.some((p) => p.d === il(0) && p.quoi.t === "libre" && p.nom === "Push" && !p.rappel), "Ajouter aujourd'hui → prévue aujourd'hui, sans rappel");
await cap(pg, "prevue");

// programmer un autre jour : la feuille Programmer, sur la séance choisie
await pg.getByRole("button", { name: "Nouvelle séance" }).click();
await dlg.getByRole("button", { name: /^Mes séances/ }).click();
await dlg.getByRole("button", { name: /^Push/ }).click();
await dlg.getByRole("button", { name: "Autre jour" }).click();
await dlg.getByRole("button", { name: "Programmer", exact: true }).click();
await pg.waitForTimeout(500);
e = await etat(pg);
ok(e.AGENDA?.filter((p) => p.nom === "Push").length === 2 && e.AGENDA.some((p) => p.d > il(0)), "Programmer un autre jour → un 2e prévu, à venir");

// une proposition d'Oxa, programmée demain avec ses muscles
await pg.getByRole("button", { name: "Programmer", exact: false }).first().waitFor();
await pg.goto(U + "/entrainement/");
await pg.getByRole("button", { name: /Programmer/ }).first().click();
await dlg.getByText("Oxa choisit pour toi").waitFor();
ok(await dlg.getByRole("heading", { name: "Programmer une séance" }).count() === 1 || await dlg.getByText("Programmer une séance").count() > 0, "« Programmer » ouvre la feuille Programmer une séance");
await dlg.getByRole("button", { name: /^Conseillée/ }).click();
await dlg.getByText("Proposée par Oxa").waitFor();
await cap(pg, "apercu-oxa");
await dlg.getByRole("button", { name: /^Ajouter le / }).click();
await pg.waitForTimeout(600);
e = await etat(pg);
ok(e.SEANCES.length === 2 && e.AGENDA?.some((p) => p.d === il(-1) && p.quoi.t === "libre" && p.quoi.i === 1), "proposition d'Oxa vue puis programmée demain : enregistrée dans Mes séances");

// voir, modifier puis ajouter : le composeur l'enregistre pour ce jour-là
await pg.getByRole("button", { name: /Programmer/ }).first().click();
await dlg.getByText("Oxa choisit pour toi").waitFor();
await dlg.getByRole("button", { name: /^Conseillée/ }).click();
await dlg.getByRole("button", { name: "Modifier" }).click();
await pg.waitForURL(/composer/);
const enr = pg.getByRole("button", { name: /^Enregistrer pour / });
await enr.waitFor();
await cap(pg, "composer-pour");
await enr.click();
await pg.waitForURL(/\/entrainement\/?$/);
e = await etat(pg);
ok(e.SEANCES.length === 3 && e.AGENDA.some((p) => p.d === il(-1) && p.quoi.t === "libre" && p.quoi.i === 2), "Modifier → composeur → Enregistrer pour … : enregistrée et programmée");

// l'assistant ouvert pour un jour à venir
const dans3 = il(-3);
await pg.goto(U + `/entrainement/assistant/?jour=${dans3}&m=dos`);
/* profil vide : les 3 questions de mise en route s'ouvrent d'abord */
const plusTard = pg.getByRole("button", { name: "Plus tard" });
if (await plusTard.waitFor({ timeout: 3000 }).then(() => true, () => false)) await plusTard.click();
const bt = pg.getByRole("button", { name: "Voir la séance" });
await bt.waitFor();
ok(!(await pg.getByRole("button", { name: /^Créer pour / }).count()), "assistant pour un jour à venir : « Voir la séance », plus de programmation à l'aveugle");
if (await bt.isDisabled()) for (const m of ["Haltères", "Barre", "Machines", "Poids du corps"]) await pg.getByRole("button", { name: m, exact: true }).first().click().catch(() => {});
await cap(pg, "assistant");
await bt.click();
await pg.waitForURL(/composer/);
e = await etat(pg);
ok(e.SEANCES.length === 3, "Voir la séance → l'aperçu (composeur), rien d'enregistré encore");
const enr2 = pg.getByRole("button", { name: /^Enregistrer pour / });
await enr2.waitFor();
await cap(pg, "assistant-apercu");
await enr2.click();
await pg.waitForURL(/\/entrainement\/?$/);
e = await etat(pg);
ok(e.SEANCES.length === 4 && e.AGENDA.some((p) => p.d === dans3 && p.quoi.t === "libre" && p.quoi.i === 3), "Enregistrer pour … → séance créée et programmée ce jour-là");
ok(!errs.length, "aucune erreur JS " + errs.join(" | "));

// un compte qui n'a jamais fait de séance : la carte « Ta première séance », vers l'assistant pré-coché
const ctx2 = await b.newContext({ locale: "fr-FR", viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, serviceWorkers: "block" });
await ctx2.addInitScript((s) => { if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); localStorage.setItem("repere.visite", "1"); sessionStorage.vu = 1; } }, { ...base, HIST: [], SEANCES: [] });
await ctx2.route(/supabase\.co/, (r) => r.abort());
const pg2 = await ctx2.newPage();
await pg2.goto(U + "/entrainement/");
await pg2.getByText("Ta première séance").waitFor();
await cap(pg2, "premiere");
await pg2.getByRole("button", { name: "Créer ma première séance" }).click();
await pg2.waitForURL(/assistant\/?\?m=/);
ok(/m=.*pec/.test(pg2.url()), "aucune séance faite : « Ta première séance » → assistant avec les muscles " + pg2.url().split("?")[1]);
await b.close(); srv.close();
