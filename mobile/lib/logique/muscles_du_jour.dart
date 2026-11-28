/* Composer une séance par muscles, comme CorpsDuJour (web/components/repere/corps-du-jour.tsx) et la feuille
   d'ajout du mode Suivi (ajout-exercice.tsx) : la teinte des 7 derniers jours, « Pas encore cette semaine »,
   les exercices des muscles touchés (exosParMuscle de bibliotheque-muscles.tsx) rangés par rôle
   (roleDe de web/lib/logic/roles.ts, parRole de bibliotheque.tsx). Logique pure.
   Le site filtre aussi par le matériel du Profil ; l'appli n'a pas encore ce réglage : tout le matériel. */
import 'mode.dart' show decaler;
import 'modele.dart';
import 'progres.dart' show nomMuscle, nomsMuscles, pat2musc, principaux, seriesParMuscle;

/// Exercice de la bibliothèque Soin & mobilité (estSoin de web/lib/data/soin.ts).
bool estSoin(Exercice? x) => x != null && (x.soin || x.pat == 'soin');

const _polyOui = {'sdts', 'sql', 'rwm', 'tbarp', 'rkp'};
const _polyNon = {'scap', 'elf', 'scappu', 'trxy', 'trxt', 'curlpc', 'pull'};
const _explosifs = {'pp', 'pompp', 'jsq', 'ktj', 'fsaut', 'bondl', 'grenou', 'sautl', 'burpsl', 'kbsw', 'kbthr'};
const _portes = {'ferm', 'trpush', 'trpull'};
const _sansRole = {'kbtgu', 'kbwm', 'mclimb', 'trxmc', 'corde'};
const _complements = {
  'fe', 'fb', 'bul', 'ferh', 'bulsm', 'mont', 'montb', 'fepc',
  'dci', 'dhi', 'dcism', 'chpi', 'pompe',
  'rw', 'rh', 'tps', 'rw2', 'rwapp', 'rwm', 'tbarp', 'seal', 'tps1', 'landr', 'rwsu', 'rwhm', 'tbar', 'kbrw', 'kbrw2',
};
const _tronc = ['ae', 'ft', 'lo'];

/// Plusieurs articulations et plusieurs muscles qui comptent, hors gainage (estPoly du site).
bool estPoly(String id, Map<String, Exercice> cat) {
  if (_polyOui.contains(id)) return true;
  if (_polyNon.contains(id)) return false;
  final x = cat[id];
  return x?.pat2 != null && !_tronc.contains(x!.pat) && !['avb', 'tra', 'add', 'mol'].contains(pat2musc[x.pat2]);
}

/// Rôle d'un exercice : 'b' base, 'c' complément, 'i' isolation, 'g' gainage, ou null (cardio, soin,
/// explosif, porté). Avec `muscle` : une base qui ne le travaille qu'en second y compte comme complément.
String? roleDe(String id, Map<String, Exercice> cat, [String? muscle]) {
  final x = cat[id];
  if (x == null || estSoin(x) || x.pat == 'ca' || x.ch == 'dist' || _explosifs.contains(id) || _portes.contains(id) || _sansRole.contains(id)) {
    return null;
  }
  if (_tronc.contains(x.pat) && !_polyOui.contains(id)) return 'g';
  if (!estPoly(id, cat)) return 'i';
  final base = _complements.contains(id) ? 'c' : 'b';
  if (muscle != null && pat2musc[x.pat] != muscle && x.pat2 != null && pat2musc[x.pat2] == muscle) return 'c';
  return base;
}

const nomsRoles = {'b': 'Base', 'c': 'Complément', 'i': 'Isolation', 'g': 'Gainage'};

/// En une ligne, à côté des titres de rôle (COURTS de role-exercice.tsx).
const courtsRoles = {
  'b': 'Plusieurs muscles, le plus lourd : en premier',
  'c': 'Le même muscle, sous un autre angle : après la base',
  'i': 'Un seul muscle, plus léger : pour finir',
  'g': 'Abdos et bas du dos : en fin de séance',
};

/// Les exercices regroupés par rôle (Base, Complément, Isolation, Gainage, puis les autres).
List<({String? ro, List<String> ids})> parRole(List<String> l, Map<String, Exercice> cat, [String? muscle]) => [
  for (final ro in const ['b', 'c', 'i', 'g', null])
    if (l.where((o) => roleDe(o, cat, muscle) == ro).toList() case final ids when ids.isNotEmpty) (ro: ro, ids: ids),
];

/// Les exercices de chaque muscle touché, dans l'ordre des muscles du site ; s'il n'y en a aucun dont
/// c'est le muscle principal, ceux qui le travaillent en second (`aussi`).
List<({String g, List<String> l, bool aussi})> exosParMuscle(List<String> m, Map<String, Exercice> cat) => [
  for (final g in nomsMuscles.keys)
    if (m.contains(g)) _exosDe(g, cat),
];

({String g, List<String> l, bool aussi}) _exosDe(String g, Map<String, Exercice> cat) {
  List<String> de(String? Function(Exercice) p) => [
    for (final e in cat.entries)
      if (p(e.value) case final v? when pat2musc[v] == g && !estSoin(e.value)) e.key,
  ];
  final l = de((x) => x.pat.isEmpty ? null : x.pat);
  return l.isNotEmpty ? (g: g, l: l, aussi: false) : (g: g, l: de((x) => x.pat2), aussi: true);
}

/// Les séries par muscle des 7 derniers jours (aujourd'hui compris), pour teinter le corps.
Map<String, num> seriesSemaine(List<LigneHist> h, String auj, Map<String, Exercice> cat) =>
    seriesParMuscle(h, decaler(auj, -6), auj, cat);

/// Intensité de 0 à 1 d'une zone du corps : 16 séries dans la semaine donnent le plus foncé.
double teinte(String? p, Map<String, num> parM) {
  final k = p == null ? null : pat2musc[p];
  final n = k == null ? 0 : parM[k] ?? 0;
  return n <= 0 ? 0 : (n / 16).clamp(0, 1).toDouble();
}

/// « Pas encore cette semaine » : les grands groupes sans série, en minuscules, 4 au plus.
String? pasEncore(Map<String, num> parM) {
  final r = [for (final k in principaux) if ((parM[k] ?? 0) == 0) nomMuscle(k)];
  return r.isEmpty ? null : r.take(4).join(', ').toLowerCase();
}

/// Les muscles touchés, dans l'ordre où ils l'ont été : « Pectoraux · Dos », le nom de la séance.
String nomDesMuscles(List<String> m) => m.map(nomMuscle).join(' · ');
