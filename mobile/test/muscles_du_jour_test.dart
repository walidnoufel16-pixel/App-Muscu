// Composer une séance par muscles : mêmes cas que web/tests/roles.test.ts et historique.test.ts.
import 'package:flutter_test/flutter_test.dart';
import 'package:oxa/logique/modele.dart';
import 'package:oxa/logique/muscles_du_jour.dart';
import 'package:oxa/logique/progres.dart' show pat2musc, principaux;

import 'catalogue.dart';

void main() {
  group('rôle des exercices', () {
    test('les corrections du coach', () {
      for (final id in ['sdts', 'sql']) {
        expect(roleDe(id, cat), 'b', reason: id);
      }
      for (final id in ['rwm', 'tbarp']) {
        expect(roleDe(id, cat), 'c', reason: id);
      }
      expect(roleDe('rkp', cat), 'b');
      for (final id in ['scap', 'elf', 'scappu', 'trxy', 'trxt', 'curlpc']) {
        expect(roleDe(id, cat), 'i', reason: id);
      }
    });
    test('les classiques', () {
      expect(roleDe('sq', cat), 'b');
      expect(roleDe('dc', cat), 'b');
      expect(roleDe('tr', cat), 'b');
      expect(roleDe('fe', cat), 'c');
      expect(roleDe('dci', cat), 'c');
      expect(roleDe('lext', cat), 'i');
      expect(roleDe('curlh', cat), 'i');
      expect(roleDe('gai', cat), 'g');
    });
    test('pas de badge pour le cardio, le soin, les explosifs et les portés', () {
      for (final id in ['ram', 'jsq', 'pompp', 'kbsw', 'pp', 'ferm', 'trpush', 'kbtgu']) {
        expect(roleDe(id, cat), isNull, reason: id);
      }
    });
    test("relatif au muscle affiché : une base qui ne le travaille qu'en second compte comme complément", () {
      expect(roleDe('trs', cat), 'b');
      if (cat['trs']!.pat2 != null) expect(roleDe('trs', cat, 'bic'), 'c');
    });
    test('chaque exercice a un rôle connu ou aucun', () {
      for (final id in cat.keys) {
        expect([null, 'b', 'c', 'i', 'g'], contains(roleDe(id, cat)), reason: id);
      }
    });
  });

  group('exercices des muscles touchés', () {
    test('dans l\'ordre des muscles, sans le soin, chaque grand groupe en a', () {
      final r = exosParMuscle(['dos', 'pec'], cat);
      expect(r.map((x) => x.g), ['pec', 'dos']);
      for (final k in principaux) {
        final x = exosParMuscle([k], cat).single;
        expect(x.l, isNotEmpty, reason: k);
        expect(x.aussi, isFalse, reason: k);
        for (final o in x.l) {
          expect(pat2musc[cat[o]!.pat], k, reason: o);
          expect(estSoin(cat[o]), isFalse, reason: o);
        }
      }
    });
    test('rangés par rôle : base, complément, isolation, gainage, puis les autres', () {
      final l = exosParMuscle(['pec'], cat).single.l;
      final g = parRole(l, cat, 'pec');
      expect(g.first.ro, 'b');
      expect(g.first.ids, contains('dc'));
      expect(g.expand((x) => x.ids).toSet(), l.toSet());
      const ordre = ['b', 'c', 'i', 'g', null];
      for (var i = 1; i < g.length; i++) {
        expect(ordre.indexOf(g[i].ro), greaterThan(ordre.indexOf(g[i - 1].ro)));
      }
    });
  });

  group('le corps des 7 derniers jours', () {
    final h = [
      const LigneHist(d: '2026-09-29', s: 'L|0', ser: 6, ex: {'dc': [80, 1000, 70, 5, 4]}),
      const LigneHist(d: '2026-10-02', s: 'L|0', ser: 3, ex: {'dc': [80, 500, 70, 5, 3]}),
    ];
    test('séries par muscle : pectoraux (1 par série), triceps en second (½)', () {
      expect(seriesSemaine(h, '2026-10-04', cat), {'pec': 7, 'tri': 3.5});
      /* le 29 sort des 7 jours le 6 octobre */
      expect(seriesSemaine(h, '2026-10-06', cat), {'pec': 3, 'tri': 1.5});
    });
    test('teinte : 16 séries pour le plus foncé, rien pour un muscle pas travaillé', () {
      final parM = seriesSemaine(h, '2026-10-04', cat);
      expect(teinte('ph', parM), 7 / 16);
      expect(teinte('ec', parM), 3.5 / 16);
      expect(teinte('tv', parM), 0);
      expect(teinte(null, parM), 0);
      expect(teinte('ph', {'pec': 40}), 1);
    });
    test('pas encore cette semaine : les grands groupes sans série, 4 au plus', () {
      expect(pasEncore(seriesSemaine(h, '2026-10-04', cat)), 'dos, épaules, biceps, quadriceps');
      expect(pasEncore({for (final k in principaux) k: 1}), isNull);
    });
    test('le nom de la séance suit les muscles touchés', () {
      expect(nomDesMuscles(['epa', 'dos']), 'Épaules · Dos');
    });
  });
}
