"use client";

/* Admin : fiche détaillée d'un compte (lecture seule). Les calculs réutilisent la
   logique de l'app : historique, records, badges, course, forme, nutrition. */
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EnTete } from "@/components/repere/en-tete";
import { Retour } from "@/components/repere/retour";
import { Barres } from "@/components/repere/graphes";
import { EX } from "@/lib/data/exercices";
import { BLESN } from "@/lib/data/referentiels";
import { court, ilya, PLAFOND_IA, type FicheAdmin } from "@/lib/logic/admin";
import { FORMATS } from "@/lib/logic/cardio";
import { allureDe, allureTxt, chronoTxt, DISTANCES } from "@/lib/logic/course";
import { TYPES_DEFI, type TypeDefi } from "@/lib/logic/defis";
import { formeDuJour, nomZone, NOMS_NIVEAU, niveau, zonesActives } from "@/lib/logic/forme";
import { jourDe, records, semaines } from "@/lib/logic/historique";
import { BADGES, stats } from "@/lib/logic/motivation";
import { objectifProteines, poidsDe, protDuJour } from "@/lib/logic/nutrition";
import { recap } from "@/lib/logic/questionnaire";
import { fiche, useEstAdmin } from "@/lib/admin";
import { versEtat } from "@/lib/store";
import { ARRIERE } from "@/lib/nav";

export default function PageFiche() {
  return <Suspense><Fiche /></Suspense>;
}

const date = (t: string | null) => (t ? court(jourDe(Date.parse(t))) + " " + new Date(t).getFullYear() : "—");
const kg = (v: number) => (v >= 10000 ? (Math.round(v / 100) / 10).toLocaleString("fr-FR") + " t" : Math.round(v).toLocaleString("fr-FR") + " kg");

function Fiche() {
  const router = useRouter();
  const admin = useEstAdmin();
  const id = useSearchParams().get("u") || "";
  const [F, setF] = useState<FicheAdmin | null | undefined>(undefined);
  const [err, setErr] = useState("");

  useEffect(() => { if (admin === false) router.replace("/profil", ARRIERE); }, [admin, router]);
  useEffect(() => {
    if (!admin || !id) return;
    fiche(id).then(setF).catch((e) => setErr((e as Error).message));
  }, [admin, id]);

  const E = useMemo(() => (F ? versEtat(F.etat) : null), [F]);
  if (err || F === null) return (
    <>
      <EnTete titre="Compte introuvable" gauche={<Retour repli="/admin" />} />
      <p className="px-4 text-[14px] text-destructive">{err || "Ce compte n'existe plus."}</p>
    </>
  );
  if (!F || !E) return (
    <>
      <EnTete titre="Fiche" gauche={<Retour repli="/admin" />} />
      <p className="py-10 text-center text-[14px] text-muted-foreground">Chargement…</p>
    </>
  );
  return <Contenu F={F} E={E} />;
}

function Bloc({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="eyebrow mb-2 px-1">{titre}</h2>
      <div className="rounded-[22px] bg-card p-4 text-[14px]">{children}</div>
    </section>
  );
}
function Ligne({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-border/60 py-2 first:border-t-0 first:pt-0 last:pb-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}
const Vide = ({ t }: { t: string }) => <p className="text-muted-foreground">{t}</p>;

function Contenu({ F, E }: { F: FicheAdmin; E: ReturnType<typeof versEtat> }) {
  const [auj] = useState(() => jourDe(Date.now()));
  const A = E.A, H = E.HIST || [], s = stats(E, auj);
  const sem = semaines(H, E.CARDIO || [], 12, auj);
  const R = records(H).slice(-10).reverse();
  const notes = (A.badges || {}) as Record<string, string>;
  const badges = BADGES.filter((b) => notes[b.id]).sort((a, b) => notes[b.id].localeCompare(notes[a.id]));
  const forme = formeDuJour(A), zones = zonesActives(A);
  const poids = poidsDe(A), protObj = poids ? objectifProteines(A) : 0;
  const prot = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return jourDe(d.getTime()); });
  const der = [...H.map((l) => l.d), ...(E.CARDIO || []).map((c) => jourDe(c.ts))].sort().at(-1) || null;
  const gen = F.generations.reduce((n, g) => n + g.n, 0);
  return (
    <>
      <EnTete surtitre={F.email || "Sans adresse"} titre={F.pseudo || "Sans surnom"} gauche={<Retour repli="/admin" />} />
      <div className="flex flex-col gap-5 px-4 pb-10">
        <Bloc titre="Compte">
          <Ligne k="Adresse" v={F.email || "aucune (compte anonyme)"} />
          <Ligne k="Inscription" v={date(F.cree)} />
          <Ligne k="Dernière connexion" v={date(F.connexion)} />
          <Ligne k="Dernière synchronisation" v={date(F.maj)} />
          <Ligne k="Dernier entraînement" v={ilya(der, auj)} />
          <Ligne k="Générations par IA" v={`${gen} au total`} />
          <p className="mt-2 text-[11.5px] break-all text-muted-foreground">{F.id}</p>
        </Bloc>

        <Bloc titre="Activité">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[[s.seances, "séances"], [s.records, "records"], [s.serie, "sem. d'affilée (record)"], [kg(s.tonnes * 1000), "soulevés"], [(Math.round(s.heuresCardio * 10) / 10).toLocaleString("fr-FR") + " h", "de cardio"], [Math.round(s.km) + " km", "courus"]].map(([v, n]) => (
              <div key={n as string} className="rounded-2xl bg-muted/60 px-2 py-2.5">
                <div className="num text-[18px] font-bold">{v}</div>
                <div className="text-[11.5px] leading-tight text-muted-foreground">{n}</div>
              </div>
            ))}
          </div>
          <div className="mt-3"><Barres valeurs={sem.map((x) => ({ x: court(x.lundi), y: x.seances }))} unite="séances" hauteur={100} /></div>
        </Bloc>

        <Bloc titre="Réponses au questionnaire">
          {A.objectif != null ? recap(E).map(([k, v]) => <Ligne key={k} k={k} v={v} />) : <Vide t="Questionnaire non rempli." />}
        </Bloc>

        <Bloc titre="Programme">
          {E.FINI || E.PLAN ? (
            <>
              <Ligne k="Programme" v={E.PLAN?.plan?.titre || "Règles intégrées"} />
              <Ligne k="Semaine en cours" v={`${E.wk + 1} sur 8`} />
              <Ligne k="Séances perso" v={E.SEANCES.length} />
            </>
          ) : <><Vide t="Pas de plan de 8 semaines." /><Ligne k="Séances perso" v={E.SEANCES.length} /></>}
        </Bloc>

        <Bloc titre={`Séances de musculation · ${H.length}`}>
          {H.length ? H.slice(-25).reverse().map((l, i) => (
            <div key={i} className="flex items-baseline justify-between gap-3 border-t border-border/60 py-1.5 first:border-t-0">
              <span className="min-w-0"><span className="block truncate font-medium">{l.nom}</span>
                <span className="text-[12px] text-muted-foreground">{Object.keys(l.ex).length} exercices · {l.ser} séries{l.rec ? ` · ${l.rec} record${l.rec > 1 ? "s" : ""}` : ""}</span></span>
              <span className="shrink-0 text-right text-[12.5px] text-muted-foreground">{court(l.d)}<span className="block num">{kg(l.vol)}</span></span>
            </div>
          )) : <Vide t="Aucune séance." />}
        </Bloc>

        <Bloc titre="Derniers records">
          {R.length ? R.map((r, i) => (
            <Ligne key={i} k={`${EX[r.id]?.n || r.id} · ${court(r.d)}`} v={EX[r.id]?.ch === "kg" ? `${Math.round(r.rm)} kg (1RM estimé)` : `${r.reps} rép.`} />
          )) : <Vide t="Aucun record." />}
        </Bloc>

        <Bloc titre={`Cardio · ${(E.CARDIO || []).length}`}>
          {(E.CARDIO || []).length ? (E.CARDIO || []).slice(-10).reverse().map((c, i) => (
            <Ligne key={i} k={`${c.nom || FORMATS[c.f]?.nom || c.f} · ${court(jourDe(c.ts))}`} v={`${Math.round(c.min)} min${c.ref ? " · combinée" : ""}`} />
          )) : <Vide t="Aucune séance de cardio." />}
        </Bloc>

        <Bloc titre="Course à pied">
          {E.COURSE && <>
            <Ligne k="Objectif" v={`${DISTANCES[E.COURSE.obj]?.nom || E.COURSE.obj} le ${court(E.COURSE.date)}`} />
            <Ligne k="Jours de course" v={`${E.COURSE.jours} par semaine`} />
            <Ligne k="Chrono de référence" v={E.COURSE.ref ? `${E.COURSE.ref.km} km en ${chronoTxt(E.COURSE.ref.sec)}` : "débutant"} />
          </>}
          {(E.SORTIES || []).slice(-8).reverse().map((x, i) => (
            <Ligne key={i} k={`${court(x.d)}${x.course ? " · course" : ""}${x.douleur ? " · douleur" : ""}`} v={`${x.km} km · ${allureTxt(allureDe(x))}`} />
          ))}
          {!E.COURSE && !(E.SORTIES || []).length && <Vide t="Pas de préparation course." />}
        </Bloc>

        <Bloc titre={`Badges · ${badges.length}`}>
          {badges.length ? <p className="leading-relaxed">{badges.map((b) => b.nom).join(" · ")}</p> : <Vide t="Aucun badge." />}
        </Bloc>

        <Bloc titre="Défis">
          {F.defis.length ? F.defis.map((d) => (
            <Ligne key={d.code} k={`${d.nom} · ${court(d.debut)} → ${court(d.fin)}`} v={`${d.score}/${d.cible} ${TYPES_DEFI[d.type as TypeDefi]?.unite || ""}`} />
          )) : <Vide t="Aucun défi." />}
        </Bloc>

        <Bloc titre="Santé et forme">
          <Ligne k="Forme du jour" v={forme ? `${NOMS_NIVEAU[niveau(forme)]} (${court(forme.d)})` : "—"} />
          <Ligne k="Douleurs signalées" v={zones.length ? zones.map(nomZone).join(", ") : "aucune"} />
          <Ligne k="Zones à ménager" v={(A.blessure || []).map((i) => BLESN[i]).filter(Boolean).join(", ") || "aucune"} />
          <Ligne k="Poids" v={poids ? `${poids} kg` : "—"} />
          <Ligne k="Protéines (7 jours)" v={protObj ? prot.map((j) => protDuJour(A, j)).join(" · ") + ` / ${protObj} g` : "—"} />
        </Bloc>

        <Bloc titre="Générations par IA">
          {F.generations.length ? F.generations.slice(0, 10).map((g) => <Ligne key={g.jour} k={court(g.jour)} v={`${g.n}`} />) : <Vide t="Aucune." />}
          <p className="mt-2 text-[12px] text-muted-foreground">Plafond : 5 par jour et par compte, {PLAFOND_IA} au total.</p>
        </Bloc>
      </div>
    </>
  );
}
