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
await dlg.getByText("Créer une séance pour moi").waitFor();
ok(await dlg.getByText("Composer exercice par exercice").isVisible() && await dlg.getByText("Importer une séance avec un code").isVisible(), "menu : créer pour moi, composer, importer");
ok(await dlg.getByText("Mes séances").isVisible() && !(await dlg.getByText("Recommandation d'Oxa").count()), "menu : Mes séances, sans recommandation");
await dlg.getByRole("button", { name: /^Push/ }).click();
await dlg.getByRole("button", { name: "Ajouter aujourd'hui" }).waitFor();
ok(await dlg.getByRole("button", { name: "Programmer un autre jour" }).isVisible(), "toucher une séance : Ajouter aujourd'hui / Programmer un autre jour");
await cap(pg, "menu");
await dlg.getByRole("button", { name: "Ajouter aujourd'hui" }).click();
await pg.getByText("Aujourd'hui · prévue").waitFor();
await pg.waitForTimeout(900);
let e = await etat(pg);
ok(e.AGENDA?.some((p) => p.d === il(0) && p.quoi.t === "libre" && p.nom === "Push" && !p.rappel), "Ajouter aujourd'hui → prévue aujourd'hui, sans rappel");
await cap(pg, "prevue");

// programmer un autre jour : la feuille Programmer, sur la séance choisie
await pg.getByRole("button", { name: "Nouvelle séance" }).click();
await dlg.getByRole("button", { name: /^Push/ }).click();
await dlg.getByRole("button", { name: "Programmer un autre jour" }).click();
await dlg.getByRole("button", { name: "Programmer", exact: true }).click();
await pg.waitForTimeout(500);
e = await etat(pg);
ok(e.AGENDA?.filter((p) => p.nom === "Push").length === 2 && e.AGENDA.some((p) => p.d > il(0)), "Programmer un autre jour → un 2e prévu, à venir");

// l'assistant ouvert pour un jour à venir
const dans3 = il(-3);
await pg.goto(U + `/entrainement/assistant/?jour=${dans3}&m=dos`);
/* profil vide : les 3 questions de mise en route s'ouvrent d'abord */
const plusTard = pg.getByRole("button", { name: "Plus tard" });
if (await plusTard.waitFor({ timeout: 3000 }).then(() => true, () => false)) await plusTard.click();
const bt = pg.getByRole("button", { name: /^Créer pour / });
await bt.waitFor();
ok(true, "assistant pour un jour à venir : « " + (await bt.textContent()) + " »");
if (await bt.isDisabled()) for (const m of ["Haltères", "Barre", "Machines", "Poids du corps"]) await pg.getByRole("button", { name: m, exact: true }).first().click().catch(() => {});
await cap(pg, "assistant");
await bt.click();
await pg.waitForURL(/\/entrainement\/?$/);
e = await etat(pg);
ok(e.SEANCES.length === 2 && e.AGENDA.some((p) => p.d === dans3 && p.quoi.t === "libre" && p.quoi.i === 1), "Créer pour … → séance créée et programmée ce jour-là");
ok(!errs.length, "aucune erreur JS " + errs.join(" | "));
await b.close(); srv.close();
