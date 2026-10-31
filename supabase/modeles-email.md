# E-mails du code de connexion (français + anglais)

Supabase n'envoie qu'un modèle par type d'e-mail, sans tenir compte de la langue
de l'app. Ces modèles sont donc bilingues : le français d'abord, l'anglais en
dessous. Ils sont à coller dans Supabase › Authentication › Emails, dans le
projet de production (et dans staging si tu veux le même rendu).

L'app utilise deux de ces e-mails :
- **Magic Link** : le code pour retrouver son compte sur un autre appareil
  (écran « J'ai déjà un compte »).
- **Change Email Address** : le code qui confirme l'adresse rattachée au compte
  (création du compte, ou ajout d'une adresse depuis Profil).

---

## Magic Link

**Subject**

```
Ton code Oxa · Your Oxa code: {{ .Token }}
```

**Body** (onglet Source)

```html
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:440px;margin:0 auto;padding:24px;color:#111">
  <p style="font-size:15px;margin:0 0 6px">Voici ton code pour retrouver ton compte Oxa :</p>
  <p style="font-size:13px;color:#666;margin:0 0 16px">Here is your code to get back into your Oxa account:</p>
  <p style="font-size:34px;font-weight:700;letter-spacing:8px;margin:0 0 20px">{{ .Token }}</p>
  <p style="font-size:14px;margin:0 0 4px">Saisis-le dans l'app. Il expire dans une heure.</p>
  <p style="font-size:13px;color:#666;margin:0 0 20px">Enter it in the app. It expires in one hour.</p>
  <p style="font-size:12px;color:#888;margin:0">Si tu n'as rien demandé, ignore ce message. · If you didn't ask for this, just ignore this email.</p>
</div>
```

---

## Change Email Address

**Subject**

```
Confirme ton adresse · Confirm your email: {{ .Token }}
```

**Body** (onglet Source)

```html
<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:440px;margin:0 auto;padding:24px;color:#111">
  <p style="font-size:15px;margin:0 0 6px">Voici ton code pour rattacher {{ .NewEmail }} à ton compte Oxa :</p>
  <p style="font-size:13px;color:#666;margin:0 0 16px">Here is your code to link {{ .NewEmail }} to your Oxa account:</p>
  <p style="font-size:34px;font-weight:700;letter-spacing:8px;margin:0 0 20px">{{ .Token }}</p>
  <p style="font-size:14px;margin:0 0 4px">Saisis-le dans l'app. Il expire dans une heure.</p>
  <p style="font-size:13px;color:#666;margin:0 0 20px">Enter it in the app. It expires in one hour.</p>
  <p style="font-size:12px;color:#888;margin:0">Si tu n'as rien demandé, ignore ce message. · If you didn't ask for this, just ignore this email.</p>
</div>
```

La durée d'expiration indiquée (une heure) correspond au réglage par défaut de
Supabase (Authentication › Providers › Email › Email OTP Expiration). Si tu la
changes, adapte la phrase.
