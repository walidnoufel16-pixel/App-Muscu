/* Accueil sans Oxa Plan (profil sportif, dernières 48 h, première séance), visite avec Oxa Plan
   (6 bulles dont la tuile du programme, « Construisons ton programme »), et la mini-visite quand
   Oxa Plan s'ouvre pour un compte qui a déjà vu la visite. CAPTURES=dossier pour garder des captures. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8831);
const U = "http://localhost:8831";
const CAP = process.env.CAPTURES;
const neuf = { A: { materiel: 0, acc: [], blessure: [], prio: [] }, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, FINI: false, wk: 0, day: 0, HIST: [], SEANCES: [], ts: Date.now() };
const ancien = { ...neuf, A: { ...neuf.A, objectif: 0, regularite: 2, objHebdo: 3 }, HIST: [{ d: new Date(Date.now() - 864e5).toISOString().slice(0, 10), s: "L|0", nom: "Push", vol: 1440, ser: 3, ex: { dc: [80, 1440, 60, 8, 3] } }], SEANCES: [{ nom: "Push", ex: [{ id: "dc", s: 3, r: 8, p: "2 min" }] }] };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };
const errs = [];
async function contexte(etat, extra = {}) {
  const ctx = await b.newContext({ locale: "fr-FR", viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, serviceWorkers: "block" });
  await ctx.addInitScript(([s, x]) => {
    if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); localStorage.setItem("palier.pseudo.v1", "Walid"); for (const [k, v] of Object.entries(x)) localStorage.setItem(k, v); sessionStorage.vu = 1; }
  }, [etat, extra]);
  await ctx.route(/supabase\.co/, (r) => r.abort());
  const pg = await ctx.newPage();
  pg.on("pageerror", (x) => errs.push(x.message));
  return [ctx, pg];
}
const cap = async (pg, nom) => { if (CAP) { await pg.waitForTimeout(700); await pg.screenshot({ path: `${CAP}/${nom}.png` }); } };
async function bulles(pg, prefixe) {
  const vus = [];
  for (let i = 0; i < 8; i++) {
    const d = pg.locator('[role="dialog"][aria-modal="true"]').filter({ has: pg.getByRole("button", { name: "Suivant" }) });
    if (!(await d.count())) { await pg.waitForTimeout(900); if (!(await d.count())) break; }
    vus.push(await d.getAttribute("aria-label"));
    await cap(pg, `${prefixe}-bulle-${i + 1}`);
    await d.getByRole("button", { name: "Suivant" }).click();
    await pg.waitForTimeout(700);
  }
  return vus;
}

/* 1. sans Oxa Plan : l'accueil (profil sportif une question par écran, dernières 48 h, première séance) */
{
  const [ctx, pg] = await contexte(neuf);
  await pg.goto(U + "/entrainement/");
  const dlg = pg.getByRole("dialog");
  await dlg.getByText("Commencer · 1 min").waitFor({ timeout: 8000 });
  ok(await dlg.getByText("Bienvenue sur Oxa, Walid").count() === 1 && await dlg.getByText("Tes dernières 48 h").count() === 1, "accueil : bienvenue, 3 étapes");
  ok(await pg.getByText("Créer ma première séance").count() === 0 && await pg.getByText("Repas", { exact: true }).count() === 0, "l'app n'est pas visible derrière le questionnaire");
  await cap(pg, "sans-bienvenue");
  await dlg.getByText("Commencer · 1 min").click();
  const suivant = () => dlg.getByRole("button", { name: "Suivant" }).click();
  await dlg.getByText("1 / 10 · Profil sportif").waitFor();
  await dlg.getByRole("button", { name: "Homme" }).click(); await suivant();
  await dlg.getByText("2 / 10 · Profil sportif").waitFor(); await suivant();
  await dlg.getByText("3 / 10 · Profil sportif").waitFor(); await suivant();
  await dlg.getByText("4 / 10 · Profil sportif").waitFor();
  ok(await dlg.getByRole("button", { name: "Suivant" }).isDisabled(), "objectif obligatoire");
  await dlg.getByRole("button", { name: /Prendre du muscle/ }).click();
  await cap(pg, "sans-objectif");
  await suivant();
  await dlg.getByRole("button", { name: /^Régulier/ }).click(); await suivant();
  await dlg.getByRole("button", { name: "3", exact: true }).click(); await suivant();
  await dlg.getByText("Ton matériel").waitFor(); await cap(pg, "sans-materiel"); await suivant();
  await suivant(); // muscles prioritaires
  await suivant(); // autres sports
  await dlg.getByText("Tu t'es entraîné ces dernières 48 h ?").waitFor();
  await dlg.getByRole("radio", { name: "Hier", exact: true }).click();
  ok(await dlg.getByRole("button", { name: "Terminer" }).isDisabled(), "hier : il faut au moins un muscle");
  await dlg.getByRole("button", { name: "Pecs", exact: true }).click();
  await dlg.getByRole("button", { name: "Triceps", exact: true }).click();
  await cap(pg, "sans-48h");
  await dlg.getByRole("button", { name: "Terminer" }).click();
  await dlg.getByText("Aujourd'hui, tes muscles").waitFor();
  const puces = await dlg.locator("span.rounded-full").allTextContents();
  ok(puces.includes("Pecs · récupère") && puces.includes("Dos · prêt"), "fin : pecs récupèrent, dos prêt");
  const seance = await dlg.locator("section h2").textContent();
  ok(!/pecs|triceps|full/i.test(seance), "première séance sans les muscles qui récupèrent : " + seance);
  await dlg.getByRole("button", { name: "Dos", exact: true }).last().click();
  await pg.waitForTimeout(300);
  const autre = await dlg.locator("section h2").textContent();
  ok(!/dos/i.test(autre), "Dos écarté : la proposition change → " + autre);
  await cap(pg, "sans-fin");
  const e = await pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")));
  ok(e.A.objectif === 0 && e.A.regularite === 2 && e.A.objHebdo === 3 && e.A.sexe === 0 && e.A.profil?.["Âge"] === 30 && e.A.accueil && e.A.miseEnRoute, "profil enregistré");
  ok(e.A.avant?.m?.join() === "pec,tri" && !e.HIST.length, "48 h : muscles déclarés, aucune fausse séance");
  await dlg.getByRole("button", { name: "Voir la séance" }).click();
  await pg.waitForURL(/assistant\/?\?m=/);
  ok(!/pec|tri/.test(pg.url().split("m=")[1]) && await pg.getByText("3 questions pour des séances à ta mesure").count() === 0, "Voir la séance → assistant, sans les 3 questions");
  await ctx.close();
}

/* 1 bis. un nouveau profil sur un téléphone qui a déjà vu la visite : l'accueil s'ouvre quand même ;
   « Plus tard » le referme pour de bon, la carte « Complète ton profil sportif » y ramène */
{
  const [ctx, pg] = await contexte(neuf, { "repere.visite": "1" });
  await pg.goto(U + "/entrainement/");
  const dlg = pg.getByRole("dialog");
  await dlg.getByText("Commencer · 1 min").waitFor({ timeout: 8000 });
  ok(true, "nouveau profil, visite déjà vue sur l'appareil : l'accueil s'ouvre");
  await dlg.getByRole("button", { name: "Plus tard" }).click();
  const carte = pg.getByRole("button", { name: /Complète ton profil sportif/ });
  await carte.waitFor();
  await cap(pg, "plus-tard-carte");
  await pg.reload();
  await pg.waitForTimeout(2500);
  ok(await pg.getByText("Commencer · 1 min").count() === 0, "« Plus tard » : ne se rouvre plus tout seul");
  await carte.click();
  await dlg.getByText("Commencer · 1 min").waitFor();
  ok(true, "la carte « Complète ton profil sportif » rouvre l'accueil");
  await ctx.close();
}

/* 2. avec Oxa Plan */
{
  const [ctx, pg] = await contexte(neuf, { "repere.programme": "1" });
  await pg.goto(U + "/entrainement/");
  await pg.getByText("Faire la visite · 30 s").waitFor({ timeout: 8000 });
  ok(await pg.getByText("Ton programme de 8 semaines, et des séances libres quand tu veux").count() === 1, "bienvenue : axe programme");
  await cap(pg, "plan-bienvenue");
  await pg.getByText("Faire la visite · 30 s").click();
  await pg.waitForTimeout(900);
  const vus = await bulles(pg, "plan");
  ok(JSON.stringify(vus) === JSON.stringify(["Tes séances", "Ton programme sur 8 semaines", "Tes repas", "Tes progrès", "Ton profil sportif", "Tes réglages"]), "6 bulles avec Oxa Plan : " + vus.join(", "));
  await pg.getByText("Construisons ton programme").waitFor({ timeout: 4000 }).catch(() => {});
  ok(await pg.getByText("Construisons ton programme").count() === 1, "fin : « Construisons ton programme »");
  await cap(pg, "plan-fin");
  await pg.getByRole("button", { name: "Construire mon programme" }).click();
  await pg.waitForURL(/questionnaire/, { timeout: 5000 }).catch(() => {});
  ok(pg.url().includes("/questionnaire"), "ouvre le questionnaire");
  ok(await pg.evaluate(() => !!localStorage.getItem("repere.visite") && !!localStorage.getItem("repere.visite.plan")), "visite et mini-visite notées comme vues");
  await ctx.close();
}

/* 3. mini-visite : Oxa Plan ouvert pour un compte qui a déjà sa vie dans l'app */
{
  const [ctx, pg] = await contexte(ancien, { "repere.programme": "1", "repere.visite": "1" });
  await pg.goto(U + "/entrainement/");
  const t = pg.getByText("Nouveau : ton programme sur 8 semaines");
  await t.waitFor({ timeout: 8000 }).catch(() => {});
  ok(await t.count() === 1, "mini-visite sur la tuile Oxa Plan");
  await cap(pg, "mini");
  await pg.getByRole("button", { name: "Plus tard" }).click();
  await pg.waitForTimeout(500);
  ok(await t.count() === 0 && await pg.evaluate(() => !!localStorage.getItem("repere.visite.plan")), "« Plus tard » la ferme pour de bon");
  await pg.reload();
  await pg.waitForTimeout(2500);
  ok(await t.count() === 0, "pas de seconde mini-visite");
  await ctx.close();
}

/* 4. sans accès : pas de mini-visite */
{
  const [ctx, pg] = await contexte(ancien, { "repere.visite": "1" });
  await pg.goto(U + "/entrainement/");
  await pg.waitForTimeout(2500);
  ok(await pg.getByText("Nouveau : ton programme sur 8 semaines").count() === 0, "sans Oxa Plan, rien ne s'affiche");
  await ctx.close();
}

ok(errs.length === 0, "aucune erreur de page " + errs.join(" | "));
await b.close();
srv.close();
