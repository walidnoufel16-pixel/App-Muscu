/* Accueil Entraînement allégé : une carte d'action en haut, deux tuiles, Mes séances avec
   « Créer », le soin de la zone sensible ; carte « Installer l'app » ; barre du haut nette.
   CAPTURES=dossier pour garder des captures. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8821);
const U = "http://localhost:8821";
const CAP = process.env.CAPTURES;
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const etat = (seances, hist = []) => ({
  A: { objectif: 0, regularite: 2, socle: 1, axe: 0, materiel: 0, acc: [], blessure: [1], sexe: 0, prio: [], actuel: 0, profil: { "Âge": 30, Taille: 180, Poids: 78 } },
  LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, FINI: true, wk: 0, day: 0, HIST: hist, SEANCES: seances, ts: Date.now(),
});
const PUSH = { nom: "Push", ex: [{ id: "dc", s: 3, r: 8, p: "2 min" }, { id: "dmh", s: 3, r: 10, p: "90 s" }] };
const PULL = { nom: "Pull", ex: [{ id: "tr", s: 3, r: 8, p: "2 min" }] };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };
const errs = [];
async function contexte(e, { prog = false, langue, ua, installee = false } = {}) {
  const ctx = await b.newContext({ locale: "fr-FR", viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, serviceWorkers: "block", ...(ua ? { userAgent: ua } : {}) });
  await ctx.addInitScript(([s, p, l, inst]) => {
    if (p) localStorage.setItem("repere.programme", "1");
    if (inst) { const m = window.matchMedia.bind(window); window.matchMedia = (q) => (q.includes("standalone") ? { matches: true, media: q, addEventListener() {}, removeEventListener() {} } : m(q)); }
    if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); if (l) localStorage.setItem("repere.langue.v1", l); sessionStorage.vu = 1; }
  }, [e, prog, langue, installee]);
  await ctx.route(/supabase\.co/, (r) => r.abort());
  const pg = await ctx.newPage();
  pg.on("pageerror", (x) => errs.push(x.message));
  return [ctx, pg];
}
const cap = async (pg, nom) => { if (CAP) { await pg.waitForTimeout(1000); await pg.screenshot({ path: `${CAP}/${nom}.png` }); } };

{
  /* Avec le programme : séance du jour et ses points de semaine, deux tuiles, « Créer ». */
  const [ctx, pg] = await contexte(etat([PUSH, PULL]), { prog: true });
  await pg.goto(U + "/entrainement/");
  await pg.getByText(/^Séance du jour/).waitFor({ timeout: 8000 });
  ok(await pg.getByRole("button", { name: "Voir le programme de la semaine" }).count() === 1, "programme : la semaine en points dans la carte du jour");
  ok(await pg.getByText("Ma semaine", { exact: true }).count() === 0, "plus de liste « Ma semaine » en 5 lignes");
  ok(await pg.locator("button", { hasText: "séances cette semaine" }).count() === 1 && await pg.locator("button", { hasText: "protéines aujourd'hui" }).count() === 1, "deux tuiles : régularité et protéines");
  await cap(pg, "entrainement-programme");
  await pg.getByRole("button", { name: "Voir le programme de la semaine" }).click();
  await pg.waitForURL(/\/entrainement\/programme\/?$/);
  ok(true, "les points ouvrent le programme");
  await pg.goto(U + "/entrainement/");
  ok(await pg.getByText("Composer exercice par exercice").count() === 0, "les trois façons de créer ne sont plus en liste");
  await pg.getByRole("button", { name: "Créer", exact: true }).click();
  const feuille = pg.getByRole("dialog");
  await feuille.getByText("Nouvelle séance").waitFor();
  ok(await feuille.getByText("Créer une séance pour moi").count() === 1 && await feuille.getByText("Composer exercice par exercice").count() === 1 && await feuille.getByText("Importer une séance avec un code").count() === 1, "« Créer » : feuille avec les trois choix");
  await cap(pg, "entrainement-creer");
  await feuille.getByText("Composer exercice par exercice").click();
  await pg.waitForURL(/\/entrainement\/composer\/?$/);
  ok(true, "composer depuis la feuille");
  await ctx.close();
}

{
  /* Sans programme : la prochaine séance libre, celle qui suit la dernière faite. */
  const hier = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const [ctx, pg] = await contexte(etat([PUSH, PULL], [{ d: hier, s: "L|0", nom: "Push", vol: 2000, ser: 6, ex: {} }]));
  await pg.goto(U + "/entrainement/");
  await pg.getByText(/^Ta prochaine séance/).waitFor({ timeout: 8000 });
  ok(await pg.getByRole("heading", { name: "Pull" }).count() === 1, "après Push, la prochaine est Pull");
  ok(await pg.getByText("Bientôt disponible").count() === 1 && await pg.getByText(/^Un cycle complet/).count() === 0, "programme : une ligne discrète en bas");
  await cap(pg, "entrainement-libre");
  await pg.getByRole("button", { name: /^Commencer/ }).click();
  await pg.waitForURL(/seance\/?\?l=1/, { waitUntil: "commit" });
  ok(true, "« Commencer » ouvre Pull");
  await ctx.close();
}

{
  /* Aucune séance : de quoi créer la première. */
  const [ctx, pg] = await contexte(etat([]));
  await pg.goto(U + "/entrainement/");
  await pg.getByRole("heading", { name: "Crée ta première séance" }).waitFor({ timeout: 8000 });
  ok(await pg.getByText("Importer une séance avec un code").count() === 1, "sans séance : les façons d'en créer sont visibles");
  await ctx.close();
}

{
  /* Installer l'app : carte sur iPhone dans Safari, feuille en 3 étapes, « Plus tard ». */
  const [ctx, pg] = await contexte(etat([PUSH]), { ua: IPHONE });
  await pg.goto(U + "/entrainement/");
  const carte = pg.getByRole("button", { name: /Installe Repère sur ton iPhone/ });
  await carte.waitFor({ timeout: 8000 });
  const bas = await carte.evaluate((el) => el.getBoundingClientRect().bottom), barre = await pg.locator('nav[aria-label="Navigation principale"]').evaluate((el) => el.firstElementChild.getBoundingClientRect().top);
  ok(bas <= barre, "carte posée au-dessus de la barre d'onglets");
  await cap(pg, "installer-carte");
  await carte.click();
  await pg.getByText("Installer Repère").waitFor();
  ok(await pg.getByRole("dialog").locator("li").count() === 3, "feuille iPhone : trois étapes");
  await cap(pg, "installer-feuille");
  await pg.getByRole("button", { name: "C'est compris" }).click();
  await pg.waitForTimeout(500);
  await pg.getByRole("button", { name: "Plus tard" }).click();
  ok(await carte.count() === 0, "« Plus tard » masque la carte");
  await pg.goto(U + "/profil/");
  await pg.waitForTimeout(1200);
  ok(await pg.getByRole("button", { name: /Installe Repère/ }).count() === 0, "elle reste masquée ensuite");
  await ctx.close();
}

{
  const [ctx, pg] = await contexte(etat([PUSH, PULL]), { ua: IPHONE, installee: true });
  await pg.goto(U + "/entrainement/");
  await pg.getByText("Mes séances").first().waitFor({ timeout: 8000 });
  await pg.waitForTimeout(600);
  ok(await pg.getByRole("button", { name: /Installe Repère/ }).count() === 0, "app déjà installée : pas de carte");

  /* Barre du haut : barre fixe, contenu hors de la couche floutée, fond dès que la page défile. */
  const structure = await pg.evaluate(() => {
    const fond = document.querySelector("[data-fond]"), barre = fond.parentElement;
    return { fixe: getComputedStyle(barre).position === "fixed", horsDuFlou: !fond.contains(document.querySelector('[aria-label^="Langue"]')), opacite: getComputedStyle(fond).opacity };
  });
  ok(structure.fixe && structure.horsDuFlou, "barre du haut fixe, langue hors de la couche floutée");
  ok(structure.opacite === "0", "en haut de page : pas de fond");
  await pg.evaluate(() => window.scrollTo(0, 30));
  await pg.waitForTimeout(500);
  const [y, op] = await pg.evaluate(() => [scrollY, getComputedStyle(document.querySelector("[data-fond]")).opacity]);
  ok(y > 4 && op === "1", `dès que la page défile : fond sous l'heure (défilé de ${y} px, opacité ${op})`);
  await ctx.close();
}

{
  /* En anglais : l'accueil sans français. */
  const [ctx, pg] = await contexte(etat([PUSH, PULL]), { langue: "en" });
  await pg.goto(U + "/entrainement/");
  await pg.getByText(/^Your next workout/).waitFor({ timeout: 8000 });
  const t = await pg.evaluate(() => document.body.innerText);
  const fr = t.split("\n").filter((l) => /[éèàçêûôîœ]/i.test(l.replace(/Repère|REPÈRE|Français/g, "")));
  ok(!fr.length, `EN : accueil sans français${fr.length ? " → " + fr.slice(0, 5).join(" | ") : ""}`);
  await cap(pg, "entrainement-en");
  await ctx.close();
}

ok(!errs.length, "aucune erreur JS" + (errs.length ? " : " + errs.join(" / ") : ""));
await b.close();
srv.close();
