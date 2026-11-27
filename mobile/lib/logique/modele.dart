/* Les données du compte, telles que le site les range dans Supabase (table « etats », colonne
   « etat », un seul document JSON par compte). Reprise de web/lib/logic/types.ts et historique.ts :
   on ne lit ici que ce dont le mode Suivi a besoin, le reste du document est gardé tel quel. */

/// Un exercice d'une séance : identifiant du catalogue, séries, répétitions, repos.
class ExLibre {
  final String id;
  final int s;
  final int r;
  final String p;
  const ExLibre({required this.id, this.s = 0, this.r = 0, this.p = ''});

  factory ExLibre.depuis(Map<String, dynamic> j) => ExLibre(
        id: j['id'] as String? ?? '',
        s: (j['s'] as num?)?.toInt() ?? 0,
        r: (j['r'] as num?)?.toInt() ?? 0,
        p: j['p']?.toString() ?? '',
      );
}

/// Une séance de « Mes séances ».
class SeanceLibre {
  final String nom;
  final List<ExLibre> ex;
  final String? soin;
  final String? street;
  final bool auto;
  const SeanceLibre({required this.nom, this.ex = const [], this.soin, this.street, this.auto = false});

  factory SeanceLibre.depuis(Map<String, dynamic> j) => SeanceLibre(
        nom: j['nom']?.toString() ?? '',
        ex: ((j['ex'] as List?) ?? const [])
            .whereType<Map>()
            .map((e) => ExLibre.depuis(Map<String, dynamic>.from(e)))
            .toList(),
        soin: j['soin'] as String?,
        street: j['street'] as String?,
        auto: j['auto'] == true,
      );
}

/// Une ligne de l'historique : une séance faite, un jour.
/// `ex` : par exercice, [_, _, charge de la meilleure série, répétitions, séries].
class LigneHist {
  final String d;
  final String s;
  final String nom;
  final int? ts;
  final Map<String, List<num>> ex;
  const LigneHist({required this.d, required this.s, this.nom = '', this.ts, this.ex = const {}});

  factory LigneHist.depuis(Map<String, dynamic> j) => LigneHist(
        d: j['d']?.toString() ?? '',
        s: j['s']?.toString() ?? '',
        nom: j['nom']?.toString() ?? '',
        ts: (j['ts'] as num?)?.toInt(),
        ex: {
          for (final e in ((j['ex'] as Map?) ?? const {}).entries)
            if (e.value is List) e.key.toString(): (e.value as List).map((x) => x is num ? x : 0).toList(),
        },
      );
}

/// L'état du compte, réduit à ce que lit l'appli.
class Etat {
  final Map<String, dynamic> a;
  /// null : une case vide ou illisible dans la liste du compte (les index restent ceux du site).
  final List<SeanceLibre?> seances;
  final List<LigneHist> hist;
  const Etat({this.a = const {}, this.seances = const [], this.hist = const []});

  factory Etat.depuis(Map<String, dynamic>? j) {
    if (j == null) return const Etat();
    return Etat(
      a: Map<String, dynamic>.from((j['A'] as Map?) ?? const {}),
      seances: ((j['SEANCES'] as List?) ?? const [])
          .map<SeanceLibre?>((s) => s is Map ? SeanceLibre.depuis(Map<String, dynamic>.from(s)) : null)
          .toList(),
      hist: ((j['HIST'] as List?) ?? const [])
          .whereType<Map>()
          .map((l) => LigneHist.depuis(Map<String, dynamic>.from(l)))
          .toList(),
    );
  }
}

/// Une entrée du catalogue des exercices (assets/exercices.json) : nom et type de charge.
class Exercice {
  final String n;
  final String ch;
  const Exercice(this.n, this.ch);
}
