/* Protéines, bilan du mois à partager, option cycle (données gardées sur le téléphone).
   CAPTURES=dossier pour garder des captures. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8811);
const U = "http://localhost:8811";
const deux = (n) => String(n).padStart(2, "0");
const m = new Date(); m.setDate(1); m.setMonth(m.getMonth() - 1);
const mois = `${m.getFullYear()}-${deux(m.getMonth() + 1)}`;
const HIST = [3, 6, 10, 13, 17, 20, 24].map((d, i) => ({ d: `${mois}-${deux(d)}`, s: "L|0", nom: "Push", vol: 3000 + i * 400, ser: 9, ex: { dc: [70 + i * 2, 3000, 60 + i * 2, 8, 3], sq: [100 + i * 3, 1500, 80 + i * 3, 6, 3] } }));
const etat = {
  A: { objectif: 0, materiel: 0, acc: [], sexe: 1, profil: { Poids: 70 } }, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null,
  SEANCES: [{ nom: "Push", ex: [{ id: "dc", s: 3, r: 8, p: "2 min" }] }], wk: 0, day: 0, FINI: false, HIST,
  CARDIO: [{ nom: "Rameur", f: "norvegien", m: "ram", min: 31, effort: 8, ts: new Date(`${mois}-08T18:00`).getTime() }], ts: Date.now(),
};
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, serviceWorkers: "block" });
await ctx.addInitScript((s) => { if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); sessionStorage.vu = 1; } }, etat);
await ctx.route(/supabase\.co/, (r) => r.abort());
const pg = await ctx.newPage();
const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };
const cap = async (n) => { if (process.env.CAPTURES) await pg.screenshot({ path: `${process.env.CAPTURES}/${n}.png` }); };

// protéines
await pg.goto(U + "/entrainement/");
await pg.getByText(/de protéines/).waitFor();
ok(await pg.getByText("/ 125 g").isVisible(), "objectif protéines : 70 kg × 1,8 ≈ 125 g");
await pg.getByText(/de protéines/).click();
await pg.getByRole("button", { name: /Poulet ou dinde/ }).click();
await pg.getByRole("button", { name: /Œufs/ }).click();
await pg.waitForTimeout(300);
await cap("proteines");
await pg.keyboard.press("Escape");
await pg.waitForTimeout(400);
ok(await pg.getByText("42", { exact: true }).isVisible(), "42 g notés (poulet + œufs)");

// bilan du mois
await pg.locator("nav a", { hasText: "Progrès" }).click();
await pg.getByText(/^Ton bilan de /).waitFor();
await pg.getByText(/^Ton bilan de /).click();
await pg.waitForURL(/\/progres\/bilan\/\?p=/);
await pg.getByText(/^Ton mois de/).waitFor();
ok(await pg.locator('nav[aria-label="Navigation principale"]').count() === 0, "bilan en plein écran");
ok(await pg.getByRole("heading", { name: "8 séances" }).isVisible(), "écran 1 : 8 séances");
await cap("bilan-1");
await pg.getByRole("button", { name: "Suivant" }).click();
await pg.waitForTimeout(700);
ok(await pg.getByText("Tu as soulevé").isVisible() && await pg.getByText(/éléphants|voitures|baleine/).isVisible(), "écran 2 : tonnage et comparaison");
await cap("bilan-2");
for (let i = 0; i < 6 && !(await pg.getByText("À partager").isVisible().catch(() => false)); i++) { await pg.getByRole("button", { name: "Suivant" }).click(); await pg.waitForTimeout(400); }
await pg.getByAltText("Ton bilan en image").waitFor({ timeout: 5000 });
const taille = await pg.getByAltText("Ton bilan en image").evaluate((i) => [i.naturalWidth, i.naturalHeight]);
ok(taille[0] === 1080 && taille[1] === 1920, `image story fabriquée (${taille.join("×")})`);
await pg.waitForTimeout(600);
await cap("bilan-fin");
await pg.getByRole("button", { name: "Fermer" }).click();
await pg.waitForURL(/\/progres\/$/);

// cycle : réglage local, phase dans le check-in, rien dans l'état synchronisé
await pg.goto(U + "/profil/");
await pg.getByText("Cycle menstruel").waitFor();
await pg.getByLabel("Adapter à mon cycle").check();
const d = new Date(); d.setDate(d.getDate() - 1);
await pg.locator('input[type="date"]').fill(`${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`);
await pg.waitForTimeout(200);
ok(await pg.getByText(/Aujourd'hui : règles \(jour 2\)/).isVisible(), "phase calculée : règles, jour 2");
const local = await pg.evaluate(() => [localStorage.getItem("repere.cycle.v1"), localStorage.getItem("palier.state.v1")]);
ok(!!local[0] && !local[1].includes("cycle") && !local[1].includes("duree"), "données du cycle hors de l'état synchronisé");
await pg.goto(U + "/entrainement/seance/?l=0");
await pg.getByText("Comment tu te sens ?").waitFor();
ok(await pg.getByText(/Règles.*jour 2/).isVisible(), "check-in : rappel de la phase");
await cap("cycle-checkin");

console.log("erreurs:", JSON.stringify(errs));
await ctx.close(); await b.close(); srv.close();
