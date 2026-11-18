"use client";

/* Admin : vue d'ensemble de tous les comptes, réservée aux comptes de la table
   admins (vérifié par le serveur à chaque appel). Lecture seule. */
import { pluriel, tp, tr } from "@/lib/i18n";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CaretRightIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";
import { EnTete } from "@/components/repere/en-tete";
import { Retour } from "@/components/repere/retour";
import { Segmente } from "@/components/repere/segmente";
import { ErreursAdmin } from "@/components/repere/admin-mesure";
import { VueEnsemble } from "@/components/repere/admin-vue";
import type { Route } from "next";
import { basculerDiag, useDiag } from "@/components/repere/diagnostic-ecran";
import { Barres } from "@/components/repere/graphes";
import { Input } from "@/components/ui/input";
import { EX } from "@/lib/data/exercices";
import { TYPES_DEFI, type TypeDefi } from "@/lib/logic/defis";
import { jourDe } from "@/lib/logic/historique";
import { court, filtrer, ilya, jourIso, pl, PLAFOND_IA, resume, tableau, testeurs, type CompteAdmin, type FiltreTesteurs, type StatsAdmin, type Tri } from "@/lib/logic/admin";
import { comptesExclus, statsAdmin, useEstAdmin, utilisateurs } from "@/lib/admin";
import { ARRIERE, AVANT } from "@/lib/nav";
import { cn } from "@/lib/utils";

export default function PageAdmin() {
  return <Suspense><Admin /></Suspense>;
}

function Admin() {
  const router = useRouter();
  const admin = useEstAdmin();
  const params = useSearchParams(), v = params.get("v"), vue = v === "u" || v === "m" ? v : "e";
  const f = params.get("f"), filtre: FiltreTesteurs = f === "seance" || f === "sans" ? f : "tous";
  const [L, setL] = useState<CompteAdmin[] | null>(null);
  const [S, setS] = useState<StatsAdmin | null>(null);
  const [exclus, setExclus] = useState<string[]>([]);
  const [err, setErr] = useState("");
  /* « Compter mes appareils dans les chiffres » : réglage de ce téléphone (éteint par défaut) */
  const [avecMoi, setAvecMoi] = useState(() => { try { return localStorage.getItem(CLE_AVEC_MOI) === "1"; } catch { return false; } });

  useEffect(() => { if (admin === false) router.replace("/profil", ARRIERE); }, [admin, router]);
  useEffect(() => {
    if (!admin) return;
    Promise.all([utilisateurs(), statsAdmin(), comptesExclus()]).then(([l, s, x]) => { setL(l); setS(s); setExclus(x); }).catch((e) => setErr((e as Error).message));
  }, [admin]);
  const changerAvecMoi = (x: boolean) => { setAvecMoi(x); try { localStorage.setItem(CLE_AVEC_MOI, x ? "1" : "0"); } catch {} };

  return (
    <>
      <EnTete surtitre={tr("Réservé à l'admin")} titre={tr("Admin")} gauche={<Retour repli="/profil" />} />
      <div className="flex flex-col gap-4 px-4 pb-10">
        <Segmente label={tr("Vue")} valeur={vue} onChange={(x) => router.replace(x === "u" ? "/admin?v=u" : x === "m" ? "/admin?v=m" : "/admin")}
          options={[{ v: "e", n: tr("Vue d'ensemble") }, { v: "u", n: tr("Testeurs") }, { v: "m", n: tr("Technique") }]} />
        {err && <p className="rounded-2xl bg-card p-4 text-[14px] text-destructive">{err}</p>}
        {!err && (!L || !S) && <p className="py-10 text-center text-[14px] text-muted-foreground">{tr("Chargement…")}</p>}
        {L && S && vue === "e" && <VueEnsemble L={L} S={S} exclus={exclus} avecMoi={avecMoi} plus={<Tableau L={L} S={S} />} />}
        {L && vue === "u" && <Utilisateurs L={L} exclus={exclus} filtre={filtre} />}
        {admin && vue === "m" && (
          <>
            <ErreursAdmin />
            {S && <CarteIA S={S} />}
            {admin && <InterrupteurDiag />}
            <label className="flex items-center gap-3 rounded-[22px] bg-card p-4">
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold">{tr("Compter mes appareils dans les chiffres")}</span>
                <span className="block text-[12.5px] leading-snug text-muted-foreground">{avecMoi ? tr("Activé : tes visites, tes séances et tes comptes de test comptent dans la Vue d'ensemble.") : tr("Désactivé : tes visites, tes séances et tes comptes de test ne faussent pas la Vue d'ensemble.")}</span>
              </span>
              <input type="checkbox" checked={avecMoi} onChange={(e) => changerAvecMoi(e.target.checked)} className="size-5 accent-[var(--plate)]" />
            </label>
          </>
        )}
      </div>
    </>
  );
}
const CLE_AVEC_MOI = "repere.admin.avecMoi";

/* Génération par IA (onglet Technique). */
function CarteIA({ S }: { S: StatsAdmin }) {
  const [auj] = useState(() => jourDe(Date.now()));
  const iaJour = S.generations.find((g) => g.jour === auj)?.n || 0;
  const ia = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 29 + i);
    const j = jourDe(d.getTime());
    return { x: court(j), y: S.generations.find((g) => g.jour === j)?.n || 0 };
  }), [S]);
  return (
    <Carte titre={tr("Génération par IA")}>
      <div className="grid grid-cols-2 gap-2">
        <Chiffre v={`${iaJour}/${PLAFOND_IA}`} n={tr("aujourd'hui")} d={tr("plafond quotidien")} />
        <Chiffre v={ia.reduce((n, x) => n + x.y, 0)} n={tr("sur 30 jours")} d={tr("{a} en cache", { a: pl(S.cache, tr("programme")) })} />
      </div>
      <div className="mt-3"><Barres valeurs={ia} unite={tr("générations")} hauteur={100} /></div>
    </Carte>
  );
}

/* Diagnostic d'affichage de l'iPhone (barres fixes décalées après une saisie) : sur ce téléphone seulement. */
function InterrupteurDiag() {
  const actif = useDiag((s) => s.actif);
  return (
    <label className="flex items-center gap-3 rounded-[22px] bg-card p-4">
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold">{tr("Diagnostic d'affichage")}</span>
        <span className="block text-[12.5px] leading-snug text-muted-foreground">{tr("Affiche les mesures de l'écran sur ce téléphone, pour le bug des barres décalées. Toucher le panneau copie les mesures.")}</span>
      </span>
      <input type="checkbox" checked={actif} onChange={(e) => basculerDiag(e.target.checked)} className="size-5 accent-[var(--plate)]" />
    </label>
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
  const actifs = S.defis.filter((d) => d.fin >= auj && d.debut <= auj);
  return (
    <>
      <Carte titre={tr("Utilisateurs")}>
        <div className="grid grid-cols-2 gap-2">
          <Chiffre v={T.total} n={tr("comptes")} d={tr("{a} avec adresse · {b} sans", { a: T.avecMail, b: T.anonymes })} />
          <Chiffre v={T.actifs7} n={tr("actifs sur 7 jours")} d={tr("{a} sur 30 jours", { a: T.actifs30 })} />
          <Chiffre v={T.nouveaux7} n={tr("nouveaux sur 7 jours")} d={`${T.nouveaux30} sur 30 jours`} />
          <Chiffre v={T.semaines.at(-1)?.seances ?? 0} n={tr("séances cette semaine")} d={tp(T.semaines.at(-1)?.comptes ?? 0, "{n} compte actif", "{n} comptes actifs")} />
        </div>
      </Carte>
      <Carte titre={tr("Séances par semaine, tous comptes")}>
        <Barres valeurs={T.semaines.map((s) => ({ x: court(s.lundi), y: s.seances }))} unite={tr("séances")} />
      </Carte>
      <Carte titre={tr("Usage des fonctions (comptes)")}>
        {T.usage.map((u) => <Jauge key={u.k} n={u.n} v={u.comptes} max={T.total} d={`/ ${T.total}`} />)}
      </Carte>
      <Carte titre={tr("Exercices les plus faits")}>
        {T.topEx.length ? T.topEx.map((e) => (
          <Jauge key={e.id} n={EX[e.id]?.n || e.id} v={e.seances} max={T.topEx[0].seances} d={`${tr(pluriel(e.seances) ? "séances" : "séance")} · ${pl(e.comptes, tr("compte"))}`} />
        )) : <p className="text-[14px] text-muted-foreground">{tr("Aucune séance enregistrée.")}</p>}
      </Carte>
      <div className="grid gap-5 sm:grid-cols-2">
        <Carte titre={tr("Objectifs")}>{T.objectifs.map(([n, v]) => <Jauge key={n} n={n} v={v} max={T.total} />)}</Carte>
        <Carte titre={tr("Matériel")}>{T.materiel.map(([n, v]) => <Jauge key={n} n={n} v={v} max={T.total} />)}</Carte>
      </div>
      <Carte titre={tr("Défis · {length} en cours sur {length1}", { length: actifs.length, length1: S.defis.length })}>
        {S.defis.length ? S.defis.slice(0, 15).map((d) => (
          <div key={d.code} className="flex items-center justify-between gap-3 border-t border-border/60 py-2 text-[14px] first:border-t-0">
            <span className="min-w-0">
              <span className="block truncate font-medium">{d.nom}</span>
              <span className="text-[12.5px] text-muted-foreground">
                {TYPES_DEFI[d.type as TypeDefi]?.nom || d.type} · {d.cible} {TYPES_DEFI[d.type as TypeDefi]?.unite || ""} · {court(d.debut)} → {court(d.fin)}
              </span>
            </span>
            <span className="num shrink-0 text-[13px] text-muted-foreground">{d.participants}{" "}{tr("pers.")}</span>
          </div>
        )) : <p className="text-[14px] text-muted-foreground">{tr("Aucun défi.")}</p>}
      </Carte>
      <Carte titre={tr("Séances partagées · {partages}", { partages: S.partages })}>
        {S.partages_recents.length ? S.partages_recents.map((p, i) => (
          <div key={i} className="flex justify-between gap-3 border-t border-border/60 py-1.5 text-[14px] first:border-t-0">
            <span className="truncate">{p.nom}</span><span className="shrink-0 text-muted-foreground">{jourIso(p.cree) ? court(jourIso(p.cree)!) : "—"}</span>
          </div>
        )) : <p className="text-[14px] text-muted-foreground">{tr("Aucune séance partagée.")}</p>}
      </Carte>
    </>
  );
}

function Utilisateurs({ L, exclus, filtre }: { L: CompteAdmin[]; exclus: string[]; filtre: FiltreTesteurs }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [tri, setTri] = useState<Tri>("activite");
  const [moi, setMoi] = useState(false);
  const base = useMemo(() => (moi ? L.filter((c) => exclus.includes(c.id)) : testeurs(L, exclus, filtre)), [L, exclus, filtre, moi]);
  const l = useMemo(() => filtrer(base, q, tri), [base, q, tri]);
  const nb = (f: FiltreTesteurs) => testeurs(L, exclus, f).length;
  const puce = (on: boolean) => cn("rounded-full px-3 py-1.5 text-[13px] font-semibold", on ? "bg-foreground text-background" : "bg-card text-muted-foreground");
  const choisir = (f: FiltreTesteurs) => () => { setMoi(false); router.replace((f === "tous" ? "/admin?v=u" : `/admin?v=u&f=${f}`) as Route); };
  return (
    <>
      <div className="relative">
        <MagnifyingGlassIcon className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr("Surnom ou adresse")} aria-label={tr("Rechercher un utilisateur")} className="h-11 rounded-xl pl-10" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button onClick={choisir("tous")} className={puce(!moi && filtre === "tous")}>{tr("Tous · {n}", { n: nb("tous") })}</button>
        <button onClick={choisir("seance")} className={puce(!moi && filtre === "seance")}>{tr("Ont fait une séance · {n}", { n: nb("seance") })}</button>
        <button onClick={choisir("sans")} className={puce(!moi && filtre === "sans")}>{tr("Pas encore · {n}", { n: nb("sans") })}</button>
        {exclus.length > 0 && <button onClick={() => setMoi(true)} className={puce(moi)}>{tr("Mes comptes · {n}", { n: L.filter((c) => exclus.includes(c.id)).length })}</button>}
      </div>
      <Segmente label={tr("Trier par")} valeur={tri} onChange={setTri}
        options={[{ v: "activite", n: tr("Activité") }, { v: "inscription", n: tr("Inscription") }, { v: "seances", n: tr("Séances") }]} />
      <p className="px-1 text-[12.5px] text-muted-foreground">{moi ? tr("Tes comptes et tes comptes de test : ils ne comptent pas dans les chiffres.") : tr("Sans tes comptes ni tes comptes de test. Touche un testeur pour voir sa fiche.")}</p>
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
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[15px] font-semibold">{c.pseudo || tr("Sans surnom")}</span>
                  {c.programme && <span className="shrink-0 rounded-full bg-plate-soft px-2 py-0.5 text-[11px] font-semibold text-plate-ink">{tr("8 sem.")}</span>}
                </span>
                <span className="block truncate text-[12.5px] text-muted-foreground">{c.email || tr("Sans adresse")}</span>
                <span className="block truncate text-[12.5px] text-muted-foreground">{tr("{seances} séance{a} · actif {a1}{a2}{a3}", { seances: r.seances, a: pluriel(r.seances) ? "s" : "", a1: ilya(r.derniere), a2: r.plan ? ` · ${r.plan}` : "", a3: r.course ? tr(" · course") : "" })}</span>
              </span>
              <CaretRightIcon className="size-4 shrink-0 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </>
  );
}
