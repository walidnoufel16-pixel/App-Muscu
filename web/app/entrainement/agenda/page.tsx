"use client";

/* Agenda : tout le calendrier des séances, façon Calendrier. Vue Mois (des points sous les jours)
   ou Semaine (la grille de deux semaines) ; on touche un jour pour le voir en dessous, puis on
   touche une séance pour la commencer, la déplacer, la refaire ou la modifier (feuilles d'agenda.tsx). */
import { loc, tr } from "@/lib/i18n";
import { useMemo, useState } from "react";
import { BellIcon, CaretLeftIcon, CaretRightIcon, PlusIcon } from "@phosphor-icons/react";
import { EnTete } from "@/components/repere/en-tete";
import { Retour } from "@/components/repere/retour";
import { Segmente } from "@/components/repere/segmente";
import { Case, FeuillesAgenda, initiales, jourCourt, jourLong, maj, nomPrevu, sousTitre, type Feuille } from "@/components/repere/agenda";
import { FeuilleImport } from "@/components/repere/mes-seances";
import { debutGrille, familleDe, joursAgenda, type JourAgenda } from "@/lib/logic/agenda";
import { decaler, jourDe, lundiDe } from "@/lib/logic/historique";
import { useRepere } from "@/lib/store";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

const RUN = "#c2622a";
type Vue = "mois" | "semaine";

/* le premier jour du mois (AAAA-MM-01) décalé de n mois */
const moisDecale = (m: string, n: number) => {
  const d = new Date(+m.slice(0, 4), +m.slice(5, 7) - 1 + n, 1, 12);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
};

export default function PageAgenda() {
  const etat = useRepere((s) => s.etat);
  const [auj] = useState(() => jourDe(Date.now()));
  const [vue, setVue] = useState<Vue>("mois");
  const [sel, setSel] = useState(auj);
  const [mois, setMois] = useState(() => auj.slice(0, 8) + "01");
  const [decal, setDecal] = useState(0);
  const [f, setF] = useState<Feuille | null>(null);
  const ini = initiales();

  /* six semaines à partir du lundi qui ouvre le mois */
  const debutMois = lundiDe(mois);
  const M = useMemo(() => joursAgenda(etat, debutMois, auj, 42), [etat, debutMois, auj]);
  const debut2 = debutGrille(auj, decal);
  const S = useMemo(() => joursAgenda(etat, debut2, auj, 14), [etat, debut2, auj]);
  const J = useMemo(() => joursAgenda(etat, sel, auj, 1)[0], [etat, sel, auj]);
  const aVenir = useMemo(() => joursAgenda(etat, auj, auj, 29).filter((j) => j.d !== sel).flatMap((j) => j.prevus.map((p) => ({ p, d: j.d }))).slice(0, 6), [etat, auj, sel]);

  const choisir = (d: string) => { tactile(4); setSel(d); };
  const nomMois = maj(new Date(mois + "T12:00").toLocaleDateString(loc(), { month: "long", year: "numeric" }));
  const semaines = M.slice(35).some((j) => j.d.slice(0, 7) === mois.slice(0, 7)) ? 6 : 5;

  return (
    <>
      <EnTete
        gauche={<Retour repli="/entrainement" />}
        surtitre={tr("Mon agenda")}
        titre={vue === "mois" ? nomMois : tr("Deux semaines")}
        actions={
          <button aria-label={tr("Programmer une séance")} onClick={() => { tactile(8); setF({ m: "nouvelle", d: sel >= auj ? sel : auj }); }}
            className="grid size-9 place-items-center rounded-full bg-plate text-plate-foreground active:scale-95">
            <PlusIcon className="size-5" weight="bold" />
          </button>
        }
      />
      <div className="flex flex-col gap-3 px-4 pb-6">
        <Segmente label={tr("Affichage")} valeur={vue} onChange={setVue} options={[{ v: "semaine", n: tr("Semaine") }, { v: "mois", n: tr("Mois") }]} />

        {vue === "mois" ? (
          <section className="rounded-[22px] bg-card p-3">
            <div className="mb-1 flex items-center justify-between">
              <button aria-label={tr("Mois précédent")} onClick={() => setMois((m) => moisDecale(m, -1))} className="grid size-8 place-items-center rounded-full text-muted-foreground active:bg-muted"><CaretLeftIcon className="size-4" weight="bold" /></button>
              <span className="text-[14px] font-semibold">{nomMois}</span>
              <button aria-label={tr("Mois suivant")} onClick={() => setMois((m) => moisDecale(m, 1))} className="grid size-8 place-items-center rounded-full text-muted-foreground active:bg-muted"><CaretRightIcon className="size-4" weight="bold" /></button>
            </div>
            <div className="grid grid-cols-7 text-center">
              {ini.map((x, i) => <span key={i} className="pb-1 text-[11px] font-semibold text-muted-foreground uppercase">{x}</span>)}
              {M.slice(0, semaines * 7).map((j) => (
                <JourMois key={j.d} j={j} auj={auj} sel={sel} dansMois={j.d.slice(0, 7) === mois.slice(0, 7)} onClick={() => choisir(j.d)} />
              ))}
            </div>
          </section>
        ) : (
          <section className="rounded-[22px] bg-card p-3">
            <div className="mb-1.5 flex items-center justify-between">
              <button aria-label={tr("Deux semaines plus tôt")} onClick={() => setDecal((x) => x - 1)} className="grid size-8 place-items-center rounded-full text-muted-foreground active:bg-muted"><CaretLeftIcon className="size-4" weight="bold" /></button>
              <span className="text-[13px] font-semibold text-muted-foreground">{decal === 0 ? tr("Cette semaine et la suivante") : `${jourCourt(debut2)} – ${jourCourt(decaler(debut2, 13))}`}</span>
              <button aria-label={tr("Deux semaines plus tard")} onClick={() => setDecal((x) => x + 1)} className="grid size-8 place-items-center rounded-full text-muted-foreground active:bg-muted"><CaretRightIcon className="size-4" weight="bold" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {ini.map((x, i) => <span key={i} className="text-center text-[10.5px] font-semibold text-muted-foreground uppercase">{x}</span>)}
              {S.map((j) => <div key={j.d} className={cn("grid min-w-0 rounded-[13px]", j.d === sel && j.d !== auj && "ring-2 ring-plate ring-offset-1 ring-offset-card")}><Case j={j} auj={auj} onClick={() => choisir(j.d)} /></div>)}
            </div>
          </section>
        )}

        <Legende />

        {/* le jour choisi */}
        <section>
          <h2 className="mt-2 mb-1.5 px-1 text-[13px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
            {maj(jourLong(sel))}{sel === auj ? " · " + tr("aujourd'hui") : ""}
          </h2>
          <ListeJour j={J} auj={auj} setF={setF} />
        </section>

        {aVenir.length > 0 && (
          <section>
            <h2 className="mt-3 mb-1.5 px-1 text-[13px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">{tr("À venir")}</h2>
            <div className="rounded-[18px] bg-card px-3">
              {aVenir.map(({ p, d }) => (
                <Rangee key={p.id + d} barre={familleDe(p.quoi) === "course" ? "run" : "prevu"} titre={nomPrevu(p)}
                  sous={`${maj(jourLong(d))}${sousTitre(etat, p) ? " · " + sousTitre(etat, p) : ""}`} rappel={p.rappel}
                  onClick={() => { tactile(5); setSel(d); setF({ m: "jour", d }); }} />
              ))}
            </div>
          </section>
        )}
      </div>
      <FeuillesAgenda f={f} setF={setF} auj={auj} />
      <FeuilleImport />
    </>
  );
}

/* ---------------- un jour de la vue Mois ---------------- */
function JourMois({ j, auj, sel, dansMois, onClick }: { j: JourAgenda; auj: string; sel: string; dansMois: boolean; onClick: () => void }) {
  const points = [
    ...j.fait.map((f) => (f.famille === "course" ? "run" : "fait")),
    ...j.prevus.map((p) => (familleDe(p.quoi) === "course" ? "runp" : "prevu")),
    ...j.manques.map(() => "manque"),
  ].slice(0, 3);
  const estAuj = j.d === auj, estSel = j.d === sel;
  return (
    <button onClick={onClick} aria-label={jourLong(j.d)} aria-pressed={estSel}
      className={cn("flex h-12 flex-col items-center pt-1 active:scale-95", !dansMois && "opacity-35")}>
      <span className={cn("num grid size-7 place-items-center rounded-full text-[15px] font-semibold",
        estAuj ? "bg-plate text-plate-foreground" : estSel ? "bg-foreground text-background" : j.d < auj ? "text-muted-foreground" : "")}>
        {+j.d.slice(8)}
      </span>
      <span className="mt-1 flex h-1.5 gap-[3px]">
        {points.map((t, k) => (
          <i key={k} className={cn("size-1.5 rounded-full",
            t === "fait" && "bg-plate", t === "prevu" && "border-[1.5px] border-plate", t === "manque" && "bg-foreground/25",
            t === "runp" && "border-[1.5px]")}
            style={t === "run" ? { background: RUN } : t === "runp" ? { borderColor: RUN } : undefined} />
        ))}
      </span>
    </button>
  );
}

function Legende() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3.5 gap-y-1 text-[11.5px] text-muted-foreground">
      <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-plate" />{tr("fait")}</span>
      <span className="flex items-center gap-1"><i className="size-2 rounded-full border-[1.5px] border-plate" />{tr("prévu")}</span>
      <span className="flex items-center gap-1"><i className="size-2 rounded-full" style={{ background: RUN }} />Oxa Run</span>
      <span className="flex items-center gap-1"><i className="size-2 rounded-full bg-foreground/25" />{tr("manqué")}</span>
    </div>
  );
}

/* ---------------- les séances d'un jour, en liste ---------------- */
function Rangee({ barre, titre, sous, rappel, droite, onClick }: { barre: "fait" | "prevu" | "run" | "manque"; titre: string; sous: string; rappel?: { veille: boolean; h: number }; droite?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 border-b border-border/70 px-1 py-2.5 text-left last:border-b-0 active:bg-muted/50">
      <span className={cn("w-1 self-stretch rounded-full",
        barre === "fait" && "bg-plate", barre === "manque" && "bg-foreground/20",
        barre === "prevu" && "bg-[repeating-linear-gradient(var(--plate)_0_4px,transparent_4px_7px)]")}
        style={barre === "run" ? { background: RUN } : undefined} />
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate text-[15.5px] font-semibold", barre === "manque" && "text-muted-foreground line-through decoration-1")}>{titre}</span>
        <span className="block truncate text-[12.5px] text-muted-foreground">{sous}</span>
      </span>
      {rappel ? (
        <span className="flex shrink-0 items-center gap-1 text-[12px] text-muted-foreground">
          <BellIcon className="size-3.5" weight="fill" />{rappel.veille ? tr("la veille à {h} h", { h: rappel.h }) : tr("à {h} h", { h: rappel.h })}
        </span>
      ) : droite ? <span className="shrink-0 text-[12.5px] font-semibold text-plate-ink dark:text-plate">{droite}</span> : null}
    </button>
  );
}

function ListeJour({ j, auj, setF }: { j: JourAgenda; auj: string; setF: (f: Feuille) => void }) {
  const etat = useRepere((s) => s.etat);
  const ouvrir = () => { tactile(5); setF({ m: "jour", d: j.d }); };
  const vide = !j.fait.length && !j.prevus.length && !j.manques.length;
  return (
    <div className="rounded-[18px] bg-card px-3">
      {j.fait.map((f, k) => (
        <Rangee key={"f" + k} barre={f.famille === "course" ? "run" : "fait"} titre={f.nom}
          sous={f.famille === "course" ? tr("Faite · Oxa Run") : f.famille === "cardio" ? tr("Faite · cardio") : tr("Faite")}
          droite={f.famille === "muscu" ? tr("Refaire") : undefined} onClick={ouvrir} />
      ))}
      {j.prevus.map((p) => (
        <Rangee key={p.id} barre={familleDe(p.quoi) === "course" ? "run" : "prevu"} titre={nomPrevu(p)}
          sous={[tr("Prévue"), sousTitre(etat, p), p.hebdo ? tr("chaque semaine") : ""].filter(Boolean).join(" · ")} rappel={p.rappel} onClick={ouvrir} />
      ))}
      {j.manques.map((p) => (
        <Rangee key={p.id} barre="manque" titre={nomPrevu(p)} sous={tr("Prévue, pas faite")} droite={tr("Reprogrammer")} onClick={ouvrir} />
      ))}
      {vide && j.d < auj && <p className="py-3 text-[13.5px] text-muted-foreground">{tr("Rien ce jour-là.")}</p>}
      {j.d >= auj && (
        <button onClick={() => { tactile(6); setF({ m: "nouvelle", d: j.d }); }} className={cn("flex w-full items-center gap-2 py-3 text-[14.5px] font-semibold text-plate-ink dark:text-plate", !vide && "border-t border-border/70")}>
          <PlusIcon className="size-4" weight="bold" />{vide ? tr("Ajouter une séance ce jour-là") : tr("Ajouter une autre séance ce jour-là")}
        </button>
      )}
    </div>
  );
}
