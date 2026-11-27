/* La charge proposée en séance (mode Suivi), reprise de web/lib/logic/core.ts : mêmes règles,
   mêmes textes, mêmes tests (web/tests/progression-libre.test.ts).
   - Double progression dans une fourchette de répétitions.
   - Après une pause de 10 jours : −10 %, de 21 jours : −20 %.
   - Première fois sur un exercice à charge : rien à suivre, la case KG part vide.
   Pas repris ici : la forme du jour et les zones douloureuses, que le mode Suivi ne demande pas. */
import 'dart:math' as math;

import 'mode.dart' show nb;
import 'modele.dart';

const _pasLourd = {'eg', 'fh'};
const _pasMoyen = {'ph', 'pv', 'tv', 'th'};
const _petits = {'re', 'ep', 'fc', 'ec', 'avb', 'tra', 'mol', 'add', 'ae', 'soin'};

/// Unité affichée d'un type de charge.
const unite = {'kg': 'kg', 'lest': 'kg', 'aucune': 'reps', 'temps': 's', 'dist': 'm'};

num _r2(num v) => (v * 100).round() / 100;

/// Palier du plan (aussi utilisé pour les exercices sans charge).
num pasDe(Exercice x) {
  if (x.ch == 'temps') return 5;
  if (x.ch == 'dist') return 50;
  if (x.ch == 'aucune') return 1;
  if (_pasLourd.contains(x.pat)) return 5;
  if (_pasMoyen.contains(x.pat)) return 2.5;
  return 1;
}

/// Palier de charge en séance libre : selon le matériel et le mouvement.
num pasExercice(Exercice x) {
  if (x.ch != 'kg') return pasDe(x);
  final jambesLourdes = _pasLourd.contains(x.pat) && x.pat2 != null && x.pat2!.isNotEmpty;
  if (x.eq == 1 || x.eq == 0) return jambesLourdes ? 5 : 2.5;
  if (x.eq == 2) return _petits.contains(x.pat) || x.pat2 == null || x.pat2!.isEmpty ? 1 : 2;
  return 2.5;
}

/// Charge arrondie au palier inférieur.
num auPalier(num v, num pas) => math.max(0, ((v / pas + 1e-9).floor() * pas * 100).round() / 100);

/// Fourchette de répétitions : ±1 en force (obj 1), ±2 sinon.
({int bas, int haut}) fourchette(int r, [num? obj]) {
  final w = obj == 1 ? 1 : 2;
  return (bas: math.max(1, r - w), haut: r + w);
}

bool okDe(Journal l, Serie s) => s.ok ?? l.done;

num maxV(Journal? l) {
  if (l == null) return 0;
  if (l.series.isNotEmpty) return l.series.map((s) => s.v).reduce(math.max);
  return l.v ?? 0;
}

num _minReps(Journal d, bool dbl) {
  final ok = d.series.where((s) => okDe(d, s)).toList();
  return ok.isEmpty ? 0 : ok.map((s) => dbl ? s.reps : s.v).reduce(math.min);
}

String _jourLocal(int ts) {
  final d = DateTime.fromMillisecondsSinceEpoch(ts);
  String z(int n) => n.toString().padLeft(2, '0');
  return '${d.year}-${z(d.month)}-${z(d.day)}';
}

int _midi(String d) {
  final p = d.split('-').map(int.parse).toList();
  return DateTime(p[0], p[1], p[2], 12).millisecondsSinceEpoch;
}

/// Dernier journal terminé de l'exercice, hors de la ligne `sauf`.
Journal? precedentDe(Map<String, Journal> log, String id, [String? sauf]) {
  Journal? best;
  for (final e in log.entries) {
    final l = e.value;
    if (e.key != sauf && l.done && l.ex == id && (best == null || l.ts > best.ts)) best = l;
  }
  return best;
}

/// Les n dernières fois où l'exercice figure dans Progrès, de la plus récente à la plus ancienne
/// (la séance en cours exclue).
List<Journal> historiqueEx(Etat e, String id, String k, [int n = 3]) {
  final s = k.split('|').take(2).join('|');
  final cur = e.log[k];
  final auj = cur != null && cur.ts > 0 && cur.series.any((x) => okDe(cur, x)) ? _jourLocal(cur.ts) : null;
  final out = <Journal>[];
  for (var i = e.hist.length - 1; i >= 0 && out.length < n; i--) {
    final l = e.hist[i];
    if (l.s == s && l.d == auj) continue;
    final dets = l.det.where((x) => x.id == id && x.s.isNotEmpty).toList();
    if (dets.isEmpty) continue;
    final det = dets.last;
    final series = [
      for (final x in det.s)
        Serie(v: x.isNotEmpty ? x[0] : 0, reps: x.length > 1 ? x[1] : 0, ok: true, lest: x.length > 2 && x[2] != 0 ? x[2] : null),
    ];
    out.add(Journal(
      ex: id,
      done: true,
      nb: series.length,
      feel: det.f,
      ts: _midi(l.d),
      series: series,
      v: series.map((x) => x.v).reduce(math.max),
      reps: series.last.reps,
      lest: series.any((x) => (x.lest ?? 0) > 0),
    ));
  }
  return out;
}

/// La variante la plus récente du même mouvement dans l'historique (règle de pause : le muscle
/// a travaillé). Renvoie l'instant de cette séance (midi du jour).
int? varianteRecente(Etat e, String id, Map<String, Exercice> cat) {
  final x = cat[id];
  if (x == null) return null;
  for (var i = e.hist.length - 1; i >= 0; i--) {
    for (final o in e.hist[i].ex.keys) {
      final y = cat[o];
      if (o == id || y == null || y.pat != x.pat) continue;
      return _midi(e.hist[i].d);
    }
  }
  return null;
}

class Proposition {
  final num v;
  final num reps;
  final String t;
  const Proposition(this.v, this.reps, this.t);
}

/// Double progression en séance libre (voir l'en-tête). `avant` : les séances précédentes à d.
Proposition? progressionLibre(Exercice x, ({int s, int r}) cible, Journal d,
    {num? obj, List<Journal> avant = const [], int? maintenant, int? voisin}) {
  final ok = d.series.where((s) => okDe(d, s)).toList();
  final dbl = x.ch == 'kg' || x.ch == 'lest';
  final v = maxV(d), reps = d.reps ?? cible.r;
  final chargee = x.ch == 'kg' || (x.ch == 'lest' && v > 0);
  final dernier = math.max(d.ts, voisin ?? 0);
  final jours = dernier > 0 ? (((maintenant ?? DateTime.now().millisecondsSinceEpoch) - dernier) / 864e5).floor() : 0;
  if (chargee && jours >= 10) {
    final pas = pasExercice(x), pc = jours >= 21 ? 20 : 10, nv = auPalier(v * (1 - pc / 100), pas);
    if (nv < v) return Proposition(nv, cible.r, 'Reprise après $jours jours sans cet exercice : −$pc % pour réhabituer tes muscles.');
  }
  if (x.ch == 'dist') return d.feel == 2 ? Proposition(v, reps, 'Même distance : la dernière fois était au-dessus de la cible.') : null;
  if (d.feel == 2 || (d.feel == 0 && ok.length >= cible.s)) {
    final monte = d.feel == 0;
    if (chargee) {
      final pas = pasExercice(x), nv = monte ? _r2(v + pas) : auPalier(v - pas, pas);
      if (nv != v) {
        return monte
            ? Proposition(nv, math.min(math.max(_minReps(d, dbl), 1), fourchette(cible.r, obj).haut),
                '+${nb(pas)} kg : la dernière fois, c\'était facile pour l\'effort visé.')
            : Proposition(nv, reps, '−${nb(pas)} kg : la dernière fois, c\'était trop dur.');
      }
      if (!monte) return Proposition(v, reps, 'Même charge : la dernière fois était au-dessus de la cible.');
    } else if (ok.isNotEmpty) {
      final bas = ok.map((s) => dbl ? s.reps : s.v).reduce(math.min);
      if (x.ch == 'temps') {
        final pas = pasDe(x);
        return monte
            ? Proposition(bas + pas, reps, '+$pas s : la dernière fois, c\'était facile.')
            : Proposition(math.max(pas, bas - pas), reps, '−$pas s : la dernière fois, c\'était trop dur.');
      }
      if (x.ch == 'lest') {
        return monte
            ? Proposition(v, bas + 1, 'Une répétition de plus : la dernière fois, c\'était facile. Ou un lest de 2,5 kg.')
            : Proposition(v, math.max(1, bas - 1), 'Une répétition de moins : la dernière fois, c\'était trop dur.');
      }
      return monte
          ? Proposition(bas + 1, reps, 'Une répétition de plus : la dernière fois, c\'était facile.')
          : Proposition(math.max(1, bas - 1), reps, 'Une répétition de moins : la dernière fois, c\'était trop dur.');
    }
  }

  if (chargee) {
    final pas = pasExercice(x), f = fourchette(cible.r, obj), m = _minReps(d, dbl), complet = ok.length >= cible.s;
    if (complet && m >= f.haut) {
      return Proposition(_r2(v + pas), f.bas,
          'Toutes tes séries à ${f.haut} répétitions ou plus : +${nb(pas)} kg, et tu repars à ${f.bas} répétitions.');
    }
    if (!complet || m < f.bas) {
      final p = avant.isNotEmpty ? avant.first : null;
      if (p != null && maxV(p) >= v && (_minReps(p, dbl) < f.bas || p.series.where((s) => okDe(p, s)).length < cible.s)) {
        final nv = auPalier(v * 0.9, pas);
        if (nv < v) return Proposition(nv, f.bas, 'Deux séances sous ${f.bas} répétitions : −10 % pour repartir sur de bonnes bases.');
      }
      return Proposition(v, f.bas, 'Même charge : vise au moins ${f.bas} répétitions sur chaque série.');
    }
    final vise = math.min(f.haut, m + 1);
    final stagne = avant.length >= 2 && avant.take(2).every((p) => maxV(p) == v && _minReps(p, dbl) < f.haut);
    return Proposition(
      v,
      vise,
      'Même charge, vise $vise répétitions : à ${f.haut} sur toutes tes séries, on ajoute ${nb(pas)} kg.'
      '${stagne ? ' Ça stagne depuis trois séances : essaie une variante de l\'exercice.' : ''}',
    );
  }

  final atteint = ok.length >= cible.s && ok.every((s) => (dbl ? s.reps : s.v) >= cible.r);
  if (!atteint) return null;
  if (x.ch == 'lest') {
    return Proposition(v, reps + 1, 'Toutes tes séries réussies la dernière fois : une répétition de plus, ou un lest de 2,5 kg.');
  }
  final bas = ok.map((s) => s.v).reduce(math.min), pas = pasDe(x);
  if (x.ch == 'temps') return Proposition(bas + pas, reps, 'Toutes tes séries tenues la dernière fois : +$pas s.');
  return Proposition(bas + 1, reps, 'Toutes tes séries réussies la dernière fois : une répétition de plus.');
}

/// Première fois sans historique, pour un exercice sans charge : la valeur de départ de
/// l'exercice (lest : au poids du corps, sauf pour un pratiquant confirmé).
num departSansCharge(Map<String, dynamic> a, Exercice x) {
  if (x.ch == 'lest') return ((a['regularite'] as num?) ?? 0) >= 3 ? x.d : 0;
  return x.d;
}

/// Meilleure performance passée sur un exercice (séance en cours exclue).
class MaxEx {
  final num v;
  final num reps;
  final String d;
  const MaxEx(this.v, this.reps, this.d);
}

num _scoreMax(String? ch, num v, num reps) => ch == 'temps' || ch == 'dist' ? v : v * 1000 + reps;

MaxEx? maxHist(Etat e, String id, String k, Map<String, Exercice> cat) {
  final s = k.split('|').take(2).join('|');
  final cur = e.log[k];
  final auj = cur != null && cur.ts > 0 && cur.series.any((x) => okDe(cur, x)) ? _jourLocal(cur.ts) : null;
  final ch = cat[id]?.ch;
  MaxEx? best;
  for (final l in e.hist) {
    final p = l.ex[id];
    if (p == null || p.length < 4 || (l.s == s && l.d == auj)) continue;
    final m = MaxEx(p[2], p[3], l.d);
    if (best == null || _scoreMax(ch, m.v, m.reps) > _scoreMax(ch, best.v, best.reps)) best = m;
  }
  return best;
}

/// Le max, seulement s'il dépasse ce que montre « Précédent ».
MaxEx? maxAuDessus(String id, MaxEx? max, Journal? prev, Map<String, Exercice> cat) {
  if (max == null) return null;
  final ch = cat[id]?.ch;
  num p = 0;
  if (prev != null) {
    for (final x in prev.series.where((x) => okDe(prev, x))) {
      final v = ch == 'aucune' ? (x.lest ?? 0) : x.v, r = ch == 'aucune' ? x.v : x.reps;
      p = math.max(p, _scoreMax(ch, v, r));
    }
  }
  return _scoreMax(ch, max.v, max.reps) > p ? max : null;
}

/// « 10 kg × 8 », « +5 kg × 6 », « 15 réps », « 75 s », « 500 m ».
String fmtMax(String? ch, MaxEx m) {
  if (ch == 'kg') return '${nb(m.v)} kg × ${nb(m.reps)}';
  if (ch == 'temps') return '${nb(m.v)} s';
  if (ch == 'dist') return '${nb(m.v)} m';
  return m.v > 0 ? '+${nb(m.v)} kg × ${nb(m.reps)}' : '${nb(m.reps)} réps';
}

/// Une série en court : « 80 × 10 », « 45 s », « 12 ».
String fmtSerie(Exercice x, Serie? s) {
  if (s == null) return '—';
  final b = x.ch == 'kg' || x.ch == 'lest'
      ? '${nb(s.v)} × ${nb(s.reps)}'
      : x.ch == 'temps'
          ? '${nb(s.v)} s'
          : x.ch == 'dist'
              ? '${nb(s.v)} m'
              : nb(s.v);
  return (s.lest ?? 0) > 0 ? '$b +${nb(s.lest!)}kg' : b;
}

/// Résumé d'un journal : « 3 × 80 kg × 10 » ou « 80 kg × 10, 80 kg × 9 ».
String resumeDe(Journal l, Exercice x) {
  final u = unite[x.ch] ?? '';
  final s = l.series.isNotEmpty ? l.series : [Serie(v: l.v ?? 0, reps: l.reps ?? 0)];
  String par(Serie y) =>
      '${nb(y.v)}${u.isNotEmpty ? ' $u' : ''}${x.ch == 'kg' || x.ch == 'lest' ? ' × ${nb(y.reps)}' : ''}'
      '${l.lest && (y.lest ?? 0) > 0 ? ' +${nb(y.lest!)} kg' : ''}';
  final tous = s.every((y) => y.v == s[0].v && y.reps == s[0].reps && (y.lest ?? 0) == (s[0].lest ?? 0));
  const feels = ['facile', 'juste', 'trop dur'];
  return (tous ? '${s.length} × ${par(s[0])}' : s.map(par).join(', ')) +
      (l.feel != null && l.feel! >= 0 && l.feel! < 3 ? ' · ${feels[l.feel!]}' : '');
}

/// Durée de repos en secondes, depuis « 2 min 30 » ou « 60 s » (90 s par défaut).
int secondesDe(String t) {
  final m = RegExp(r'(\d+)\s*min\s*(\d+)?').firstMatch(t), sec = RegExp(r'(\d+)\s*s\b').firstMatch(t);
  final v = m != null ? int.parse(m[1]!) * 60 + (int.tryParse(m[2] ?? '') ?? 0) : sec != null ? int.parse(sec[1]!) : 0;
  return v > 0 ? v : 90;
}

String kLibre(int idx, int j) => 'L|$idx|$j';

/// Ce que l'écran de séance affiche pour un exercice : la charge proposée et pourquoi,
/// le précédent, le record s'il le dépasse.
class Ctx {
  final String k;
  final String id;
  final int n;
  final num v;
  final num reps;
  final String? why;
  final String repos;
  final Journal? prev;
  final bool vide;
  final MaxEx? max;
  const Ctx({
    required this.k,
    required this.id,
    required this.n,
    required this.v,
    required this.reps,
    required this.repos,
    this.why,
    this.prev,
    this.vide = false,
    this.max,
  });

  /// Variation de la charge proposée par rapport à la dernière fois (exercices en kg).
  num variation(Map<String, Exercice> cat) => cat[id]?.ch == 'kg' && prev != null ? _r2(v - maxV(prev)) : 0;
}

/// La charge proposée pour l'exercice j de la séance libre idx, en mode Suivi.
Ctx? ctxLibre(Etat e, int idx, int j, Map<String, Exercice> cat, {int? maintenant}) {
  final s = idx >= 0 && idx < e.seances.length ? e.seances[idx] : null;
  if (s == null || j < 0 || j >= s.ex.length) return null;
  final ex = s.ex[j], x = cat[ex.id];
  if (x == null) return null;
  final k = kLibre(idx, j);
  final h = historiqueEx(e, ex.id, k, 3);
  final d = h.isNotEmpty ? h.first : precedentDe(e.log, ex.id, k);
  if (d == null && x.ch == 'kg') {
    return Ctx(k: k, id: ex.id, n: ex.s, v: 0, reps: ex.r, repos: ex.p, vide: true);
  }
  final pr = d == null
      ? null
      : progressionLibre(x, (s: ex.s, r: ex.r), d,
          obj: s.obj, avant: h.skip(1).toList(), voisin: varianteRecente(e, ex.id, cat), maintenant: maintenant);
  final v = pr?.v ?? (d != null ? maxV(d) : departSansCharge(e.a, x));
  final reps = pr?.reps ?? (d != null ? (d.reps ?? ex.r) : ex.r);
  final why = pr?.t ?? (d != null ? 'Reprise de ta dernière séance sur cet exercice.' : null);
  return Ctx(
    k: k,
    id: ex.id,
    n: ex.s,
    v: v,
    reps: reps,
    why: why,
    repos: ex.p,
    prev: d,
    max: maxAuDessus(ex.id, maxHist(e, ex.id, k, cat), d, cat),
  );
}
