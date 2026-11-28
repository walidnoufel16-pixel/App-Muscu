/* Le poids du corps dans Progrès, logique pure. Reprise de SectionPoids et Poids de web/app/progres/page.tsx :
   les pesées sont dans A.poids ([jour, kg], une par jour, les 120 dernières), et la dernière remplit
   aussi le poids du Profil (A.profil.Poids, arrondi au kilo). Avant toute pesée, le dernier poids connu
   est celui du questionnaire. */

/// Les pesées du compte, de la plus ancienne à la plus récente (les cases illisibles sont ignorées).
List<({String d, num kg})> pesees(Map<String, dynamic> a) {
  final p = a['poids'];
  if (p is! List) return const [];
  return [
    for (final x in p)
      if (x is List && x.length >= 2 && x[0] is String && x[1] is num) (d: x[0] as String, kg: x[1] as num),
  ];
}

/// La section s'affiche une fois une pesée notée ; avant, une ligne « Suivre mon poids ».
bool poidsSuivi(Map<String, dynamic> a) => pesees(a).isNotEmpty;

/// Le dernier poids connu : la dernière pesée, sinon le poids déclaré au questionnaire.
num? dernierPoids(Map<String, dynamic> a) {
  final p = pesees(a);
  if (p.isNotEmpty) return p.last.kg;
  final profil = a['profil'];
  final v = profil is Map ? profil['Poids'] : null;
  return v is num ? v : null;
}

/// Le poids saisi, arrondi au dixième (virgule ou point), ou null s'il n'est pas entre 30 et 300 kg.
num? lirePoids(String saisie) {
  final v = double.tryParse(saisie.trim().replaceAll(',', '.'));
  if (v == null || v.isNaN) return null;
  final n = (v * 10 + 0.5).floor() / 10;
  if (!(n >= 30 && n <= 300)) return null;
  return n == n.roundToDouble() ? n.toInt() : n;
}

/// Note la pesée du jour, comme « Noter » du site : celle du même jour est remplacée, on garde les 120
/// dernières et le poids du Profil suit. On part du document relu sur le serveur ; seul A change.
Map<String, dynamic> noterPoids(Map<String, dynamic> doc, String jour, num kg) {
  final a = Map<String, dynamic>.from((doc['A'] as Map?) ?? const {});
  final l = [
    for (final x in (a['poids'] is List ? a['poids'] as List : const []))
      if (!(x is List && x.isNotEmpty && x[0] == jour)) x,
    [jour, kg],
  ];
  a['poids'] = l.length > 120 ? l.sublist(l.length - 120) : l;
  a['profil'] = {...((a['profil'] as Map?) ?? const {}), 'Poids': (kg + 0.5).floor()};
  return {...doc, 'A': a};
}
