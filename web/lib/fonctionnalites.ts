/* Fonctionnalités mises de côté pour l'instant.
   Le programme sur 8 semaines revient plus tard : l'app se concentre sur les séances libres.
   `localStorage["repere.programme"] = "1"` le rallume (tests, démonstration). */
export function programmeActif() {
  try { return localStorage.getItem("repere.programme") === "1"; } catch { return false; }
}
