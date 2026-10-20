/* Parcours de navigation : trois onglets, séance en plein écran, retour vers
   l'écran d'où l'on vient, anciennes adresses, changer de compte, fiche chargée à part. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8803);
const U = "http://localhost:8803";
const etat = { A: { objectif: 0, materiel: 0, acc: [] }, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, SEANCES: [{ nom: "Test", ex: [{ id: "dc", s: 3, r: 8, p: "2 min" }] }], wk: 0, day: 0, FINI: false, ts: Date.now() };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({ locale: "fr-FR", viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
/* le programme sur 8 semaines est en pause dans l'app : on le rallume pour le tester */
await ctx.addInitScript(() => localStorage.setItem("repere.programme", "1"));
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
/* Nouvelle séance : les trois façons d'en créer une, en tête des séances libres */
const creer = async (pg, quoi) => { await pg.getByText(quoi).first().click(); };
const actif = () => pg.locator('nav a[aria-current="page"]').textContent();

await pg.goto(U + "/");
await pg.waitForURL(/\/entrainement\/$/);
ok(await actif() === "Entraînement", "accueil : onglet Entraînement actif");
ok(await pg.locator("nav a").count() === 4, "quatre onglets");
await pg.getByRole("tab", { name: "Programme" }).click();
ok(await pg.getByText("Construis ton programme").isVisible(), "vue Programme sans programme : la carte propose de le construire");
await pg.getByRole("tab", { name: "Séances libres" }).click();

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
ok(await pg.getByRole("button", { name: "Entraînement" }).isVisible(), "retour libellé « Entraînement »");

// modifier → composeur → retour : on revient sur la séance
await pg.getByRole("button", { name: "Modifier" }).click();
await pg.waitForURL(/\/entrainement\/composer\//);
ok(await pg.getByRole("button", { name: "Séance", exact: true }).isVisible(), "composeur : retour libellé « Séance »");
await pg.getByRole("button", { name: "Séance", exact: true }).click();
await pg.waitForURL(/\/entrainement\/seance\/\?l=0/);
ok(true, "retour du composeur vers la séance");
await pg.getByRole("button", { name: "Modifier" }).click();
await pg.waitForURL(/\/entrainement\/composer\//);
await pg.getByRole("button", { name: "Enregistrer la séance" }).click();
await pg.waitForURL(/\/entrainement\/seance\/\?l=0/);
ok(true, "enregistrer une modification ramène à la séance");

// fiche chargée à part
ok(fiches === 0, "fiches.json pas chargé avant d'ouvrir une fiche");
await pg.locator("button").filter({ hasText: /Développé couché/ }).first().click();
await pg.getByRole("button", { name: "Fiche", exact: true }).click();
await pg.getByText("Exécution").waitFor({ timeout: 5000 });
ok(fiches === 1, "fiches.json chargé à l'ouverture de la fiche");
// variantes : on ouvre une variante dans la même feuille, puis on revient
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
// toucher la photo d'une carte ouvre directement la fiche
await pg.getByRole("button", { name: "Fiche : Développé couché barre" }).click();
await pg.getByText("Exécution").waitFor({ timeout: 3000 }).catch(() => {});
ok(await pg.getByText("Exécution").isVisible(), "photo de la carte : fiche ouverte");
await pg.keyboard.press("Escape");
await pg.waitForTimeout(400);

await pg.getByRole("button", { name: "Entraînement" }).click();
await pg.waitForURL(/\/entrainement\/$/);
ok(true, "retour de la séance vers Entraînement");

// assistant, puis onglets
await creer(pg, "Créer une séance pour moi");
await pg.waitForURL(/\/entrainement\/assistant\/$/);
ok(await pg.getByRole("button", { name: "Entraînement" }).waitFor({ timeout: 3000 }).then(() => true, () => false), "assistant : retour libellé « Entraînement »");
await pg.getByRole("button", { name: "Entraînement" }).click();
await pg.waitForURL(/\/entrainement\/$/);
await pg.locator("nav a", { hasText: "Exercices" }).click();
await pg.waitForURL(/\/exercices\/$/);
ok(await actif() === "Exercices", "onglet Exercices actif");

// anciennes adresses
for (const [de, vers] of [["/seances/seance/?i=0", /\/entrainement\/seance\/\?l=0/], ["/plan/", /\/entrainement\/$/], ["/explorer/", /\/exercices\/$/], ["/compte/", /\/profil\/$/], ["/plan/synthese/", /\/entrainement\/programme\/$/]]) {
  await pg.goto(U + de);
  await pg.waitForURL(vers, { timeout: 5000 }).catch(() => {});
  ok(vers.test(pg.url()), `ancienne adresse ${de} redirigée`);
}

// créer une séance avec l'assistant : après l'enregistrement, retour à Entraînement (pas à l'assistant)
await pg.goto(U + "/entrainement/");
await creer(pg, "Créer une séance pour moi");
await pg.waitForURL(/\/entrainement\/assistant\/$/);
await pg.getByRole("button", { name: "Full body" }).click();
await pg.getByRole("button", { name: "Créer ma séance" }).click();
await pg.waitForURL(/\/entrainement\/composer\/$/);
// ajouter des exercices à la séance générée : bouton « + Exercice », feuille de la bibliothèque
const nbAvant = +(await pg.getByText(/^Ta séance · \d+ exercice/).textContent()).match(/(\d+) exercice/)[1];
await pg.getByRole("button", { name: "Exercice", exact: true }).click();
await pg.getByRole("heading", { name: "Ajouter un exercice" }).waitFor();
await pg.getByPlaceholder(/Rechercher/).fill("curl");
await pg.getByRole("button", { name: /^Ajouter Curl/ }).first().click();
await pg.getByPlaceholder(/Rechercher/).fill("gainage");
await pg.getByRole("button", { name: /^Ajouter / }).first().click();
await pg.getByRole("button", { name: /^Terminé/ }).click();
await pg.waitForTimeout(500);
const nbApres = +(await pg.getByText(/^Ta séance · \d+ exercice/).textContent()).match(/(\d+) exercice/)[1];
ok(nbApres === nbAvant + 2, `composeur : 2 exercices ajoutés (${nbAvant} → ${nbApres})`);
await pg.getByRole("button", { name: "Enregistrer la séance" }).click();
await pg.waitForURL(/\/entrainement\/$/);
await pg.waitForTimeout(400);
ok(await pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")).SEANCES.at(-1).ex.length) === nbApres, "séance enregistrée avec les exercices ajoutés");
ok(await pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")).SEANCES.length) === 2, "séance créée, retour à Entraînement");
ok(!(await pg.goBack().then(() => /assistant|composer/.test(pg.url()))), "le retour arrière ne repasse pas par l'assistant");

// pendant une séance libre : ajouter un exercice à la fin, les séries déjà validées restent
await pg.goto(U + "/entrainement/seance/?l=0");
await pg.waitForTimeout(1000);
if (await pg.getByRole("button", { name: "Passer" }).isVisible().catch(() => false)) await pg.getByRole("button", { name: "Passer" }).click();
await pg.locator('[id="ex-L|0|0"] button[aria-expanded]').first().click();
await pg.getByRole("button", { name: /^Valider la série/ }).first().click();
await pg.waitForTimeout(300);
await pg.getByRole("button", { name: "Ajouter un exercice" }).click();
await pg.getByPlaceholder(/Rechercher/).fill("curl");
await pg.getByRole("button", { name: /^Ajouter Curl/ }).first().click();
await pg.waitForTimeout(900);
const e9 = await pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")));
ok(e9.SEANCES[0].ex.length === 2 && /^curl|^c/i.test(e9.SEANCES[0].ex[1].id) !== null, "séance libre : exercice ajouté à la fin");
ok(e9.LOG["L|0|0"]?.series?.[0]?.ok === true, "les séries déjà validées sont conservées");
ok(await pg.locator('[id="ex-L|0|1"] [aria-expanded="true"]').count() === 1, "le nouvel exercice s'ouvre directement");

// onglets façon iOS : contenu instantané, pastille qui glisse, position retenue, onglet ouvert → en haut
const pastille = () => pg.evaluate(() => { const p = document.querySelector("[data-pastille]").getBoundingClientRect(), a = document.querySelector('nav a[aria-current="page"]').getBoundingClientRect(); return Math.abs(p.left + p.width / 2 - (a.left + a.width / 2)); });
await pg.goto(U + "/exercices/");
await pg.getByRole("tab", { name: "Liste" }).click();
await pg.waitForTimeout(800);
await pg.mouse.wheel(0, 600);
await pg.waitForTimeout(500);
const yAvant = await pg.evaluate(() => scrollY);
await pg.evaluate(() => { window.__vtTypes = []; });
await pg.locator("nav a", { hasText: "Progrès" }).click();
await pg.waitForURL(/\/progres\/$/);
await pg.waitForTimeout(700);
ok(!(await pg.evaluate(() => window.__vtTypes)).some((x) => x.startsWith("onglet")), "changement d'onglet sans animation de page");
ok(await pastille() < 1, "pastille sous l'onglet Progrès");
await pg.locator("nav a", { hasText: "Exercices" }).click();
await pg.waitForURL(/\/exercices\/$/);
await pg.waitForTimeout(700);
const yApres = await pg.evaluate(() => scrollY);
ok(yAvant > 300 && Math.abs(yApres - yAvant) <= 5, `Exercices retrouvé là où on l'avait laissé (${yAvant} → ${yApres})`);
ok(await pastille() < 1, "pastille revenue sous Exercices");
await pg.locator("nav a", { hasText: "Exercices" }).click();
await pg.waitForTimeout(1200);
ok(await pg.evaluate(() => scrollY) === 0, "onglet ouvert touché : retour en haut");

// titre réduit centré sur l'écran, avec la langue à droite ou le retour à gauche
for (const c of ["/entrainement/", "/exercices/", "/profil/", "/entrainement/seance/?l=0"]) {
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

console.log("erreurs:", JSON.stringify(errs));
await b.close(); srv.close();
