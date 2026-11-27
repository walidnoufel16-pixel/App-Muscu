/* Les données du compte, telles que le site les range dans Supabase (table « etats », colonne
   « etat », un seul document JSON par compte). Reprise de web/lib/logic/types.ts et historique.ts :
   on ne lit ici que ce dont le mode Suivi a besoin. Pour écrire, l'appli part toujours du document
   brut (voir enregistrer.dart) : les champs qu'elle ne connaît pas restent tels quels. */

num _n(Object? x) => x is num ? x : 0;

String _jour(int ts) {
  final d = DateTime.fromMillisecondsSinceEpoch(ts);
  String z(int n) => n.toString().padLeft(2, '0');
  return '${d.year}-${z(d.month)}-${z(d.day)}';
}

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
  final num? obj;
  const SeanceLibre({required this.nom, this.ex = const [], this.soin, this.street, this.auto = false, this.obj});

  /// Ce qui identifie la séance : son nom et ses exercices. Sert à vérifier, au moment
  /// d'enregistrer, que la séance n'a pas été modifiée ou déplacée sur le site entre-temps.
  String get signature => '$nom|${ex.map((e) => e.id).join(',')}';

  factory SeanceLibre.depuis(Map<String, dynamic> j) => SeanceLibre(
        nom: j['nom']?.toString() ?? '',
        ex: ((j['ex'] as List?) ?? const [])
            .whereType<Map>()
            .map((e) => ExLibre.depuis(Map<String, dynamic>.from(e)))
            .toList(),
        soin: j['soin'] as String?,
        street: j['street'] as String?,
        auto: j['auto'] == true,
        obj: (j['obj'] as num?) ?? ((j['gen'] as Map?)?['obj'] as num?),
      );
}

/// Une série : charge (kg), répétitions (poids du corps), secondes ou mètres dans `v`.
class Serie {
  num v;
  num reps;
  bool? ok;
  num? lest;
  Serie({required this.v, required this.reps, this.ok, this.lest});

  factory Serie.depuis(Map<String, dynamic> j) =>
      Serie(v: _n(j['v']), reps: _n(j['reps']), ok: j['ok'] as bool?, lest: j['lest'] is num ? j['lest'] as num : null);

  Map<String, dynamic> versJson() => {'v': v, 'reps': reps, if (ok != null) 'ok': ok, if (lest != null) 'lest': lest};
}

/// Le journal d'un exercice (une entrée de LOG).
class Journal {
  bool done;
  num? v;
  num? reps;
  int? nb;
  int? feel;
  String ex;
  int ts;
  String? why;
  List<Serie> series;
  bool lest;
  Journal({
    required this.ex,
    required this.series,
    this.done = false,
    this.v,
    this.reps,
    this.nb,
    this.feel,
    this.ts = 0,
    this.why,
    this.lest = false,
  });

  factory Journal.depuis(Map<String, dynamic> j) => Journal(
        ex: j['ex']?.toString() ?? '',
        done: j['done'] == true,
        v: j['v'] as num?,
        reps: j['reps'] as num?,
        nb: (j['nb'] as num?)?.toInt(),
        feel: (j['feel'] as num?)?.toInt(),
        ts: (j['ts'] as num?)?.toInt() ?? 0,
        why: j['why'] as String?,
        lest: j['lest'] == true,
        series: ((j['series'] as List?) ?? const [])
            .whereType<Map>()
            .map((s) => Serie.depuis(Map<String, dynamic>.from(s)))
            .toList(),
      );

  Map<String, dynamic> versJson() => {
        'done': done,
        if (v != null) 'v': v,
        if (reps != null) 'reps': reps,
        if (nb != null) 'nb': nb,
        'feel': feel,
        'ex': ex,
        'ts': ts,
        if (why != null) 'why': why,
        'series': series.map((s) => s.versJson()).toList(),
        if (lest) 'lest': true,
      };
}

/// Le détail d'un exercice dans une ligne d'historique : séries validées [valeur, répétitions, lest].
class DetailEx {
  final String id;
  final List<List<num>> s;
  final int? f;
  const DetailEx(this.id, this.s, [this.f]);
}

/// Une ligne de l'historique : une séance faite, un jour.
/// `ex` : par exercice, [1RM estimé, volume, meilleure charge, répétitions à cette charge, séries].
class LigneHist {
  final String d;
  final String s;
  final String nom;
  final int? ts;
  final num ser;
  /// Durée de la séance en minutes, si elle a été chronométrée.
  final num? min;
  final Map<String, List<num>> ex;
  final List<DetailEx> det;
  const LigneHist({required this.d, required this.s, this.nom = '', this.ts, this.ser = 0, this.min, this.ex = const {}, this.det = const []});

  factory LigneHist.depuis(Map<String, dynamic> j) => LigneHist(
        d: j['d']?.toString() ?? '',
        s: j['s']?.toString() ?? '',
        nom: j['nom']?.toString() ?? '',
        ts: (j['ts'] as num?)?.toInt(),
        ser: _n(j['ser']),
        min: j['min'] is num ? j['min'] as num : null,
        ex: {
          for (final e in ((j['ex'] as Map?) ?? const {}).entries)
            if (e.value is List) e.key.toString(): (e.value as List).map(_n).toList(),
        },
        det: [
          for (final x in ((j['det'] as List?) ?? const []).whereType<Map>())
            DetailEx(
              x['id']?.toString() ?? '',
              [for (final s in ((x['s'] as List?) ?? const []).whereType<List>()) s.map(_n).toList()],
              (x['f'] as num?)?.toInt(),
            ),
        ],
      );
}

/// L'état du compte, réduit à ce que lit l'appli.
class Etat {
  final Map<String, dynamic> a;
  /// null : une case vide ou illisible dans la liste du compte (les index restent ceux du site).
  final List<SeanceLibre?> seances;
  final List<LigneHist> hist;
  final Map<String, Journal> log;
  /// Un cycle du mode Guidé existe (FINI ou PLAN du site).
  final bool cycle;
  /// Les jours des séances de cardio seules et des sorties de course (CARDIO sans « ref », SORTIES) :
  /// elles comptent dans les séances de la semaine, comme sur le site.
  final List<String> joursCardio;
  const Etat({this.a = const {}, this.seances = const [], this.hist = const [], this.log = const {}, this.cycle = false, this.joursCardio = const []});

  factory Etat.depuis(Map<String, dynamic>? j) {
    if (j == null) return const Etat();
    return Etat(
      cycle: j['PLAN'] != null || j['FINI'] == true,
      a: Map<String, dynamic>.from((j['A'] as Map?) ?? const {}),
      seances: ((j['SEANCES'] as List?) ?? const [])
          .map<SeanceLibre?>((s) => s is Map ? SeanceLibre.depuis(Map<String, dynamic>.from(s)) : null)
          .toList(),
      hist: ((j['HIST'] as List?) ?? const [])
          .whereType<Map>()
          .map((l) => LigneHist.depuis(Map<String, dynamic>.from(l)))
          .toList(),
      log: {
        for (final e in ((j['LOG'] as Map?) ?? const {}).entries)
          if (e.value is Map) e.key.toString(): Journal.depuis(Map<String, dynamic>.from(e.value as Map)),
      },
      joursCardio: [
        for (final c in ((j['CARDIO'] as List?) ?? const []).whereType<Map>())
          if (c['ts'] is num && c['ref'] == null) _jour((c['ts'] as num).toInt()),
        for (final x in ((j['SORTIES'] as List?) ?? const []).whereType<Map>())
          if (x['d'] is String) x['d'] as String,
      ],
    );
  }
}

/// Une entrée du catalogue des exercices (assets/exercices.json).
/// ch : kg, lest, aucune (poids du corps), temps, dist. eq : 0 machine · 1 barre · 2 haltères · 3 corps.
class Exercice {
  final String n;
  final String m; // muscles, texte libre
  final String ch;
  final String pat;
  final String? pat2;
  final int eq;
  final num d;
  const Exercice(this.n, this.ch, {this.m = '', this.pat = '', this.pat2, this.eq = 0, this.d = 0});

  factory Exercice.depuis(Map<String, dynamic> j) => Exercice(
        j['n'] as String? ?? '',
        j['ch'] as String? ?? 'kg',
        m: j['m'] as String? ?? '',
        pat: j['pat'] as String? ?? '',
        pat2: j['pat2'] as String?,
        eq: (j['eq'] as num?)?.toInt() ?? 0,
        d: _n(j['d']),
      );
}
