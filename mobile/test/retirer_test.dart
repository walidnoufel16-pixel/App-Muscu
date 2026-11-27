// Relire et retirer une séance passée : mêmes cas que web/tests/detail.test.ts et web/tests/retirer.test.ts.
import 'package:flutter_test/flutter_test.dart';
import 'package:oxa/logique/enregistrer.dart';
import 'package:oxa/logique/mode.dart';
import 'package:oxa/logique/modele.dart';
import 'package:oxa/logique/retirer.dart';

import 'catalogue.dart';

int ts(String j) => DateTime.parse('${j}T18:00:00').millisecondsSinceEpoch;

Map<String, dynamic> etat() => {
  'A': {},
  'SEANCES': [
    {
      'nom': 'Push',
      'ex': [
        {'id': 'dc', 's': 3, 'r': 10, 'p': '2 min'},
      ],
      'blocs': [
        {'id': 'b1'},
      ],
    },
  ],
  'LOG': {
    'L|0|a0': {
      'done': true,
      'ex': 'dc',
      'ts': ts('2026-11-03'),
      'v': 60,
      'reps': 10,
      'feel': 1,
      'series': [
        {'v': 60, 'reps': 10, 'ok': true},
      ],
    },
  },
  'HIST': [
    {
      'd': '2026-11-01',
      's': 'L|0',
      'nom': 'Push',
      'vol': 500,
      'ser': 3,
      'ex': {
        'dc': [55, 500, 55, 10, 3],
      },
    },
    {
      'd': '2026-11-03',
      's': 'L|0',
      'nom': 'Push',
      'vol': 600,
      'ser': 3,
      'ex': {
        'dc': [60, 600, 60, 10, 3],
      },
    },
  ],
  'CARDIO': [
    {'nom': 'Bloc', 'f': 'endurance', 'm': 'tapis', 'min': 10, 'effort': 1, 'ts': ts('2026-11-03'), 'ref': 'b1'},
    {'nom': 'Vélo', 'f': 'endurance', 'm': 'velo', 'min': 20, 'effort': 1, 'ts': ts('2026-11-02')},
  ],
  'X': {'inconnu': true},
};

void main() {
  group("retirer une séance de l'historique", () {
    test('la ligne, ses séries du jour et le cardio de ses blocs disparaissent ; le reste reste', () {
      final brut = etat();
      final e = retirerDeHistorique(brut, '2026-11-03', 'L|0', maintenant: DateTime(2026, 11, 27, 12));
      expect([for (final l in e['HIST'] as List) l['d']], ['2026-11-01']);
      expect(e['LOG'] as Map, isEmpty);
      expect([for (final c in e['CARDIO'] as List) c['nom']], ['Vélo']);
      expect(e['SEANCES'] as List, hasLength(1));
      final r = (e['RETIRES'] as List).cast<String>();
      expect(r.any((x) => x.startsWith('2026-11-03|L|0@')), isTrue);
      expect(r, contains('c|${ts('2026-11-03')}'));
      expect(e['X'], {'inconnu': true});
      expect(e['ts'], DateTime(2026, 11, 27, 12).millisecondsSinceEpoch);
      // le document de départ n'est pas touché
      expect(brut['HIST'] as List, hasLength(2));
    });

    test("les séries d'un autre jour de la même séance restent", () {
      final brut = etat();
      (brut['LOG'] as Map)['L|0|a1'] = {
        'done': true,
        'ex': 'dc',
        'ts': ts('2026-11-01'),
        'series': [
          {'v': 55, 'reps': 10, 'ok': true},
        ],
      };
      final e = retirerDeHistorique(brut, '2026-11-03', 'L|0');
      expect((e['LOG'] as Map).keys, ['L|0|a1']);
    });

    test('RETIRES gardé à 300 entrées au plus', () {
      final brut = etat()..['RETIRES'] = [for (var i = 0; i < 300; i++) 'x$i'];
      final r = retirerDeHistorique(brut, '2026-11-03', 'L|0')['RETIRES'] as List;
      expect(r, hasLength(300));
      expect(r.first, 'x2');
    });

    test('texte de confirmation : une séance auto ne parle pas de Mes séances', () {
      expect(texteRetrait(Etat.depuis(etat()), 'L|0'), contains('reste dans Mes séances'));
      final auto = etat();
      (auto['SEANCES'] as List)[0]['auto'] = true;
      expect(texteRetrait(Etat.depuis(auto), 'L|0'), isNot(contains('Mes séances')));
    });
  });

  group('relire une séance passée', () {
    final auj = jourDe(DateTime.now());
    Map<String, dynamic> j(String ex, List<List<num>> s) => {
      'ex': ex,
      'done': true,
      'nb': s.length,
      'feel': 1,
      'ts': DateTime.now().millisecondsSinceEpoch,
      'series': [
        for (final x in s) {'v': x[0], 'reps': x[1], 'ok': true},
      ],
    };
    Etat e(Map<String, dynamic> log) => Etat.depuis({
      'SEANCES': [
        {'nom': 'Push', 'ex': []},
      ],
      'LOG': log,
      'HIST': [],
    });

    test("l'historique garde chaque série, dans l'ordre de la séance", () {
      final l = ligneDe(
        e({
          'L|0|1': j('dmh', [
            [20, 10],
          ]),
          'L|0|0': j('dc', [
            [60, 8],
            [62.5, 8],
          ]),
          'L|0|a2': j('tricor', [
            [9, 10],
          ]),
        }),
        'L|0',
        auj,
        cat,
      )!;
      final det = (l['det'] as List).cast<Map>();
      expect(det.map((x) => x['id']), ['dc', 'dmh', 'tricor']);
      expect(det[0]['s'], [
        [60, 8],
        [62.5, 8],
      ]);
      expect(det[0]['f'], 1);
    });

    test("détail : celui de l'historique, sinon le journal du jour, sinon le résumé", () {
      final avec = e({
        'L|0|0': j('dc', [
          [60, 8],
          [65, 6],
        ]),
      });
      final avecDet = LigneHist.depuis(ligneDe(avec, 'L|0', auj, cat)!);
      expect(detailDe(e({}), avecDet, cat)[0].l.series.map((s) => s.v), [60, 65]);
      final ancien = LigneHist(d: avecDet.d, s: avecDet.s, nom: avecDet.nom, ser: avecDet.ser, ex: avecDet.ex);
      expect(detailDe(avec, ancien, cat)[0].l.series.map((s) => s.v), [60, 65]); // journal encore là
      final resume = detailDe(
        e({}),
        LigneHist(
          d: auj,
          s: 'L|0',
          ex: {
            'dc': [80, 900, 65, 6, 2],
          },
        ),
        cat,
      );
      expect(resume[0].l.series, hasLength(2));
      expect((resume[0].l.series[0].v, resume[0].l.series[0].reps), (65, 6));
    });

    test('poids du corps résumé : la valeur est le nombre de répétitions, le lest à part', () {
      final r = detailDe(
        e({}),
        LigneHist(
          d: auj,
          s: 'L|0',
          ex: {
            'pomp': [0, 0, 5, 12, 3],
          },
        ),
        cat,
      );
      expect(r[0].l.series, hasLength(3));
      expect((r[0].l.series[0].v, r[0].l.series[0].lest), (12, 5));
    });
  });
}
