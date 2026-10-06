"use client";

/* Admin : vue d'ensemble de tous les comptes, réservée aux comptes de la table
   admins (vérifié par le serveur à chaque appel). Lecture seule. */
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CaretRightIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { EnTete } from "@/components/repere/en-tete";
import { Retour } from "@/components/repere/retour";
import { Segmente } from "@/components/repere/segmente";
import { Barres } from "@/components/repere/graphes";
import { Input } from "@/components/ui/input";
import { EX } from "@/lib/data/exercices";
import { TYPES_DEFI, type TypeDefi } from "@/lib/logic/defis";
import { jourDe } from "@/lib/logic/historique";
import { court, filtrer, ilya, pl, PLAFOND_IA, resume, tableau, type CompteAdmin, type StatsAdmin, type Tri } from "@/lib/logic/admin";
import { statsAdmin, useEstAdmin, utilisateurs } from "@/lib/admin";
import { ARRIERE, AVANT } from "@/lib/nav";
import { cn } from "@/lib/utils";

export default function PageAdmin() {
  return <Suspense><Admin /></Suspense>;
}

function Admin() {
  const router = useRouter();
  const admin = useEstAdmin();
  const vue = useSearchParams().get("v") === "u" ? "u" : "t";
  const [L, setL] = useState<CompteAdmin[] | null>(null);
  const [S, setS] = useState<StatsAdmin | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => { if (admin === false) router.replace("/profil", ARRIERE); }, [admin, router]);
  useEffect(() => {
    if (!admin) return;
    Promise.all([utilisateurs(), statsAdmin()]).then(([l, s]) => { setL(l); setS(s); }).catch((e) => setErr((e as Error).message));
  }, [admin]);

  return (
    <>
      <EnTete surtitre="Réservé à l'admin" titre="Admin" gauche={<Retour repli="/profil" />} />
      <div className="flex flex-col gap-5 px-4 pb-10">
        <Segmente label="Vue" valeur={vue} onChange={(v) => router.replace(v === "u" ? "/admin?v=u" : "/admin")}
          options={[{ v: "t", n: "Tableau de bord" }, { v: "u", n: "Utilisateurs" }]} />
        {err && <p className="rounded-2xl bg-card p-4 text-[14px] text-destructive">{err}</p>}
        {!err && (!L || !S) && <p className="py-10 text-center text-[14px] text-muted-foreground">Chargement…</p>}
        {L && S && (vue === "t" ? <Tableau L={L} S={S} /> : <Utilisateurs L={L} />)}
      </div>
    </>
  );
}

function Carte({ titre, children, className }: { titre: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[22px] bg-card p-4", className)}>
      <h2 className="eyebrow mb-3">{titre}</h2>
      {children}
    </section>
  );
}
function Chiffre({ v, n, d }: { v: number | string; n: string; d?: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 px-3 py-2.5">
      <div className="num text-[24px] leading-none font-bold">{v}</div>
      <div className="mt-1 text-[12.5px] leading-tight text-muted-foreground">{n}{d && <span className="block">{d}</span>}</div>
    </div>
  );
}
function Jauge({ n, v, max, d }: { n: string; v: number; max: number; d?: string }) {
  return (
    <div className="py-1.5">
      <div className="flex items-baseline justify-between gap-3 text-[14px]">
        <span className="min-w-0 truncate">{n}</span>
        <span className="num shrink-0 font-semibold">{v}{d && <span className="font-normal text-muted-foreground"> {d}</span>}</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-plate" style={{ width: `${max ? Math.round((v / max) * 100) : 0}%` }} />
      </div>
    </div>
  );
}

function Tableau({ L, S }: { L: CompteAdmin[]; S: StatsAdmin }) {
  const [auj] = useState(() => jourDe(Date.now()));
  const T = useMemo(() => tableau(L, auj), [L, auj]);
  const iaJour = S.generations.find((g) => g.jour === auj)?.n || 0;
  const ia = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 29 + i);
    const j = jourDe(d.getTime());
    return { x: court(j), y: S.generations.find((g) => g.jour === j)?.n || 0 };
  }), [S]);
  const actifs = S.defis.filter((d) => d.fin >= auj && d.debut <= auj);
  return (
    <>
      <Carte titre="Utilisateurs">
        <div className="grid grid-cols-2 gap-2">
          <Chiffre v={T.total} n="comptes" d={`${T.avecMail} avec adresse · ${T.anonymes} sans`} />
          <Chiffre v={T.actifs7} n="actifs sur 7 jours" d={`${T.actifs30} sur 30 jours`} />
          <Chiffre v={T.nouveaux7} n="nouveaux sur 7 jours" d={`${T.nouveaux30} sur 30 jours`} />
          <Chiffre v={T.semaines.at(-1)?.seances ?? 0} n="séances cette semaine" d={`${pl(T.semaines.at(-1)?.comptes ?? 0, "compte")} actif${(T.semaines.at(-1)?.comptes ?? 0) > 1 ? "s" : ""}`} />
        </div>
      </Carte>
      <Carte titre="Séances par semaine, tous comptes">
        <Barres valeurs={T.semaines.map((s) => ({ x: court(s.lundi), y: s.seances }))} unite="séances" />
      </Carte>
      <Carte titre="Génération par IA">
        <div className="grid grid-cols-2 gap-2">
          <Chiffre v={`${iaJour}/${PLAFOND_IA}`} n="aujourd'hui" d="plafond quotidien" />
          <Chiffre v={ia.reduce((n, x) => n + x.y, 0)} n="sur 30 jours" d={`${pl(S.cache, "programme")} en cache`} />
        </div>
        <div className="mt-3"><Barres valeurs={ia} unite="générations" hauteur={100} /></div>
      </Carte>
      <Carte titre="Usage des fonctions (comptes)">
        {T.usage.map((u) => <Jauge key={u.k} n={u.n} v={u.comptes} max={T.total} d={`/ ${T.total}`} />)}
      </Carte>
      <Carte titre="Exercices les plus faits">
        {T.topEx.length ? T.topEx.map((e) => (
          <Jauge key={e.id} n={EX[e.id]?.n || e.id} v={e.seances} max={T.topEx[0].seances} d={`${e.seances > 1 ? "séances" : "séance"} · ${pl(e.comptes, "compte")}`} />
        )) : <p className="text-[14px] text-muted-foreground">Aucune séance enregistrée.</p>}
      </Carte>
      <div className="grid gap-5 sm:grid-cols-2">
        <Carte titre="Objectifs">{T.objectifs.map(([n, v]) => <Jauge key={n} n={n} v={v} max={T.total} />)}</Carte>
        <Carte titre="Matériel">{T.materiel.map(([n, v]) => <Jauge key={n} n={n} v={v} max={T.total} />)}</Carte>
      </div>
      <Carte titre={`Défis · ${actifs.length} en cours sur ${S.defis.length}`}>
        {S.defis.length ? S.defis.slice(0, 15).map((d) => (
          <div key={d.code} className="flex items-center justify-between gap-3 border-t border-border/60 py-2 text-[14px] first:border-t-0">
            <span className="min-w-0">
              <span className="block truncate font-medium">{d.nom}</span>
              <span className="text-[12.5px] text-muted-foreground">
                {TYPES_DEFI[d.type as TypeDefi]?.nom || d.type} · {d.cible} {TYPES_DEFI[d.type as TypeDefi]?.unite || ""} · {court(d.debut)} → {court(d.fin)}
              </span>
            </span>
            <span className="num shrink-0 text-[13px] text-muted-foreground">{d.participants} pers.</span>
          </div>
        )) : <p className="text-[14px] text-muted-foreground">Aucun défi.</p>}
      </Carte>
      <Carte titre={`Séances partagées · ${S.partages}`}>
        {S.partages_recents.length ? S.partages_recents.map((p, i) => (
          <div key={i} className="flex justify-between gap-3 border-t border-border/60 py-1.5 text-[14px] first:border-t-0">
            <span className="truncate">{p.nom}</span><span className="shrink-0 text-muted-foreground">{court(jourDe(Date.parse(p.cree)))}</span>
          </div>
        )) : <p className="text-[14px] text-muted-foreground">Aucune séance partagée.</p>}
      </Carte>
    </>
  );
}

function Utilisateurs({ L }: { L: CompteAdmin[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [tri, setTri] = useState<Tri>("activite");
  const l = useMemo(() => filtrer(L, q, tri), [L, q, tri]);
  return (
    <>
      <div className="relative">
        <MagnifyingGlassIcon className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Surnom ou adresse" aria-label="Rechercher un utilisateur" className="h-11 rounded-xl pl-10" />
      </div>
      <Segmente label="Trier par" valeur={tri} onChange={setTri}
        options={[{ v: "activite", n: "Activité" }, { v: "inscription", n: "Inscription" }, { v: "seances", n: "Séances" }]} />
      <p className="px-1 text-[12.5px] text-muted-foreground">{l.length} compte{l.length > 1 ? "s" : ""}</p>
      <div className="overflow-hidden rounded-[22px] bg-card">
        {l.map((c) => {
          const r = resume(c);
          return (
            <button key={c.id} onClick={() => router.push(`/admin/fiche?u=${c.id}`, AVANT)}
              className="flex w-full items-center gap-3 border-t border-border/60 px-4 py-3 text-left first:border-t-0 active:bg-muted">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-plate text-[16px] font-bold text-plate-foreground">
                {(c.pseudo || "?").slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold">{c.pseudo || "Sans surnom"}</span>
                <span className="block truncate text-[12.5px] text-muted-foreground">{c.email || "Sans adresse"}</span>
                <span className="block truncate text-[12.5px] text-muted-foreground">
                  {r.seances} séance{r.seances > 1 ? "s" : ""} · actif {ilya(r.derniere)}{r.plan ? ` · ${r.plan}` : ""}{r.course ? " · course" : ""}
                </span>
              </span>
              <CaretRightIcon className="size-4 shrink-0 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </>
  );
}
