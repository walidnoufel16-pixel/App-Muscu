// Mode Suivi : mêmes cas que web/tests/mode.test.ts, pour que l'appli calcule comme le site.
import 'package:flutter_test/flutter_test.dart';
import 'package:oxa/logique/mode.dart';
import 'package:oxa/logique/modele.dart';

const catalogue = {
  'sq': Exercice('Squat barre', 'kg'),
  'dc': Exercice('Développé couché barre', 'kg'),
  'el': Exercice('Élévations latérales', 'kg'),
};

LigneHist ligne(String d, String s, Map<String, List<num>> ex) => LigneHist(d: d, s: s, nom: 't', ex: ex);

final seances = Etat.depuis({
  'SEANCES': [
    {'nom': 'Jambes', 'ex': [{'id': 'sq', 's': 4, 'r': 8, 'p': '2 min 30'}]},
    {'nom': 'Pecs', 'ex': [{'id': 'dc', 's': 3, 'r': 10, 'p': '2 min'}]},
    {'nom': 'Mobilité', 'soin': 'dos', 'ex': [{'id': 'el', 's': 2, 'r': 12, 'p': '60 s'}]},
    {'nom': 'Oxa', 'auto': true, 'ex': [{'id': 'el', 's': 3, 'r': 12, 'p': '60 s'}]},
  ],
}).seances;

Etat etat({List<LigneHist> hist = const [], List<SeanceLibre?>? s}) => Etat(seances: s ?? seances, hist: hist);

void main() {
  group('le réglage', () {
    test("Guidé par défaut (comptes d'avant le réglage), Suivi s'il est choisi", () {
      expect(modeDe({}), Mode.guide);
      expect(modeDe(null), Mode.guide);
      expect(modeDe({'mode': 'suivi'}), Mode.suivi);
      expect(modeDe({'mode': 'guide'}), Mode.guide);
    });
  });

  group("l'accueil du mode Suivi", () {
    test("Mes séances : ni soin, ni street, ni séance d'Oxa non gardée", () {
      expect(seancesSuivies(etat()), [0, 1]);
    });
    test('« Commencer » : une séance jamais faite d\'abord, sinon la plus ancienne', () {
      expect(prochaineSeance(etat()), 0);
      expect(prochaineSeance(etat(hist: [ligne('2026-11-20', 'L|0', {'sq': [0, 0, 80, 10, 4]})])), 1);
      expect(prochaineSeance(etat(hist: [ligne('2026-11-20', 'L|0', {}), ligne('2026-11-23', 'L|1', {})])), 0);
      expect(prochaineSeance(etat(s: [])), isNull);
    });
    test('« Dernière fois · squat 80 × 10 » : la dernière ligne de la séance, son exercice à charge', () {
      final e = etat(hist: [
        ligne('2026-11-13', 'L|0', {'sq': [0, 0, 75, 10, 4]}),
        ligne('2026-11-20', 'L|0', {'sq': [0, 0, 80, 10, 4]}),
      ]);
      expect(derniereFois(e, 0, catalogue), const DerniereFois('2026-11-20', PerfDerniere('sq', 80, 10)));
      expect(derniereFois(e, 1, catalogue), isNull);
    });
    test("le jour dit simplement : aujourd'hui, hier, le jour de la semaine, puis rien", () {
      expect(quandRelatif('2026-11-25', '2026-11-25'), 'auj');
      expect(quandRelatif('2026-11-24', '2026-11-25'), 'hier');
      expect(quandRelatif('2026-11-19', '2026-11-25'), 4); // jeudi
      expect(quandRelatif('2026-11-10', '2026-11-25'), isNull);
    });
  });

  group("l'affichage", () {
    test('« Dernière fois jeudi · squat barre 80 × 10 », ou « Pas encore faite »', () {
      final e = etat(hist: [ligne('2026-11-19', 'L|0', {'sq': [0, 0, 82.5, 10, 4]})]);
      expect(texteDerniere(e, 0, '2026-11-25', catalogue, detail: true), 'Dernière fois jeudi · squat barre 82,5 × 10');
      expect(texteDerniere(e, 0, '2026-11-25', catalogue), 'Dernière fois jeudi');
      expect(texteDerniere(e, 0, '2026-12-25', catalogue), 'Dernière fois le 19 nov');
      expect(texteDerniere(e, 1, '2026-11-25', catalogue), 'Pas encore faite');
    });
    test('un compte du site se lit tel quel, même avec des cases inattendues', () {
      final e = Etat.depuis({
        'A': {'mode': 'suivi'},
        'SEANCES': [null, {'nom': 'Dos', 'ex': [{'id': 'sq'}]}],
        'HIST': [{'d': '2026-11-20', 's': 'L|1', 'ex': {'sq': [0, 0, 60, 8, 3]}}, 'cassé'],
      });
      expect(seancesSuivies(e), [1]);
      expect(derniereFois(e, 1, catalogue)?.ex, const PerfDerniere('sq', 60, 8));
    });
  });
}
