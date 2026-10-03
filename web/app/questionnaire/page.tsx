"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmer, dire } from "@/components/repere/confirmer";
import { ACC, MATCATS, SPORTS } from "@/lib/data/referentiels";
import { accDeclares, freqDe, sportsChoisis, sportsTotal } from "@/lib/logic/core";
import { buildQ, prioNoms, repondue, sportWarn } from "@/lib/logic/questionnaire";
import type { Reponses } from "@/lib/logic/types";
import { useRepere } from "@/lib/store";
import { genererCycle } from "@/lib/generer";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

export default function PageQuestionnaire() {
  const router = useRouter();
  const { etat, muter } = useRepere();
  const A = etat.A;
  const Q = useMemo(() => buildQ(A), [A]);
  const [qi, setQi] = useState(() => Math.min(A.reprise as number || 0, Q.length - 1));
  const [gen, setGen] = useState<{ pct: number; texte: string } | null>(null);
  const bascule = useRef<ReturnType<typeof setTimeout> | null>(null);
  const q = Q[Math.min(qi, Q.length - 1)];

  const majA = (fn: (a: Reponses) => void) => muter((E) => fn(E.A));
  const suivant = async () => {
    const i = Q.findIndex((x) => x.k === q.k);
    majA((a) => { a.reprise = i + 1; });
    if (i < Q.length - 1) { setQi(i + 1); window.scrollTo({ top: 0 }); return; }
    await lancerGeneration();
  };
  const precedent = async () => {
    if (bascule.current) clearTimeout(bascule.current);
    const i = Q.findIndex((x) => x.k === q.k);
    if (i > 0) { setQi(i - 1); majA((a) => { a.reprise = i - 1; }); return; }
    if (await confirmer({ titre: "Quitter le questionnaire ?", texte: "Tes réponses sont gardées : tu pourras reprendre où tu en étais.", ok: "Quitter" }))
      router.push(etat.FINI ? "/plan/synthese/" : "/bienvenue/");
  };

  const lancerGeneration = async (forcer = false) => {
    setGen({ pct: 0, texte: "" });
    let pct = 0, fini = false;
    const t = setInterval(() => { if (fini) return; pct = Math.min(94, pct + Math.max(0.25, (94 - pct) * 0.04)); setGen((g) => g && { ...g, pct }); }, 200);
    const r = await genererCycle(useRepere.getState().etat.A, forcer, (texte) => setGen((g) => g && { ...g, texte }));
    fini = true; clearInterval(t);
    setGen({ pct: 100, texte: "" });
    muter((E) => { E.PLAN = r.plan; E.FINI = true; });
    await new Promise((z) => setTimeout(z, 380));
    if (r.erreur) await dire("Génération par IA indisponible", r.erreur + "\n\nLe programme affiché vient des règles intégrées.");
    router.push("/plan/synthese/");
  };

  /* ----- choix ----- */
  const choisir = (i: number) => {
    tactile(6);
    if (q.t === "multi") {
      const s = ((A[q.k] as number[]) || []).slice(), last = q.o!.length - 1, aucun = /Aucun|Rien/.test(q.o![last][0]);
      if (aucun && i === last) { majA((a) => { (a as Record<string, unknown>)[q.k] = s.includes(last) ? [] : [last]; }); return; }
      const j = s.indexOf(i);
      if (j < 0) { if (q.max && s.filter((x) => x !== last).length >= q.max) return; s.push(i); } else s.splice(j, 1);
      majA((a) => { (a as Record<string, unknown>)[q.k] = s.filter((x) => x !== last || !aucun); });
      return;
    }
    majA((a) => { (a as Record<string, unknown>)[q.k] = i; });
    /* choix unique : on passe tout seul à la question suivante */
    if (bascule.current) clearTimeout(bascule.current);
    bascule.current = setTimeout(() => {
      const Q2 = buildQ(useRepere.getState().etat.A), i2 = Q2.findIndex((x) => x.k === q.k);
      if (i2 < Q2.length - 1) { setQi(i2 + 1); window.scrollTo({ top: 0 }); }
    }, 170);
  };

  if (gen)
    return (
      <div className="flex min-h-dvh flex-col justify-center px-8">
        <div className="eyebrow">Génération</div>
        <h1 className="mt-2 text-[34px] leading-[1.05] font-bold tracking-[-0.025em]">On construit ton cycle</h1>
        <div className="mt-8 h-3 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-plate transition-[width] duration-200" style={{ width: gen.pct + "%" }} />
        </div>
        <div className="num mt-3 text-[40px] font-bold">{Math.round(gen.pct)} %</div>
        <p className="mt-1 min-h-5 text-[14px] text-muted-foreground">{gen.texte}</p>
      </div>
    );

  const total = Q.length, idx = Q.findIndex((x) => x.k === q.k);
  const fait = repondue(A, q), auto = !q.t && idx < total - 1;
  const warn = q.k === "sportFreq" ? sportWarn(A) : [];

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="safe-top sticky top-0 z-20 bg-background/90 backdrop-blur-xl">
        <div className="flex h-12 items-center gap-2 px-3">
          <Button variant="ghost" size="icon" aria-label="Question précédente" onClick={precedent}><ChevronLeft className="size-6" /></Button>
          {/* progression : des disques qui se chargent */}
          <div className="flex flex-1 items-center gap-1" aria-label={`Question ${idx + 1} sur ${total}`}>
            {Q.map((x, n) => (
              <span key={x.k} className={cn("h-1.5 flex-1 rounded-full transition-colors duration-300", n < idx ? "bg-foreground" : n === idx ? "bg-plate" : "bg-muted")} />
            ))}
          </div>
          <span className="num w-12 text-right text-[15px] font-semibold text-muted-foreground">{String(idx + 1).padStart(2, "0")}/{total}</span>
        </div>
      </div>

      <div className="flex-1 px-5 pt-4 pb-32">
        <div className="eyebrow">Question {idx + 1}</div>
        <h1 className="mt-2 text-[28px] leading-[1.1] font-bold tracking-[-0.02em] text-balance">{q.q}</h1>
        {q.h && <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{q.h}</p>}
        {warn.length > 0 && (
          <div className="mt-4 rounded-2xl bg-plate-soft p-4 text-[14px] leading-relaxed">
            {warn.map(([g, t], i) => <p key={i} className={i ? "mt-2" : ""}><b className="font-semibold">{g}</b> {t}</p>)}
            {warn.some(([g]) => g.includes("axe")) && (
              <button onClick={() => setQi(Q.findIndex((x) => x.k === "axe"))} className="mt-2 text-[13.5px] font-semibold underline underline-offset-4">Revenir changer l&apos;axe de ma séance bonus</button>
            )}
          </div>
        )}

        <div className="mt-6">
          {!q.t || q.t === "multi" ? (
            <div className="flex flex-col gap-2">
              {q.o!.map(([t, d], i) => {
                const v = A[q.k], on = q.t === "multi" ? ((v as number[]) || []).includes(i) : v === i;
                const plein = q.t === "multi" && q.max && ((v as number[]) || []).length >= q.max && !on;
                return (
                  <button
                    key={i}
                    disabled={!!plein}
                    onClick={() => choisir(i)}
                    aria-pressed={on}
                    className={cn(
                      "flex items-center gap-3.5 rounded-[18px] border-2 bg-card px-4 py-3.5 text-left transition-[border-color,transform] active:scale-[.99] disabled:opacity-40",
                      on ? "border-foreground" : "border-transparent",
                    )}
                  >
                    <span className={cn("grid size-6 shrink-0 place-items-center border-2 transition-colors", q.t === "multi" ? "rounded-[7px]" : "rounded-full", on ? "border-foreground bg-foreground text-background" : "border-border")}>
                      {on && <Check className="size-3.5" strokeWidth={3.5} />}
                    </span>
                    <span>
                      <span className="block text-[16px] font-semibold">{t}</span>
                      {d && <span className="mt-0.5 block text-[13.5px] text-muted-foreground">{d}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : q.t === "freq" ? (
            <Frequences A={A} majA={majA} />
          ) : q.t === "prefs" ? (
            <Preferences A={A} majA={majA} rows={q.rows!} onToutConvient={() => { majA((a) => { a.prefs = {}; q.rows!.forEach((g) => (a.prefs![g] = [])); }); suivant(); }} />
          ) : (
            <Profil A={A} majA={majA} loads={q.loads!} />
          )}
        </div>
      </div>

      {!auto && (
        <div className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[480px] bg-gradient-to-t from-background via-background to-transparent px-5 pt-6 pb-[max(env(safe-area-inset-bottom),16px)]">
          <Button variant={idx === total - 1 ? "plate" : "default"} size="xl" className="w-full" disabled={!fait} onClick={suivant}>
            {idx === total - 1 ? "Générer mon programme" : "Continuer"}
          </Button>
        </div>
      )}
    </div>
  );
}

type Maj = (fn: (a: Reponses) => void) => void;

function Frequences({ A, majA }: { A: Reponses; majA: Maj }) {
  const F = ["1 fois", "2 fois", "3 fois ou plus"];
  return (
    <div className="flex flex-col gap-3">
      {sportsChoisis(A).map((i) => (
        <div key={i} className="rounded-[18px] bg-card p-4">
          <div className="text-[15.5px] font-semibold">{SPORTS[i].n}</div>
          <div className="mt-2.5 grid grid-cols-3 gap-1.5">
            {F.map((f, j) => {
              const on = (A.sportFreq || {})[i] !== undefined && freqDe(A, i) === j;
              return (
                <button key={f} onClick={() => majA((a) => { a.sportFreq = { ...(a.sportFreq || {}), [i]: j }; })}
                  className={cn("h-10 rounded-xl border text-[13.5px] font-medium", on ? "border-foreground bg-foreground text-background" : "border-border")}>{f}</button>
              );
            })}
          </div>
        </div>
      ))}
      <p className="px-1 text-[13.5px] text-muted-foreground">Soit {sportsTotal(A)} séance{sportsTotal(A) > 1 ? "s" : ""} par semaine en dehors de la musculation.</p>
    </div>
  );
}

function Preferences({ A, majA, rows, onToutConvient }: { A: Reponses; majA: Maj; rows: string[]; onToutConvient: () => void }) {
  const C: [number, string][] = MATCATS.filter((c) => c[0] >= (A.materiel ?? 0)).concat(ACC.filter((a) => accDeclares(A).includes(a[0])).map((a) => [a[2], a[1]] as [number, string]));
  const pref = async (g: string, v: number) => {
    if (v === -2) {
      const exclu = (A.exclus || []).includes(g);
      if (!exclu && prioNoms(A).includes(g)) { await dire("Groupe prioritaire", `Tu as déclaré « ${g} » comme groupe prioritaire. Reviens en arrière pour le retirer de tes priorités avant de l'écarter du programme.`); return; }
      majA((a) => { a.prefs = a.prefs || {}; a.exclus = a.exclus || []; if (exclu) a.exclus.splice(a.exclus.indexOf(g), 1); else { a.exclus.push(g); a.prefs[g] = []; } });
      return;
    }
    if ((A.exclus || []).includes(g)) return;
    majA((a) => {
      a.prefs = a.prefs || {};
      const arr = a.prefs[g] || [];
      if (v === -1) a.prefs[g] = [];
      else { const j = arr.indexOf(v); if (j < 0) arr.push(v); else arr.splice(j, 1); a.prefs[g] = arr; }
    });
  };
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((g) => {
        const arr = (A.prefs || {})[g] || [], off = (A.exclus || []).includes(g);
        const Chip = ({ on, onClick, children, danger }: { on: boolean; onClick: () => void; children: React.ReactNode; danger?: boolean }) => (
          <button onClick={onClick} className={cn("h-8 rounded-full border px-3 text-[13px] font-medium", on ? (danger ? "border-destructive bg-destructive text-white" : "border-foreground bg-foreground text-background") : "border-border bg-background")}>{children}</button>
        );
        return (
          <div key={g} className={cn("rounded-[18px] bg-card p-3.5", off && "opacity-70")}>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-[15px] font-semibold">{g}</span>
              <span className="text-[12px] text-muted-foreground">{off ? "écarté" : arr.length ? arr.length + " choix" : "peu importe"}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Chip on={!off && !arr.length} onClick={() => pref(g, -1)}>Peu importe</Chip>
              {C.map(([c, n]) => <Chip key={c} on={!off && arr.includes(c)} onClick={() => pref(g, c)}>{n}</Chip>)}
              <Chip danger on={off} onClick={() => pref(g, -2)}>Ne pas travailler</Chip>
            </div>
          </div>
        );
      })}
      {(A.exclus || []).length > 0 && (
        <p className="rounded-2xl bg-plate-soft p-3.5 text-[13.5px] leading-relaxed">
          Le volume de {A.exclus!.join(" et ")} sera reporté sur {prioNoms(A).length ? "tes groupes prioritaires : " + prioNoms(A).join(", ") + "." : "les autres groupes, à parts égales."} Aucun groupe ne dépassera vingt séries par semaine.
        </p>
      )}
      <p className="px-1 text-[13px] leading-relaxed text-muted-foreground">Ces choix pilotent aussi les alternatives proposées en salle quand un appareil est occupé.</p>
      <Button variant="ghost" onClick={onToutConvient}>Tout me convient, passe cette étape</Button>
    </div>
  );
}

function Profil({ A, majA, loads }: { A: Reponses; majA: Maj; loads: [string, number, number, string][] }) {
  const st = (A.profil || {}) as Record<string, number>;
  const val = (l: string, d: number) => (st[l] ?? d);
  /* Valeurs par défaut enregistrées dès l'affichage : « Continuer » est actif tout de suite. */
  useEffect(() => { majA((a) => { if (!a.profil) { a.profil = {}; loads.forEach(([l, d]) => (a.profil![l] = d)); } }); }, [majA, loads]);
  const t = val("Taille", 178) / 100, p = val("Poids", 76), imc = p / (t * t), pos = Math.max(1, Math.min(99, ((imc - 15) / 20) * 100));
  return (
    <div className="flex flex-col gap-2">
      {loads.map(([l, d, pas, u]) => (
        <div key={l} className="flex items-center justify-between rounded-[18px] bg-card p-3 pl-4">
          <span className="text-[15.5px] font-semibold">{l}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => majA((a) => { a.profil = { ...(a.profil || {}), [l]: Math.max(0, val(l, d) - pas) }; })} aria-label={`${l} moins`} className="grid size-10 place-items-center rounded-full bg-muted active:scale-90"><Minus className="size-4" /></button>
            <span className="flex w-24 items-baseline justify-center gap-1">
              <input
                value={val(l, d)}
                inputMode="decimal"
                aria-label={l}
                onChange={(e) => { const v = parseFloat(e.target.value.replace(",", ".")); if (!isNaN(v)) majA((a) => { a.profil = { ...(a.profil || {}), [l]: Math.max(0, v) }; }); }}
                className="num w-14 bg-transparent text-center text-[28px] font-bold outline-none"
              />
              <span className="text-[13px] text-muted-foreground">{u}</span>
            </span>
            <button onClick={() => majA((a) => { a.profil = { ...(a.profil || {}), [l]: val(l, d) + pas }; })} aria-label={`${l} plus`} className="grid size-10 place-items-center rounded-full bg-muted active:scale-90"><Plus className="size-4" /></button>
          </div>
        </div>
      ))}
      <div className="mt-2 rounded-[18px] bg-card p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[14px] font-medium">Indice de masse corporelle</span>
          <b className="num text-[26px] font-bold">{imc.toFixed(1).replace(".", ",")}</b>
        </div>
        <div className="relative mt-3 h-2 rounded-full bg-gradient-to-r from-rpe8 via-rpe7 to-rpe9">
          <i className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-foreground" style={{ left: pos + "%" }} />
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
          Repère de population, calculé à partir de ta taille et de ton poids. Il ne fait pas la différence entre le muscle et la graisse : chez quelqu&apos;un qui s&apos;entraîne depuis plusieurs années, il surestime presque toujours. Le programme ne s&apos;en sert ni pour tes charges ni pour ton volume.
        </p>
      </div>
    </div>
  );
}
