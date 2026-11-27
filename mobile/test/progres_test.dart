// L'onglet Progrès : mêmes cas de test que le site (web/tests/historique.test.ts, motivation.test.ts,
// progression-exercice.test.ts).
import 'package:flutter_test/flutter_test.dart';
import 'package:oxa/logique/mode.dart';
import 'package:oxa/logique/modele.dart';
import 'package:oxa/logique/progres.dart';

import 'catalogue.dart';

LigneHist L(String d, [Map<String, List<num>> ex = const {}]) => LigneHist(d: d, s: 'L|0', ser: 1, ex: ex);
List<LigneHist> semaine(String lundi, int n) => [for (var i = 0; i < n; i++) L(decaler(lundi, i))];

void main() {
  group('semaines', () {
    test('lundi et décalages', () {
      expect(lundiDe('2026-10-04'), '2026-09-28'); // dimanche → lundi précédent
      expect(lundiDe('2026-09-28'), '2026-09-28');
      expect(decaler('2026-02-27', 3), '2026-03-02');
    });

    test('séries par muscle : 1 au muscle principal, ½ au secondaire', () {
      final h = [
        const LigneHist(d: '2026-09-29', s: 'L|0', ser: 6, ex: {'dc': [80, 1000, 70, 5, 4]}),
        const LigneHist(d: '2026-10-02', s: 'L|0', ser: 3, ex: {'dc': [80, 500, 70, 5, 3]}),
      ];
      expect(seriesParMuscle(h, '2026-09-28', '2026-10-04', cat), {'pec': 7, 'tri': 3.5});
    });

    test('séries de la semaine comparées à la semaine passée au même jour', () {
      final h = [
        const LigneHist(d: '2026-09-29', s: 'L|0', ser: 6),
        const LigneHist(d: '2026-10-03', s: 'L|0', ser: 10), // samedi d'avant : pas encore compté un jeudi
        const LigneHist(d: '2026-10-06', s: 'L|0', ser: 9),
      ];
      final s = seriesSemaine(h, '2026-10-08');
      expect([s.cette, s.avant], [9, 6]);
      expect(ecart(9, 6), 50);
      expect(ecart(9, 0), null);
    });
  });

  group('série de semaines', () {
    const auj = '2026-10-07'; // mercredi, semaine du 5 octobre
    test('objectif : réglé, sinon questionnaire, sinon 2', () {
      expect(objectifHebdo({}), 2);
      expect(objectifHebdo({'socle': 1}), 3);
      expect(objectifHebdo({'socle': 1, 'objHebdo': 9}), 6);
    });
    test("semaines réussies d'affilée ; la semaine en cours ne casse rien", () {
      final h = [...semaine('2026-09-14', 2), ...semaine('2026-09-21', 2), ...semaine('2026-09-28', 3), ...semaine('2026-10-05', 1)];
      final s = serieSemaines(h, [], 2, auj);
      expect(s.semaines, 3);
      expect(s.cetteSemaine, 1);
      expect(serieSemaines([...h, L('2026-10-07')], [], 2, auj).semaines, 4);
    });
    test('une semaine manquée par mois est couverte par le joker, pas deux', () {
      final h = [...semaine('2026-08-31', 2), ...semaine('2026-09-14', 2), ...semaine('2026-09-28', 2)];
      expect(serieSemaines(h, [], 2, auj).semaines, 1);
      final t = serieSemaines([...semaine('2026-09-14', 2), ...semaine('2026-09-28', 2)], [], 2, auj);
      expect([t.semaines, t.jokers, t.jokerDispo], [2, ['2026-09-21'], true]);
    });
    test("le cardio seul compte, pas un bloc d'une séance combinée", () {
      final t = DateTime(2026, 10, 6, 10).millisecondsSinceEpoch;
      final e = Etat.depuis({
        'CARDIO': [
          {'ts': t, 'min': 10},
          {'ts': t, 'min': 10, 'ref': '0|b1'},
        ],
      });
      expect(serieSemaines([], e.joursCardio, 2, auj).cetteSemaine, 1);
    });
  });

  group('progression par exercice', () {
    final h = [
      const LigneHist(d: '2026-10-21', s: 'L|0', ser: 3, ex: {'arn': [0, 0, 8, 11, 3]}),
      const LigneHist(d: '2026-11-04', s: 'L|0', ser: 3, ex: {'arn': [0, 0, 10, 10, 3]}, det: [
        DetailEx('arn', [[10, 10], [10, 10], [10, 8]]),
      ]),
      const LigneHist(d: '2026-11-14', s: 'L|0', ser: 3, ex: {'arn': [0, 0, 12, 7, 3], 'pomp': [0, 0, 0, 15, 3]}, det: [
        DetailEx('arn', [[12, 7], [12, 7], [12, 7]]),
        DetailEx('pomp', [[15, 0], [12, 0], [12, 0]]),
      ]),
    ];
    test('le plus récent d\'abord, séries identiques regroupées', () {
      final j = seriesParJour(h, 'arn', 'kg');
      expect(j.map((x) => x.d), ['2026-11-14', '2026-11-04', '2026-10-21']);
      expect(j[0].groupes, [(n: 3, t: '12 kg × 7')]);
      expect(j[1].groupes, [(n: 2, t: '10 kg × 10'), (n: 1, t: '10 kg × 8')]);
      expect(j[2].groupes, null);
    });
    test('poids du corps : des répétitions', () {
      expect(seriesParJour(h, 'pomp', 'aucune')[0].groupes, [(n: 1, t: '15 réps'), (n: 2, t: '12 réps')]);
    });
    test('exercices faits, du plus récent au plus ancien', () {
      expect(exercicesFaits(h).map((e) => (e.id, e.n)), [('arn', 3), ('pomp', 1)]);
    });
    test('durée lisible', () {
      expect(duree('2026-10-21', '2026-11-14'), '3 semaines');
      expect(duree('2026-11-04', '2026-11-14'), '10 jours');
      expect(duree('2026-08-01', '2026-11-14'), '4 mois');
    });
  });

  group('records', () {
    test('courbe : un point par jour, le meilleur', () {
      final h = [
        const LigneHist(d: '2026-09-01', s: '0|0', ex: {'dc': [70, 0, 62.5, 5, 2]}),
        const LigneHist(d: '2026-09-01', s: 'L|1', ex: {'dc': [60, 0, 55, 5, 2]}),
        const LigneHist(d: '2026-09-08', s: '1|0', ex: {'dc': [75, 0, 65, 5, 1]}),
      ];
      expect(courbe(h, 'dc').map((p) => p.max), [62.5, 65]);
      expect(records(h, cat), hasLength(1));
    });
    test('un record par exercice, le meilleur, du plus récent au plus ancien', () {
      final h = [
        const LigneHist(d: '2026-09-01', s: 'L|0', ex: {'dc': [80, 0, 70, 5, 3], 'sq': [100, 0, 90, 4, 3]}),
        const LigneHist(d: '2026-09-08', s: 'L|0', ex: {'dc': [85, 0, 72.5, 5, 3]}),
        const LigneHist(d: '2026-09-15', s: 'L|0', ex: {'dc': [90, 0, 75, 6, 3], 'sq': [105, 0, 95, 3, 3]}),
        const LigneHist(d: '2026-09-22', s: 'L|0', ex: {'dc': [88, 0, 75, 5, 3]}),
      ];
      expect(records(h, cat).map((r) => (r.d, r.id)), [('2026-09-15', 'sq'), ('2026-09-15', 'dc'), ('2026-09-08', 'dc')]);
      expect(meilleursRecords(h, cat).map((r) => (r.id, r.rm)), [('sq', 105), ('dc', 90)]);
    });
  });

  group('prochaine fois', () {
    LigneHist ligne(int jours, num v, num reps) => LigneHist(
          d: jourDe(DateTime.now().subtract(Duration(days: jours))),
          s: 'L|0',
          ser: 3,
          ex: {'arn': [0, v * reps * 3, v, reps, 3]},
          det: [DetailEx('arn', [[v, reps], [v, reps], [v, reps]])],
        );
    test('dans la fourchette : même charge, une répétition de plus', () {
      final e = Etat(
        hist: [ligne(9, 10, 10), ligne(2, 12, 7)],
        seances: const [SeanceLibre(nom: 'Haut', ex: [ExLibre(id: 'arn', s: 3, r: 10, p: '90 s')], obj: 0)],
      );
      final p = prochaineFois(e, 'arn', cat)!;
      expect([p.v, p.reps], [12, 8]);
    });
    test('exercice sans charge : rien', () {
      expect(prochaineFois(const Etat(), 'pomp', cat), null);
    });
  });
}
