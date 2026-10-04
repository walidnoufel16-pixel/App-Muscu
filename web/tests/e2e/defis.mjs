/* Défis entre amis, avec un serveur Supabase simulé (session ouverte, fonctions
   creer/rejoindre/lire/maj_score/quitter en mémoire) : créer un défi, partager son
   code, le score qui suit les séances, rejoindre par lien (?d=), quitter.
   CAPTURES=dossier pour garder des captures. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8812);
const U = "http://localhost:8812";
const MOI = "aaaaaaaa-1111-4111-8111-111111111111";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: MOI, role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
const session = {
  access_token: jwt, refresh_token: "r", token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600,
  user: { id: MOI, aud: "authenticated", role: "authenticated", is_anonymous: true, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
};
const deux = (n) => String(n).padStart(2, "0");
const jour = (d) => `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
const auj = jour(new Date());
const etat = {
  A: { objectif: 0, materiel: 0, acc: [] }, LOG: {}, SWAP: {}, SWAPP: {}, PLAN: null,
  SEANCES: [{ nom: "Push", ex: [{ id: "dc", s: 2, r: 8, p: "2 min" }] }], wk: 0, day: 0, FINI: false,
  HIST: [{ d: "2025-01-02", s: "L|0", nom: "Push", vol: 1000, ser: 3, ex: { dc: [70, 1000, 60, 8, 3] } }], ts: Date.now(),
};

/* --- serveur simulé --- */
const defis = {
  AMIS2: { code: "AMIS2", nom: "Octobre entre potes", type: "seances", cible: 8, debut: auj, fin: jour(new Date(Date.now() + 20 * 864e5)), p: [{ id: "x", pseudo: "Sam", score: 3 }] },
};
const lire = (code) => {
  const d = defis[code];
  if (!d) return null;
  const { p, ...rest } = d;
  return { ...rest, participants: [...p].sort((a, b) => b.score - a.score).map((x) => ({ pseudo: x.pseudo, score: x.score, moi: x.id === MOI })) };
};
const appels = [];
const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, serviceWorkers: "block" });
await ctx.addInitScript(([s, sess]) => {
  if (!sessionStorage.vu) {
    localStorage.setItem("palier.state.v1", JSON.stringify(s));
    localStorage.setItem("palier.pseudo.v1", "Walid");
    localStorage.setItem("sb-iyjiwfzrmyvcnmzwlgxe-auth-token", JSON.stringify(sess));
    sessionStorage.vu = 1;
  }
}, [etat, session]);
await ctx.route(/supabase\.co/, async (r) => {
  const u = new URL(r.request().url()), corps = r.request().postDataJSON?.() || {};
  const json = (body, status = 200) => r.fulfill({ status, contentType: "application/json", body: JSON.stringify(body), headers: { "access-control-allow-origin": "*" } });
  if (r.request().method() === "OPTIONS") return r.fulfill({ status: 200, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
  const rpc = u.pathname.match(/\/rest\/v1\/rpc\/(\w+)/)?.[1];
  if (rpc) {
    appels.push([rpc, corps]);
    const code = (corps.p_code || "").toUpperCase();
    if (rpc === "lire_defi") return json(lire(code));
    if (rpc === "creer_defi") {
      defis[code] = { code, nom: corps.p_nom, type: corps.p_type, cible: corps.p_cible, debut: corps.p_debut, fin: corps.p_fin, p: [{ id: MOI, pseudo: corps.p_pseudo, score: 0 }] };
      return json(lire(code));
    }
    if (rpc === "rejoindre_defi") {
      if (!defis[code]) return json(null);
      if (!defis[code].p.some((x) => x.id === MOI)) defis[code].p.push({ id: MOI, pseudo: corps.p_pseudo, score: 0 });
      return json(lire(code));
    }
    if (rpc === "maj_score") { const x = defis[code]?.p.find((y) => y.id === MOI); if (x) x.score = corps.p_score; return json(null); }
    if (rpc === "quitter_defi") { if (defis[code]) defis[code].p = defis[code].p.filter((y) => y.id !== MOI); return json(null); }
  }
  if (u.pathname.includes("/rest/v1/etats")) return json(r.request().method() === "GET" ? null : [], r.request().method() === "GET" ? 200 : 201);
  if (u.pathname.includes("/auth/v1/user")) return json(session.user);
  return json({});
});
const pg = await ctx.newPage();
const errs = []; pg.on("pageerror", (e) => errs.push(e.message));
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };
const etatLu = () => pg.evaluate(() => JSON.parse(localStorage.getItem("palier.state.v1")));
const cap = async (n) => { if (process.env.CAPTURES) await pg.screenshot({ path: `${process.env.CAPTURES}/${n}.png` }); };

// créer un défi
await pg.goto(U + "/progres/");
await pg.getByRole("button", { name: "Créer un défi" }).waitFor({ timeout: 8000 });
await pg.getByRole("button", { name: "Créer un défi" }).click();
await pg.getByRole("tab", { name: "Séances" }).waitFor();
await pg.getByRole("button", { name: "4", exact: true }).click();
await pg.getByRole("tab", { name: "1 sem." }).click();
await cap("defi-creation");
await pg.getByRole("button", { name: "Créer le défi" }).click();
await pg.getByText("Code du défi, à lire ou à dicter").waitFor({ timeout: 5000 });
const cree = appels.find((a) => a[0] === "creer_defi")[1];
ok(cree.p_type === "seances" && cree.p_cible === 4 && cree.p_pseudo === "Walid" && /^[A-HJ-NP-Z2-9]{5}$/.test(cree.p_code), `défi créé (${cree.p_code}, « ${cree.p_nom} »)`);
ok((await pg.getByRole("dialog").textContent()).includes("/?d=" + cree.p_code), "lien de défi /?d=CODE dans la feuille de partage");
await cap("defi-partage");
await pg.keyboard.press("Escape");
await pg.waitForTimeout(500);
ok(await pg.getByText(cree.p_nom).isVisible(), "défi listé dans Progrès");
ok((await etatLu()).A.defis.includes(cree.p_code), "code suivi dans l'état du compte");

// une séance validée fait monter le score
await pg.goto(U + "/entrainement/seance/?l=0");
await pg.waitForTimeout(1000);
if (await pg.getByRole("button", { name: "Passer" }).isVisible().catch(() => false)) await pg.getByRole("button", { name: "Passer" }).click();
await pg.locator('[id="ex-L|0|0"] button[aria-expanded]').first().click();
await pg.getByRole("button", { name: "Tout valider" }).click();
await pg.waitForTimeout(4500);
const maj = appels.filter((a) => a[0] === "maj_score" && a[1].p_code === cree.p_code).at(-1);
ok(maj && maj[1].p_score === 1, `score envoyé après la séance (${maj?.[1].p_score})`);

// rejoindre par lien
await pg.goto(U + "/?d=amis2");
await pg.waitForURL(/\/progres\/\?d=AMIS2/, { timeout: 8000 });
await pg.getByRole("dialog").getByText("Octobre entre potes").waitFor({ timeout: 8000 });
ok(await pg.getByRole("dialog").getByText("Sam").isVisible() && await pg.getByRole("dialog").getByText("(toi)").isVisible(), "lien ?d= : défi rejoint, classement affiché");
await pg.waitForTimeout(800);
await cap("defi-classement");
ok(defis.AMIS2.p.find((x) => x.id === MOI)?.score === 1, "mon score (1 séance aujourd'hui) envoyé au défi rejoint");
await pg.getByRole("button", { name: "Quitter ce défi" }).click();
await pg.waitForTimeout(500);
ok(!(await etatLu()).A.defis.includes("AMIS2") && !defis.AMIS2.p.some((x) => x.id === MOI), "quitter le défi");

// code inconnu
await pg.getByRole("button", { name: "Rejoindre", exact: true }).first().click();
await pg.getByLabel("Code du défi").fill("ZZZ99");
await pg.getByRole("dialog").getByRole("button", { name: "Rejoindre" }).click();
await pg.getByText(/Aucun défi ne correspond/).waitFor({ timeout: 4000 }).catch(() => {});
ok(await pg.getByText(/Aucun défi ne correspond/).isVisible(), "code inconnu : message clair");

console.log("erreurs:", JSON.stringify(errs));
await ctx.close(); await b.close(); srv.close();
