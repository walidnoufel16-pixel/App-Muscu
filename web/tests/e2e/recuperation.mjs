/* Reconnexion à un compte existant sur un téléphone où l'on s'entraînait sans être connecté
   (retour d'un testeur, novembre 2026) : Profil › Changer de compte n'efface plus rien, le code
   propose d'ajouter les séances du téléphone au compte (coché par défaut) ; décoché, le compte
   remplace le téléphone, et ce choix tient. Serveur Supabase simulé. CAPTURES=dossier pour des captures. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const S = process.env.CAPTURES;
servir(new URL("../../out/", import.meta.url).pathname, 8839);
const U = "http://localhost:8839";
const ID = "cccccccc-1111-4111-8111-111111111111";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: ID, role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
const user = { id: ID, aud: "authenticated", role: "authenticated", is_anonymous: false, email: "ad@ex.fr", app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
const session = { access_token: jwt, refresh_token: "r", token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user };
const ligne = (d, s) => ({ d, s, nom: "Haut du corps", vol: 1000, ser: 9, ex: {} });
/* le téléphone : 3 séances faites sans compte */
const local = { A: { objectif: 0, regularite: 2, socle: 1, axe: 0, materiel: 0, acc: [], blessure: [], sexe: 0, prio: [], actuel: 0, profil: { "Âge": 25, Taille: 178, Poids: 72 } },
  LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, FINI: true, wk: 1, day: 0, HIST: [ligne("2026-11-19", "L|0"), ligne("2026-11-21", "L|0"), ligne("2026-11-23", "L|0")],
  SEANCES: [{ nom: "Haut du corps", ex: [{ id: "dc", s: 3, r: 8, p: "2 min" }] }], ts: Date.now() };
/* le compte : créé, presque vide */
const compte = { A: { objectif: 1, regularite: 3, socle: 1, axe: 0, materiel: 2, acc: [], blessure: [], sexe: 0, prio: [], actuel: 0, profil: { "Âge": 25, Taille: 178, Poids: 72 } },
  LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null, FINI: false, wk: 0, day: 0, HIST: [], SEANCES: [{ nom: "Pecs", ex: [{ id: "dc", s: 4, r: 10, p: "2 min" }] }], ts: Date.now() - 6 * 864e5 };
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };
async function parcours(ajouter) {
  const envois = [];
  const ctx = await b.newContext({ locale: "fr-FR", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, serviceWorkers: "block" });
  await ctx.addInitScript((s) => { if (!sessionStorage.vu) { localStorage.setItem("palier.state.v1", JSON.stringify(s)); localStorage.setItem("repere.visite.seance", "1"); sessionStorage.vu = 1; } }, local);
  let connecte = false;
  await ctx.route(/supabase\.co/, async (r) => {
    const u = new URL(r.request().url()), m = r.request().method(), corps = r.request().postDataJSON?.() || {};
    const json = (body, status = 200) => r.fulfill({ status, contentType: "application/json", body: JSON.stringify(body), headers: { "access-control-allow-origin": "*" } });
    if (m === "OPTIONS") return r.fulfill({ status: 200, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
    if (u.pathname.endsWith("/auth/v1/otp")) return json({});
    if (u.pathname.endsWith("/auth/v1/verify")) { connecte = corps.token === "123456"; return connecte ? json(session) : json({ code: 403, error_code: "otp_expired", msg: "bad" }, 403); }
    if (u.pathname.endsWith("/auth/v1/user")) return connecte ? json(user) : json({ code: 401, msg: "no" }, 401);
    if (u.pathname.includes("/rest/v1/etats")) {
      if (m === "GET") return json({ etat: compte, pseudo: "Ad_cutz49" });
      envois.push(corps); return json([], 201);
    }
    if (u.pathname.includes("/rest/v1/rpc/")) return json(null);
    return json({});
  });
  const pg = await ctx.newPage(); const errs = []; pg.on("pageerror", (x) => errs.push(x.message));
  const nom = ajouter ? "ajout" : "remplace";
  await pg.goto(U + "/profil/?p=compte"); await pg.waitForTimeout(1500);
  const changer = pg.getByRole("button", { name: "Changer de compte" });
  if (!(await changer.isVisible().catch(() => false))) { await pg.goto(U + "/profil/"); await pg.waitForTimeout(1200); }
  await pg.getByRole("button", { name: "Changer de compte" }).scrollIntoViewIfNeeded();
  await pg.getByRole("button", { name: "Changer de compte" }).click(); await pg.waitForTimeout(500);
  ok(await pg.getByText("Rien n'est effacé").isVisible(), `${nom} : la confirmation annonce que rien n'est effacé`);
  ok(await pg.getByText("ce sera effacé").count() === 0, `${nom} : plus d'avertissement « ce sera effacé »`);
  if (ajouter && S) await pg.screenshot({ path: `${S}/recup-1-profil.png` });
  await pg.getByRole("button", { name: "Continuer" }).click();
  await pg.getByPlaceholder("prenom@exemple.fr").waitFor({ timeout: 8000 });
  ok(await pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1") || "null")?.HIST?.length) === 3, `${nom} : les 3 séances sont toujours sur le téléphone`);
  await pg.waitForLoadState("networkidle"); await pg.waitForTimeout(800);
  await pg.getByPlaceholder("prenom@exemple.fr").fill("ad@ex.fr");
  await pg.getByRole("button", { name: "Recevoir mon code" }).click();
  try { await pg.getByLabel("Code à six chiffres").waitFor({ timeout: 8000 }); }
  catch (e) { console.log("URL", pg.url(), "TEXTE", (await pg.locator("body").innerText()).slice(0, 400).replace(/\n/g, " / ")); throw e; }
  const caseAjout = pg.getByRole("checkbox");
  ok(await pg.getByText("Ajouter à ce compte les 3 séances faites sur ce téléphone").isVisible() && await caseAjout.isChecked(), `${nom} : case « Ajouter les 3 séances » cochée par défaut`);
  if (!ajouter) { await caseAjout.uncheck(); ok(await pg.getByText("Décoché : le compte remplacera").isVisible(), "décoché : avertissement affiché"); }
  await pg.getByLabel("Code à six chiffres").fill("123456");
  if (ajouter && S) await pg.screenshot({ path: `${S}/recup-2-code.png` });
  await pg.getByRole("button", { name: "Ouvrir mon compte" }).click();
  await pg.waitForTimeout(2500);
  const etat = await pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1") || "null"));
  const envoi = envois.at(-1)?.etat;
  if (ajouter) {
    ok(etat?.HIST?.length === 3, "ajout : les 3 séances restent sur le téléphone après connexion");
    ok(envoi?.HIST?.length === 3, `ajout : les 3 séances sont envoyées au compte (${envois.length} envoi(s))`);
    ok(envoi?.A?.objectif === 1 && envoi?.A?.materiel === 2, "ajout : les réglages du compte sont gardés");
    ok(JSON.stringify(envoi?.SEANCES?.map((s) => s.nom)) === JSON.stringify(["Pecs", "Haut du corps"]), "ajout : séances enregistrées du compte + celle du téléphone");
    ok(await pg.getByText("Les 3 séances faites sur ce téléphone ont été ajoutées à ton compte.").isVisible(), "ajout : message de confirmation");
    if (S) await pg.screenshot({ path: `${S}/recup-3-fin.png` });
  } else {
    ok(etat?.HIST?.length === 0, "remplace : le compte a remplacé le téléphone (choix explicite)");
  }
  ok(!errs.length, `${nom} : aucune erreur de page ` + errs.join(" | "));
  await ctx.close();
}
await parcours(true);
await parcours(false);
await b.close(); process.exit(process.exitCode || 0);
