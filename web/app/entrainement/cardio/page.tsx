"use client";

/* Cardio guidé : préparation (format, machine, niveau, durées), puis minuteur
   plein écran (components/repere/minuteur.tsx). Séance enregistrée (?s=index)
   ou bloc d'une séance combinée (?l=index&b=bloc). */
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EnTete } from "@/components/repere/en-tete";
import { Retour } from "@/components/repere/retour";
import { Redirige } from "@/components/repere/redirige";
import { Minuteur, type Course } from "@/components/repere/minuteur";
import { ICONE_FORMAT, ReglagesCardio, type ChoixCardio } from "@/components/repere/reglages-cardio";
import { bilanCardio, construireSeance, dureeTotale, FORMATS, nomSeanceCardio, type Phase } from "@/lib/logic/cardio";
import { useRepere } from "@/lib/store";
import { useCelebrer } from "@/lib/celebrer";
import { preparer } from "@/lib/sons";

/* ---------------- préparation ----------------
   Le cardio se crée uniquement depuis « Créer une séance pour moi › Cardio » ;
   cet écran ouvre une séance enregistrée (?s=index), et démarre aussitôt avec &go=1. */
function Cardio() {
  const q = useSearchParams();
  const s = q.get("s"), l = q.get("l"), b = q.get("b");
  if (l != null && b != null) return <PreparationBloc i={Number(l)} id={b} />;
  if (s == null) return <Redirige vers="/entrainement/assistant" force={{ type: "cardio" }} />;
  return <PreparationSeance i={Number(s)} go={q.get("go") === "1"} />;
}

/* Séance cardio enregistrée (SEANCES_CARDIO). */
function PreparationSeance({ i, go }: { i: number; go: boolean }) {
  const muter = useRepere((s) => s.muter);
  const enregistree = useRepere((s) => s.etat.SEANCES_CARDIO?.[i]);
  return (
    <Preparation
      source={enregistree} go={go} nomModifiable
      sauver={(choix, nom) => muter((E) => { const s = E.SEANCES_CARDIO![i]; Object.assign(s, choix, { nom: nom.trim().slice(0, 60) || s.nom }); })}
    />
  );
}

/* Bloc cardio d'une séance combinée : ses réglages restent dans le bloc, et la
   séance jouée est notée avec la référence du bloc (« fait aujourd'hui »). */
function PreparationBloc({ i, id }: { i: number; id: string }) {
  const muter = useRepere((s) => s.muter);
  const seance = useRepere((s) => s.etat.SEANCES[i]);
  const bloc = seance?.blocs?.find((x) => x.id === id);
  return (
    <Preparation
      source={bloc && { nom: `Cardio · ${seance!.nom}`, f: bloc.f, m: bloc.m, n: bloc.n, r: bloc.r }} go={false} refBloc={id}
      sauver={(choix) => muter((E) => { const x = E.SEANCES[i]?.blocs?.find((y) => y.id === id); if (x) Object.assign(x, choix); })}
    />
  );
}

type Source = { nom: string } & ChoixCardio;

function Preparation({ source: enregistree, go, nomModifiable, refBloc, sauver }: {
  source: Source | undefined; go: boolean; nomModifiable?: boolean; refBloc?: string; sauver: (c: ChoixCardio, nom: string) => void;
}) {
  const [choix, setChoix] = useState<ChoixCardio | null>(() => (enregistree ? { f: enregistree.f, m: enregistree.m, n: enregistree.n, r: enregistree.r } : null));
  const [course, setCourse] = useState<Course | null>(() => (go && enregistree ? { debut: Date.now(), pause: null, cumulPause: 0, saut: 0 } : null));
  const [nom, setNom] = useState(enregistree?.nom ?? "");
  const phases = useMemo(() => (choix ? construireSeance(choix.f, choix.m, choix.r) : []), [choix]);

  if (!enregistree || !choix)
    return (
      <>
        <EnTete titre="Séance introuvable" gauche={<Retour repli="/entrainement" />} />
        <p className="px-5 text-[15px] text-muted-foreground">Cette séance cardio n&apos;existe plus sur ce téléphone.</p>
      </>
    );

  const titre = nom.trim() || enregistree.nom || nomSeanceCardio(choix.f, choix.m);
  const modifiee = nom.trim() !== enregistree.nom || JSON.stringify({ f: enregistree.f, m: enregistree.m, n: enregistree.n, r: enregistree.r }) !== JSON.stringify(choix);

  if (course) return <Minuteur phases={phases} titre={titre} course={course} setCourse={setCourse} onFin={(e) => finCardio(phases, titre, choix, refBloc, e)} />;

  const I = ICONE_FORMAT[choix.f];
  return (
    <>
      <EnTete surtitre={<span className="flex items-center gap-1.5"><I className="size-3.5" weight="fill" />Cardio · {FORMATS[choix.f].nom}</span>} titre={titre} gauche={<Retour repli="/entrainement" />} />
      <div className="px-4 pb-32">
        {nomModifiable && (
          <section className="mb-6">
            <h2 className="eyebrow mb-2 px-1">Nom de la séance</h2>
            <Input value={nom} onChange={(e) => setNom(e.target.value)} maxLength={60} className="h-12 rounded-2xl bg-card text-[16px]" aria-label="Nom de la séance" />
          </section>
        )}
        <ReglagesCardio choix={choix} onChange={setChoix} avecFormat={false} />
        {modifiee && (
          <Button variant="soft" size="lg" className="mt-4 w-full rounded-xl" onClick={() => { sauver(choix, nom); toast.success("Séance enregistrée"); }}>
            Enregistrer ces réglages dans la séance
          </Button>
        )}
      </div>
      <div className="fixed inset-x-0 bottom-[max(env(safe-area-inset-bottom),14px)] z-30 mx-auto max-w-[480px] px-4">
        <Button
          variant="plate" size="xl" className="w-full"
          onClick={() => { preparer(); setCourse({ debut: Date.now(), pause: null, cumulPause: 0, saut: 0 }); }}
        >
          Démarrer · {Math.round(dureeTotale(phases) / 60)} min<ArrowRightIcon />
        </Button>
      </div>
    </>
  );
}

/* Fin d'une séance cardio : historique et bilan. */
function finCardio(phases: Phase[], titre: string, choix: ChoixCardio, refBloc: string | undefined, e: number) {
  const b = bilanCardio(phases, e);
  useRepere.getState().muter((E) => { (E.CARDIO ??= []).push({ nom: titre, f: choix.f, m: choix.m, min: b.minutes, effort: b.effort, ts: Date.now(), ...(refBloc ? { ref: refBloc } : {}) }); });
  useCelebrer.getState().montrerBilan({
    titre,
    cases: [
      { n: "minutes", v: b.minutes },
      choix.f === "endurance" ? { n: "minutes en endurance", v: Math.round(b.effort / 60) } : { n: "minutes à l'effort", v: Math.round(b.effort / 60) },
      ...(choix.f === "endurance" ? [] : [{ n: "tours d'effort", v: b.tours }]),
      { n: "séances cardio sur 7 jours", v: (useRepere.getState().etat.CARDIO || []).filter((h) => Date.now() - h.ts < 7 * 864e5).length, accent: true },
    ],
  });
}

export default function PageCardio() {
  return (
    <Suspense>
      <Cardio />
    </Suspense>
  );
}
