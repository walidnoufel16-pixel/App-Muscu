/* iPhone, appli installée : après une saisie au clavier, la partie visible de l'écran peut rester
   décalée par rapport à celle où se placent les éléments fixés en bas (barre de série, repos,
   onglets…), qui « flottent » alors au milieu de l'écran jusqu'à ce qu'on relance l'appli.
   On mesure ce décalage (visualViewport) et on le reporte dans --vv-dy ; la classe .bas-ecran
   (globals.css) décale d'autant ces éléments. Ailleurs, et clavier ouvert, le décalage reste 0. */

const saisie = () => {
  const a = document.activeElement as HTMLElement | null;
  return !!a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.isContentEditable);
};

/** Le décalage, en px, entre le bas visible de l'écran et le bas où se placent les éléments fixes. */
export function decalage(vv: { offsetTop: number; height: number; scale: number }, hauteur: number, clavier: boolean) {
  if (clavier || vv.scale > 1.01) return 0;
  const d = Math.round(vv.offsetTop + vv.height - hauteur);
  return Math.abs(d) < 2 ? 0 : d;
}

export function suivreViewport() {
  const vv = typeof window !== "undefined" ? window.visualViewport : null;
  if (!vv) return () => {};
  let rq = 0, dernier = 0;
  const mesurer = () => {
    rq = 0;
    const d = decalage(vv, document.documentElement.clientHeight, saisie());
    if (d !== dernier) { dernier = d; document.documentElement.style.setProperty("--vv-dy", d + "px"); }
  };
  const plus_tard = () => { if (!rq) rq = requestAnimationFrame(mesurer); };
  /* clavier refermé : iOS met un instant à rendre l'écran ; on remesure pendant l'animation */
  const sortie = () => { [0, 120, 350, 700].forEach((t) => setTimeout(plus_tard, t)); };
  vv.addEventListener("resize", plus_tard);
  vv.addEventListener("scroll", plus_tard);
  window.addEventListener("scroll", plus_tard, { passive: true });
  document.addEventListener("focusout", sortie);
  document.addEventListener("focusin", plus_tard);
  mesurer();
  return () => {
    vv.removeEventListener("resize", plus_tard);
    vv.removeEventListener("scroll", plus_tard);
    window.removeEventListener("scroll", plus_tard);
    document.removeEventListener("focusout", sortie);
    document.removeEventListener("focusin", plus_tard);
    if (rq) cancelAnimationFrame(rq);
  };
}
