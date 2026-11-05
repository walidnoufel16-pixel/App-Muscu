/* Visite guidée : sans Oxa Plan (5 bulles, mise en route, première séance), avec Oxa Plan
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

/* 1. sans Oxa Plan */
{
  const [ctx, pg] = await contexte(neuf);
  await pg.goto(U + "/entrainement/");
  await pg.getByText("Faire la visite · 30 s").waitFor({ timeout: 8000 });
  ok(await pg.getByText("Ta séance du jour, prête en un geste").count() === 1, "bienvenue : axe séance du jour");
  ok(await pg.getByText("Il calcule tes séances et tes repas").count() === 1, "bienvenue : axe profil");
  await cap(pg, "sans-bienvenue");
  await pg.getByText("Faire la visite · 30 s").click();
  await pg.waitForTimeout(900);
  const vus = await bulles(pg, "sans");
  ok(JSON.stringify(vus) === JSON.stringify(["Tes séances", "Tes repas", "Tes progrès", "Ton profil sportif", "Tes réglages"]), "5 bulles sans Oxa Plan : " + vus.join(", "));
  await pg.getByText("3 questions pour des séances à ta mesure").waitFor({ timeout: 4000 }).catch(() => {});
  ok(await pg.getByText("3 questions pour des séances à ta mesure").count() === 1, "profil vide : mise en route");
  await cap(pg, "sans-mise-en-route");
  await pg.getByRole("button", { name: "Plus tard" }).click();
  await pg.getByText("Ta première séance ?").waitFor({ timeout: 4000 }).catch(() => {});
  ok(await pg.getByText("Ta première séance ?").count() === 1, "puis « Ta première séance ? »");
  await cap(pg, "sans-fin");
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
