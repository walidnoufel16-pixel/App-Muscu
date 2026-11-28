// L'accueil du mode Suivi : mêmes cas de test que le site (web/tests/agenda.test.ts,
// recommandation.test.ts, activites.test.ts).
import 'package:flutter_test/flutter_test.dart';
import 'package:oxa/logique/agenda.dart';
import 'package:oxa/logique/mode.dart';
import 'package:oxa/logique/modele.dart';
import 'package:oxa/logique/progres.dart';
import 'package:oxa/logique/recuperation.dart';

import 'catalogue.dart';

/* une séance : exercice → nombre de séries */
LigneHist seance(String d, Map<String, int> ex) => LigneHist(
      d: d,
      s: 'L|0',
      nom: 'test',
      ser: ex.values.fold(0, (a, b) => a + b),
      ex: {for (final e in ex.entries) e.key: [50, 500, 60, 10, e.value]},
    );
LigneHist ligne(String d, [String nom = 'Pecs et triceps']) => LigneHist(d: d, s: 'L|0', nom: nom, ser: 9);
Map<String, dynamic> pecs(String d, {bool hebdo = false, List<String>? sauf}) => {
      'id': 'p$d',
      'd': d,
      'nom': 'Pecs et triceps',
      'quoi': {'t': 'libre', 'i': 0},
      if (hebdo) 'hebdo': true,
      'sauf': ?sauf,
    };

const lun = '2026-11-02', mar = '2026-11-03', mer = '2026-11-04';
LigneHist push(String d) => seance(d, {'dc': 4, 'dh': 3, 'tri': 3});

void main() {
  group('agenda', () {
    const auj = '2026-11-05'; // jeudi
    test('commence le lundi de la semaine, sur 14 jours', () {
      expect(lundiDe(auj), '2026-11-02');
      final j = joursAgenda(const Etat(), lundiDe(auj), auj);
      expect(j, hasLength(14));
      expect(j[13].d, '2026-11-15');
    });

    test("place le fait et le prévu au bon jour ; un prévu fait n'apparaît plus ; un prévu passé non fait est manqué", () {
      final e = Etat(
        hist: [ligne('2026-11-02'), ligne('2026-11-04', 'Dos et biceps')],
        agenda: [pecs('2026-11-04'), pecs('2026-11-03'), pecs('2026-11-10')],
      );
      final J = joursAgenda(e, '2026-11-02', auj);
      JourAgenda j(String d) => J.firstWhere((x) => x.d == d);
      expect(j('2026-11-02').fait.first.nom, 'Pecs et triceps');
      expect(j('2026-11-04').prevus, isEmpty); // fait (dos) ce jour-là : le prévu muscu disparaît
      expect(j('2026-11-03').manques, hasLength(1));
      expect(j('2026-11-10').prevus.first.nom, 'Pecs et triceps');
    });

    test('répétition hebdo, avec un jour retiré', () {
      final p = Prevu.depuis(pecs('2026-11-03', hebdo: true, sauf: ['2026-11-10']));
      expect(tombeLe(p, '2026-11-03'), true);
      expect(tombeLe(p, '2026-11-10'), false);
      expect(tombeLe(p, '2026-11-17'), true);
      expect(tombeLe(p, '2026-11-04'), false);
      expect(tombeLe(p, '2026-10-27'), false);
    });

    test('cardio seul et sorties de course comptent comme faits ; un bloc cardio de séance non', () {
      final ts = DateTime(2026, 11, 3, 18).millisecondsSinceEpoch;
      final e = Etat(cardio: [
        {'nom': 'Vélo', 'ts': ts},
        {'nom': 'Bloc', 'ts': ts, 'ref': 'L|0'},
      ], sorties: [
        {'d': '2026-11-04', 'km': 8, 'course': false},
      ]);
      final f = faitsParJour(e);
      expect(f['2026-11-03']!.map((x) => x.famille), [Famille.cardio]);
      expect(f['2026-11-04']!.single.famille, Famille.course);
    });
  });

  group('séance en cours', () {
    /* midi, heure fixe : à 0 h 10, une séance commencée « il y a 20 minutes » tomberait la veille */
    final maintenant = DateTime.now().copyWith(hour: 12, minute: 0, second: 0, millisecond: 0, microsecond: 0).millisecondsSinceEpoch;
    final aujd = jourDe(DateTime.fromMillisecondsSinceEpoch(maintenant));
    final avant = jourDe(DateTime.fromMillisecondsSinceEpoch(maintenant - 2 * 86400000));
    final e = Etat.depuis({
      'HIST': [
        {'d': aujd, 's': 'L|0', 'nom': 'Push', 'vol': 600, 'ser': 2, 'ex': {}},
        {'d': avant, 's': 'L|0', 'nom': 'Push', 'vol': 600, 'ser': 3, 'ex': {}},
      ],
      'LOG': {
        'L|0|0': {
          'done': false, 'ex': 'dc', 'ts': maintenant - 20 * 60000,
          'series': [
            {'v': 60, 'reps': 10, 'ok': true},
            {'v': 60, 'reps': 10, 'ok': true},
            {'v': 60, 'reps': 10, 'ok': false},
          ],
        },
        'L|0|a0': {'done': true, 'ex': 'dc', 'ts': maintenant - 2 * 86400000, 'series': [{'v': 60, 'reps': 10, 'ok': true}]},
      },
      'SEANCES': [{'nom': 'Push', 'ex': []}],
      'CARDIO': [],
      'SORTIES': [],
    });

    test('des séries validées il y a moins de 6 heures, pas encore rangées : en cours', () {
      final c = seancesEnCours(e, maintenant);
      expect([for (final x in c) (x.i, x.nom, x.series)], [(0, 'Push', 2)]);
      expect(seancesEnCours(e, maintenant + 7 * 3600000), isEmpty);
    });

    test("ne compte pas encore comme faite dans l'agenda ; les séances rangées, si", () {
      final f = faitsParJour(e, maintenant);
      expect(f[aujd], isNull);
      expect(f[avant], hasLength(1));
    });

    test('la série de semaines ne compte pas la séance en cours', () {
      expect(histSansEnCours(e, maintenant).map((l) => l.d), [avant]);
    });
  });

  group('récupération', () {
    test('des abdos travaillés la veille sont de nouveau prêts', () {
      expect(etatGroupes([seance(mar, {'crp': 4, 'plat': 3})], mer, cat)['abd']!.recupere, true);
    });

    test('shrugs et extensions lombaires : trapèzes et lombaires en récupération', () {
      final e = etatGroupes([seance(mar, {'shr': 4, 'lom': 3})], mer, cat);
      expect(e['tra']!.recupere, false);
      expect(e['lom']!.recupere, false);
      expect(etatGroupes([seance(mar, {'shr': 4, 'lom': 3})], '2026-11-05', cat)['lom']!.recupere, true);
    });

    test('un soulevé de terre (lombaires en second) fatigue les lombaires 48 h', () {
      final e = etatGroupes([seance(mar, {'sdt': 4})], mer, cat);
      expect((e['lom']!.recupere, e['lom']!.reste), (false, 1));
      expect(musclesRecup, hasLength(13));
    });
  });

  group('course, cardio, activités', () {
    Map<String, dynamic> sortie(String d, num km, num rpe, [bool course = false]) =>
        {'d': d, 'km': km, 'sec': km * 330, 'rpe': rpe, 'course': course};

    test('un footing court et facile ne compte pas ; une sortie longue, si', () {
      expect(effortsEndurance(Etat(sorties: [sortie(mar, 5, 4)])), isEmpty);
      final e = etatGroupes([push(lun)], mer, cat, effortsEndurance(Etat(sorties: [sortie(mar, 18, 6)])));
      expect((e['qua']!.recupere, e['qua']!.reste), (false, 1));
      expect(e['mol']!.recupere, false);
      expect(e['pec']!.recupere, true);
    });

    test('un marathon : 72 h', () {
      final ef = effortsEndurance(Etat(sorties: [sortie(lun, 42.2, 9, true)]));
      expect(ef.first.jours, 3);
      expect(etatGroupes([], mer, cat, ef)['isc']!.reste, 1);
    });

    test("cardio guidé : du fractionné au rameur fatigue dos et jambes 24 h, une endurance courte rien", () {
      final ts = DateTime(2026, 11, 3, 18).millisecondsSinceEpoch;
      final ef = effortsEndurance(Etat(cardio: [
        {'nom': 'x', 'f': 'fractionne', 'm': 'ram', 'min': 20, 'effort': 600, 'ts': ts},
        {'nom': 'y', 'f': 'endurance', 'm': 'velo', 'min': 30, 'effort': 1800, 'ts': ts},
      ]));
      expect(ef, [const Endurance(mar, 1, ['dos', 'qua', 'isc'])]);
    });

    test("séance déclarée à l'accueil : les muscles récupèrent sans séance dans l'historique", () {
      final e = etatGroupes([], mer, cat, effortsEndurance(const Etat(a: {'avant': {'d': mar, 'm': ['pec', 'tri', 'dos']}})));
      expect(e['pec']!.recupere, false);
      expect(e['dos']!.recupere, false);
      expect(e['qua']!.recupere, true);
      final e2 = etatGroupes([], mer, cat, effortsEndurance(const Etat(a: {'avant': {'d': lun, 'm': ['pec', 'dos']}})));
      expect(e2['pec']!.recupere, true);
      expect(e2['dos']!.recupere, false);
      expect(effortsDeclares({'d': mar, 'm': []}), isEmpty);
    });

    test('activités : jours de récupération selon intensité et durée', () {
      expect(joursRecup(0, 60), 1);
      expect(joursRecup(1, 90), 2);
      expect(joursRecup(1, 120), 3);
      expect(joursRecup(2, 45), 3);
    });

    test("le foot d'hier : jambes pas prêtes aujourd'hui, prêtes demain ; une activité à venir ne fatigue pas", () {
      const auj = '2026-11-16';
      Map<String, dynamic> foot(String d) => {'id': 'a$d', 'd': d, 'sp': 'foot', 'min': 90, 'int': 1, 'm': ['qua', 'isc', 'mol', 'add']};
      final ef = effortsEndurance(Etat(activites: [foot(decaler(auj, -1))]));
      final a = etatGroupes([], auj, cat, ef), d = etatGroupes([], decaler(auj, 1), cat, ef);
      expect(a['qua']!.recupere, false);
      expect(a['isc']!.recupere, false);
      expect(a['pec']!.recupere, true);
      expect(d['qua']!.recupere, true);
      expect(etatGroupes([], auj, cat, effortsEndurance(Etat(activites: [foot(decaler(auj, 2))])))['qua']!.recupere, true);
    });
  });

  group('ligne Récupération', () {
    test('rien sans séance ni effort sur 14 jours', () {
      expect(recuperation(Etat(hist: [push('2026-10-01')]), mer, cat), isNull);
    });

    test('les muscles prêts, ceux au repos et quand', () {
      final r = recuperation(Etat(hist: [seance(mar, {'sq': 4, 'pr': 4, 'rm': 3, 'mol': 3})]), mer, cat)!;
      expect(r.titre, 'Prêts : pecs, dos, épaules, biceps, triceps');
      expect(r.repos, ['qua', 'isc']);
      expect(r.sous, 'Quadriceps, Ischios · prêts demain'); // le plus tôt prêt : ischios (7 séries, 48 h)
      expect(r.tri.take(2), ['qua', 'isc']);
      expect(r.delai('qua'), 'dans 2 jours');
      expect(r.delai('pec'), 'prêt · pas travaillé depuis 7 j+');
      /* avant-bras, trapèzes… : listés seulement s'ils ont travaillé */
      expect(r.suivis.contains('avb'), false);
      expect(recuperation(Etat(hist: [push('2026-10-25')]), mer, cat)!.titre, 'Tous tes muscles sont prêts');
    });
  });
}
