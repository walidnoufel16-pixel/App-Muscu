/* Onglet Exercices sans loupe (liste complète sous le corps, réduite au muscle touché), message
   matériel bien visible, échauffement construit d'après la séance, chrono des exercices en durée,
   feuille « Bloc cardio » (résumé, frise, durée, intensité, détail replié).
   CAPTURES=dossier pour garder des captures. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8824);
const U = "http://localhost:8824";
const CAP = process.env.CAPTURES;
const etat = (seances = []) => ({
  A: { objectif: 0, regularite: 2, socle: 1, axe: 0, materiel: 0, acc: [], blessure: [], sexe: 0, prio: [], actuel: 0, profil: { "Âge": 30, Taille: 180, Poids: 78 } },
  LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, FINI: true, wk: 0, day: 0, HIST: [], SEANCES: seances, ts: Date.now(),
});
const PUSH = { nom: "Push", ex: [{ id: "dc", s: 3, r: 8, p: "2 min" }, { id: "dmh", s: 3, r: 10, p: "90 s" }, { id: "tri", s: 3, r: 12, p: "60 s" }] };
const JAMBES = { nom: "Jambes", ex: [{ id: "sq", s: 3, r: 8, p: "2 min" }, { id: "rm", s: 3, r: 10, p: "2 min" }] };
const GAINAGE = { nom: "Tronc", ex: [{ id: "gai", s: 2, r: 45, p: "60 s" }] };
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
const cap = async (pg, nom) => { if (CAP) { await pg.waitForTimeout(900); await pg.screenshot({ path: `${CAP}/${nom}.png` }); } };
const etatLu = (pg) => pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")));

{
  /* Exercices : rien de coché → l'encadré ; Haltères → tout sous le corps ; pectoraux → réduit. */
  const [ctx, pg] = await contexte(etat());
  await pg.goto(U + "/exercices/");
  const msg = pg.getByRole("status").filter({ hasText: "Sélectionne au moins un matériel" });
  await msg.waitFor({ timeout: 8000 });
  const st = await msg.evaluate((el) => ({ poids: getComputedStyle(el).fontWeight, fond: getComputedStyle(el).backgroundColor }));
  ok(+st.poids >= 600 && st.fond !== "rgba(0, 0, 0, 0)", `message matériel en gras sur fond coloré (${st.poids}, ${st.fond})`);
  await cap(pg, "materiel-message");
  ok(await pg.getByPlaceholder("Rechercher un exercice…").count() === 0, "plus de loupe dans Corps");
  await pg.getByRole("button", { name: "Haltères", exact: true }).click();
  await pg.getByRole("region", { name: "Pectoraux" }).waitFor();
  const groupes = await pg.locator("section[aria-label] h3.eyebrow").allTextContents();
  ok(groupes.length >= 5, `liste complète par groupe (${groupes.join(", ")})`);
  const tous = await pg.getByRole("button", { name: /^Développé couché haltères/ }).count() + await pg.getByText("Développé couché haltères", { exact: true }).count();
  ok(tous > 0 && await pg.getByText("Curl haltères", { exact: false }).count() > 0, "pectoraux et biceps dans la même liste");
  await cap(pg, "liste-complete");
  await pg.locator("path", { has: pg.locator("title", { hasText: "Pectoraux" }) }).first().click({ force: true });
  await pg.getByRole("region", { name: "Musculation" }).waitFor();
  ok(await pg.getByRole("region", { name: "Musculation" }).getByText(/Curl/).count() === 0, "pectoraux touchés : la liste se réduit");
  await pg.locator("path", { has: pg.locator("title", { hasText: "Pectoraux" }) }).first().click({ force: true });
  await pg.getByRole("region", { name: "Pectoraux" }).waitFor();
  ok(true, "toucher à nouveau : la liste complète revient");
  await ctx.close();
}

{
  /* Échauffement adapté : Push → pompes et approche au développé couché ; Jambes → squats et pont. */
  const [ctx, pg] = await contexte(etat([PUSH, JAMBES]));
  await pg.goto(U + "/entrainement/seance?l=0");
  await pg.getByRole("tab", { name: "Échauffement" }).click();
  await pg.getByText("Pompes d'activation").waitFor({ timeout: 8000 });
  const push = await pg.locator("ol").first().innerText();
  ok(/Séries d'approche/.test(push) && /Développé couché/.test(push), "Push : pompes d'activation et séries d'approche au développé couché");
  ok(!/\b\d+[ \t]*(pompes|squats|répétitions|reps)\b|RPE/i.test(push) && /Effort facile/.test(push), "Push : effort en clair, sans nombre de répétitions ni RPE");
  await cap(pg, "echauffement-push");
  await pg.goto(U + "/entrainement/seance?l=1");
  await pg.getByRole("tab", { name: "Échauffement" }).click();
  await pg.getByText("Squats d'activation").waitFor({ timeout: 8000 });
  ok(await pg.getByText("Pont fessier", { exact: true }).count() === 1 && await pg.getByText("Pompes d'activation").count() === 0, "Jambes : squats et pont fessier, pas de pompes");
  await ctx.close();
}

{
  /* Chrono : gainage 45 s, horloge accélérée. */
  const [ctx, pg] = await contexte(etat([GAINAGE]));
  await pg.clock.install();
  const plein = pg.locator('[role="timer"].inset-0'); // le minuteur plein écran, pas celui du repos
  await pg.goto(U + "/entrainement/seance?l=0");
  await pg.getByText("Gainage ventral").first().waitFor({ timeout: 8000 });
  const lancer = pg.getByRole("button", { name: "Lancer le chrono de la série 1" });
  if (!(await lancer.count())) await pg.getByText("Gainage ventral").first().click();
  await lancer.click();
  await plein.getByText("Prépare-toi").waitFor();
  await cap(pg, "chrono-prepa");
  await pg.clock.runFor(12000);
  await plein.getByText("Tiens", { exact: true }).waitFor();
  await cap(pg, "chrono-tiens");
  await pg.clock.runFor(46000);
  await plein.waitFor({ state: "detached" });
  let L = Object.values((await etatLu(pg)).LOG)[0];
  ok(L?.series?.[0]?.v === 45 && L.series[0].ok, `série 1 : 45 s inscrites et validée (${JSON.stringify(L?.series?.[0])})`);
  /* série 2 : arrêt à 20 s de maintien */
  await pg.getByRole("button", { name: "Lancer le chrono de la série 2" }).click();
  await pg.clock.runFor(30000);
  await plein.getByRole("button", { name: "Arrêter" }).click();
  await pg.getByRole("alertdialog").getByRole("button", { name: "Arrêter" }).or(pg.getByRole("dialog").getByRole("button", { name: "Arrêter" })).first().click();
  await plein.waitFor({ state: "detached" });
  L = Object.values((await etatLu(pg)).LOG)[0];
  ok(L?.series?.[1]?.v === 20 && L.series[1].ok, `arrêt à 20 s : 20 s inscrites (${JSON.stringify(L?.series?.[1])})`);
  await ctx.close();
}

{
  /* Feuille « Bloc cardio » : résumé, frise, 15 min, intensité, détail replié. */
  const [ctx, pg] = await contexte(etat());
  await pg.goto(U + "/entrainement/");
  await pg.getByText("Composer exercice par exercice").click();
  await pg.waitForURL(/composer/);
  await pg.getByRole("button", { name: "Bloc cardio", exact: true }).click();
  const f = pg.getByRole("dialog");
  await f.getByRole("region", { name: "Résumé" }).waitFor();
  ok(await f.getByText("Ajuster les durées en détail").count() === 1 && await f.getByText("Effort", { exact: true }).count() === 1, "résumé avec frise, détail replié (pas de compteurs)");
  await f.getByRole("button", { name: "15 minutes" }).click();
  const total = +(await f.getByRole("region", { name: "Résumé" }).locator("b.num").innerText());
  ok(Math.abs(total - 15) <= 2, `15 min choisies : ${total} min`);
  ok(await f.getByRole("button", { name: "15 minutes" }).getAttribute("aria-pressed") === "true", "15 min surligné");
  await f.getByRole("button", { name: /^Costaud/ }).click();
  const total2 = +(await f.getByRole("region", { name: "Résumé" }).locator("b.num").innerText());
  ok(Math.abs(total2 - 15) <= 2, `intensité Costaud : la durée reste proche (${total2} min)`);
  await f.getByRole("button", { name: "Ajuster les durées en détail" }).click();
  ok(await f.getByRole("button", { name: "Tours : plus" }).count() === 1, "détail déplié : les compteurs");
  await cap(pg, "bloc-cardio");
  await ctx.close();
}

{
  /* En anglais : échauffement, chrono, feuille cardio sans français. */
  const [ctx, pg] = await contexte(etat([PUSH]), "en");
  await pg.goto(U + "/entrainement/seance?l=0");
  await pg.getByRole("tab", { name: "Warm-up" }).click();
  await pg.getByText("Activation push-ups").waitFor({ timeout: 8000 });
  const t = await pg.locator("ol").first().innerText();
  ok(!/[éèàçêûôîœ]|Effort facile|Mise en route/.test(t.replace(/Développé|Repère/g, "")), "EN : échauffement en anglais");
  await ctx.close();
}

ok(!errs.length, "aucune erreur JS" + (errs.length ? " : " + errs.join(" / ") : ""));
await b.close();
srv.close();
