"use client";

/* Défis entre amis (onglet Progrès) : mes défis, créer, rejoindre avec un code,
   classement et partage du code. */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CaretRightIcon, CrownSimpleIcon, FlagCheckeredIcon, PlusIcon, ShareNetworkIcon, SignInIcon, UsersThreeIcon } from "@phosphor-icons/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { FeuillePartage, type Partage } from "./feuille-partage";
import { Segmente } from "./segmente";
import { useDefis } from "@/lib/defis";
import { joursRestants, termine, TYPES_DEFI, type Defi, type TypeDefi } from "@/lib/logic/defis";
import { useRepere } from "@/lib/store";
import { AVANT } from "@/lib/nav";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

const val = (d: Pick<Defi, "type">, v: number) =>
  d.type === "tonnage" ? (v >= 1000 ? `${(Math.round(v / 100) / 10).toLocaleString("fr-FR")} t` : `${v} kg`)
    : d.type === "seances" ? `${v} séance${v > 1 ? "s" : ""}` : `${v} ${TYPES_DEFI[d.type].unite}`;

export function SectionDefis({ ouvrirCode }: { ouvrirCode?: string | null }) {
  const router = useRouter();
  const user = useRepere((s) => s.user);
  const suivis = useRepere((s) => s.etat.A.defis as string[] | undefined);
  const codes = suivis || [];
  const { liste, charge, rafraichir, rejoindre } = useDefis();
  const [vu, setVu] = useState<string | null>(null);
  const [creation, setCreation] = useState(false);
  const [saisie, setSaisie] = useState<string | null>(null);
  const [partage, setPartage] = useState<Partage | null>(null);
  useEffect(() => { if (user) rafraichir(); }, [user, rafraichir]);
  /* ?d=CODE : on arrive d'un lien de défi */
  useEffect(() => {
    if (!ouvrirCode || !user) return;
    rejoindre(ouvrirCode).then((r) => {
      if (r.erreur) toast.error(r.erreur);
      else if (r.defi) { toast.success(`Tu participes à « ${r.defi.nom} »`); setVu(r.defi.code); }
    });
  }, [ouvrirCode, user, rejoindre]);

  const defis = codes.map((c) => liste[c]).filter(Boolean).sort((a, b) => +termine(a) - +termine(b) || (a.fin < b.fin ? -1 : 1));
  const d = vu ? liste[vu] : null;
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2 className="eyebrow">Défis entre amis</h2>
        {user && <button onClick={() => setSaisie("")} className="text-[13px] font-semibold text-plate-ink">Rejoindre</button>}
      </div>
      {!user ? (
        <button onClick={() => router.push("/profil", AVANT)} className="flex w-full items-center gap-3 rounded-[20px] border border-dashed border-border bg-card p-4 text-left">
          <UsersThreeIcon className="size-7 shrink-0 text-plate" weight="duotone" />
          <span className="flex-1 text-[13.5px] leading-snug"><b className="block text-[15px]">Défie tes amis</b>Les défis demandent un compte : crée-le dans Profil, c&apos;est gratuit.</span>
          <CaretRightIcon className="size-4 text-muted-foreground" />
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          {defis.map((x) => <CarteDefi key={x.code} d={x} onClick={() => setVu(x.code)} />)}
          {charge && codes.length > 0 && !defis.length && <p className="px-1 text-[13px] text-muted-foreground">Chargement des défis impossible pour l&apos;instant (hors ligne ?).</p>}
          <button onClick={() => setCreation(true)} className="flex items-center justify-center gap-2 rounded-[20px] border border-dashed border-plate/50 bg-plate-soft/40 p-3.5 text-[15px] font-semibold text-plate-ink active:scale-[.99]">
            <PlusIcon className="size-4" weight="bold" />Créer un défi
          </button>
        </div>
      )}

      <Drawer open={!!d} onOpenChange={(o) => !o && setVu(null)}>
        <DrawerContent>{d && <Detail d={d} onPartager={() => setPartage({ nom: d.nom, code: d.code, defi: true })} onFermer={() => setVu(null)} />}</DrawerContent>
      </Drawer>
      <Drawer open={creation} onOpenChange={setCreation} repositionInputs>
        <DrawerContent>{creation && <Creation onCree={(code) => { setCreation(false); const x = useDefis.getState().liste[code]; if (x) setPartage({ nom: x.nom, code, defi: true }); }} />}</DrawerContent>
      </Drawer>
      <Drawer open={saisie !== null} onOpenChange={(o) => !o && setSaisie(null)} repositionInputs>
        <DrawerContent>
          <div className="px-5 pt-2 pb-[max(env(safe-area-inset-bottom),20px)]">
            <DrawerTitle className="text-[20px] font-bold">Rejoindre un défi</DrawerTitle>
            <DrawerDescription className="mt-0.5 text-[13px] text-muted-foreground">Saisis le code de cinq caractères qu&apos;on t&apos;a envoyé.</DrawerDescription>
            <input autoFocus value={saisie || ""} onChange={(e) => setSaisie(e.target.value.toUpperCase())} maxLength={5} aria-label="Code du défi" placeholder="ABCDE"
              className="num mt-4 h-16 w-full rounded-2xl border bg-background text-center text-[34px] font-bold tracking-[0.3em] uppercase outline-none focus:border-plate" />
            <Button variant="plate" size="xl" className="mt-3 w-full" disabled={(saisie || "").length !== 5} onClick={async () => {
              const r = await rejoindre(saisie || "");
              if (r.erreur) { toast.error(r.erreur); return; }
              setSaisie(null);
              if (r.defi) { toast.success(`Tu participes à « ${r.defi.nom} »`); setVu(r.defi.code); }
            }}><SignInIcon weight="bold" />Rejoindre</Button>
          </div>
        </DrawerContent>
      </Drawer>
      <FeuillePartage partage={partage} onClose={() => setPartage(null)} />
    </section>
  );
}

function CarteDefi({ d, onClick }: { d: Defi; onClick: () => void }) {
  const moi = d.participants.find((p) => p.moi), rang = d.participants.findIndex((p) => p.moi) + 1, fini = termine(d);
  const p = Math.min(1, (moi?.score || 0) / d.cible), j = joursRestants(d);
  return (
    <button onClick={onClick} className={cn("rounded-[20px] border border-border/80 bg-card p-3.5 text-left active:scale-[.99]", fini && "opacity-70")}>
      <div className="flex items-center gap-2">
        <FlagCheckeredIcon className={cn("size-5 shrink-0", p >= 1 ? "text-success" : "text-plate-ink")} weight="fill" />
        <span className="min-w-0 flex-1 truncate text-[16px] font-semibold">{d.nom}</span>
        <span className="shrink-0 text-[12px] text-muted-foreground">{fini ? "terminé" : `${j} jour${j > 1 ? "s" : ""}`}</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", p >= 1 ? "bg-success" : "bg-plate")} style={{ width: p * 100 + "%" }} /></div>
      <div className="mt-1.5 flex justify-between text-[12.5px] text-muted-foreground">
        <span><b className="text-foreground">{val(d, moi?.score || 0)}</b> sur {val(d, d.cible)}</span>
        <span>{rang ? `${rang}${rang === 1 ? "er" : "e"} sur ${d.participants.length}` : ""}</span>
      </div>
    </button>
  );
}

function Detail({ d, onPartager, onFermer }: { d: Defi; onPartager: () => void; onFermer: () => void }) {
  const quitter = useDefis((s) => s.quitter);
  const fini = termine(d), j = joursRestants(d);
  const max = Math.max(d.cible, ...d.participants.map((p) => p.score));
  return (
    <div className="max-h-[80vh] overflow-y-auto px-5 pt-2 pb-[max(env(safe-area-inset-bottom),20px)]">
      <div className="eyebrow">{TYPES_DEFI[d.type].nom} · {fini ? "terminé" : `encore ${j} jour${j > 1 ? "s" : ""}`}</div>
      <DrawerTitle className="mt-1 text-[24px] leading-tight font-bold">{d.nom}</DrawerTitle>
      <DrawerDescription className="mt-0.5 text-[13.5px] text-muted-foreground">Objectif : {val(d, d.cible)} · code <b className="num tracking-wider">{d.code}</b></DrawerDescription>
      <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">{TYPES_DEFI[d.type].aide}</p>
      <ol className="mt-4 flex flex-col gap-2">
        {d.participants.map((p, i) => (
          <li key={i} className={cn("rounded-2xl border p-3", p.moi ? "border-plate bg-plate-soft" : "bg-card")}>
            <div className="flex items-center gap-2">
              <span className="num w-6 text-[17px] font-bold text-muted-foreground">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{p.pseudo}{p.moi && <span className="font-normal text-muted-foreground"> (toi)</span>}</span>
              {i === 0 && p.score > 0 && <CrownSimpleIcon className="size-4 text-amber-500" weight="fill" />}
              <span className="num text-[16px] font-bold">{val(d, p.score)}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full origin-left animate-[remplir_.7s_ease-out_both] rounded-full", p.score >= d.cible ? "bg-success" : "bg-plate")} style={{ width: (p.score / max) * 100 + "%", animationDelay: i * 70 + "ms" }} />
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-[12px] leading-snug text-muted-foreground">Ton score se met à jour tout seul après chaque séance. Seul le score est partagé, rien d&apos;autre.</p>
      {!fini && <Button variant="plate" size="xl" className="mt-4 w-full" onClick={() => { tactile(8); onPartager(); }}><ShareNetworkIcon weight="bold" />Inviter des amis</Button>}
      <Button variant="ghost" className="mt-1 w-full text-muted-foreground" onClick={async () => { await quitter(d.code); onFermer(); }}>Quitter ce défi</Button>
    </div>
  );
}

function Creation({ onCree }: { onCree: (code: string) => void }) {
  const creer = useDefis((s) => s.creer);
  const [type, setType] = useState<TypeDefi>("seances");
  const [semaines, setSemaines] = useState(4);
  const [cible, setCible] = useState(12);
  const [nom, setNom] = useState("");
  const [occupe, setOccupe] = useState(false);
  const T = TYPES_DEFI[type];
  const choisirType = (t: TypeDefi) => { setType(t); setCible(TYPES_DEFI[t].cibles[2]); };
  return (
    <div className="max-h-[85vh] overflow-y-auto px-5 pt-2 pb-[max(env(safe-area-inset-bottom),20px)]">
      <DrawerTitle className="text-[20px] font-bold">Nouveau défi</DrawerTitle>
      <DrawerDescription className="mt-0.5 text-[13px] text-muted-foreground">Tu recevras un code à envoyer à tes amis.</DrawerDescription>
      <div className="mt-4 flex flex-col gap-3">
        <Segmente label="Type de défi" valeur={type} onChange={choisirType} options={(Object.keys(TYPES_DEFI) as TypeDefi[]).map((t) => ({ v: t, n: TYPES_DEFI[t].nom }))} />
        <p className="-mt-1 px-1 text-[12.5px] leading-snug text-muted-foreground">{T.aide}</p>
        <div>
          <div className="mb-1 text-[12.5px] font-medium text-muted-foreground">Objectif</div>
          <div className="grid grid-cols-5 gap-1.5">
            {T.cibles.map((c) => (
              <button key={c} onClick={() => setCible(c)} aria-pressed={cible === c}
                className={cn("num h-11 rounded-xl border text-[15px] font-bold", cible === c ? "border-plate bg-plate-soft text-plate-ink" : "bg-background")}>
                {type === "tonnage" ? `${c / 1000} t` : c}
              </button>
            ))}
          </div>
        </div>
        <Segmente label="Durée" valeur={semaines} onChange={setSemaines} options={[1, 2, 4, 8].map((s) => ({ v: s, n: `${s} sem.` }))} />
        <input value={nom} onChange={(e) => setNom(e.target.value)} maxLength={60} placeholder={T.exemple(cible, semaines)} aria-label="Nom du défi"
          className="h-12 rounded-xl border bg-background px-3 text-[16px] outline-none focus:border-plate" />
      </div>
      <Button variant="plate" size="xl" className="mt-4 w-full" disabled={occupe} onClick={async () => {
        setOccupe(true);
        const r = await creer(nom.trim() || T.exemple(cible, semaines), type, cible, semaines);
        setOccupe(false);
        if (r.erreur) toast.error(r.erreur); else if (r.code) onCree(r.code);
      }}>Créer le défi</Button>
    </div>
  );
}
