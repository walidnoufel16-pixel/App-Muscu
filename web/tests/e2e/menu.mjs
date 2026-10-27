/* Menu latéral (☰) : quatre onglets en bas, le reste dans le menu, chaque entrée mène au bon endroit.
   CAPTURES=dossier pour garder des captures. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8827);
const U = "http://localhost:8827";
const CAP = process.env.CAPTURES;
const etat = {
  A: { objectif: 0, regularite: 2, socle: 1, axe: 0, materiel: 0, acc: [], blessure: [], sexe: 0, prio: [], actuel: 0, profil: { "Âge": 30, Taille: 180, Poids: 80 }, repas: { fait: true, regime: 0, allergies: [], exclus: [], temps: 2, mat: ["plaques"], pers: 1, stock: [] } },
  LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, FINI: true, wk: 0, day: 0, HIST: [{ d: new Date(Date.now() - 864e5).toISOString().slice(0, 10), s: "L|0", nom: "Push", vol: 1440, ser: 3, ex: { dc: [80, 1440, 60, 8, 3] } }], SEANCES: [{ nom: "Push", ex: [{ id: "dc", s: 3, r: 8, p: "2 min" }] }], ts: Date.now(),
};
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };
const errs = [];
async function contexte(langue) {
  const ctx = await b.newContext({ locale: "fr-FR", viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, serviceWorkers: "block" });
  await ctx.addInitScript(([s, l]) => {
    if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); localStorage.setItem("palier.pseudo.v1", "Walid"); if (l) localStorage.setItem("repere.langue.v1", l); sessionStorage.vu = 1; }
  }, [etat, langue]);
  await ctx.route(/supabase\.co/, (r) => r.abort());
  const pg = await ctx.newPage();
  pg.on("pageerror", (x) => errs.push(x.message));
  return [ctx, pg];
}
const cap = async (pg, nom) => { if (CAP) { await pg.waitForTimeout(800); await pg.screenshot({ path: `${CAP}/${nom}.png` }); } };

{
  const [ctx, pg] = await contexte();
  await pg.goto(U + "/entrainement/");
  await pg.locator("nav a").first().waitFor({ timeout: 8000 });
  ok((await pg.locator("nav a").allTextContents()).join(",") === "Entraînement,Exercices,Repas,Progrès", "quatre onglets, plus de Profil");
  const menu = () => pg.getByRole("dialog");
  /* une feuille encore en train de se fermer rend la page inerte un instant : on attend qu'elle parte */
  const ouvrir = async () => { await pg.getByRole("dialog").waitFor({ state: "detached", timeout: 4000 }).catch(() => {}); await pg.getByRole("button", { name: "Menu" }).click(); await menu().getByRole("region", { name: "Aller plus loin" }).waitFor(); await pg.waitForTimeout(400); };
  await ouvrir();
  ok(await menu().getByText("Walid").count() === 1 && await menu().getByText("Sur ce téléphone").count() === 1, "en-tête du menu : surnom et état du compte");
  for (const t of ["Aller plus loin", "Mes réglages", "L'app"]) ok(await menu().getByRole("region", { name: t }).count() === 1, `bloc « ${t} »`);
  ok(await menu().getByText("Administration").count() === 0, "pas d'Administration pour un compte normal");
  await cap(pg, "menu");
  /* fermer au toucher à côté */
  await pg.mouse.click(380, 400);
  await pg.waitForTimeout(600);
  ok(await menu().count() === 0, "fermé au toucher à côté");

  /* chaque entrée */
  const entree = async (n, url, cible) => {
    await ouvrir();
    await menu().getByRole("button", { name: n }).click();
    await pg.waitForURL(url, { timeout: 8000 });
    if (cible) await cible().waitFor({ timeout: 8000 });
    ok(true, `« ${n} » → ${pg.url().replace(U, "")}`);
  };
  await entree("Défis entre amis", /\/progres\/?$/, () => pg.locator("#defis"));
  await pg.waitForTimeout(1200);
  ok(await pg.locator("#defis").evaluate((el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }), "Défis : la section est à l'écran");
  await entree("Badges et bilans", /\/progres\/?$/, () => pg.locator("#badges"));
  await entree("Mon matériel", /\/profil\/?$/, () => pg.locator("#materiel"));
  await entree("Préférences repas", /\/repas\/?\?prefs=1/, () => pg.getByRole("dialog").getByText("Préférences repas").first());
  await pg.getByRole("dialog").getByRole("button", { name: "Enregistrer" }).click();
  await pg.waitForTimeout(500);
  await entree("Programme 8 semaines", /\/entrainement\/?$/, () => pg.getByRole("tab", { name: "Programme", selected: true }));
  await entree("Importer une séance", /\/entrainement\/?$/, () => pg.getByRole("dialog").getByText("Importer une séance").first());
  await pg.goto(U + "/entrainement/"); // la feuille d'import garde le clavier : on recharge l'écran
  await pg.locator("nav a").first().waitFor();
  await ouvrir();
  await menu().getByRole("button", { name: /Walid/ }).click();
  await pg.waitForURL(/\/profil\/?$/);
  ok(await pg.getByText("Compte et réglages").count() > 0 && await pg.locator("#compte").count() === 1, "le compte ouvre « Compte et réglages »");
  await cap(pg, "menu-profil");
  await ctx.close();
}

{
  /* En anglais. */
  const [ctx, pg] = await contexte("en");
  await pg.goto(U + "/progres/");
  await pg.getByRole("button", { name: "Menu" }).click();
  await pg.getByRole("dialog").getByRole("region", { name: "Go further" }).waitFor({ timeout: 8000 });
  const t = await pg.getByRole("dialog").innerText();
  ok(!/[éèàçêûô]|Réglages|Défis|Aller/.test(t), "EN : menu sans français");
  await ctx.close();
}

ok(!errs.length, "aucune erreur JS" + (errs.length ? " : " + errs.join(" / ") : ""));
await b.close();
srv.close();
