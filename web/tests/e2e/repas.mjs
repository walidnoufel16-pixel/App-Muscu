/* Partie Repas : première ouverture (préférences), aujourd'hui (besoins, suggestions, ↻),
   fiche de recette à la portion, recettes et filtres, « avec ce que j'ai », semaine et liste de courses,
   lien depuis la collation d'une séance, anglais. CAPTURES=dossier pour garder des captures. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8826);
const U = "http://localhost:8826";
const CAP = process.env.CAPTURES;
const etat = (A = {}, extra = {}) => ({
  A: { objectif: 0, regularite: 2, socle: 1, axe: 0, materiel: 0, acc: [], blessure: [], sexe: 0, prio: [], actuel: 0, profil: { "Âge": 30, Taille: 180, Poids: 80 }, ...A },
  LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, FINI: true, wk: 0, day: 0, HIST: [], SEANCES: [{ nom: "Push", ex: [{ id: "dc", s: 3, r: 8, p: "2 min" }] }], ts: Date.now(), ...extra,
});
const PREFS = { fait: true, regime: 0, allergies: [], exclus: [], temps: 2, mat: ["plaques", "four", "micro", "mixeur"], pers: 1, stock: [] };
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
const cap = async (pg, nom, plein = false) => { if (CAP) { await pg.waitForTimeout(900); await pg.screenshot({ path: `${CAP}/${nom}.png`, fullPage: plein }); } };
const etatLu = (pg) => pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")));

{
  /* Première ouverture : cinq questions, puis la partie Repas. */
  const [ctx, pg] = await contexte(etat());
  await pg.goto(U + "/entrainement/");
  ok(await pg.locator("nav a").count() === 5 && (await pg.locator("nav a").allTextContents()).join(",") === "Entraînement,Exercices,Repas,Progrès,Profil", "cinq onglets, Repas au milieu");
  await pg.locator("nav a", { hasText: "Repas" }).click();
  await pg.getByText("Des repas pensés pour ton entraînement").waitFor({ timeout: 8000 });
  const q = (n) => pg.getByRole("region", { name: n });
  const entetes = pg.locator("section[aria-label] > button[aria-expanded]");
  ok(await entetes.count() === 6 && (await entetes.evaluateAll((l) => l.map((x) => x.getAttribute("aria-expanded")))).every((x) => x === "false"), "premier passage : les 6 questions repliées");
  await cap(pg, "repas-accueil");
  await q("1 · Ton régime").locator("button[aria-expanded]").click();
  await q("3 · Allergies ou intolérances").locator("button[aria-expanded]").click();
  ok(await pg.getByRole("button", { name: "Végétarien", exact: true }).isVisible() && await pg.getByRole("button", { name: "Lactose", exact: true }).isVisible(), "deux questions ouvertes en même temps");
  await pg.getByRole("button", { name: "Végétarien", exact: true }).click();
  await pg.getByRole("button", { name: "Lactose", exact: true }).click();
  ok(/Végétarien/.test(await q("1 · Ton régime").innerText()) && /Lactose/.test(await q("3 · Allergies ou intolérances").locator("button[aria-expanded]").innerText()), "résumés à jour");
  /* halal ou casher */
  await q("2 · Halal ou casher").locator("button[aria-expanded]").first().click();
  await pg.getByRole("button", { name: "Halal", exact: true }).click();
  ok(/Halal/.test(await q("2 · Halal ou casher").locator("button[aria-expanded]").first().innerText()), "halal choisi");
  /* ce que tu n'aimes pas : sous-catégories repliables */
  await q("4 · Ce que tu n'aimes pas").locator("button[aria-expanded]").first().click();
  await q("4 · Ce que tu n'aimes pas").getByRole("button", { name: /^Légumes/ }).click();
  await pg.getByRole("button", { name: "Brocoli", exact: true }).click();
  await q("4 · Ce que tu n'aimes pas").getByRole("button", { name: /^Fruits/ }).click();
  ok(await pg.getByRole("button", { name: "Kiwis", exact: true }).isVisible() && /Brocoli/.test(await q("4 · Ce que tu n'aimes pas").locator("button[aria-expanded]").first().innerText()), "sous-catégories légumes et fruits, brocoli évité");
  await cap(pg, "repas-n-aime-pas");
  await q("1 · Ton régime").locator("button[aria-expanded]").click();
  ok(await pg.getByRole("button", { name: "Omnivore", exact: true }).count() === 0 && await pg.getByRole("button", { name: "Lactose", exact: true }).isVisible(), "régime refermé d'un toucher, allergies toujours ouvertes");
  await cap(pg, "repas-questions");
  await pg.getByRole("button", { name: "C'est parti" }).click();
  await pg.getByRole("region", { name: "Tes besoins du jour" }).waitFor();
  const A = (await etatLu(pg)).A;
  ok(A.repas?.fait && A.repas.regime === 2 && A.repas.culte === 1 && A.repas.allergies.includes("l") && A.repas.exclus.includes("brocoli"), "préférences notées (végétarien, halal, sans lactose, sans brocoli)");
  const couleur = await pg.evaluate(() => getComputedStyle(document.querySelector(".theme-repas")).getPropertyValue("--plate").trim());
  ok(couleur === "#f08a24", `Repas en orange safran (${couleur})`);
  /* revenir au questionnaire */
  const carte = pg.getByRole("region", { name: "Mes préférences" });
  ok(/Végétarien · halal · sans lactose/.test(await carte.innerText()), "carte « Mes préférences » : le résumé");
  await carte.getByRole("button", { name: "Modifier" }).click();
  const feuille = pg.getByRole("dialog");
  await feuille.getByRole("region", { name: "1 · Ton régime" }).locator("button[aria-expanded]").click();
  ok(await feuille.getByRole("button", { name: "Végétarien", exact: true }).getAttribute("aria-pressed") === "true", "Modifier : les réponses déjà cochées");
  await feuille.getByRole("button", { name: "Vegan", exact: true }).click();
  await feuille.getByRole("button", { name: "Enregistrer" }).click();
  await pg.waitForTimeout(400);
  ok((await etatLu(pg)).A.repas.regime === 3 && /Vegan/.test(await carte.innerText()), "enregistré : vegan");
  await pg.getByRole("tab", { name: "Recettes" }).click();
  ok(await pg.getByText("Omelette épinards et feta").count() === 0, "les recettes suivent (plus d'omelette)");
  /* depuis Profil */
  await pg.goto(U + "/profil/");
  await pg.getByRole("button", { name: /Préférences repas/ }).click();
  await pg.waitForURL(/\/repas\/?\?prefs=1/);
  await pg.getByRole("dialog").getByRole("heading", { name: "Préférences repas" }).or(pg.getByRole("dialog").getByText("Préférences repas")).first().waitFor();
  ok(true, "Profil › Préférences repas ouvre le questionnaire");
  await ctx.close();
}

{
  /* Aujourd'hui : besoins, suggestions, ↻, fiche à la portion. */
  const [ctx, pg] = await contexte(etat({ repas: PREFS }));
  await pg.goto(U + "/repas/");
  const besoins = pg.getByRole("region", { name: "Tes besoins du jour" });
  await besoins.waitFor({ timeout: 8000 });
  ok(/145\s*g/.test(await besoins.innerText()), "besoins : 145 g de protéines (80 kg, prise de muscle)");
  ok(!/kcal/.test(await besoins.innerText()), "sans calories par défaut");
  ok(/paumes de protéines/i.test(await besoins.innerText()), "portions à la main");
  await cap(pg, "repas-jour");
  const premier = await pg.locator("button", { hasText: /protéines/ }).filter({ has: pg.locator(".eyebrow") }).first().innerText().catch(() => "");
  const nomsAvant = await pg.locator("span.truncate.text-\\[15\\.5px\\]").allTextContents();
  await pg.getByRole("button", { name: /^Une autre idée : Collation/ }).click();
  await pg.waitForTimeout(300);
  const nomsApres = await pg.locator("span.truncate.text-\\[15\\.5px\\]").allTextContents();
  ok(nomsAvant[2] !== nomsApres[2] && nomsAvant[0] === nomsApres[0], `↻ change seulement la collation (${nomsAvant[2]} → ${nomsApres[2]})`);
  void premier;
  await pg.locator("span.truncate.text-\\[15\\.5px\\]").first().click();
  const fiche = pg.getByRole("dialog");
  await fiche.getByRole("heading", { name: "Préparation" }).or(fiche.getByText("Préparation")).first().waitFor();
  const q1 = await fiche.getByRole("list", { name: "Ingrédients" }).innerText();
  await fiche.getByRole("button", { name: "Une personne de plus" }).click();
  const q2 = await fiche.getByRole("list", { name: "Ingrédients" }).innerText();
  ok(q1 !== q2 && /Le mot du nutritionniste/i.test(await fiche.innerText()), "fiche : ingrédients à la portion, ×2 personnes, mot du nutritionniste" + (q1 !== q2 ? "" : " (q1 = q2)"));
  await cap(pg, "repas-fiche");
  await pg.keyboard.press("Escape");
  /* calories en option */
  await pg.getByRole("region", { name: "Mes préférences" }).getByRole("button", { name: "Modifier" }).click();
  await pg.getByRole("dialog").getByRole("checkbox").check();
  await pg.getByRole("dialog").getByRole("button", { name: "Enregistrer" }).click();
  await pg.waitForTimeout(400);
  ok(/kcal/.test(await besoins.innerText()), "calories affichées une fois activées");
  await ctx.close();
}

{
  /* Recettes : filtres et « avec ce que j'ai ». */
  const [ctx, pg] = await contexte(etat({ repas: { ...PREFS, regime: 3 } }));
  await pg.goto(U + "/repas/");
  await pg.getByRole("tab", { name: "Recettes" }).click();
  await pg.getByText(/recettes pour toi/).waitFor({ timeout: 8000 });
  const t = await pg.getByText(/recettes pour toi/).innerText();
  ok(+t.match(/\d+/)[0] >= 10 && await pg.getByText("Chili con carne").count() === 0, `vegan : ${t}, pas de chili con carne`);
  await pg.getByRole("button", { name: "Desserts", exact: true }).click();
  ok(await pg.getByText("Pudding de chia coco-mangue").count() === 1, "filtre Desserts");
  await pg.getByRole("tab", { name: "Avec ce que j'ai" }).click();
  for (const n of ["Pois chiches (conserve)", "Épinards", "Tofu ferme"]) await pg.getByRole("button", { name: n, exact: true }).click();
  await pg.getByText("Ce que tu peux cuisiner").scrollIntoViewIfNeeded();
  await pg.waitForTimeout(300);
  ok(await pg.getByText(/Il te manque : /).count() > 0, "avec ce que j'ai : ce qui manque est indiqué");
  ok(((await etatLu(pg)).A.repas.stock || []).length === 3, "stock gardé pour la prochaine fois");
  await cap(pg, "repas-stock");
  await ctx.close();
}

{
  /* Courses : semaine, ↻ sur une case, liste cochée et partagée. */
  const [ctx, pg] = await contexte(etat({ repas: PREFS }));
  await pg.goto(U + "/repas/");
  await pg.getByRole("tab", { name: "Courses" }).click();
  await pg.getByRole("region", { name: "Ma semaine de repas" }).waitFor({ timeout: 8000 });
  ok(await pg.getByRole("region", { name: "Lundi" }).count() === 1 && await pg.getByRole("region", { name: "Vendredi" }).count() === 1, "5 jours, déjeuner et dîner");
  await cap(pg, "repas-semaine");
  const liste = pg.getByRole("region", { name: "Liste de courses" });
  const avant = await liste.innerText();
  ok(/Légumes/i.test(avant) && /Viandes, poissons/i.test(avant) && !/\d,5 (carotte|courgette|pavé|steak)/.test(avant), "liste rangée par rayon, unités entières");
  const lundi = pg.getByRole("region", { name: "Lundi" });
  const nom = await lundi.locator("span.truncate").first().innerText();
  await lundi.getByRole("button", { name: /^Changer : Lundi/ }).first().click();
  await pg.waitForTimeout(300);
  ok(await lundi.locator("span.truncate").first().innerText() !== nom, "↻ remplace le plat du lundi");
  const art = liste.getByRole("button").first();
  await art.click();
  ok(((await etatLu(pg)).A.semaine?.coches || []).length === 1, "article coché et gardé");
  await liste.scrollIntoViewIfNeeded();
  await cap(pg, "repas-courses");
  await ctx.close();
}

{
  /* Collation d'une séance : idées de recettes vers Repas. */
  const [ctx, pg] = await contexte(etat({ repas: PREFS }));
  await pg.goto(U + "/entrainement/seance?l=0");
  await pg.getByRole("tab", { name: "Collation" }).click();
  const idees = pg.getByRole("region", { name: "Idées de recettes" });
  await idees.waitFor({ timeout: 8000 });
  await idees.getByRole("link").first().click();
  await pg.waitForURL(/\/repas\/?\?r=/);
  await pg.getByRole("dialog").getByText("Le mot du nutritionniste").waitFor();
  ok(true, "collation de la séance → recette ouverte dans Repas");
  await ctx.close();
}

{
  /* En anglais. */
  const [ctx, pg] = await contexte(etat({ repas: PREFS }), "en");
  await pg.goto(U + "/repas/");
  await pg.getByRole("region", { name: "Your needs today" }).waitFor({ timeout: 8000 });
  for (const v of ["Recipes", "Shopping"]) { await pg.getByRole("tab", { name: v }).click(); await pg.waitForTimeout(400); }
  const t = await pg.evaluate(() => document.body.innerText);
  const fr = t.split("\n").filter((l) => /[éèàçêûôîœ]|\b(avec|pour|les|des)\b/i.test(l.replace(/Repère|Français|crème fraîche|Fromage blanc|fromage blanc|Rumsteck/g, "")));
  ok(!fr.length, `EN : sans français${fr.length ? " → " + fr.slice(0, 5).join(" | ") : ""}`);
  await ctx.close();
}

ok(!errs.length, "aucune erreur JS" + (errs.length ? " : " + errs.join(" / ") : ""));
await b.close();
srv.close();
