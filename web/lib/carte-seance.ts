/* Carte « Séance terminée » au format story (1080 × 1920), dessinée sur le téléphone pour être
   partagée (Instagram, WhatsApp…). Même principe que l'image du bilan du mois (app/progres/bilan). */
import { tr } from "@/lib/i18n";

export type CarteSeance = { titre: string; jour: string; cases: { n: string; v: number | string }[]; semaine?: string; serie?: string };

const chargerImage = (src: string) =>
  new Promise<HTMLImageElement | null>((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

/* rectangle aux coins arrondis */
function arrondi(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}

export async function imageSeance(c: CarteSeance): Promise<Blob | null> {
  const W = 1080, H = 1920, cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const g = cv.getContext("2d");
  if (!g) return null;
  const police = getComputedStyle(document.body).fontFamily;
  const chiffres = getComputedStyle(document.body).getPropertyValue("--font-chiffres").trim() || police;
  const fond = g.createRadialGradient(W * 0.8, 0, 0, W * 0.8, 0, H * 0.95);
  fond.addColorStop(0, "#7068ff"); fond.addColorStop(0.45, "#4f46e5"); fond.addColorStop(1, "#2f2899");
  g.fillStyle = fond; g.fillRect(0, 0, W, H);
  const texte = (t: string, x: number, y: number, taille: number, poids = 700, alpha = 1, fam = police) => {
    g.globalAlpha = alpha; g.font = `${poids} ${taille}px ${fam}`; g.fillText(t, x, y); g.globalAlpha = 1;
  };
  /* le disque du logo, en grand et en filigrane (comme le bilan du mois) */
  g.lineCap = "round"; g.lineWidth = 120;
  g.strokeStyle = "rgba(255,255,255,.08)"; g.beginPath(); g.arc(W - 120, H - 420, 420, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = "rgba(255,255,255,.16)"; g.beginPath(); g.arc(W - 120, H - 420, 420, -Math.PI / 2, Math.PI); g.stroke();
  g.fillStyle = "#fff";
  /* logo et nom */
  const logo = await chargerImage("/icon-192.png");
  if (logo) { g.save(); arrondi(g, 78, 100, 84, 84, 20); g.clip(); g.drawImage(logo, 78, 100, 84, 84); g.restore(); }
  texte(tr("Oxa"), 186, 158, 44, 600);
  /* titre */
  texte(`${tr("Séance terminée")} · ${c.jour}`.toUpperCase(), 78, 420, 34, 600, 0.75);
  g.font = `900 104px ${police}`;
  const mots = c.titre.split(" "), lignes: string[] = [];
  for (const m of mots) { const l = lignes.at(-1); if (l && g.measureText(l + " " + m).width < W - 156) lignes[lignes.length - 1] = l + " " + m; else lignes.push(m); }
  let y = 540;
  for (const l of lignes.slice(0, 2)) { texte(l, 78, y, 104, 900); y += 110; }
  /* quatre cases */
  /* une case à zéro (aucun record) n'a rien à montrer sur une story */
  const pleines = c.cases.filter((k) => k.v !== 0), cases = (pleines.length >= 2 ? pleines : c.cases).slice(0, 4), cw = (W - 156 - 30) / 2, ch = 300;
  y += 30;
  cases.forEach((k, i) => {
    const x = 78 + (i % 2) * (cw + 30), yy = y + Math.floor(i / 2) * (ch + 30);
    g.fillStyle = "rgba(255,255,255,.13)"; arrondi(g, x, yy, cw, ch, 54); g.fill();
    g.fillStyle = "#fff";
    texte(String(k.v), x + 44, yy + 170, 140, 800, 1, chiffres);
    texte(k.n, x + 44, yy + 238, 38, 500, 0.85);
  });
  y += Math.ceil(cases.length / 2) * (ch + 30) + 20;
  if (c.semaine) { texte(c.semaine, 78, y + 40, 44, 600); y += 80; }
  if (c.serie) texte(`🔥 ${c.serie}`, 78, y + 40, 44, 500, 0.95);
  /* pied : l'adresse de l'app */
  g.font = `600 38px ${police}`;
  const essai = tr("Essaie gratuitement"), lb = g.measureText(essai).width + 96;
  g.fillStyle = "rgba(255,255,255,.16)"; arrondi(g, W - 78 - lb, H - 200, lb, 96, 48); g.fill();
  g.fillStyle = "#fff";
  texte(essai, W - 78 - lb + 48, H - 138, 38, 600);
  texte(location.host, 78, H - 138, 38, 600);
  return new Promise((ok) => cv.toBlob((b) => ok(b), "image/png"));
}

/** Partage l'image (feuille de partage du téléphone), ou la télécharge si le partage de fichiers n'existe pas. */
export async function partagerImage(b: Blob, nom: string, titre: string) {
  const f = new File([b], nom, { type: "image/png" });
  try {
    if (navigator.canShare?.({ files: [f] })) await navigator.share({ files: [f], title: titre });
    else { const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = nom; a.click(); }
  } catch {}
}
