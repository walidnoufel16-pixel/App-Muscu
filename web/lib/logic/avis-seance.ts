/* « L'avis d'Oxa » : ce qu'un coach dirait d'une séance libre qu'on compose ou qu'on modifie.
   Logique pure. Cinq familles, de la plus importante à la moins importante :
   - corps : un muscle qui récupère encore, un exercice qui touche une zone à ménager ;
   - volume : trop sur un muscle, un muscle prévu oublié, séance trop longue ou trop légère ;
   - équilibre : poussée sans tirage sur la semaine, quadriceps sans ischios, haut du corps sans
     lombaires ni gainage, que de l'isolation ;
   - ordre : isolation avant le polyarticulaire du même mouvement, gainage avant un squat, cardio
     intense avant les jambes ;
   - réglages : répétitions et repos selon l'objectif, trop de séries sur un exercice.
   Chaque avis peut porter une action que `appliquerAvis` exécute sur le brouillon. */
import { langue, tr } from "@/lib/i18n";
import { EX } from "@/lib/data/exercices";
import { OBJS, PAT2MUSC } from "@/lib/data/referentiels";
import { estSoin } from "@/lib/data/soin";
import type { BlocCardio, ExLibre, Reponses } from "./types";
import { exoFiltre, secondesDe } from "./core";
import { exParDefaut, prescription } from "./assistant";
import { dureeTotale, ordre, partiesDe, ranger, recomposer } from "./combinee";
import { etatGroupes, nomGroupe, phrase, type Groupe } from "./recommandation";
import type { LigneHist } from "./historique";
import { zonesDe } from "./forme";

type Brouillon = { ex: ExLibre[]; blocs?: BlocCardio[]; obj?: number; gen?: { m: string[] } };

export type ActionAvis =
  | { t: "retirer"; id: string }
  | { t: "ajouter"; id: string; debut?: boolean }
  | { t: "avant"; id: string; devant: string }
  | { t: "fin"; ids: string[] }
  | { t: "cardioFin" }
  | { t: "regler"; r: { id: string; s?: number; r?: number; p?: string }[] }
  | { t: "remplacer"; id: string; par: string };

export type Famille = "corps" | "volume" | "equilibre" | "ordre" | "reglages";
export type Avis = { id: string; f: Famille; titre: string; texte: string; bouton?: string; action?: ActionAvis };

export type ContexteAvis = { A: Reponses; H?: LigneHist[]; sel: string[]; zones?: number[]; auj: string };

const PETITS = new Set(["bic", "tri", "epa", "mol", "abd", "avb", "tra", "add", "lom"]);
const nom = (id: string) => EX[id]?.n ?? id;
const guill = (id: string) => (langue() === "en" ? `“${nom(id)}”` : `« ${nom(id)} »`);
/* polyarticulaire : un second schéma qui compte (pas les avant-bras d'un curl), sauf le pull-over et le gainage */
export const estPoly = (id: string) => {
  const x = EX[id];
  return !!x?.pat2 && id !== "pull" && !["ae", "ft", "lo"].includes(x.pat) && !["avb", "tra", "add", "mol"].includes(PAT2MUSC[x.pat2]);
};
const groupe = (id: string) => PAT2MUSC[EX[id]?.pat] as string | undefined;
const estMuscu = (id: string) => !!EX[id] && !estSoin(id) && EX[id].pat !== "ca";
const nomG = (g: string) => (["pec", "dos", "epa", "bic", "tri", "qua", "isc", "mol", "abd"].includes(g) ? nomGroupe(g as Groupe) : ({ avb: tr("Avant-bras"), tra: tr("Trapèzes"), add: tr("Adducteurs"), lom: tr("Lombaires") } as Record<string, string>)[g] ?? g);

/** Un exercice à ajouter : bon schéma, disponible avec le matériel, pas déjà dans la séance, sans zone à ménager si possible. */
export function candidat(pats: string[], sel: string[], pris: Set<string>, zones: number[] = [], poly?: boolean): string | undefined {
  const l = Object.keys(EX).filter((o) => pats.includes(EX[o].pat) && exoFiltre(o, sel) && !pris.has(o) && EX[o].ch !== "dist" && !estSoin(o));
  const note = (o: string) =>
    (zonesDe(o, zones).length ? 8 : 0) + (EX[o].horsIA ? 2 : 0) + (poly != null && estPoly(o) !== poly ? 4 : 0) + (EX[o].ch === "kg" ? 0 : 1) + pats.indexOf(EX[o].pat) * 0.5;
  return l.sort((a, b) => note(a) - note(b))[0];
}

/** Zones de répétitions et de repos par objectif (OBJS : muscle, force, affiner, forme). */
const ZONE_REPS: [number, number, number][] = [[6, 12, 10], [3, 6, 5], [10, 20, 12], [8, 15, 10]];

export function avisSeance(L: Brouillon, c: ContexteAvis): Avis[] {
  const ex = L.ex.filter((e) => estMuscu(e.id));
  if (ex.length < 3) return [];
  const pris = new Set(L.ex.map((e) => e.id)), zones = c.zones ?? [];
  const out: Avis[] = [];

  /* séries par groupe : principal 1, secondaire ½ ; et séries « principales » seules */
  const eff: Record<string, number> = {}, prin: Record<string, number> = {}, nEx: Record<string, number> = {};
  for (const e of ex) {
    const g = groupe(e.id), g2 = EX[e.id].pat2 ? PAT2MUSC[EX[e.id].pat2!] : undefined;
    if (g) { eff[g] = (eff[g] || 0) + e.s; prin[g] = (prin[g] || 0) + e.s; nEx[g] = (nEx[g] || 0) + 1; }
    if (g2 && g2 !== g) eff[g2] = (eff[g2] || 0) + e.s / 2;
  }
  const total = ex.reduce((a, e) => a + e.s, 0);
  const de = (g: string) => ex.filter((e) => groupe(e.id) === g);

  /* ---------- corps ---------- */
  if (c.H?.length) {
    const E = etatGroupes(c.H, c.auj);
    const recup = (Object.keys(E) as Groupe[]).filter((g) => (prin[g] || 0) >= 3 && !E[g].recupere && E[g].dernier);
    if (recup.length) {
      const j = Math.min(...recup.map((g) => E[g].jours));
      const quand = j === 0 ? tr("aujourd'hui") : j === 1 ? tr("hier") : tr("il y a {n} jours", { n: j });
      out.push({ id: "recup", f: "corps", titre: tr("{a} récupèrent encore.", { a: phrase(recup.map(nomGroupe)) }),
        texte: tr("Travaillés {q} : allège-les aujourd'hui, ou garde-les pour une prochaine séance.", { q: quand }) });
    }
  }
  for (const e of ex) {
    if (!zonesDe(e.id, zones).length) continue;
    const par = candidat([EX[e.id].pat], c.sel, pris, zones, estPoly(e.id));
    const sur = par && !zonesDe(par, zones).length ? par : undefined;
    out.push({ id: "zone-" + e.id, f: "corps", titre: tr("{x} sollicite une zone que tu ménages.", { x: guill(e.id) }),
      texte: sur ? tr("{y} travaille les mêmes muscles en la préservant.", { y: guill(sur) }) : tr("Allège la charge et arrête au moindre signal de douleur."),
      ...(sur ? { bouton: tr("Remplacer par {y}", { y: guill(sur) }), action: { t: "remplacer" as const, id: e.id, par: sur } } : {}) });
  }

  /* ---------- volume ---------- */
  for (const g of Object.keys(prin)) {
    const n = nEx[g], petit = PETITS.has(g), trop = petit ? n > 3 : n > 5, series = prin[g] > (petit ? 10 : 14);
    if (!trop && !series) continue;
    const l = de(g), iso = l.filter((e) => !estPoly(e.id)), cible = (iso.at(-1) ?? l.at(-1))!.id;
    out.push({ id: "trop-" + g, f: "volume",
      titre: trop ? tr("{n} exercices pour {g}.", { n, g: nomG(g).toLowerCase() }) : tr("{n} séries pour {g}.", { n: prin[g], g: nomG(g).toLowerCase() }),
      texte: trop ? tr("Au-delà de {m}, tu ajoutes de la fatigue sans progresser plus.", { m: petit ? 3 : 5 }) : tr("Au-delà d'une dizaine de séries pour un muscle dans une séance, la qualité baisse."),
      bouton: tr("Retirer {x}", { x: guill(cible) }), action: { t: "retirer", id: cible } });
  }
  for (const g of L.gen?.m ?? []) {
    if (prin[g] || (eff[g] || 0) >= 2) continue;
    const pats = Object.entries(PAT2MUSC).filter(([, m]) => m === g).map(([p]) => p);
    const id = candidat(pats, c.sel, pris, zones, true);
    out.push({ id: "oubli-" + g, f: "volume", titre: tr("Plus rien pour {g}.", { g: nomG(g).toLowerCase() }), texte: tr("C'était un des muscles que tu voulais travailler."),
      ...(id ? { bouton: tr("Ajouter {x}", { x: guill(id) }), action: { t: "ajouter" as const, id } } : {}) });
  }
  const min = dureeTotale(L);
  if (total > 25 || min > 90)
    out.push({ id: "long", f: "volume", titre: tr("Séance longue : {n} séries, environ {m} min.", { n: total, m: min }), texte: tr("Au-delà d'1 h 30, la fatigue prend le dessus. Coupe-la en deux séances.") });
  else if (total < 6) {
    const r = ex.filter((e) => e.s < 3).map((e) => ({ id: e.id, s: 3 }));
    out.push({ id: "court", f: "volume", titre: tr("{n} séries au total.", { n: total }), texte: tr("C'est trop peu pour progresser : 3 séries par exercice, c'est la bonne base."),
      bouton: tr("Passer à 3 séries"), action: { t: "regler", r } });
  }

  /* ---------- équilibre ---------- */
  const semaine = c.H?.length ? etatGroupes(c.H, c.auj) : null;
  /* poussée : pectoraux et développés d'épaules ; tirage : dos et rotation externe d'épaule */
  const parPat = (p: string) => ex.filter((e) => EX[e.id].pat === p).reduce((a, e) => a + e.s, 0);
  const pousse = (prin.pec || 0) + parPat("pv"), tire = (prin.dos || 0) + parPat("re");
  const tireSem = tire + (semaine?.dos.semaine || 0), pousseSem = pousse + (semaine ? semaine.pec.semaine + semaine.epa.semaine : 0);
  if (pousse >= 6 && tireSem * 2 < pousse) {
    const id = candidat(["th", "tv"], c.sel, pris, zones);
    out.push({ id: "tirage", f: "equilibre", titre: tire ? tr("{p} séries de poussée, {q} de tirage.", { p: pousse, q: tire }) : tr("{p} séries de poussée, et pas de dos cette semaine.", { p: pousse }),
      texte: tr("Pour des épaules solides et une bonne posture, équilibre avec un exercice de dos."), ...(id ? { bouton: tr("Ajouter {x}", { x: guill(id) }), action: { t: "ajouter" as const, id } } : {}) });
  } else if (tire >= 6 && pousseSem * 2 < tire) {
    const id = candidat(["ph"], c.sel, pris, zones);
    out.push({ id: "poussee", f: "equilibre", titre: tr("{q} séries de tirage, et pas de poussée cette semaine.", { q: tire }),
      texte: tr("Pour garder l'équilibre du haut du corps, ajoute un exercice de pectoraux."), ...(id ? { bouton: tr("Ajouter {x}", { x: guill(id) }), action: { t: "ajouter" as const, id } } : {}) });
  }
  if ((prin.qua || 0) >= 4 && !prin.isc) {
    const id = candidat(["fh"], c.sel, pris, zones);
    out.push({ id: "ischios", f: "equilibre", titre: tr("Des quadriceps, mais pas d'ischios."), texte: tr("L'arrière de la cuisse protège tes genoux : ajoute un exercice d'ischios."),
      ...(id ? { bouton: tr("Ajouter {x}", { x: guill(id) }), action: { t: "ajouter" as const, id } } : {}) });
  } else if ((prin.isc || 0) >= 4 && !prin.qua && (eff.qua || 0) < 2) {
    const id = candidat(["eg"], c.sel, pris, zones);
    out.push({ id: "quadris", f: "equilibre", titre: tr("Des ischios, mais pas de quadriceps."), texte: tr("Équilibre l'avant et l'arrière de la cuisse avec un exercice de quadriceps."),
      ...(id ? { bouton: tr("Ajouter {x}", { x: guill(id) }), action: { t: "ajouter" as const, id } } : {}) });
  }
  if (prin.pec && prin.dos && ex.length >= 4 && !eff.lom && !eff.abd) {
    /* une extension lombaire, légère, plutôt qu'un soulevé partiel en fin de séance */
    const id = ["lom", "revhyp", "lomsol", "sup"].find((o) => EX[o] && exoFiltre(o, c.sel) && !pris.has(o) && !zonesDe(o, zones).length) ?? candidat(["ft", "ae"], c.sel, pris, zones);
    out.push({ id: "gainage", f: "equilibre", titre: tr("Pas de lombaires ni de gainage."), texte: tr("Un exercice pour le bas du dos protège ta colonne sur les tirages et les développés."),
      ...(id ? { bouton: tr("Ajouter {x}", { x: guill(id) }), action: { t: "ajouter" as const, id } } : {}) });
  }
  const grands = ["pec", "dos", "qua", "isc"].filter((g) => prin[g]).sort((a, b) => prin[b] - prin[a]);
  if (grands.length && !ex.some((e) => estPoly(e.id))) {
    const g = grands[0], pats = Object.entries(PAT2MUSC).filter(([, m]) => m === g).map(([p]) => p);
    const id = candidat(pats, c.sel, pris, zones, true);
    if (id && estPoly(id))
      out.push({ id: "poly", f: "equilibre", titre: tr("Que des exercices d'isolation."), texte: tr("Un mouvement polyarticulaire fait travailler plus de muscle, avec plus de charge : commence par lui."),
        bouton: tr("Ajouter {x}", { x: guill(id) }), action: { t: "ajouter", id, debut: true } });
  }

  /* ---------- ordre ---------- */
  ordreIso: for (let i = 0; i < ex.length; i++) {
    if (estPoly(ex[i].id)) continue;
    for (let j = i + 1; j < ex.length; j++)
      if (estPoly(ex[j].id) && EX[ex[j].id].pat === EX[ex[i].id].pat) {
        out.push({ id: "ordre-" + ex[j].id, f: "ordre", titre: tr("{a} avant {b}.", { a: guill(ex[i].id), b: guill(ex[j].id) }), texte: tr("Commence par le mouvement le plus lourd, quand tu es frais."),
          bouton: tr("Mettre {x} en premier", { x: guill(ex[j].id) }), action: { t: "avant", id: ex[j].id, devant: ex[i].id } });
        break ordreIso;
      }
  }
  const lourd = ex.findIndex((e) => estPoly(e.id) && (groupe(e.id) === "qua" || groupe(e.id) === "isc"));
  if (lourd > 0) {
    const avant = ex.slice(0, lourd).filter((e) => ["ae", "ft", "lo"].includes(EX[e.id].pat));
    if (avant.length)
      out.push({ id: "gainage-fin", f: "ordre", titre: tr("Du gainage avant {x}.", { x: guill(ex[lourd].id) }), texte: tr("Des abdos et des lombaires fatigués protègent moins ton dos sous la charge : garde-les pour la fin."),
        bouton: tr("Les mettre à la fin"), action: { t: "fin", ids: avant.map((e) => e.id) } });
  }
  const parties = partiesDe(L);
  const jambes = ex.some((e) => groupe(e.id) === "qua" || groupe(e.id) === "isc");
  if (jambes && parties.indexOf("cardio") >= 0 && parties.indexOf("cardio") < parties.indexOf("muscu") && (L.blocs || []).some((b) => b.f !== "endurance"))
    out.push({ id: "cardio", f: "ordre", titre: tr("Du cardio intense avant les jambes."), texte: tr("Il vide les jambes avant les exercices lourds : place-le à la fin, ou garde un cardio doux pour t'échauffer."),
      bouton: tr("Mettre le cardio à la fin"), action: { t: "cardioFin" } });

  /* ---------- réglages ---------- */
  const obj = L.obj ?? c.A.objectif;
  if (obj != null && ZONE_REPS[obj]) {
    const [bas, haut, vise] = ZONE_REPS[obj];
    const r: { id: string; r?: number; p?: string }[] = [];
    for (const e of ex) {
      if (EX[e.id].ch !== "kg") continue;
      const poly = estPoly(e.id), x: { id: string; r?: number; p?: string } = { id: e.id };
      /* l'isolation se travaille plus haut en répétitions (élévations latérales à 15, c'est bien) */
      const h = poly ? haut : haut + 5;
      if ((obj !== 1 || poly) && (e.r < bas || e.r > h)) x.r = obj === 1 ? vise : e.r < bas ? bas : h;
      const sec = secondesDe(e.p);
      if (obj === 1 && poly && sec < 120) x.p = "3 min";
      else if ((obj === 2 || obj === 3) && sec > 120) x.p = poly ? "90 s" : "60 s";
      else if (obj !== 1 && !poly && sec > 150) x.p = "90 s";
      if (x.r != null || x.p) r.push(x);
    }
    if (r.length) {
      const detail = (x: (typeof r)[number]) => [x.r != null ? tr("{n} répétitions", { n: x.r }) : "", x.p ? tr("{p} de repos", { p: tr(x.p) }) : ""].filter(Boolean).join(", ");
      const liste = r.slice(0, 2).map((x) => `${guill(x.id)} : ${detail(x)}`).join(" ; ") + (r.length > 2 ? " " + tr("(+ {n} autres)", { n: r.length - 2 }) : "");
      out.push({ id: "reglages", f: "reglages", titre: tr("Réglages pour « {o} ».", { o: tr(OBJS[obj]).toLowerCase() }), texte: liste + ".",
        bouton: r.length > 1 ? tr("Ajuster les {n} exercices", { n: r.length }) : tr("Ajuster"), action: { t: "regler", r } });
    }
  }
  const lourds = ex.filter((e) => e.s > 5);
  if (lourds.length)
    out.push({ id: "series", f: "reglages", titre: tr("{n} séries sur {x}.", { n: lourds[0].s, x: guill(lourds[0].id) }), texte: tr("Au-delà de 4 ou 5 séries, un même exercice n'apporte plus grand-chose : change plutôt d'angle."),
      bouton: tr("Garder 4 séries"), action: { t: "regler", r: lourds.map((e) => ({ id: e.id, s: 4 })) } });

  return out;
}

/** Applique un avis au brouillon (mutation, comme `majLibre`). */
export function appliquerAvis(l: Brouillon, a: ActionAvis, objDefaut?: number) {
  const ranger_ = () => { const r = ranger(l); l.ex = r.ex; if (l.blocs) l.blocs = r.blocs; };
  const unifie = (f: (L: ReturnType<typeof ordre>) => ReturnType<typeof ordre>) => { const r = recomposer(f(ordre(l))); l.ex = r.ex; if (l.blocs) l.blocs = r.blocs; };
  if (a.t === "retirer") unifie((L) => L.filter((x) => !(x.t === "ex" && x.e.id === a.id)));
  else if (a.t === "remplacer") { const e = l.ex.find((x) => x.id === a.id); if (e) { e.id = a.par; delete e.o; } }
  else if (a.t === "ajouter") {
    const obj = l.obj ?? objDefaut, e = obj != null ? prescription(a.id, estPoly(a.id), obj) : exParDefaut(a.id);
    if (a.debut) { const k = l.ex.findIndex((x) => estMuscu(x.id)); unifie((L) => { const pos = k < 0 ? L.length : L.findIndex((x) => x.t === "ex" && x.i === k); L.splice(pos, 0, { t: "ex", i: -1, e }); return L; }); }
    else l.ex.push(e);
    ranger_();
  } else if (a.t === "avant") unifie((L) => {
    const k = L.findIndex((x) => x.t === "ex" && x.e.id === a.id); if (k < 0) return L;
    const [x] = L.splice(k, 1), d = L.findIndex((y) => y.t === "ex" && y.e.id === a.devant);
    L.splice(d < 0 ? 0 : d, 0, x); return L;
  });
  else if (a.t === "fin") { unifie((L) => [...L.filter((x) => !(x.t === "ex" && a.ids.includes(x.e.id))), ...L.filter((x) => x.t === "ex" && a.ids.includes(x.e.id))]); ranger_(); }
  else if (a.t === "cardioFin") { const r = ranger(l, [...partiesDe(l).filter((p) => p !== "cardio"), "cardio"]); l.ex = r.ex; if (l.blocs) l.blocs = r.blocs; }
  else if (a.t === "regler") for (const x of a.r) { const e = l.ex.find((y) => y.id === x.id); if (!e) continue; if (x.s != null) e.s = x.s; if (x.r != null) e.r = x.r; if (x.p) e.p = x.p; }
}
