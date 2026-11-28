/* « Ma salle », comme le site (web/components/repere/ma-salle.tsx, POSTES et ZONES_SALLE de
   web/lib/data/salle.ts, copiés dans assets/salle.json par outils/exporter-exercices.mjs) : les machines et
   postes par zone, à décocher quand la salle ne les a pas. Rangé dans le même champ du compte que le site,
   A.sansPostes (les postes absents) ; exoFiltre (materiel.dart) retire alors leurs exercices. Logique pure. */

/// Une zone de la salle ; `type` : le matériel dont elle dépend (m0 machines, m1 barre).
class ZoneSalle {
  final String k;
  final String n;
  final String type;
  const ZoneSalle(this.k, this.n, this.type);
}

/// Un poste ; `img` : l'exercice dont la photo l'illustre (sans lui, une icône).
class Poste {
  final String id;
  final String n;
  final String zone;
  final String? img;
  const Poste(this.id, this.n, this.zone, {this.img});
}

class Salle {
  final List<ZoneSalle> zones;
  final List<Poste> postes;
  const Salle(this.zones, this.postes);
  static const vide = Salle([], []);

  factory Salle.depuis(Map<String, dynamic> j) => Salle(
        [for (final z in (j['zones'] as List? ?? const [])) ZoneSalle(z['k'] as String, z['n'] as String, z['type'] as String)],
        [
          for (final p in (j['postes'] as List? ?? const []))
            Poste(p['id'] as String, p['n'] as String, p['zone'] as String, img: p['img'] as String?),
        ],
      );

  /// Les zones visibles selon le matériel coché.
  List<ZoneSalle> zonesPour(List<String> types) => [for (final z in zones) if (types.contains(z.type)) z];

  List<Poste> postesDe(String zone) => [for (final p in postes) if (p.zone == zone) p];

  /// Les postes affichés (leurs id), dans l'ordre.
  List<String> visibles(List<String> types) {
    final z = {for (final x in zonesPour(types)) x.k};
    return [for (final p in postes) if (z.contains(p.zone)) p.id];
  }
}

/// Ce que montre « Ma salle » : machines et postes à barre en salle complète, postes à barre en home gym,
/// rien sinon (comme mon-materiel.tsx).
List<String> typesSalle(int lieu) => lieu == 0 ? const ['m0', 'm1'] : lieu == 1 ? const ['m1'] : const [];

/// Les postes absents de la salle (A.sansPostes).
List<String> postesAbsents(Map<String, dynamic> a) => [for (final p in (a['sansPostes'] as List?) ?? const []) if (p is String) p];

/// Combien des postes affichés sont disponibles.
int postesDispo(Map<String, dynamic> a, List<String> visibles) {
  final sans = postesAbsents(a);
  return visibles.where((id) => !sans.contains(id)).length;
}

Map<String, dynamic> _avecSans(Map<String, dynamic> doc, List<String> Function(List<String> l) changer) {
  final a = Map<String, dynamic>.from((doc['A'] as Map?) ?? const {});
  a['sansPostes'] = changer(postesAbsents(a));
  return {...doc, 'A': a};
}

/// Toucher un poste : absent s'il était là, de retour sinon.
Map<String, dynamic> basculerPoste(Map<String, dynamic> doc, String id) =>
    _avecSans(doc, (l) => l.contains(id) ? [for (final x in l) if (x != id) x] : [...l, id]);

/// « Toutes » (dispo) ou « Aucune » : seuls les postes affichés changent, les autres restent comme ils sont.
Map<String, dynamic> tousLesPostes(Map<String, dynamic> doc, List<String> visibles, bool dispo) => _avecSans(doc, (l) {
      final reste = [for (final x in l) if (!visibles.contains(x)) x];
      return dispo ? reste : [...reste, ...visibles];
    });
