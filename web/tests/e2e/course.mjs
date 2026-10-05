/* Préparation course à pied : questionnaire › plan › séance guidée au minuteur ›
   saisie de la sortie (« trop dur » allège la semaine suivante) › pause et reprise ›
   renfo du coureur › carte sur Entraînement. CAPTURES=dossier pour des captures. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8815);
const U = "http://localhost:8815";
const etat = { A: { objectif: 3, materiel: 0, acc: [] }, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, SEANCES: [], wk: 0, day: 0, FINI: false, ts: Date.now() };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, serviceWorkers: "block" });
await ctx.addInitScript((s) => { if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); sessionStorage.vu = 1; } }, etat);
await ctx.route(/supabase\.co/, (r) => r.abort());
const pg = await ctx.newPage();
const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };
const etatLu = () => pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")));
const cap = async (n) => { if (process.env.CAPTURES) await pg.screenshot({ path: `${process.env.CAPTURES}/${n}.png`, fullPage: n.endsWith("-long") }); };

// questionnaire
await pg.goto(U + "/entrainement/assistant/?type=course");
await pg.getByRole("tab", { name: "Course" }).waitFor();
ok(await pg.getByRole("tab", { name: "Course" }).getAttribute("aria-selected") === "true", "onglet Course");
await pg.getByRole("tab", { name: "Semi-marathon" }).click();
await pg.getByRole("tab", { name: "10 km", exact: true }).last().click();
await pg.getByLabel("Minutes").fill("50");
await pg.getByLabel("Secondes").fill("00");
await pg.waitForTimeout(200);
ok(await pg.getByText("1 h 50").isVisible(), "chrono estimé au semi : 1 h 50 pour 50 min au 10 km");
await cap("course-questionnaire-long");
await pg.getByRole("button", { name: "Créer mon plan" }).click();
await pg.waitForURL(/\/entrainement\/course\/$/);
const e1 = await etatLu();
ok(e1.COURSE?.obj === "semi" && e1.COURSE.ref.sec === 3000 && e1.COURSE.jours === 4, "plan enregistré");
ok(e1.SEANCES.some((s) => s.nom === "Renfo coureur A"), "séance de renfo ajoutée à Mes séances");
await pg.getByText(/^Semaine 1 sur \d+/).waitFor();
ok(await pg.getByRole("heading", { name: /^J-\d+/ }).isVisible(), "compte à rebours");
await cap("course-plan");

// séance 1 au minuteur, puis saisie
await pg.locator("main button", { hasText: /lignes droites/ }).first().click();
await pg.waitForURL(/course\/\?s=0\|0/);
ok(await pg.getByText("Déroulé").isVisible(), "déroulé de la séance");
await cap("course-seance");
await pg.clock.install();
await pg.getByRole("button", { name: /^Minuteur/ }).click();
await pg.getByRole("timer").waitFor();
ok(await pg.getByText("Endurance", { exact: true }).isVisible(), "minuteur : footing guidé");
await pg.clock.runFor(70 * 60 * 1000);
await pg.getByText("Enregistrer la sortie").waitFor({ timeout: 5000 });
ok(+(await pg.getByLabel("Durée, minutes").inputValue()) > 30, "saisie pré-remplie avec la durée du minuteur");
await pg.getByLabel("Distance en km").fill("7,5");
await pg.getByRole("radio", { name: "Trop dur" }).click();
await cap("course-saisie");
await pg.getByRole("button", { name: "Enregistrer la sortie" }).click();
await pg.waitForTimeout(400);
const e2 = await etatLu();
ok(e2.SORTIES.length === 1 && e2.SORTIES[0].s === "0|0" && e2.SORTIES[0].km === 7.5, "sortie enregistrée et rattachée à la séance");
ok(e2.COURSE.ajust["1"] === 0.9, "trop dur : semaine suivante allégée");
ok(await pg.getByText(/Faite le/).isVisible(), "séance marquée faite");

// pause et reprise
await pg.goto(U + "/entrainement/course/");
await pg.getByRole("button", { name: "Mettre en pause" }).click();
await pg.waitForTimeout(300);
ok((await etatLu()).COURSE.pauses.length === 1, "plan en pause");
await pg.evaluate(() => {
  const s = JSON.parse(localStorage.getItem("palier.state.v1"));
  const d = new Date(Date.now() - 10 * 864e5);
  s.COURSE.pauses[0].de = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  localStorage.setItem("palier.state.v1", JSON.stringify(s));
});
await pg.reload();
await pg.getByRole("button", { name: "Reprendre le plan" }).click();
await pg.waitForTimeout(300);
const e3 = await etatLu();
ok(e3.COURSE.pauses[0].a && e3.COURSE.ajust["0"] === 0.7, "reprise après 10 jours : semaine réduite à 70 %");

// renfo du coureur
await pg.locator("main button", { hasText: "Renfo du coureur" }).first().click();
await pg.getByRole("button", { name: /Ouvrir la séance de renfo/ }).click();
await pg.waitForURL(/seance\/\?l=0/);
ok(await pg.getByText("Mollets sur une jambe").first().isVisible(), "renfo : séance de musculation ouverte");

// Progrès : section course à pied
await pg.goto(U + "/progres/");
await pg.getByRole("heading", { name: "Course à pied" }).waitFor();
ok(await pg.getByText("km cette semaine").isVisible() && await pg.getByText(/Chrono estimé au semi/).isVisible(), "Progrès : km, chrono estimé");
await cap("course-progres");

// jour J : la course tombe cette semaine, on la note → bilan, badge
await pg.evaluate(() => {
  const s = JSON.parse(localStorage.getItem("palier.state.v1"));
  const j = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const t = new Date(); const lundi = new Date(t); lundi.setDate(t.getDate() - ((t.getDay() + 6) % 7));
  const course = new Date(lundi); course.setDate(lundi.getDate() + 6);
  const debut = new Date(lundi); debut.setDate(lundi.getDate() - 7 * 13);
  s.COURSE.date = j(course); s.COURSE.debut = j(debut);
  localStorage.setItem("palier.state.v1", JSON.stringify(s));
});
await pg.goto(U + "/entrainement/course/");
await pg.locator("main button", { hasText: "Jour J" }).first().click();
await pg.getByRole("button", { name: "Noter" }).click();
await pg.getByLabel("Distance en km").fill("21,1");
await pg.getByLabel("Durée, minutes").fill("108");
await pg.getByRole("radio", { name: "Trop dur" }).click();
await pg.getByRole("button", { name: "Enregistrer la sortie" }).click();
await pg.getByText(/bouclé !/).waitFor({ timeout: 5000 });
ok(await pg.getByText("km de préparation").isVisible(), "jour J : bilan de la préparation");
await pg.waitForTimeout(1500);
await cap("course-jourj");
await pg.getByRole("button", { name: "Terminer" }).click();
await pg.getByText("Nouveau badge").waitFor({ timeout: 4000 }).catch(() => {});
const fetes = [];
while (await pg.getByText("Nouveau badge").isVisible().catch(() => false)) {
  fetes.push(await pg.getByRole("dialog").locator("h2").textContent());
  await pg.getByRole("button", { name: "Super" }).click();
  await pg.waitForTimeout(700);
}
ok(fetes.includes("Jour J"), `badges : ${fetes.join(", ")}`);

// carte sur Entraînement
await pg.goto(U + "/entrainement/");
await pg.getByText(/Semi-marathon · J-/).waitFor();
ok(true, "carte de la préparation sur Entraînement");
await cap("course-entrainement");

console.log("erreurs:", JSON.stringify(errs));
await ctx.close(); await b.close(); srv.close();
