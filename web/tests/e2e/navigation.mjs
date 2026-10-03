/* Parcours de navigation : trois onglets, séance en plein écran, retour vers
   l'écran d'où l'on vient, anciennes adresses, changer de compte, fiche chargée à part. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8803);
const U = "http://localhost:8803";
const etat = { A: { objectif: 0, materiel: 0, acc: [] }, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, SEANCES: [{ nom: "Test", ex: [{ id: "dc", s: 3, r: 8, p: "2 min" }] }], wk: 0, day: 0, FINI: false, ts: Date.now() };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: "block" });
await ctx.addInitScript((s) => { if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); sessionStorage.vu = 1; } }, etat);
await ctx.route(/supabase\.co/, (r) => r.abort());
const pg = await ctx.newPage();
const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
let fiches = 0; pg.on("request", (r) => r.url().includes("fiches.json") && fiches++);
await pg.addInitScript(() => {
  window.__vt = 0;
  const o = document.startViewTransition?.bind(document);
  if (o) document.startViewTransition = (...a) => { window.__vt++; return o(...a); };
});
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };
const actif = () => pg.locator('nav a[aria-current="page"]').textContent();

await pg.goto(U + "/");
await pg.waitForURL(/\/entrainement\/$/);
ok(await actif() === "Entraînement", "accueil : onglet Entraînement actif");
ok(await pg.locator("nav a").count() === 3, "trois onglets");
ok(await pg.getByText("Construis ton programme").isVisible(), "sans programme : la carte propose de le construire");

// séance libre en plein écran
await pg.getByText("Test", { exact: true }).click();
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
await pg.getByRole("button", { name: "Fiche" }).click();
await pg.getByText("Exécution").waitFor({ timeout: 5000 });
ok(fiches === 1, "fiches.json chargé à l'ouverture de la fiche");
await pg.keyboard.press("Escape");
await pg.waitForTimeout(400);

await pg.getByRole("button", { name: "Entraînement" }).click();
await pg.waitForURL(/\/entrainement\/$/);
ok(true, "retour de la séance vers Entraînement");

// assistant, puis onglets
await pg.getByText("Créer une séance pour moi").click();
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
await pg.getByText("Créer une séance pour moi").click();
await pg.waitForURL(/\/entrainement\/assistant\/$/);
await pg.getByRole("button", { name: "Full body" }).click();
await pg.getByRole("button", { name: "Créer ma séance" }).click();
await pg.waitForURL(/\/entrainement\/composer\/$/);
await pg.getByRole("button", { name: "Enregistrer la séance" }).click();
await pg.waitForURL(/\/entrainement\/$/);
await pg.waitForTimeout(400);
ok(await pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")).SEANCES.length) === 2, "séance créée, retour à Entraînement");
ok(!(await pg.goBack().then(() => /assistant|composer/.test(pg.url()))), "le retour arrière ne repasse pas par l'assistant");

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
