/* Création du compte avec une adresse, serveur Supabase simulé : l'écran du code
   suit tout de suite, un code faux est refusé, le bon mène à « Par où commencer ».
   « Plus tard » laisse le code à saisir dans Profil. CAPTURES=dossier pour des captures. */
import { chromium } from "@playwright/test";
import { servir } from "./serveur.mjs";
const srv = servir(new URL("../../out/", import.meta.url).pathname, 8816);
const U = "http://localhost:8816";
const MOI = "bbbbbbbb-1111-4111-8111-111111111111";
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: MOI, role: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })}.sig`;
const BON = "123456";

const b = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ok = (c, m) => { console.log(c ? "OK  " : "ÉCHEC", m); if (!c) process.exitCode = 1; };
const errs = [];

async function parcours(confirmer) {
  let user = { id: MOI, aud: "authenticated", role: "authenticated", is_anonymous: true, email: "", app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
  const session = () => ({ access_token: jwt, refresh_token: "r", token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, user });
  const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, serviceWorkers: "block" });
  await ctx.route(/supabase\.co/, async (r) => {
    const u = new URL(r.request().url()), m = r.request().method(), corps = r.request().postDataJSON?.() || {};
    const json = (body, status = 200) => r.fulfill({ status, contentType: "application/json", body: JSON.stringify(body), headers: { "access-control-allow-origin": "*" } });
    if (m === "OPTIONS") return r.fulfill({ status: 200, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "*" } });
    if (u.pathname.endsWith("/auth/v1/signup")) return json(session());
    if (u.pathname.endsWith("/auth/v1/user") && m === "PUT") { user = { ...user, new_email: corps.email, email_change_sent_at: new Date().toISOString() }; return json(user); }
    if (u.pathname.endsWith("/auth/v1/user")) return json(user);
    if (u.pathname.endsWith("/auth/v1/verify")) {
      if (corps.token !== BON || corps.type !== "email_change" || corps.email !== user.new_email) return json({ code: 403, error_code: "otp_expired", msg: "Token has expired or is invalid" }, 403);
      user = { ...user, email: user.new_email, new_email: undefined, is_anonymous: false };
      return json(session());
    }
    if (u.pathname.includes("/rest/v1/etats")) return json(m === "GET" ? null : [], m === "GET" ? 200 : 201);
    return json({});
  });
  const pg = await ctx.newPage();
  pg.on("pageerror", (e) => errs.push(e.message));
  const cap = async (n) => { if (process.env.CAPTURES) await pg.screenshot({ path: `${process.env.CAPTURES}/${n}.png` }); };

  await pg.goto(U + "/bienvenue/");
  await pg.getByRole("button", { name: "Commencer" }).click();
  await pg.getByPlaceholder("Ton surnom").fill("Walid");
  await pg.getByPlaceholder("prenom@exemple.fr").fill("walid@exemple.fr");
  await pg.getByRole("button", { name: "Créer mon compte" }).click();
  await pg.getByRole("heading", { name: "Confirme ton adresse" }).waitFor({ timeout: 8000 });
  ok(await pg.getByText("walid@exemple.fr").isVisible(), "le code se saisit juste après la création du compte");
  await cap("compte-code");

  if (confirmer) {
    await pg.getByLabel("Code à six chiffres").fill("000000");
    await pg.locator("p.text-destructive").waitFor({ timeout: 5000 });
    ok(true, "code faux refusé : " + (await pg.locator("p.text-destructive").textContent()));
    await pg.getByLabel("Code à six chiffres").fill(BON);
    await pg.getByRole("heading", { name: "Deux façons de t'entraîner" }).waitFor({ timeout: 5000 });
    ok(await pg.getByText("Adresse confirmée").isVisible(), "bon code (validé sans toucher le bouton) : adresse confirmée, on passe à la suite");
    await pg.goto(U + "/profil/");
    await pg.getByText("walid@exemple.fr").first().waitFor({ timeout: 5000 });
    ok(!(await pg.getByLabel("Code à six chiffres").isVisible()), "Profil : adresse rattachée, plus de code en attente");
  } else {
    await pg.getByRole("button", { name: "Plus tard" }).click();
    await pg.getByRole("heading", { name: "Deux façons de t'entraîner" }).waitFor();
    ok(true, "« Plus tard » mène à la suite");
    await pg.goto(U + "/profil/");
    await pg.getByLabel("Code à six chiffres").waitFor({ timeout: 5000 });
    await cap("compte-profil");
    await pg.getByLabel("Code à six chiffres").fill(BON);
    await pg.getByText("Adresse confirmée").waitFor({ timeout: 5000 });
    ok(true, "Profil : le code reste saisissable et confirme l'adresse");
  }
  await ctx.close();
}

await parcours(true);
await parcours(false);
console.log("erreurs:", JSON.stringify(errs));
await b.close(); srv.close();
