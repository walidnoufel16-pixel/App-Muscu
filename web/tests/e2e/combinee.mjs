/* Séance combinée de bout en bout (horloge accélérée), puis la feuille de partage
   en taille iPhone 15 (393 × 852). VIDEO=dossier pour filmer. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8807);
const U = "http://localhost:8807";
const etat = {
  A: { objectif: 0, regularite: 2, materiel: 0, acc: [] }, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, wk: 0, day: 0, FINI: false, ts: Date.now(),
  SEANCES: [{ nom: "Push", code: "AB2CD", ex: [{ id: "dc", s: 3, r: 8, p: "2 min" }, { id: "dmh", s: 3, r: 10, p: "2 min" }] }],
};
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({
  viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, serviceWorkers: "block", permissions: ["clipboard-read", "clipboard-write"],
  ...(process.env.VIDEO ? { recordVideo: { dir: process.env.VIDEO, size: { width: 393, height: 852 } } } : {}),
});
await ctx.addInitScript((s) => { if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); sessionStorage.vu = 1; } }, etat);
await ctx.route(/supabase\.co/, (r) => r.abort());
const pg = await ctx.newPage();
const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };
const etatLu = () => pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")));
const deborde = () => pg.evaluate(() => document.documentElement.scrollWidth > innerWidth || [...document.querySelectorAll('[role="dialog"] *')].some((el) => el.getBoundingClientRect().right > innerWidth + 1));
/* l'horloge accélérée n'est posée qu'au moment du minuteur : elle gênerait le glisser-déposer */
const avancer = async (s) => { for (let i = 0; i < s; i++) { await pg.clock.runFor(1000); await pg.waitForTimeout(process.env.VIDEO ? 60 : 4); } };

// ---------- partage : le code est visible en entier ----------
await pg.goto(U + "/entrainement/");
await pg.getByRole("button", { name: "Partager" }).first().click();
await pg.getByText("Partager « Push »").waitFor();
ok(await pg.getByLabel("Code : A B 2 C D").isVisible(), "feuille de partage : code visible en 5 cases");
ok(!(await deborde()), "feuille de partage : rien ne déborde en 393 px");
await pg.getByRole("button", { name: "Copier le code" }).click();
ok(await pg.evaluate(() => navigator.clipboard.readText()) === "AB2CD", "copier le code");
await pg.keyboard.press("Escape");
await pg.waitForTimeout(400);
await pg.getByText("Importer une séance avec un code").click();
await pg.getByRole("textbox", { name: "Code de la séance" }).waitFor();
await pg.waitForTimeout(700); // fin de l'animation de la feuille
const champ = await pg.getByRole("textbox", { name: "Code de la séance" }).boundingBox();
ok(champ && champ.y > 0 && champ.y + champ.height < 852, "import : feuille et champ du code visibles");
await pg.keyboard.press("Escape");
await pg.waitForTimeout(400);

// ---------- séance combinée ----------
await pg.getByText("Créer une séance pour moi").click();
await pg.getByRole("tab", { name: "Combinée" }).click();
await pg.getByRole("tab", { name: "Liste" }).first().click();
await pg.getByRole("button", { name: "Pectoraux", exact: true }).click();
await pg.getByRole("button", { name: /^30\/30/ }).click();
await pg.getByRole("button", { name: "Créer ma séance" }).click();
await pg.waitForURL(/\/entrainement\/composer\//);
const cartes = pg.locator("[data-carte]");
const n = await cartes.count();
ok(await cartes.last().getAttribute("data-carte").then((x) => x.startsWith("bloc-")), "composeur : bloc cardio placé à la fin");

// glisser le bloc au-dessus du 3e exercice (la liste d'abord à l'écran)
await cartes.nth(1).evaluate((el) => el.scrollIntoView({ block: "start" }));
await pg.waitForFunction(() => !document.getAnimations().some((a) => a.playState === "running" && a.effect?.getComputedTiming().iterations !== Infinity), null, { timeout: 5000 }).catch(() => {});
await pg.waitForTimeout(300);
const poignee = cartes.last().getByRole("button", { name: "Glisser pour déplacer" });
const cible = await cartes.nth(2).boundingBox();
const p = await poignee.boundingBox();
await pg.mouse.move(p.x + p.width / 2, p.y + p.height / 2);
await pg.mouse.down();
for (let k = 1; k <= 12; k++) { await pg.mouse.move(p.x + p.width / 2, p.y + (cible.y + 5 - p.y) * (k / 12)); await pg.waitForTimeout(30); }
await pg.mouse.up();
await pg.waitForTimeout(300);
const ordreCartes = await cartes.evaluateAll((l) => l.map((c) => c.dataset.carte.startsWith("bloc-") ? "bloc" : "ex"));
ok(ordreCartes.indexOf("bloc") > 0 && ordreCartes.indexOf("bloc") < n - 1, `bloc déplacé entre deux exercices (${ordreCartes.join(" ")})`);
await pg.getByRole("button", { name: "Enregistrer la séance" }).click();
await pg.waitForURL(/\/entrainement\/$/);
await pg.waitForTimeout(300);
const e1 = await etatLu();
const comb = e1.SEANCES.at(-1);
ok(comb.blocs?.length === 1 && comb.blocs[0].apres > 0 && comb.blocs[0].apres < comb.ex.length, "séance combinée enregistrée, bloc à sa place");
ok(await pg.getByRole("button", { name: /^Combinées 1/ }).isVisible(), "Mes séances : groupe Combinées");

// la séance : le bloc à sa place, on le lance
await pg.getByText(comb.nom, { exact: true }).click();
await pg.waitForURL(/\/entrainement\/seance\/\?l=1/);
await pg.clock.install();
await pg.getByRole("button", { name: "Lancer" }).click();
await pg.waitForURL(/\/entrainement\/cardio\/\?l=1&b=/);
await pg.getByRole("button", { name: /Démarrer/ }).click();
await pg.getByRole("timer").waitFor();
await avancer(1500);
await pg.getByText("Séance terminée").waitFor({ timeout: 5000 }).catch(() => {});
ok(await pg.getByText("Séance terminée").isVisible(), "bloc cardio joué : bilan");
await pg.getByRole("button", { name: "Terminer" }).click();
await pg.getByRole("button", { name: "Séance" }).first().click();
await pg.waitForURL(/\/entrainement\/seance\/\?l=1/);
ok(await pg.getByText(/fait aujourd'hui/).isVisible(), "retour à la séance : bloc « fait aujourd'hui »");

// + Bloc cardio sur une séance de muscu : elle passe dans Combinées
await pg.goto(U + "/entrainement/seance/?l=0");
await pg.getByRole("button", { name: "Modifier" }).click();
await pg.getByRole("button", { name: "Bloc cardio" }).click();
await pg.getByRole("button", { name: "OK" }).click();
await pg.getByRole("button", { name: "Enregistrer la séance" }).click();
await pg.waitForTimeout(600);
ok((await etatLu()).SEANCES[0].blocs?.length === 1, "+ Bloc cardio : Push devient combinée");

console.log("erreurs:", JSON.stringify(errs));
await ctx.close(); await b.close(); srv.close();
