/* Parcours de navigation : trois onglets, séance en plein écran, retour vers
   l'écran d'où l'on vient, anciennes adresses, changer de compte, fiche chargée à part. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8803);
const U = "http://localhost:8803";
const etat = { A: { objectif: 0, materiel: 0, acc: [], miseEnRoute: true }, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, SEANCES: [{ nom: "Test", ex: [{ id: "dc", s: 3, r: 8, p: "2 min" }] }], wk: 0, day: 0, FINI: false, ts: Date.now() };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({ locale: "fr-FR", viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
await ctx.addInitScript(() => localStorage.setItem("repere.visite", "1"));
await ctx.addInitScript((s) => { if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); sessionStorage.vu = 1; } }, etat);
await ctx.route(/supabase\.co/, (r) => r.abort());
const pg = await ctx.newPage();
const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
let fiches = 0; pg.on("request", (r) => r.url().includes("fiches.json") && fiches++);
await pg.addInitScript(() => {
  window.__vt = 0; window.__vtTypes = [];
  const o = document.startViewTransition?.bind(document);
  if (o) document.startViewTransition = (...a) => { window.__vt++; window.__vtTypes.push(...(a[0]?.types ?? [])); return o(...a); };
});
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };
const actif = () => pg.locator('nav a[aria-current="page"]').textContent();

await pg.goto(U + "/");
await pg.waitForURL(/\/entrainement\/$/);
ok(await actif() === "Entraînement", "accueil : onglet Entraînement actif");
ok(await pg.locator("nav a").count() === 3, "trois onglets");
ok(await pg.getByRole("button", { name: /^Mes séances/ }).count() === 1, "accueil : l'entrée Mes séances");
ok(await pg.getByRole("button", { name: /^Oxa Street/ }).count() === 0, "accueil recentré : Oxa Street rangé dans Plus d'entraînements");
// Plus d'entraînements : épingler Oxa Run le fait apparaître sur l'accueil
await pg.getByRole("button", { name: /^Plus d'entraînements/ }).click();
await pg.waitForURL(/\/entrainement\/plus\//);
ok(await pg.getByRole("button", { name: /^Épingler .* sur l'accueil$/ }).count() === 5, "Plus d'entraînements : street, course, soin, cardio, défis");
await pg.getByRole("button", { name: "Épingler Oxa Run sur l'accueil" }).click();
await pg.goBack();
await pg.waitForURL(/\/entrainement\/$/);
ok(await pg.getByRole("button", { name: /^Oxa Run/ }).count() === 1, "Oxa Run épinglé sur l'accueil");
await pg.getByRole("button", { name: /^Mes séances/ }).click();
await pg.waitForURL(/\/entrainement\/rubrique\/\?v=libre/);

// Mes séances : groupe Musculation repliable, choix mémorisé
const groupe = pg.getByRole("button", { name: /^Musculation/ });
ok(await groupe.getAttribute("aria-expanded") === "true", "groupe Musculation ouvert (1 séance)");
await groupe.click();
await pg.waitForTimeout(400);
ok(await groupe.getAttribute("aria-expanded") === "false" && await pg.getByRole("button", { name: /^Test 1 exercice/, includeHidden: true }).evaluate((el) => !!el.closest("[inert]")), "groupe replié : séances masquées");
await pg.reload();
await pg.getByRole("button", { name: /^Musculation/ }).waitFor();
ok(await pg.getByRole("button", { name: /^Musculation/ }).getAttribute("aria-expanded") === "false", "groupe toujours replié après rechargement");
await pg.getByRole("button", { name: /^Musculation/ }).click();
await pg.waitForTimeout(400);

// séance libre en plein écran
await pg.getByRole("button", { name: /^Test \d/ }).click();
await pg.waitForURL(/\/entrainement\/seance\/\?l=0/);
ok(await pg.locator('nav[aria-label="Navigation principale"]').count() === 0, "séance : barre d'onglets masquée");
ok((await pg.evaluate(() => window.__vt)) >= 1, "transition de page déclenchée");
ok(await pg.getByRole("button", { name: "Mes séances" }).isVisible(), "retour libellé « Mes séances » (l'écran d'où l'on vient)");

// modifier → composeur → retour : on revient sur la séance
await pg.getByRole("button", { name: "Modifier" }).click();
await pg.waitForURL(/\/entrainement\/composer\//);
ok(await pg.getByRole("button", { name: "Séance", exact: true }).waitFor({ timeout: 4000 }).then(() => true, () => false), "composeur : retour libellé « Séance »");
await pg.getByRole("button", { name: "Séance", exact: true }).click();
await pg.waitForURL(/\/entrainement\/seance\/\?l=0/);
ok(true, "retour du composeur vers la séance");
await pg.getByRole("button", { name: "Modifier" }).click();
await pg.waitForURL(/\/entrainement\/composer\//);
await pg.getByRole("button", { name: /^Enregistrer/ }).first().click();
await pg.waitForURL(/\/entrainement\/seance\/\?l=0/);
ok(true, "enregistrer une modification ramène à la séance");

// fiche chargée à part
ok(fiches === 0, "fiches.json pas chargé avant d'ouvrir une fiche");
{ const l = pg.locator("button[aria-expanded]").filter({ hasText: /Développé couché/ }).first(); if ((await l.getAttribute("aria-expanded")) !== "true") await l.click(); } // l'exercice en cours s'ouvre tout seul
await pg.getByRole("button", { name: "Fiche", exact: true }).click();
await pg.getByText("Exécution").waitFor({ timeout: 5000 });
ok(fiches === 1, "fiches.json chargé à l'ouverture de la fiche");
const variante = pg.locator('[role="dialog"] button').filter({ hasText: /Développé couché haltères|Pompes|Développé incliné/ }).first();
const nomVariante = (await variante.locator("span.font-semibold").first().textContent()).trim();
await variante.click();
await pg.waitForTimeout(300);
ok(await pg.locator('[role="dialog"] h2').first().textContent() === nomVariante, `variante ouverte dans la fiche (${nomVariante})`);
await pg.getByRole("button", { name: /Retour à développé couché barre/ }).click();
await pg.waitForTimeout(300);
ok(await pg.locator('[role="dialog"] h2').first().textContent() === "Développé couché barre", "retour à la fiche d'origine");
await pg.keyboard.press("Escape");
await pg.waitForTimeout(400);
await pg.getByRole("button", { name: "Fiche : Développé couché barre" }).click();
await pg.getByText("Exécution").waitFor({ timeout: 3000 }).catch(() => {});
ok(await pg.getByText("Exécution").isVisible(), "photo de la carte : fiche ouverte");
await pg.keyboard.press("Escape");
await pg.waitForTimeout(400);

await pg.getByRole("button", { name: "Mes séances" }).click();
await pg.waitForURL(/\/entrainement\/rubrique\/\?v=libre/);
ok(true, "retour de la séance vers Mes séances");

// + › « Je choisis les muscles » ouvre l'assistant, le retour ramène à l'accueil
await pg.goto(U + "/entrainement/");
await pg.getByRole("button", { name: /^Programmer( une séance)?$/ }).first().click();
await pg.getByRole("dialog").getByText("Je choisis les muscles").click();
await pg.waitForURL(/\/entrainement\/assistant\/(\?jour=[\d-]+)?$/); // le jour choisi suit (aujourd'hui compris)
ok(await pg.getByRole("button", { name: "Entraînement" }).waitFor({ timeout: 3000 }).then(() => true, () => false), "assistant : retour libellé « Entraînement »");
await pg.getByRole("button", { name: "Entraînement" }).click();
await pg.waitForURL(/\/entrainement\/$/);
ok(true, "retour de l'assistant vers Entraînement");

// anciennes adresses
for (const [de, vers] of [["/seances/seance/?i=0", /\/entrainement\/seance\/\?l=0/], ["/plan/", /\/entrainement\/$/], ["/explorer/", /\/entrainement\/$/], ["/exercices/", /\/entrainement\/$/], ["/compte/", /\/profil\/$/]]) {
  await pg.goto(U + de);
  await pg.waitForURL(vers, { timeout: 5000 }).catch(() => {});
  ok(vers.test(pg.url()), `ancienne adresse ${de} redirigée`);
}

// pendant une séance libre : ajouter un exercice à la fin, les séries déjà validées restent
await pg.goto(U + "/entrainement/seance/?l=0");
await pg.waitForTimeout(1000);
if (await pg.getByRole("button", { name: "Passer" }).isVisible().catch(() => false)) await pg.getByRole("button", { name: "Passer" }).click();
{ const l = pg.locator('[id="ex-L|0|0"] button[aria-expanded]').first(); if ((await l.getAttribute("aria-expanded")) !== "true") await l.click(); }
await pg.getByRole("button", { name: /^Valider la série/ }).first().click();
await pg.waitForTimeout(300);
await pg.getByRole("button", { name: "Ajouter un exercice" }).click();
await pg.getByRole("dialog").getByRole("tab", { name: "Liste" }).click(); // la feuille s'ouvre sur le corps
{ const m = pg.getByRole("dialog").getByRole("button", { name: "Mon matériel déclaré" }); if (await m.count()) await m.click(); }
await pg.getByPlaceholder(/Rechercher/).fill("curl");
await pg.getByRole("button", { name: /^Ajouter Curl/ }).first().click();
await pg.waitForTimeout(900);
const e9 = await pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")));
ok(e9.SEANCES[0].ex.length === 2 && /^curl|^c/i.test(e9.SEANCES[0].ex[1].id) !== null, "séance libre : exercice ajouté à la fin");
ok(e9.LOG["L|0|0"]?.series?.[0]?.ok === true, "les séries déjà validées sont conservées");
ok(await pg.locator('[id="ex-L|0|1"] [aria-expanded="true"]').count() === 1, "le nouvel exercice s'ouvre directement");

// onglets façon iOS : contenu instantané, pastille qui glisse, position retenue, onglet ouvert → en haut
const pastille = () => pg.evaluate(() => { const p = document.querySelector("[data-pastille]").getBoundingClientRect(), a = document.querySelector('nav a[aria-current="page"]').getBoundingClientRect(); return Math.abs(p.left + p.width / 2 - (a.left + a.width / 2)); });
await pg.goto(U + "/progres/");
await pg.waitForTimeout(800);
await pg.mouse.wheel(0, 600);
await pg.waitForTimeout(500);
const yAvant = await pg.evaluate(() => scrollY);
await pg.evaluate(() => { window.__vtTypes = []; });
await pg.locator("nav a", { hasText: "Entraînement" }).click();
await pg.waitForURL(/\/entrainement\/$/);
await pg.waitForTimeout(700);
ok(!(await pg.evaluate(() => window.__vtTypes)).some((x) => x.startsWith("onglet")), "changement d'onglet sans animation de page");
ok(await pastille() < 1, "pastille sous l'onglet Entraînement");
await pg.locator("nav a", { hasText: "Progrès" }).click();
await pg.waitForURL(/\/progres\/$/);
await pg.waitForTimeout(700);
const yApres = await pg.evaluate(() => scrollY);
ok(yAvant > 300 && Math.abs(yApres - yAvant) <= 5, `Progrès retrouvé là où on l'avait laissé (${yAvant} → ${yApres})`);
ok(await pastille() < 1, "pastille revenue sous Progrès");
await pg.locator("nav a", { hasText: "Progrès" }).click();
await pg.waitForTimeout(1200);
ok(await pg.evaluate(() => scrollY) === 0, "onglet ouvert touché : retour en haut");

// titre réduit centré sur l'écran, avec la langue à droite ou le retour à gauche
for (const c of ["/entrainement/", "/progres/", "/profil/", "/entrainement/seance/?l=0"]) {
  await pg.goto(U + c);
  await pg.waitForTimeout(900);
  await pg.mouse.wheel(0, 700);
  await pg.waitForTimeout(600);
  const d = await pg.evaluate(() => {
    const t = document.querySelector(".fixed .truncate.text-center");
    const g = document.createRange(); g.selectNodeContents(t); const x = g.getBoundingClientRect();
    return Math.abs(x.left + x.width / 2 - innerWidth / 2);
  });
  ok(d <= 2, `${c} : titre réduit centré (écart ${d.toFixed(1)} px)`);
}

// changer de compte (mode local : les données du téléphone seront effacées, on le dit)
await pg.goto(U + "/profil/");
await pg.getByRole("button", { name: "Changer de compte" }).click();
await pg.getByText("ce sera effacé").waitFor({ timeout: 3000 });
ok(true, "avertissement avant de quitter des données non rattachées");
await pg.getByRole("button", { name: "Effacer et changer" }).click();
await pg.waitForURL(/\/bienvenue\/\?recup=1/);
ok(await pg.evaluate(() => localStorage.getItem("palier.state.v1")) === null, "téléphone vidé, écran de connexion");
ok(await pg.locator("h1", { hasText: "Retrouver mon compte" }).isVisible(), "on peut se connecter à un autre compte");

ok(!errs.length, "aucune erreur JS" + (errs.length ? " : " + errs.join(" / ") : ""));
await b.close(); srv.close();
