/* Accès admin, serveur Supabase simulé : invisible et refusé pour un compte normal,
   tableau de bord, recherche et fiche pour l'admin. CAPTURES=dossier pour des captures. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8817);
const U = "http://localhost:8817";
const MOI = "aaaaaaaa-1111-4111-8111-111111111111";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: MOI, role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
const session = {
  access_token: jwt, refresh_token: "r", token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: { id: MOI, aud: "authenticated", role: "authenticated", email: "moi@ex.fr", app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
};
const deux = (n) => String(n).padStart(2, "0");
const jour = (t) => { const d = new Date(t); return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`; };
const auj = jour(Date.now()), hier = jour(Date.now() - 864e5);
const etat = { A: { objectif: 0, materiel: 0, acc: [] }, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, SEANCES: [], wk: 0, day: 0, FINI: false, ts: Date.now() };
const ex = (ids) => Object.fromEntries(ids.map((id) => [id, [60, 8, 70, 8, 3]]));
const comptes = [
  { id: "u1", email: "lea@ex.fr", anonyme: false, cree: new Date(Date.now() - 2 * 864e5).toISOString(), connexion: new Date().toISOString(), pseudo: "Léa", maj: new Date().toISOString(),
    etat: { A: { objectif: 0, materiel: 3, forme: { d: auj, sommeil: 1, energie: 2, courbatures: 1, douleur: [0] }, badges: { premiere: auj } }, FINI: true, wk: 1,
      HIST: [{ d: auj, s: "1|0", nom: "Haut du corps A", vol: 1200, ser: 12, rec: 1, ex: ex(["pomp", "tr"]) }, { d: hier, s: "0|1", nom: "Bas du corps A", vol: 900, ser: 10, ex: ex(["sqpc"]) }],
      SORTIES: [{ d: hier, km: 8, sec: 2700, rpe: 4 }] } },
  { id: "u2", email: null, anonyme: true, cree: new Date(Date.now() - 40 * 864e5).toISOString(), connexion: null, pseudo: "Max", maj: new Date(Date.now() - 20 * 864e5).toISOString(),
    etat: { A: { objectif: 1, materiel: 0 }, HIST: [{ d: jour(Date.now() - 20 * 864e5), s: "L|0", nom: "Push", vol: 3000, ser: 15, ex: ex(["dc", "pomp"]) }] } },
];
const stats = { generations: [{ jour: auj, n: 3, comptes: 2 }], cache: 12, defis: [{ code: "AMIS2", nom: "Octobre entre potes", type: "seances", cible: 8, debut: hier, fin: auj, participants: 2 }], partages: 4, partages_recents: [{ nom: "Push du lundi", cree: new Date().toISOString() }] };

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };
const errs = [];

async function contexte(admin) {
  const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, serviceWorkers: "block" });
  await ctx.addInitScript(([s, sess]) => {
    if (!sessionStorage.vu) {
      localStorage.setItem("palier.state.v1", JSON.stringify(s));
      localStorage.setItem("palier.pseudo.v1", "Walid");
      localStorage.setItem("sb-iyjiwfzrmyvcnmzwlgxe-auth-token", JSON.stringify(sess));
      sessionStorage.vu = 1;
    }
  }, [etat, session]);
  const appels = [];
  await ctx.route(/supabase\.co/, async (r) => {
    const u = new URL(r.request().url()), corps = r.request().postDataJSON?.() || {};
    const json = (body, status = 200) => r.fulfill({ status, contentType: "application/json", body: JSON.stringify(body), headers: { "access-control-allow-origin": "*" } });
    if (r.request().method() === "OPTIONS") return r.fulfill({ status: 200, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
    const rpc = u.pathname.match(/\/rest\/v1\/rpc\/(\w+)/)?.[1];
    if (rpc) {
      appels.push(rpc);
      if (rpc === "est_admin") return json(admin);
      if (!admin) return json({ code: "42501", message: "Accès refusé" }, 403);
      if (rpc === "admin_utilisateurs") return json(comptes);
      if (rpc === "admin_stats") return json(stats);
      if (rpc === "admin_etat") {
        const c = comptes.find((x) => x.id === corps.p_user);
        return json(c ? { ...c, defis: [{ code: "AMIS2", nom: "Octobre entre potes", type: "seances", cible: 8, debut: hier, fin: auj, score: 5 }], generations: [{ jour: auj, n: 2 }] } : null);
      }
    }
    if (u.pathname.includes("/functions/v1/supprimer")) {
      appels.push("supprimer:" + corps.user);
      const i = comptes.findIndex((x) => x.id === corps.user);
      if (i >= 0) comptes.splice(i, 1);
      return json({ ok: true, journal: true });
    }
    if (u.pathname.includes("/rest/v1/etats")) return json(r.request().method() === "GET" ? null : [], r.request().method() === "GET" ? 200 : 201);
    if (u.pathname.includes("/auth/v1/user")) return json(session.user);
    return json({});
  });
  const pg = await ctx.newPage();
  pg.on("pageerror", (e) => errs.push(e.message));
  return { ctx, pg, appels };
}

// compte normal : pas d'entrée Admin, /admin renvoie vers Profil
{
  const { ctx, pg, appels } = await contexte(false);
  await pg.goto(U + "/profil/");
  await pg.getByText("Confidentialité").waitFor({ timeout: 8000 });
  await pg.waitForTimeout(800);
  ok(appels.includes("est_admin") && !(await pg.getByRole("button", { name: "Admin" }).isVisible()), "compte normal : pas d'entrée Admin");
  ok(await pg.getByText(/L'éditeur de Repère peut les consulter/).isVisible(), "Profil : section Confidentialité");
  await pg.goto(U + "/admin/");
  await pg.waitForURL(/\/profil\/?$/, { timeout: 8000 });
  ok(!appels.includes("admin_utilisateurs"), "compte normal : /admin redirige vers Profil sans rien demander");
  await ctx.close();
}

// admin
{
  const { ctx, pg } = await contexte(true);
  const cap = async (n) => { if (!process.env.CAPTURES) return; await pg.waitForTimeout(1200); await pg.screenshot({ path: `${process.env.CAPTURES}/${n}.png`, fullPage: n.endsWith("-long") }); };
  await pg.goto(U + "/profil/");
  await pg.getByRole("button", { name: "Admin" }).click({ timeout: 8000 });
  await pg.waitForURL(/\/admin\/?$/);
  await pg.getByText("Séances par semaine, tous comptes").waitFor({ timeout: 8000 });
  const txt = await pg.locator("main").textContent();
  ok(/2comptes1 avec adresse · 1 sans/.test(txt), "tableau de bord : 2 comptes, 1 avec adresse");
  ok(/3\/150aujourd'hui/.test(txt) && txt.includes("12 programmes en cache"), "IA : 3/150 aujourd'hui, cache");
  ok(txt.includes("Pompes") && txt.includes("Octobre entre potes") && txt.includes("Push du lundi"), "top exercices, défis, partages");
  await cap("admin-tableau-long");
  await pg.getByRole("tab", { name: "Utilisateurs" }).click();
  await pg.getByText("2 comptes").waitFor();
  await pg.getByLabel("Rechercher un utilisateur").fill("lea@");
  await pg.getByText("1 compte").waitFor();
  await cap("admin-utilisateurs");
  await pg.getByRole("button", { name: /Léa/ }).click();
  await pg.waitForURL(/\/admin\/fiche\/?\?u=u1/);
  await pg.getByRole("heading", { name: "Réponses au questionnaire" }).waitFor({ timeout: 8000 });
  const f = await pg.locator("main").textContent();
  ok(f.includes("lea@ex.fr") && f.includes("Haut du corps A") && f.includes("Semaine en cours") && f.includes("8 km"), "fiche : identité, séances, programme, course");
  ok(f.includes("Octobre entre potes") && f.includes("5/8"), "fiche : défis et score");
  ok(f.includes("épaules") || f.includes("Épaules"), "fiche : douleur signalée");
  await cap("admin-fiche-long");
  ok(!(await pg.evaluate(() => Object.keys(localStorage).some((k) => /admin/i.test(k)))), "rien d'admin gardé dans le téléphone");
  await ctx.close();
}

// formes réelles de la production, chargement direct, suppression
{
  const T = "2026-10-04 09:54:24.478679+00", base = { email: null, anonyme: true, cree: T, connexion: null, maj: T };
  comptes.push(
    { ...base, id: "u3", pseudo: "Vide", etat: { A: {}, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, SEANCES: [], wk: 0, day: 0, FINI: false } },
    { ...base, id: "u4", pseudo: "Ancien", etat: { A: { axe: 0, prio: [3], sexe: 1, prefs: {}, socle: 2, sport: 3, sportFreq: 1, profil: { Poids: 76 }, blessure: [0], materiel: 3, objectif: 0, regularite: 1 },
      LOG: {}, SWAP: {}, SWAPP: {}, wk: 0, day: 1, FINI: true, SEANCES: [{ ex: [{ p: "90 s", r: 10, s: 3, id: "arn" }], nom: "Epaules", code: "XSCP7" },
        { ex: [{ p: "2 min", r: 12, s: 4, id: "pomp" }], nom: "Pecs et cardio", blocs: [{ id: "b1", apres: 1, f: "tabata", m: "velo", n: 1, r: {} }] }],
      PLAN: { plan: { titre: "Cycle" }, seances: [{ titre: "Haut A", exercices: [{ id: "tr", reps: 8, role: 1, repos: "3 min", series: 4 }, { id: "ra", reps: 10, role: 0, repos: "90 s", series: 3 }] }, { titre: "Bas A", exercices: [{ id: "gai", reps: 45, role: 1, repos: "90 s", series: 3 }, { id: "plat", reps: 45, role: 0, repos: "75 s", series: 2 }] }] } } },
    { ...base, id: "u5", pseudo: "Journal", etat: { A: {}, SWAP: {}, SWAPP: {}, PLAN: null, wk: 0, day: 0, FINI: false, SEANCES: [{ ex: [{ p: "2 min", r: 10, s: 3, id: "pompe" }], nom: "Pecs" }],
      LOG: { "L|0|0": { v: 0, ex: "pompe", nb: 3, ts: Date.now() - 864e5, done: true, feel: null, reps: 10, series: [{ v: 0, ok: true, reps: 10 }] } } } },
    { ...base, id: MOI, email: "moi@ex.fr", anonyme: false, pseudo: "Walid", etat },
  );
  const { ctx, pg, appels } = await contexte(true);
  const cap = async (n) => { if (!process.env.CAPTURES) return; await pg.waitForTimeout(1200); await pg.screenshot({ path: `${process.env.CAPTURES}/${n}.png`, fullPage: n.endsWith("-long") }); };
  await pg.goto(U + "/admin/?v=u");
  await pg.getByText("6 comptes").waitFor({ timeout: 8000 });
  ok(/\/admin\/?\?v=u/.test(pg.url()), "chargement direct de /admin : pas de renvoi vers Profil");
  ok((await pg.locator("main button", { hasText: "Journal" }).textContent()).includes("1 séance"), "compte ancien : séance retrouvée dans son journal");
  const liste = await pg.locator("main").textContent();
  ok(!/Invalid|NaN/.test(liste), "liste : dates valides (microsecondes du serveur)");
  for (const [id, nom] of [["u3", "vide"], ["u4", "ancien format"], ["u5", "journal seul"]]) {
    await pg.goto(U + "/admin/fiche/?u=" + id);
    await pg.getByRole("heading", { name: "Réponses au questionnaire" }).waitFor({ timeout: 8000 });
    const f = await pg.locator("main").textContent();
    ok(!/Impossible d'afficher|Invalid|NaN/.test(f) && f.includes("4 oct 2026"), `fiche ${nom} : affichée, dates valides`);
    if (id === "u3") ok(f.includes("n'a encore enregistré aucune séance"), "fiche vide : bandeau explicatif");
    if (id === "u5") await cap("admin-fiche-journal-long");
    if (id === "u4") {
      await pg.locator("summary", { hasText: "Epaules" }).click();
      const d = await pg.locator("details", { hasText: "Epaules" }).textContent();
      ok(d.includes("Développé Arnold") && d.includes("3 × 10") && d.includes("XSCP7"), "séance composée : exercices, séries × répétitions, code de partage");
      await pg.locator("summary", { hasText: "Pecs et cardio" }).click();
      ok((await pg.locator("details", { hasText: "Pecs et cardio" }).textContent()).includes("Cardio : Tabata · Vélo"), "séance combinée : bloc cardio");
      await pg.locator("summary", { hasText: "Haut A" }).click();
      ok(/Tractions/.test(await pg.locator("details", { hasText: "Haut A" }).textContent()), "programme : exercices de la semaine en cours");
      await cap("admin-fiche-seances-long");
    }
  }
  await pg.goto(U + "/admin/fiche/?u=" + MOI);
  await pg.getByRole("heading", { name: "Réponses au questionnaire" }).waitFor({ timeout: 8000 });
  ok(!(await pg.getByRole("button", { name: "Supprimer ce compte" }).isVisible()), "ma propre fiche : pas de suppression");
  await pg.goto(U + "/admin/fiche/?u=u5");
  await pg.getByRole("button", { name: "Supprimer ce compte" }).click({ timeout: 8000 });
  await pg.getByRole("dialog").getByText(/définitif/).waitFor();
  await cap("admin-suppression");
  await pg.getByRole("dialog").getByRole("button", { name: "Supprimer" }).click();
  await pg.waitForURL(/\/admin\/?\?v=u/, { timeout: 8000 });
  await pg.getByText("5 comptes").waitFor({ timeout: 8000 });
  ok(appels.includes("supprimer:u5") && !(await pg.locator("main button", { hasText: "Journal" }).count()), "suppression : appel serveur, retour à la liste, compte disparu");
  await ctx.close();
}

console.log("erreurs:", JSON.stringify(errs));
await b.close(); srv.close();
