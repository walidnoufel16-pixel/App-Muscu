// Enregistrement d'une séance : mêmes cas que web/tests/historique.test.ts, puis la séance
// complète rangée dans le document du compte comme le ferait le site.
import 'package:flutter_test/flutter_test.dart';
import 'package:oxa/logique/charge.dart';
import 'package:oxa/logique/enregistrer.dart';
import 'package:oxa/logique/modele.dart';

import 'catalogue.dart';

int ts(String j, [int h = 18]) => DateTime.parse('${j}T${h.toString().padLeft(2, '0')}:00:00').millisecondsSinceEpoch;
Map<String, dynamic> jn(String ex, List<Map<String, dynamic>> series, int t, {bool done = true}) =>
    {'done': done, 'feel': null, 'ex': ex, 'ts': t, 'series': series};

void main() {
  test('1RM estimé (Epley), plafonné à 12 reps', () {
    expect(e1rm(100, 1), 100);
    expect(e1rm(100, 10), 133.3);
    expect(e1rm(100, 20), e1rm(100, 12));
    expect(e1rm(0, 5), 0);
  });

  test('ligne d\'une séance : séries validées du jour, volume, meilleur 1RM', () {
    final e = Etat.depuis({
      'SEANCES': [{'nom': 'Push', 'ex': []}],
      'LOG': {
        'L|0|0': jn('dc', [{'v': 60, 'reps': 8, 'ok': true}, {'v': 70, 'reps': 5, 'ok': true}, {'v': 80, 'reps': 5}], ts('2026-10-01'), done: false),
        'L|0|1': jn('dc', [{'v': 50, 'reps': 10, 'ok': true}], ts('2026-10-01')),
        'L|0|2': jn('dc', [{'v': 90, 'reps': 3, 'ok': true}], ts('2026-09-20')),
      },
    });
    final l = ligneDe(e, 'L|0', '2026-10-01', cat)!;
    expect(l['nom'], 'Push');
    expect(l['ser'], 3);
    expect(l['vol'], 60 * 8 + 70 * 5 + 500);
    expect((l['ex'] as Map)['dc'][0], e1rm(70, 5));
    expect((l['ex'] as Map)['dc'][2], 70);
    expect(ligneDe(e, 'L|0', '2026-10-02', cat), isNull);
  });

  test('inscrire remplace la ligne du même jour, retire une ligne vide, garde records et durée', () {
    Map<String, dynamic> l(String d, int ser, [Map<String, dynamic> x = const {}]) =>
        {'d': d, 's': 'L|0', 'nom': 'Push', 'vol': 0, 'ser': ser, 'ex': {}, ...x};
    var h = inscrire([], '2026-10-01', 'L|0', l('2026-10-01', 2, {'rec': 1, 'min': 40}));
    h = inscrire(h, '2026-09-01', 'L|0', l('2026-09-01', 1));
    h = inscrire(h, '2026-10-01', 'L|0', l('2026-10-01', 5));
    expect(h.map((x) => [x['d'], x['ser'], x['rec'], x['min']]).toList(), [
      ['2026-09-01', 1, null, null],
      ['2026-10-01', 5, 1, 40],
    ]);
    expect(inscrire(h, '2026-10-01', 'L|0', null), hasLength(1));
  });

  test('historique borné', () {
    var h = <dynamic>[];
    for (var i = 0; i < maxHistLignes + 20; i++) {
      final d = DateTime(2025, 1, 1 + i);
      final j = '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
      h = inscrire(h, j, 'L|0', {'d': j, 's': 'L|0', 'nom': '', 'vol': 0, 'ser': 1, 'ex': {}});
    }
    expect(h, hasLength(maxHistLignes));
    expect(h.first['d'], '2025-01-21');
  });

  group('enregistrer une séance faite dans l\'appli', () {
    final brut = {
      'A': {'mode': 'suivi', 'inconnu': 1},
      'SEANCES': [
        {'nom': 'Jambes', 'ex': [{'id': 'sq', 's': 2, 'r': 8, 'p': '2 min'}, {'id': 'pomp', 's': 2, 'r': 12, 'p': '60 s'}, {'id': 'dc', 's': 3, 'r': 10, 'p': '2 min'}]},
      ],
      'LOG': {
        'L|0|a0': jn('sq', [{'v': 80, 'reps': 8, 'ok': true}], ts('2026-11-20')),
      },
      'HIST': [
        {'d': '2026-11-20', 's': 'L|0', 'nom': 'Jambes', 'vol': 640, 'ser': 1, 'ex': {'sq': [0, 640, 80, 8, 1]}},
      ],
      'CARDIO': [{'ts': 1}],
      'ts': 5,
    };
    final t = ts('2026-11-27');
    final journaux = [
      Journal(ex: 'sq', ts: t, done: true, series: [Serie(v: 85, reps: 8, ok: true), Serie(v: 85, reps: 7, ok: true)]),
      Journal(ex: 'pomp', ts: t + 60000, series: [Serie(v: 12, reps: 0, ok: true), Serie(v: 10, reps: 0, ok: false)]),
      null, // développé couché : rien de validé
    ];
    final doc = enregistrerSeance(brut, 0, journaux, cat, min: 42, maintenant: DateTime.fromMillisecondsSinceEpoch(t + 120000));

    test('les journaux sont rangés « mis de côté », sans écraser ceux d\'avant', () {
      final log = doc['LOG'] as Map;
      expect(log.keys, ['L|0|a0', 'L|0|a0+', 'L|0|a1']);
      expect(log['L|0|a0+']['series'][0], {'v': 85, 'reps': 8, 'ok': true});
    });
    test('la ligne du jour entre dans l\'historique, avec la durée', () {
      final h = doc['HIST'] as List;
      expect(h, hasLength(2));
      final l = h.last as Map;
      expect([l['d'], l['s'], l['nom'], l['ser'], l['min']], ['2026-11-27', 'L|0', 'Jambes', 3, 42]);
      expect((l['ex'] as Map)['sq'], [e1rm(85, 8), 85 * 8 + 85 * 7, 85, 8, 2]);
      expect((l['det'] as List).map((x) => x['id']), ['sq', 'pomp']);
    });
    test('le reste du document est gardé, le document est daté', () {
      expect(doc['A'], {'mode': 'suivi', 'inconnu': 1});
      expect(doc['CARDIO'], [{'ts': 1}]);
      expect(doc['ts'], t + 120000);
      expect((brut['LOG'] as Map).length, 1, reason: 'le document d\'origine n\'est pas modifié');
    });
    test('la prochaine fois, la séance repart de ce qui vient d\'être fait', () {
      final c = ctxLibre(Etat.depuis(doc), 0, 0, cat, maintenant: t + jour())!;
      expect(maxV(c.prev), 85);
      expect(c.vide, isFalse);
    });
    test('rien de validé : rien n\'est écrit', () {
      final d = enregistrerSeance(brut, 0, [null, null, null], cat);
      expect(d['HIST'], brut['HIST']);
      expect(d['ts'], 5);
    });
  });
}

int jour() => 86400000;
