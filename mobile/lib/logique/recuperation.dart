/* La récupération des muscles, logique pure. Reprise de web/lib/logic/recommandation.ts (etatGroupes,
   effortsEndurance, effortsDeclares) et des textes de web/components/repere/recuperation.tsx, avec
   les mêmes cas de test. En lecture seule : l'appli ne propose pas de séance « avec les muscles prêts ».
   - Récupération : 24 h pour les abdos et les mollets ; 72 h pour les jambes et le dos après une
     grosse séance (8 séries ou plus), 48 h sinon ; 48 h pour les autres à partir de 4 séries ;
     lombaires 48 h dès 2 séries (un soulevé de terre, en second, compte pour moitié).
   - Course, cardio guidé, activités (foot, padel…) et séance déclarée à l'accueil du site fatiguent
     aussi des muscles : le plus long délai l'emporte. */
import 'mode.dart';
import 'modele.dart';
import 'progres.dart' show pat2musc;

const groupes = ['pec', 'dos', 'epa', 'bic', 'tri', 'qua', 'isc', 'mol', 'abd'];

/// Les muscles suivis : les grands groupes, et ceux qu'on ne programme pas à part.
const musclesRecup = [...groupes, 'tra', 'lom', 'avb', 'add'];

/// Les muscles cités en tête (mollets et abdos se récupèrent en un jour, on ne les cite pas).
const enTete = ['pec', 'dos', 'epa', 'qua', 'isc', 'bic', 'tri'];

const _noms = {
  'pec': 'Pecs',
  'dos': 'Dos',
  'epa': 'Épaules',
  'bic': 'Biceps',
  'tri': 'Triceps',
  'qua': 'Quadriceps',
  'isc': 'Ischios',
  'mol': 'Mollets',
  'abd': 'Abdos',
  'tra': 'Trapèzes',
  'lom': 'Lombaires',
  'avb': 'Avant-bras',
  'add': 'Adducteurs',
};
String nomRecup(String g) => _noms[g] ?? g;

/// Un effort qui fatigue des muscles : `jours` de récupération à partir du jour `d`.
class Endurance {
  final String d;
  final int jours;
  final List<String> muscles;
  const Endurance(this.d, this.jours, this.muscles);
  @override
  bool operator ==(Object other) => other is Endurance && other.d == d && other.jours == jours && other.muscles.join() == muscles.join();
  @override
  int get hashCode => Object.hash(d, jours, muscles.join());
  @override
  String toString() => 'Endurance($d, $jours, $muscles)';
}

num _n(Object? x) => x is num ? x : 0;
const _jambes = ['qua', 'isc', 'mol'];
const _machines = {
  'tapis': _jambes,
  'ellip': _jambes,
  'stair': _jambes,
  'velo': ['qua', 'isc'],
  'ram': ['dos', 'qua', 'isc'],
  'corde': ['mol'],
  'pdc': ['qua', 'mol'],
};

/// Jours de récupération d'une activité déclarée (foot, padel…) : intensité 0, 1 ou 2 et durée.
int joursRecup(num inte, num min) => inte == 0
    ? 1
    : inte == 2 || min >= 120
    ? 3
    : 2;

/// Les muscles déclarés à l'accueil du site (« Tu t'es entraîné ces dernières 48 h ? »), comme après
/// une séance de volume moyen : abdos et mollets 1 jour, dos et jambes 3, les autres 2.
List<Endurance> effortsDeclares(Object? avant) {
  if (avant is! Map || avant['d'] is! String || avant['m'] is! List) return const [];
  int delai(String g) => g == 'abd' || g == 'mol'
      ? 1
      : g == 'qua' || g == 'isc' || g == 'dos'
      ? 3
      : 2;
  final m = [
    for (final g in avant['m'] as List)
      if (musclesRecup.contains(g)) g as String,
  ];
  return [
    for (final j in [1, 2, 3])
      if (m.any((g) => delai(g) == j)) Endurance(avant['d'] as String, j, m.where((g) => delai(g) == j).toList()),
  ];
}

/// Sorties de course, cardio guidé, activités et séance déclarée, en jours de récupération :
/// course 72 h après 25 km (ou une course de 21 km et plus), 48 h après 15 km, une course ou une
/// sortie très dure (ressenti 8 et plus), 24 h après 8 km ou une sortie soutenue (6 et plus) ;
/// cardio guidé 24 h après du fractionné de 10 min et plus, ou une heure d'endurance.
List<Endurance> effortsEndurance(Etat e) {
  final out = [...effortsDeclares(e.a['avant'])];
  for (final a in e.activites) {
    final m = [
      for (final g in (a['m'] as List?) ?? const [])
        if (musclesRecup.contains(g)) g as String,
    ];
    if (m.isNotEmpty && a['d'] is String) out.add(Endurance(a['d'] as String, joursRecup(_n(a['int']), _n(a['min'])), m));
  }
  for (final s in e.sorties) {
    final km = _n(s['km']), rpe = _n(s['rpe']), course = s['course'] == true;
    final j = km >= 25 || (course && km >= 21)
        ? 3
        : km >= 15 || course || rpe >= 8
        ? 2
        : km >= 8 || rpe >= 6
        ? 1
        : 0;
    if (j > 0 && s['d'] is String) out.add(Endurance(s['d'] as String, j, _jambes));
  }
  for (final c in e.cardio) {
    final m = _machines[c['m']], min = _n(c['min']);
    if (m != null && c['ts'] is num && (c['f'] == 'endurance' ? min >= 60 : min >= 10)) {
      out.add(Endurance(jourDe(DateTime.fromMillisecondsSinceEpoch((c['ts'] as num).toInt())), 1, m));
    }
  }
  return out;
}

class EtatGroupe {
  final String? dernier;
  final int jours;
  final num semaine, dernierVolume;
  final bool recupere;

  /// jours restants avant d'être récupéré (0 : prêt)
  final int reste;
  const EtatGroupe(this.dernier, this.jours, this.semaine, this.dernierVolume, this.recupere, this.reste);
}

int _ecart(String a, String b) => (dateDe(b).difference(dateDe(a)).inHours / 24).round();

/// État de chaque muscle au jour `auj`, d'après les 14 derniers jours (muscle principal 1 série,
/// secondaire ½) et les efforts d'endurance.
Map<String, EtatGroupe> etatGroupes(List<LigneHist> h, String auj, Map<String, Exercice> cat, [List<Endurance> efforts = const []]) {
  final de = decaler(auj, -13);
  final parJour = <String, Map<String, num>>{};
  for (final l in h) {
    if (l.d.compareTo(de) < 0 || l.d.compareTo(auj) > 0) continue;
    final j = parJour[l.d] ??= {};
    for (final x in l.ex.entries) {
      final ex = cat[x.key];
      final num n = x.value.length > 4 ? x.value[4] : 0;
      if (ex == null || n == 0) continue;
      final p = pat2musc[ex.pat], s = ex.pat2 != null ? pat2musc[ex.pat2] : null;
      if (p != null) j[p] = (j[p] ?? 0) + n;
      if (s != null && s != p) j[s] = (j[s] ?? 0) + n / 2;
    }
  }
  final jours = parJour.keys.toList()..sort();
  final semaineDe = decaler(auj, -7);
  final out = <String, EtatGroupe>{};
  for (final g in musclesRecup) {
    final avec = jours.where((d) => (parJour[d]![g] ?? 0) >= 1).toList();
    final dernier = avec.isEmpty ? null : avec.last;
    final num semaine = jours.where((d) => d.compareTo(semaineDe) > 0).fold<num>(0, (n, d) => n + (parJour[d]![g] ?? 0));
    final num vol = dernier == null ? 0 : parJour[dernier]![g] ?? 0;
    final j = dernier == null ? 99 : _ecart(dernier, auj);
    final recup = dernier == null
        ? 0
        : g == 'abd' || g == 'mol'
        ? 1
        : g == 'qua' || g == 'isc' || g == 'dos'
        ? (vol >= 8 ? 3 : 2)
        : g == 'lom'
        ? (vol >= 2 ? 2 : 1)
        : vol >= 4
        ? 2
        : 1;
    out[g] = EtatGroupe(dernier, j, semaine, vol, j >= recup, recup - j > 0 ? recup - j : 0);
  }
  for (final e in efforts) {
    if (e.d.compareTo(auj) > 0) continue;
    final reste = e.jours - _ecart(e.d, auj);
    if (reste <= 0) continue;
    for (final g in e.muscles) {
      final o = out[g]!;
      if (reste > o.reste) out[g] = EtatGroupe(o.dernier, o.jours, o.semaine, o.dernierVolume, false, reste);
    }
  }
  return out;
}

/// Ce que montre la ligne Récupération de l'accueil, et sa feuille.
class Recuperation {
  final Map<String, EtatGroupe> e;

  /// les muscles listés : les grands groupes, et les autres s'ils ont travaillé ces 14 jours
  final List<String> suivis, prets, repos;
  final int bientot;
  const Recuperation(this.e, this.suivis, this.prets, this.repos, this.bientot);

  /// « Tous tes muscles sont prêts », « Prêts : pecs, dos », « Tes muscles récupèrent ».
  String get titre => prets.length == enTete.length
      ? 'Tous tes muscles sont prêts'
      : prets.isNotEmpty
      ? 'Prêts : ${prets.map(nomRecup).join(', ').toLowerCase()}'
      : 'Tes muscles récupèrent';

  /// « Quadriceps, Ischios · prêts demain », ou null.
  String? get sous =>
      repos.isEmpty ? null : '${repos.map(nomRecup).join(', ')} · ${bientot == 1 ? 'prêts demain' : 'prêts dans $bientot jours'}';

  /// La feuille : les muscles, ceux qui récupèrent le plus longtemps d'abord.
  List<String> get tri => [...suivis]..sort((a, b) => e[b]!.reste - e[a]!.reste);

  /// « demain », « dans 2 jours », « prêt », « prêt · pas travaillé depuis 7 j+ ».
  String delai(String g) {
    final x = e[g]!;
    if (!x.recupere) return x.reste == 1 ? 'demain' : 'dans ${x.reste} jours';
    return x.dernier == null || x.jours >= 7 ? 'prêt · pas travaillé depuis 7 j+' : 'prêt';
  }
}

/// La récupération du jour ; null sans séance ni effort sur les 14 derniers jours (rien à montrer).
Recuperation? recuperation(Etat etat, String auj, Map<String, Exercice> cat) {
  final e = etatGroupes(etat.hist, auj, cat, effortsEndurance(etat));
  if (musclesRecup.every((g) => e[g]!.dernier == null && e[g]!.recupere)) return null;
  final suivis = musclesRecup.where((g) => groupes.contains(g) || e[g]!.dernier != null || !e[g]!.recupere).toList();
  final prets = enTete.where((g) => e[g]!.recupere).toList();
  final repos = suivis.where((g) => !e[g]!.recupere).toList();
  final bientot = repos.isEmpty ? 0 : repos.map((g) => e[g]!.reste).reduce((a, b) => a < b ? a : b);
  return Recuperation(e, suivis, prets, repos, bientot);
}
