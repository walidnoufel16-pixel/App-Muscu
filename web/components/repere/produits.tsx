"use client";

/* Produits du commerce dans le suivi des protéines : on cherche par nom, on tape ou on scanne le
   code-barres, on choisit la quantité, et les protéines s'ajoutent au jour. Le produit est gardé
   dans « Mes produits » (sans réseau ensuite). Logique dans lib/logic/produits.ts. */
import { tr } from "@/lib/i18n";
import { useEffect, useRef, useState } from "react";
import { ArrowLeftIcon, BarcodeIcon, MagnifyingGlassIcon, MinusIcon, PlusIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { chercherProduits, codeValide, produitParCode, protDe } from "@/lib/logic/produits";
import type { Produit } from "@/lib/logic/types";
import { tactile } from "@/lib/repos";
import { cn } from "@/lib/utils";

const nb = (x: number) => String(x).replace(".", ",");

/** Recherche : un nom, ou les chiffres d'un code-barres ; puis la liste des produits trouvés. */
export function ChercherProduit({ onChoisir, onScanner, onRetour, q0 = "", erreur0 }: { onChoisir: (p: Produit) => void; onScanner: () => void; onRetour: () => void; q0?: string; erreur0?: string }) {
  const [q, setQ] = useState(q0);
  const [etat, setEtat] = useState<{ l?: Produit[]; charge?: boolean; erreur?: string }>({ erreur: erreur0 });
  const chercher = async () => {
    const t = q.trim();
    if (t.length < 2) return;
    tactile(6);
    setEtat({ charge: true });
    try {
      if (/^\d[\d\s]{6,}$/.test(t)) {
        if (!codeValide(t)) return setEtat({ erreur: tr("Ce code-barres n'est pas valide : vérifie les chiffres.") });
        const p = await produitParCode(t);
        return p ? onChoisir(p) : setEtat({ erreur: tr("Produit introuvable, ou sans protéines indiquées. Essaie avec son nom.") });
      }
      const l = await chercherProduits(t);
      setEtat(l.length ? { l } : { erreur: tr("Aucun produit trouvé. Essaie un autre nom.") });
    } catch {
      setEtat({ erreur: navigator.onLine ? tr("Le service ne répond pas. Réessaie dans un instant.") : tr("Pas de connexion : la recherche demande internet. Tes produits enregistrés restent disponibles.") });
    }
  };
  return (
    <div>
      <button onClick={onRetour} className="-ml-1 flex items-center gap-1.5 py-1 text-[14px] font-medium text-muted-foreground"><ArrowLeftIcon className="size-4" />{tr("Retour")}</button>
      <h3 className="mt-1 text-[19px] font-bold">{tr("Trouver un produit")}</h3>
      <div className="mt-3 flex gap-2">
        <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl bg-muted px-3 focus-within:ring-2 focus-within:ring-success">
          <MagnifyingGlassIcon className="size-4 shrink-0 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && chercher()} enterKeyHint="search" autoFocus
            placeholder={tr("Nom ou code-barres")} aria-label={tr("Nom ou code-barres du produit")} className="min-w-0 flex-1 bg-transparent text-[15px] outline-none" />
        </label>
        <Button variant="soft" className="h-11 rounded-xl" disabled={q.trim().length < 2 || etat.charge} onClick={chercher}>{tr("Chercher")}</Button>
      </div>
      <button onClick={onScanner} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2.5 text-[14px] font-medium active:bg-muted">
        <BarcodeIcon className="size-5" />{tr("Scanner le code-barres")}
      </button>
      {etat.charge && <p className="mt-4 text-center text-[13.5px] text-muted-foreground">{tr("Recherche…")}</p>}
      {etat.erreur && <p className="mt-4 rounded-xl bg-muted/70 px-3.5 py-3 text-[13.5px] leading-snug">{etat.erreur}</p>}
      {etat.l && (
        <ul className="mt-3 overflow-hidden rounded-[18px] bg-card" aria-label={tr("Produits trouvés")}>
          {etat.l.map((p) => (
            <li key={p.code ?? p.n + p.marque} className="border-t border-border/60 first:border-t-0">
              <button onClick={() => { tactile(5); onChoisir(p); }} className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left active:bg-muted">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-medium">{p.n}</span>
                  <span className="block truncate text-[12px] text-muted-foreground">{[p.marque, p.kcal != null ? tr("{k} kcal", { k: Math.round(p.kcal) }) : ""].filter(Boolean).join(" · ")}</span>
                </span>
                <span className="num shrink-0 text-[13.5px] font-bold text-success">{tr("{p} g / 100 g", { p: nb(p.p) })}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 px-1 text-[11.5px] leading-relaxed text-muted-foreground">{tr("Données Open Food Facts, remplies par ses contributeurs : vérifie les valeurs, tu peux les corriger avant d'ajouter.")}</p>
    </div>
  );
}

/** Quantité : portion ou grammes, valeurs pour 100 g (corrigeables), puis « Ajouter ». */
export function QuantiteProduit({ produit, onAjouter, onRetour }: { produit: Produit; onAjouter: (g: number, p: Produit) => void; onRetour: () => void }) {
  const [g, setG] = useState(produit.portion ?? 100);
  const [p100, setP100] = useState(nb(produit.p));
  const corrige = parseFloat(p100.replace(",", "."));
  const prod = { ...produit, p: Number.isFinite(corrige) && corrige >= 0 && corrige <= 100 ? corrige : produit.p };
  const prot = protDe(prod, g);
  const choix = [...new Set([produit.portion, 100, 30, 200].filter((x): x is number => !!x))].slice(0, 4);
  return (
    <div>
      <button onClick={onRetour} className="-ml-1 flex items-center gap-1.5 py-1 text-[14px] font-medium text-muted-foreground"><ArrowLeftIcon className="size-4" />{tr("Retour")}</button>
      <h3 className="mt-1 text-[19px] leading-tight font-bold">{produit.n}</h3>
      {produit.marque && <p className="text-[13px] text-muted-foreground">{produit.marque}</p>}
      <div className="mt-4 flex items-center justify-center gap-4">
        <button aria-label={tr("10 g de moins")} disabled={g <= 10} onClick={() => setG(g - 10)} className="grid size-11 place-items-center rounded-full bg-muted disabled:opacity-40"><MinusIcon className="size-5" weight="bold" /></button>
        <span className="text-center">
          <span className="num block text-[40px] leading-none font-bold">{g}<span className="text-[18px] text-muted-foreground">{" "}{tr("g")}</span></span>
          <span className="text-[12.5px] text-muted-foreground">{tr("quantité mangée")}</span>
        </span>
        <button aria-label={tr("10 g de plus")} disabled={g >= 2000} onClick={() => setG(g + 10)} className="grid size-11 place-items-center rounded-full bg-muted disabled:opacity-40"><PlusIcon className="size-5" weight="bold" /></button>
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {choix.map((x) => (
          <button key={x} aria-pressed={g === x} onClick={() => setG(x)} className={cn("h-8 rounded-full border px-3 text-[13px] font-medium", g === x ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground")}>
            {x === produit.portion ? tr("1 portion ({g} g)", { g: x }) : tr("{g} g", { g: x })}
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-2xl bg-card p-3.5">
        <p className="eyebrow">{tr("Pour 100 g")}</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <label htmlFor="p100" className="text-[14px] font-medium">{tr("Protéines")}</label>
          <span className="flex items-center gap-1.5">
            <input id="p100" inputMode="decimal" value={p100} onChange={(e) => setP100(e.target.value.replace(/[^\d.,]/g, ""))}
              className="num h-9 w-16 rounded-lg bg-muted px-2 text-right text-[15px] font-semibold outline-none focus:ring-2 focus:ring-success" />
            <span className="text-[13px] text-muted-foreground">{tr("g")}</span>
          </span>
        </div>
        {(produit.kcal != null || produit.g != null || produit.l != null) && (
          <p className="mt-1.5 text-[12.5px] text-muted-foreground">
            {[produit.kcal != null && tr("{k} kcal", { k: Math.round(produit.kcal) }), produit.g != null && tr("{g} g de glucides", { g: nb(produit.g) }), produit.l != null && tr("{l} g de lipides", { l: nb(produit.l) })].filter(Boolean).join(" · ")}
          </p>
        )}
      </div>
      <Button variant="plate" size="lg" className="mt-4 w-full rounded-xl bg-success text-white" onClick={() => { tactile(10); onAjouter(prot, prod); }}>
        {tr("Ajouter {p} g de protéines", { p: prot })}
      </Button>
    </div>
  );
}

/* lecteur de codes-barres : celui du navigateur s'il sait lire les EAN (Android), sinon zxing,
   servi par l'app (public/zxing, scripts/zxing.mjs) et chargé à la demande */
type Lecteur = { detect: (s: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e"];
async function lecteur(): Promise<Lecteur> {
  const Natif = (window as Window & { BarcodeDetector?: { new (o: { formats: string[] }): Lecteur; getSupportedFormats: () => Promise<string[]> } }).BarcodeDetector;
  if (Natif && (await Natif.getSupportedFormats()).includes("ean_13")) return new Natif({ formats: FORMATS });
  const { BarcodeDetector, prepareZXingModule } = await import("barcode-detector/ponyfill");
  prepareZXingModule({ overrides: { locateFile: (p: string, prefix: string) => (p.endsWith(".wasm") ? `/zxing/${p}` : prefix + p) } });
  return new BarcodeDetector({ formats: FORMATS as never });
}

/** Scanner plein écran : la caméra arrière, un cadre, et le premier code-barres valide lu. */
export function Scanner({ ouvert, onCode, onClose }: { ouvert: boolean; onCode: (code: string) => void; onClose: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  useEffect(() => {
    if (!ouvert) return;
    let fini = false, flux: MediaStream | null = null, minuterie = 0;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error(), { name: "NotSupportedError" });
        flux = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
        if (fini) return flux.getTracks().forEach((t) => t.stop());
        const v = video.current!;
        v.srcObject = flux;
        await v.play();
        const l = await lecteur();
        const lire = async () => {
          if (fini) return;
          try {
            if (v.readyState >= 2) {
              const code = (await l.detect(v)).map((r) => r.rawValue).find((c) => codeValide(c));
              if (code && !fini) { fini = true; tactile(12); return onCode(code); }
            }
          } catch {}
          minuterie = window.setTimeout(lire, 200);
        };
        lire();
      } catch (e) {
        const n = (e as Error).name;
        setErreur(n === "NotAllowedError" ? tr("La caméra est refusée. Autorise-la dans les réglages du téléphone (Safari › Caméra), ou tape le code-barres.")
          : n === "NotFoundError" || n === "NotSupportedError" ? tr("Pas de caméra disponible ici. Tape les chiffres du code-barres.")
          : tr("Le scanner n'a pas pu démarrer. Tape les chiffres du code-barres."));
      }
    })();
    return () => { fini = true; clearTimeout(minuterie); flux?.getTracks().forEach((t) => t.stop()); };
  }, [ouvert, onCode]);
  /* le message d'erreur s'efface à la fermeture : le prochain scan repart de zéro */
  const fermer = () => { setErreur(null); onClose(); };
  return (
    <Dialog open={ouvert} onOpenChange={(o) => !o && fermer()}>
      <DialogContent showCloseButton={false} className="flex h-dvh max-h-dvh w-screen max-w-none flex-col items-center justify-center gap-4 rounded-none border-0 bg-black p-0 text-white sm:max-w-none">
        <DialogTitle className="sr-only">{tr("Scanner un code-barres")}</DialogTitle>
        <DialogDescription className="sr-only">{tr("Vise le code-barres du produit avec la caméra arrière.")}</DialogDescription>
        <video ref={video} playsInline muted className="absolute inset-0 size-full object-cover" />
        {/* cadre de visée */}
        <div aria-hidden className="relative h-40 w-[78%] max-w-[340px] rounded-2xl border-2 border-white/90 shadow-[0_0_0_100vmax_rgba(0,0,0,.45)]" />
        <p className="relative px-6 text-center text-[15px] font-medium">{erreur ?? tr("Vise le code-barres")}</p>
        <button onClick={fermer} aria-label={tr("Fermer le scanner")} autoFocus
          className="absolute top-[max(env(safe-area-inset-top),14px)] right-4 grid size-11 place-items-center rounded-full bg-white/15 backdrop-blur active:scale-90">
          <XIcon className="size-5" weight="bold" />
        </button>
      </DialogContent>
    </Dialog>
  );
}
