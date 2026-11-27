// Charge proposée : mêmes cas que web/tests/progression-libre.test.ts et la partie séance de
// web/tests/mode.test.ts.
import 'package:flutter_test/flutter_test.dart';
import 'package:oxa/logique/charge.dart';
import 'package:oxa/logique/modele.dart';

import 'catalogue.dart';

const maintenant = 1800000000000, jour = 86400000;
Journal j(List<(num, num, bool)> series, [int? feel = 1, int ilYa = 3]) => Journal(
      ex: '',
      done: true,
      feel: feel,
      ts: maintenant - ilYa * jour,
      series: [for (final (v, reps, ok) in series) Serie(v: v, reps: reps, ok: ok)],
      reps: series.isEmpty ? null : series.last.$2,
    );
Proposition? p(String id, int s, int r, Journal d, [List<Journal> avant = const [], num obj = 0]) =>
    progressionLibre(cat[id]!, (s: s, r: r), d, obj: obj, avant: avant, maintenant: maintenant);

void main() {
  test('fourchette : ±2 en général, ±1 en force', () {
    expect(fourchette(10, 0), (bas: 8, haut: 12));
    expect(fourchette(6, 1), (bas: 5, haut: 7));
    expect(fourchette(12, 2), (bas: 10, haut: 14));
  });

  test('paliers : jambes 5 kg, barre 2,5 kg, haltères 2 kg, petits muscles 1 kg', () {
    expect(pasExercice(cat['sq']!), 5);
    expect(pasExercice(cat['dc']!), 2.5);
    expect(pasExercice(cat['dh']!), 2);
    expect(pasExercice(cat['cu']!), 1);
    expect(pasExercice(cat['lext']!), 2.5);
    expect(pasExercice(cat['lc']!), 2.5);
  });

  group('double progression', () {
    test('toutes les séries en haut : +1 palier et retour en bas', () {
      final r = p('dc', 3, 10, j([(60, 12, true), (60, 12, true), (60, 13, true)]))!;
      expect([r.v, r.reps], [62.5, 8]);
    });
    test('dans la fourchette : même charge, une répétition de plus', () {
      final r = p('dc', 3, 10, j([(60, 10, true), (60, 10, true), (60, 9, true)]))!;
      expect([r.v, r.reps], [60, 10]);
    });
    test('sous le bas une fois : même charge ; deux fois de suite : −10 %', () {
      final d = j([(60, 8, true), (60, 7, true), (60, 6, true)]);
      final a = p('dc', 3, 10, d)!;
      expect([a.v, a.reps], [60, 8]);
      final avant = j([(60, 8, true), (60, 6, true), (60, 6, true)], 1, 6);
      final b = p('dc', 3, 10, d, [avant])!;
      expect([b.v, b.reps], [52.5, 8]);
    });
    test('après une pause : −10 % à 10 jours, −20 % à 21 jours', () {
      Journal d(int n) => j([(60, 10, true), (60, 10, true), (60, 10, true)], 1, n);
      expect(p('dc', 3, 10, d(12))!.v, 52.5);
      expect(p('dc', 3, 10, d(25))!.v, 47.5);
    });
    test('trois séances à la même charge sans atteindre le haut : une variante', () {
      final d = j([(60, 10, true), (60, 10, true), (60, 10, true)]);
      final avant = [j([(60, 10, true), (60, 9, true), (60, 9, true)], 1, 6), j([(60, 9, true), (60, 9, true), (60, 9, true)], 1, 9)];
      expect(p('dc', 3, 10, d, avant)!.t, contains('variante'));
    });
    test('« Trop dur » : un palier de moins (poids du corps : une répétition de moins)', () {
      expect(p('dc', 3, 8, j([(60, 10, true), (60, 10, true), (60, 10, true)], 2))!.v, 57.5);
      expect(p('pomp', 3, 10, j([(10, 0, true), (11, 0, true), (10, 0, true)], 2))!.v, 9);
      expect(p('gai', 3, 30, j([(30, 0, true), (30, 0, true), (30, 0, true)], 2))!.v, 25);
    });
    test('« Facile », toutes les séries faites : un palier de plus', () {
      final r = p('dc', 3, 10, j([(60, 10, true), (60, 10, true), (60, 10, true)], 0))!;
      expect([r.v, r.reps], [62.5, 10]);
      expect(p('pomp', 3, 10, j([(10, 0, true), (10, 0, true), (10, 0, true)], 0))!.v, 11);
    });
    test('« Facile » mais séries manquantes : la règle habituelle', () {
      expect(p('dc', 3, 10, j([(60, 10, true), (60, 10, true), (60, 10, false)], 0))!.v, 60);
    });
    test('poids du corps : une répétition de plus ; gainage : 5 s de plus', () {
      expect(p('pomp', 3, 10, j([(10, 0, true), (11, 0, true), (10, 0, true)]))!.v, 11);
      expect(p('gai', 3, 30, j([(30, 0, true), (30, 0, true), (35, 0, true)]))!.v, 35);
    });
  });

  group('la séance en mode Suivi', () {
    final seances = [
      {'nom': 'Jambes', 'ex': [{'id': 'sq', 's': 4, 'r': 8, 'p': '2 min 30'}, {'id': 'pomp', 's': 3, 'r': 12, 'p': '60 s'}]},
    ];
    final fait = DateTime(2026, 11, 20, 18).millisecondsSinceEpoch;
    final log = {
      'L|0|a0': {'ex': 'sq', 'done': true, 'feel': null, 'ts': fait, 'series': List.generate(4, (_) => {'v': 80, 'reps': 10, 'ok': true})},
    };
    test('la charge suivante est proposée, avec son pourquoi', () {
      final e = Etat.depuis({'A': {'mode': 'suivi'}, 'SEANCES': seances, 'LOG': log});
      final c = ctxLibre(e, 0, 0, cat, maintenant: DateTime(2026, 11, 27, 18).millisecondsSinceEpoch)!;
      expect([c.v, c.reps], [85, 6]);
      expect(c.why, contains('+5 kg'));
      expect(c.variation(cat), 5);
      expect(c.vide, isFalse);
    });
    test('première fois : la case KG part vide, les répétitions de la séance', () {
      final c = ctxLibre(Etat.depuis({'SEANCES': seances}), 0, 0, cat)!;
      expect([c.v, c.reps, c.vide, c.prev, c.why], [0, 8, true, null, null]);
    });
    test('poids du corps, première fois : la valeur de départ de l\'exercice', () {
      final c = ctxLibre(Etat.depuis({'SEANCES': seances}), 0, 1, cat)!;
      expect([c.v, c.vide], [cat['pomp']!.d, false]);
    });
    test('le précédent vient d\'abord de Progrès (détail de la ligne du jour)', () {
      final e = Etat.depuis({
        'SEANCES': seances,
        'HIST': [
          {'d': '2026-11-24', 's': 'L|3', 'ex': {'sq': [0, 0, 90, 5, 2]}, 'det': [{'id': 'sq', 's': [[90, 5], [90, 4]]}]},
        ],
        'LOG': log,
      });
      final c = ctxLibre(e, 0, 0, cat, maintenant: DateTime(2026, 11, 27, 18).millisecondsSinceEpoch)!;
      expect(maxV(c.prev), 90);
      expect(resumeDe(c.prev!, cat['sq']!), '90 kg × 5, 90 kg × 4');
    });
    test('le record, s\'il dépasse le précédent', () {
      final e = Etat.depuis({
        'SEANCES': seances,
        'HIST': [{'d': '2026-10-01', 's': 'L|0', 'ex': {'sq': [0, 0, 100, 3, 3]}}],
        'LOG': log,
      });
      final c = ctxLibre(e, 0, 0, cat, maintenant: DateTime(2026, 11, 27, 18).millisecondsSinceEpoch)!;
      expect(fmtMax('kg', c.max!), '100 kg × 3');
    });
  });

  test('repos : « 2 min 30 », « 60 s », 90 s par défaut', () {
    expect(secondesDe('2 min 30'), 150);
    expect(secondesDe('60 s'), 60);
    expect(secondesDe(''), 90);
  });
}
