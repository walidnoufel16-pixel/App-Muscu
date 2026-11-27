/* L'onglet Progrès en mode Suivi, logique pure. Reprise de web/lib/logic/historique.ts (semaines,
   séries par muscle, courbe, exercices faits, records), web/lib/logic/motivation.ts (objectif et série
   de semaines) et web/components/repere/progression-exercice.tsx (séries jour par jour, durée),
   avec les mêmes cas de test. Tout se lit dans le document du compte (HIST, LOG) ; seul l'objectif
   de la semaine s'écrit (A.objHebdo, `reglerObjectif`). */
import 'charge.dart';
import 'mode.dart';
import 'modele.dart';

/// Arrondi comme Math.round du site (x,5 vers le haut, négatifs compris).
int _rond(num x) => (x + 0.5).floor();

/// Lundi de la semaine d'un jour, « AAAA-MM-JJ ».
String lundiDe(String j) => decaler(j, -((dateDe(j).weekday + 6) % 7));

/// Objectif de séances par semaine : réglé à la main, sinon celui du questionnaire (2, 3 ou 4).
int objectifHebdo(Map<String, dynamic> a) {
  final o = a['objHebdo'], socle = a['socle'];
  if (o is num) return o.clamp(1, 6).toInt();
  if (socle is num) return socle.toInt() + 2;
  return 2;
}

/// Règle l'objectif de séances par semaine (1 à 6), comme la feuille Objectif du site : on part du
/// document relu sur le serveur et seul A.objHebdo change.
Map<String, dynamic> reglerObjectif(Map<String, dynamic> doc, int n) {
  final a = Map<String, dynamic>.from((doc['A'] as Map?) ?? const {});
  a['objHebdo'] = n.clamp(1, 6);
  return {...doc, 'A': a};
}

/// Séances faites par semaine (lundi → nombre) : musculation, et cardio seul (un bloc d'une séance
/// combinée ne compte pas en plus).
Map<String, int> seancesParSemaine(List<LigneHist> h, List<String> joursCardio) {
  final m = <String, int>{};
  for (final d in [for (final l in h) l.d, ...joursCardio]) {
    final k = lundiDe(d);
    m[k] = (m[k] ?? 0) + 1;
  }
  return m;
}

class SerieSemaines {
  final int semaines;
  final List<String> jokers;
  final int cetteSemaine;
  final int objectif;
  final bool jokerDispo;
  final int record;
  const SerieSemaines(this.semaines, this.jokers, this.cetteSemaine, this.objectif, this.jokerDispo, this.record);
}

/// Série en cours : semaines réussies d'affilée. La semaine en cours compte dès que l'objectif est
/// atteint, et ne casse rien tant qu'elle n'est pas finie. Une semaine manquée par mois est
/// rattrapée par le joker.
SerieSemaines serieSemaines(List<LigneHist> h, List<String> joursCardio, int objectif, String auj) {
  final m = seancesParSemaine(h, joursCardio), courante = lundiDe(auj);
  final cles = m.keys.toList()..sort();
  final cetteSemaine = m[courante] ?? 0;
  bool reussie(String l) => (m[l] ?? 0) >= objectif;
  var n = 0, best = 0;
  final jokers = <String>[], moisJoker = <String>{};
  if (cles.isNotEmpty) {
    for (var l = cles.first; l.compareTo(courante) < 0; l = decaler(l, 7)) {
      if (reussie(l)) {
        n++;
      } else if (n > 0 && !moisJoker.contains(l.substring(0, 7))) {
        moisJoker.add(l.substring(0, 7));
        jokers.add(l);
      } else {
        n = 0;
        jokers.clear();
      }
      if (n > best) best = n;
    }
  }
  final total = n + (reussie(courante) ? 1 : 0);
  return SerieSemaines(total, jokers, cetteSemaine, objectif, !moisJoker.contains(courante.substring(0, 7)),
      total > best ? total : best);
}

/// Séries validées de la semaine en cours, et celles de la semaine passée au même jour
/// (un jeudi se compare au jeudi d'avant, pas à toute la semaine).
({num cette, num avant}) seriesSemaine(List<LigneHist> h, String auj) {
  num total(String jusqua) {
    final l0 = lundiDe(jusqua);
    num n = 0;
    for (final l in h) {
      if (l.d.compareTo(jusqua) <= 0 && lundiDe(l.d) == l0) n += l.ser;
    }
    return n;
  }

  return (cette: total(auj), avant: total(decaler(auj, -7)));
}

/// Écart en % avec la semaine d'avant ; null si la semaine d'avant était vide.
int? ecart(num v, num avant) => avant == 0 ? null : _rond((v - avant) / avant * 100);

/// Activité par jour (calendrier) : musculation, cardio.
Map<String, ({bool muscu, bool cardio})> activite(List<LigneHist> h, List<String> joursCardio) {
  final m = <String, ({bool muscu, bool cardio})>{};
  for (final l in h) {
    m[l.d] = (muscu: true, cardio: m[l.d]?.cardio ?? false);
  }
  for (final d in joursCardio) {
    m[d] = (muscu: m[d]?.muscu ?? false, cardio: true);
  }
  return m;
}

/// Les groupes musculaires de chaque mouvement (PAT2MUSC du site).
const pat2musc = {
  'ph': 'pec', 'tv': 'dos', 'th': 'dos', 'tra': 'tra', 'lo': 'lom', 'pv': 'epa', 'ep': 'epa', 're': 'epa',
  'fc': 'bic', 'ec': 'tri', 'avb': 'avb', 'eg': 'qua', 'fh': 'isc', 'add': 'add', 'mol': 'mol', 'ae': 'abd', 'ft': 'abd',
};

/// Les noms des groupes (MUSC du site).
const nomsMuscles = {
  'pec': 'Pectoraux', 'dos': 'Dos', 'epa': 'Épaules', 'bic': 'Biceps', 'tri': 'Triceps', 'qua': 'Quadriceps',
  'isc': 'Fessiers et ischios', 'mol': 'Mollets', 'abd': 'Abdos', 'tra': 'Trapèzes', 'avb': 'Avant-bras',
  'add': 'Adducteurs', 'lom': 'Lombaires',
};
String nomMuscle(String k) => nomsMuscles[k] ?? k;

/// Les grands groupes, pour « Pas encore cette semaine ».
const principaux = ['pec', 'dos', 'epa', 'bic', 'tri', 'qua', 'isc', 'mol', 'abd'];

/// Séries validées par muscle entre deux jours (inclus) : 1 série au muscle principal, ½ au secondaire.
Map<String, num> seriesParMuscle(List<LigneHist> h, String de, String a, Map<String, Exercice> cat) {
  final r = <String, num>{};
  for (final l in h) {
    if (l.d.compareTo(de) < 0 || l.d.compareTo(a) > 0) continue;
    for (final e in l.ex.entries) {
      final x = cat[e.key];
      if (x == null) continue;
      final p = pat2musc[x.pat], q = x.pat2 != null ? pat2musc[x.pat2] : null;
      final num n = e.value.length > 4 ? e.value[4] : 0;
      if (p != null) r[p] = (r[p] ?? 0) + n;
      if (q != null && q != p) r[q] = (r[q] ?? 0) + n / 2;
    }
  }
  return r;
}

/// Un point de la courbe d'un exercice : la meilleure séance du jour.
class PointEx {
  final String d;
  final num rm, max, reps, vol, ser;
  const PointEx(this.d, this.rm, this.max, this.reps, this.vol, this.ser);
}

num _p(List<num> p, int i) => i < p.length ? p[i] : 0;

/// Courbe d'un exercice : un point par jour (le meilleur s'il a été fait deux fois).
List<PointEx> courbe(List<LigneHist> h, String id) {
  final r = <PointEx>[];
  for (final l in h) {
    final p = l.ex[id];
    if (p == null) continue;
    final pt = PointEx(l.d, _p(p, 0), _p(p, 2), _p(p, 3), _p(p, 1), _p(p, 4));
    if (r.isNotEmpty && r.last.d == l.d) {
      if (pt.rm > r.last.rm || pt.max > r.last.max) r[r.length - 1] = pt;
    } else {
      r.add(pt);
    }
  }
  return r;
}

/// Exercices déjà faits, du plus récent au plus ancien, avec leur nombre de séances.
List<({String id, int n, String dernier})> exercicesFaits(List<LigneHist> h) {
  final m = <String, ({int n, String dernier})>{};
  for (final l in h) {
    for (final id in l.ex.keys) {
      m[id] = (n: (m[id]?.n ?? 0) + 1, dernier: l.d);
    }
  }
  final r = [for (final e in m.entries) (id: e.key, n: e.value.n, dernier: e.value.dernier)];
  r.sort((a, b) {
    final c = b.dernier.compareTo(a.dernier);
    return c != 0 ? c : b.n - a.n;
  });
  return r;
}

class RecordEx {
  final String d, id;
  final num rm, max, reps, avant;
  const RecordEx(this.d, this.id, this.rm, this.max, this.reps, this.avant);
}

/// Records : chaque fois qu'un exercice dépasse son meilleur précédent (1RM estimé, ou charge pour
/// le poids du corps), du plus récent au plus ancien.
List<RecordEx> records(List<LigneHist> h, Map<String, Exercice> cat) {
  final best = <String, num>{}, r = <RecordEx>[];
  for (final l in h) {
    for (final e in l.ex.entries) {
      final p = e.value, ch = cat[e.key]?.ch;
      final num v = ch == 'kg'
          ? _p(p, 0)
          : ch == 'lest' || ch == 'aucune'
              ? _p(p, 2) * 1000 + _p(p, 3)
              : _p(p, 2);
      if (v <= 0) continue;
      final avant = best[e.key];
      if (avant != null && v > avant) r.add(RecordEx(l.d, e.key, _p(p, 0), _p(p, 2), _p(p, 3), avant));
      if (avant == null || v > avant) best[e.key] = v;
    }
  }
  return r.reversed.toList();
}

/// Un seul record par exercice, le meilleur, du plus récent au plus ancien.
List<RecordEx> meilleursRecords(List<LigneHist> h, Map<String, Exercice> cat) {
  final m = <String, RecordEx>{};
  for (final r in records(h, cat)) {
    final p = m[r.id];
    if (p == null || r.rm > p.rm || (r.rm == p.rm && r.d.compareTo(p.d) > 0)) m[r.id] = r;
  }
  final l = m.values.toList();
  final rang = {for (var i = 0; i < l.length; i++) l[i]: i};
  l.sort((x, y) {
    final c = y.d.compareTo(x.d);
    return c != 0 ? c : rang[x]! - rang[y]!;
  });
  return l;
}

/// Une série telle qu'elle a été faite : « 10 kg × 10 », « 12 réps », « +5 kg × 8 », « 45 s ».
String texteSerie(String? ch, List<num> s) {
  final num v = _p(s, 0), reps = _p(s, 1), lest = _p(s, 2);
  switch (ch) {
    case 'kg':
      return '${nb(v)} kg × ${nb(reps)}';
    case 'lest':
      return v > 0 ? '+${nb(v)} kg × ${nb(reps)}' : '${nb(reps)} réps';
    case 'aucune':
      return lest != 0 ? '+${nb(lest)} kg × ${nb(v)}' : '${nb(v)} réps';
    case 'temps':
      return '${nb(v)} s';
    default:
      return '${nb(v)} m';
  }
}

/// Les séries de chaque jour où l'exercice a été fait, du plus récent au plus ancien, les séries
/// identiques qui se suivent regroupées. Une ancienne séance sans le détail : groupes null.
List<({String d, List<({int n, String t})>? groupes, num total})> seriesParJour(
    List<LigneHist> h, String id, String? ch, [int n = 8]) {
  final jours = <String, ({List<List<num>> s, num total})>{};
  for (final l in h) {
    final p = l.ex[id];
    if (p == null) continue;
    final j = jours[l.d] ?? (s: <List<num>>[], total: 0);
    for (final x in l.det.where((x) => x.id == id)) {
      j.s.addAll(x.s);
    }
    jours[l.d] = (s: j.s, total: j.total + _p(p, 4));
  }
  return [
    for (final e in jours.entries.toList().reversed.take(n))
      if (e.value.s.isEmpty)
        (d: e.key, groupes: null, total: e.value.total)
      else
        (d: e.key, groupes: _grouper([for (final x in e.value.s) texteSerie(ch, x)]), total: e.value.s.length),
  ];
}

List<({int n, String t})> _grouper(List<String> textes) {
  final g = <({int n, String t})>[];
  for (final t in textes) {
    if (g.isNotEmpty && g.last.t == t) {
      g[g.length - 1] = (n: g.last.n + 1, t: t);
    } else {
      g.add((n: 1, t: t));
    }
  }
  return g;
}

/// Durée lisible entre deux jours : « 11 jours », « 3 semaines », « 2 mois ».
String duree(String d1, String d2) {
  final j = _rond(dateDe(d2).difference(dateDe(d1)).inHours / 24);
  if (j < 14) return j <= 1 ? '1 jour' : '$j jours';
  if (j < 60) return '${_rond(j / 7)} semaines';
  return '${_rond(j / 30)} mois';
}

/// Ce qu'Oxa proposera la prochaine fois sur un exercice chargé : la règle de la séance, avec la
/// ligne d'une séance enregistrée qui le contient, sinon la dernière fois qu'il a été fait.
({num v, num reps, String? t})? prochaineFois(Etat e, String id, Map<String, Exercice> cat, [PointEx? dernier]) {
  if (cat[id]?.ch != 'kg') return null;
  var etat = e;
  int? idx, j;
  for (var i = 0; i < e.seances.length && idx == null; i++) {
    final k = e.seances[i]?.ex.indexWhere((z) => z.id == id) ?? -1;
    if (k >= 0) {
      idx = i;
      j = k;
    }
  }
  if (idx == null) {
    /* pas dans une séance : une ligne faite comme la dernière fois */
    final ex = ExLibre(id: id, s: (dernier?.ser ?? 3).toInt(), r: (dernier?.reps ?? 10).toInt(), p: '90 s');
    etat = Etat(a: e.a, seances: [...e.seances, SeanceLibre(nom: '', ex: [ex])], hist: e.hist, log: e.log);
    idx = e.seances.length;
    j = 0;
  }
  final c = ctxLibre(etat, idx, j!, cat);
  return c != null && c.v > 0 ? (v: c.v, reps: c.reps, t: c.why) : null;
}
