/* Enregistrer une séance faite dans l'appli, dans le document du compte, comme le site le fait
   (web/lib/logic/historique.ts et lib/suivi.ts, puis « Ajouter à mon suivi ») :
   - chaque exercice devient un journal rangé dans LOG, déjà « mis de côté » (clé L|i|aJ) comme
     après « Ajouter à mon suivi » : la séance repart vierge ;
   - la ligne du jour est (re)calculée dans HIST, à partir de tous les journaux de ce jour-là ;
   - ts du document mis à jour : le site voit qu'un autre appareil a écrit et fusionne.
   On part du document brut : tout ce que l'appli ne connaît pas est gardé tel quel. */
import 'dart:convert';
import 'dart:math' as math;

import 'charge.dart' show okDe;
import 'mode.dart' show jourDe;
import 'modele.dart';

const maxHistLignes = 400;

/// Écart au-delà duquel deux séries d'une même séance appartiennent à deux séances distinctes.
const ecartSeance = 6 * 3600 * 1000;

/// 1RM estimé (Epley), plafonné à 12 répétitions.
num e1rm(num charge, num reps) =>
    charge <= 0 || reps <= 0 ? 0 : reps == 1 ? charge : (charge * (1 + math.min(reps, 12) / 30) * 10).round() / 10;

/// Performance d'un exercice à partir de son journal (séries validées seulement) :
/// [1RM, volume, meilleure charge, répétitions à cette charge, séries].
List<num>? perfDe(Journal l, Map<String, Exercice> cat) {
  final ch = cat[l.ex]?.ch;
  num rm = 0, vol = 0, max = 0, repsMax = 0;
  var n = 0;
  for (final s in l.series) {
    if (!okDe(l, s)) continue;
    n++;
    if (ch == 'kg' || ch == 'lest') vol += s.v * s.reps;
    if (ch == 'kg') rm = math.max(rm, e1rm(s.v, s.reps));
    final v = ch == 'aucune' ? (s.lest ?? 0) : s.v, r = ch == 'aucune' ? s.v : s.reps;
    if (v > max || (v == max && r > repsMax)) {
      max = v;
      repsMax = r;
    }
  }
  return n > 0 ? [rm, vol.round(), max, repsMax, n] : null;
}

/// Jour de séance de chaque journal d'une séance : les séries validées à moins de 6 h d'intervalle
/// forment une même séance, datée du jour de sa première série.
Map<String, String> joursSeance(Map<String, Journal> log, String s) {
  final ks = log.keys.where((k) => k.startsWith('$s|') && log[k]!.ts > 0).toList()
    ..sort((a, b) => log[a]!.ts.compareTo(log[b]!.ts));
  final r = <String, String>{};
  var jour = '';
  num avant = -double.infinity;
  for (final k in ks) {
    final ts = log[k]!.ts;
    if (ts - avant >= ecartSeance) jour = jourDe(DateTime.fromMillisecondsSinceEpoch(ts));
    r[k] = jour;
    avant = ts;
  }
  return r;
}

/// Clés du journal d'une séance pour un jour, dans l'ordre de la séance (les mises de côté à la fin).
List<String> journauxDuJour(Map<String, Journal> log, String s, String d) {
  int rang(String k) {
    final c = k.substring(s.length + 1);
    return RegExp(r'^\d+$').hasMatch(c) ? int.parse(c) : 1000000 + (int.tryParse(c.replaceAll(RegExp(r'\D'), '')) ?? 0);
  }

  final jours = joursSeance(log, s);
  return jours.keys.where((k) => jours[k] == d).toList()..sort((a, b) => rang(a).compareTo(rang(b)));
}

/// La ligne d'historique d'une séance un jour donné (JSON, comme le site l'écrit), ou null si vide.
Map<String, dynamic>? ligneDe(Etat e, String s, String d, Map<String, Exercice> cat, [Map<String, dynamic> extra = const {}]) {
  final ex = <String, List<num>>{};
  final det = <Map<String, dynamic>>[];
  num vol = 0, ser = 0;
  var ts = 0;
  for (final k in journauxDuJour(e.log, s, d)) {
    final l = e.log[k]!, p = perfDe(l, cat);
    if (p == null) continue;
    ts = math.max(ts, l.ts);
    det.add({
      'id': l.ex,
      's': [
        for (final x in l.series.where((x) => okDe(l, x))) (x.lest ?? 0) > 0 ? [x.v, x.reps, x.lest] : [x.v, x.reps],
      ],
      if (l.feel != null) 'f': l.feel,
    });
    final a = ex[l.ex];
    ex[l.ex] = a != null
        ? [math.max(a[0], p[0]), a[1] + p[1], math.max(a[2], p[2]), p[2] > a[2] ? p[3] : a[3], a[4] + p[4]]
        : p;
    vol += p[1];
    ser += p[4];
  }
  if (ser == 0) return null;
  final parts = s.split('|');
  final i = parts.length > 1 ? int.tryParse(parts[1]) : null;
  final nom = i != null && i < e.seances.length && (e.seances[i]?.nom ?? '').isNotEmpty ? e.seances[i]!.nom : 'Séance libre';
  return {'d': d, 's': s, 'nom': nom, 'vol': vol, 'ser': ser, 'ex': ex, 'det': det, if (ts > 0) 'ts': ts, ...extra};
}

/// Insère ou remplace la ligne (même jour, même séance), ou la retire si elle est vide. Trié, borné.
List<dynamic> inscrire(List<dynamic> h, String d, String s, Map<String, dynamic>? l) {
  final r = [...h];
  final i = r.indexWhere((x) => x is Map && x['d'] == d && x['s'] == s);
  if (i >= 0) {
    if (l != null) {
      final a = r[i] as Map;
      final rec = math.max((l['rec'] as num?) ?? 0, (a['rec'] as num?) ?? 0);
      final min = l['min'] ?? a['min'], fo = l['fo'] ?? a['fo'];
      r[i] = {
        for (final e in l.entries)
          if (e.key != 'rec' && e.key != 'min' && e.key != 'fo') e.key: e.value,
        if (rec > 0) 'rec': rec,
        'min': ?min,
        'fo': ?fo,
      };
    } else {
      r.removeAt(i);
    }
  } else if (l != null) {
    r.add(l);
  }
  /* tri stable par jour, comme Array.prototype.sort */
  final indexes = List.generate(r.length, (k) => k);
  String jour(int k) => (r[k] is Map ? (r[k] as Map)['d']?.toString() : null) ?? '';
  indexes.sort((a, b) {
    final c = jour(a).compareTo(jour(b));
    return c != 0 ? c : a.compareTo(b);
  });
  final trie = [for (final k in indexes) r[k]];
  return trie.length > maxHistLignes ? trie.sublist(trie.length - maxHistLignes) : trie;
}

/// Range la séance faite (journaux de la séance libre `i`, dans l'ordre de ses exercices) dans
/// une copie du document du compte, et la renvoie. `min` : durée de la séance en minutes.
Map<String, dynamic> enregistrerSeance(
  Map<String, dynamic> brut,
  int i,
  List<Journal?> journaux,
  Map<String, Exercice> cat, {
  int? min,
  DateTime? maintenant,
}) {
  final doc = jsonDecode(jsonEncode(brut)) as Map<String, dynamic>;
  final log = (doc['LOG'] is Map) ? Map<String, dynamic>.from(doc['LOG'] as Map) : <String, dynamic>{};
  final s = 'L|$i';
  final nouvelles = <String>[];
  for (var j = 0; j < journaux.length; j++) {
    final l = journaux[j];
    if (l == null || perfDe(l, cat) == null) continue;
    var k = '$s|a$j';
    while (log.containsKey(k)) {
      k += '+';
    }
    log[k] = l.versJson();
    nouvelles.add(k);
  }
  doc['LOG'] = log;
  if (nouvelles.isEmpty) return doc;

  final e = Etat.depuis(doc);
  final jours = joursSeance(e.log, s);
  var h = (doc['HIST'] is List) ? List<dynamic>.from(doc['HIST'] as List) : <dynamic>[];
  for (final d in {for (final k in nouvelles) jours[k]!}) {
    h = inscrire(h, d, s, ligneDe(e, s, d, cat, {if (min != null && min > 0) 'min': min}));
  }
  doc['HIST'] = h;
  doc['ts'] = (maintenant ?? DateTime.now()).millisecondsSinceEpoch;
  return doc;
}
