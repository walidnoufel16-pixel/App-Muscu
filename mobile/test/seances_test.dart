// Créer, modifier, supprimer une séance : mêmes règles que le site (web/lib/logic/actions.ts,
// tests/journaux.test.ts) ; recherche et filtre du catalogue.
import 'package:flutter_test/flutter_test.dart';
import 'package:oxa/logique/modele.dart';
import 'package:oxa/logique/seances.dart';

const cat = {
  'sq': Exercice('Squat barre', 'kg', m: 'Quadriceps, fessiers', pat: 'eg'),
  'dc': Exercice('Développé couché barre', 'kg', m: 'Pectoraux, triceps', pat: 'ph'),
  'gain': Exercice('Gainage', 'temps', m: 'Abdominaux', pat: 'ft'),
  'fp': Exercice('Face pull', 'kg', m: 'Épaules arrière', pat: 're'),
  'cbras': Exercice('Cercles de bras', 'temps', pat: 'soin'),
  'rame': Exercice('Rameur', 'dist', pat: 'ca'),
};

Map<String, dynamic> j(String ex, {bool ok = true}) => {
      'ex': ex,
      'done': ok,
      'ts': 1,
      'series': [
        {'v': 10, 'reps': 10, 'ok': ok},
      ],
    };

void main() {
  final t0 = DateTime(2026, 11, 27, 10);

  test('recherche sans accents, filtre par muscle, sans les routines de soin', () {
    expect(chercherExercices(cat), ['sq', 'dc', 'gain', 'fp', 'rame']);
    expect(chercherExercices(cat, texte: 'developpe'), ['dc']);
    expect(chercherExercices(cat, texte: 'EPAULES'), ['fp']);
    expect(chercherExercices(cat, groupe: 'Quadriceps'), ['sq']);
    expect(chercherExercices(cat, groupe: 'Cardio et mobilité'), ['rame']);
    expect(chercherExercices(cat, texte: 'barre', groupe: 'Pectoraux'), ['dc']);
  });

  test('prescription par défaut, comme exParDefaut du site', () {
    expect(exParDefaut('sq', cat), {'id': 'sq', 's': 3, 'r': 10, 'p': '2 min 30'});
    expect(exParDefaut('dc', cat), {'id': 'dc', 's': 3, 'r': 10, 'p': '90 s'});
    expect(exParDefaut('gain', cat)['r'], 45);
    expect(exParDefaut('rame', cat)['r'], 250);
  });

  test('créer : la séance s\'ajoute à la fin, le reste du document est gardé', () {
    final doc = {
      'SEANCES': [
        {'nom': 'Jambes', 'ex': [{'id': 'sq', 's': 4, 'r': 8, 'p': '3 min'}]},
      ],
      'A': {'mode': 'suivi'},
      'INCONNU': 42,
    };
    final r = creerSeance(doc, '  Haut  ', ['dc', 'fp'], cat, maintenant: t0);
    expect((r['SEANCES'] as List).length, 2);
    expect(r['SEANCES'][1], {
      'nom': 'Haut',
      'ex': [exParDefaut('dc', cat), exParDefaut('fp', cat)],
    });
    expect(r['INCONNU'], 42);
    expect(r['ts'], t0.millisecondsSinceEpoch);
    expect((doc['SEANCES'] as List).length, 1); // l'original n'est pas touché
    expect(Etat.depuis(r).seances[1]!.signature, 'Haut|dc,fp');
  });

  test('modifier : déplacé, retiré, ajouté ; les journaux suivent (comme tests/journaux.test.ts)', () {
    final doc = {
      'SEANCES': [
        {
          'nom': 'S',
          'ex': [
            {'id': 'fp', 's': 4, 'r': 12, 'p': '60 s', 'ro': 'i'},
            {'id': 'dc', 's': 3, 'r': 10, 'p': '90 s'},
            {'id': 'sq', 's': 5, 'r': 5, 'p': '3 min'},
          ],
        },
      ],
      'LOG': {'L|0|0': j('fp'), 'L|0|1': j('dc'), 'L|0|2': j('sq'), 'L|0|a7': j('sq')},
    };
    /* sq (était 2), gainage (nouveau), fp (était 0) ; dc retiré */
    final r = modifierSeance(doc, 0, 'Nouvelle', [const ExModifie('sq', 2), const ExModifie('gain'), const ExModifie('fp', 0)], cat,
        maintenant: t0);
    final s = r['SEANCES'][0];
    expect(s['nom'], 'Nouvelle');
    expect(s['ex'], [
      {'id': 'sq', 's': 5, 'r': 5, 'p': '3 min'},
      exParDefaut('gain', cat),
      {'id': 'fp', 's': 4, 'r': 12, 'p': '60 s', 'ro': 'i'},
    ]);
    final log = r['LOG'] as Map;
    expect(log['L|0|0']['ex'], 'sq');
    expect(log['L|0|1'], isNull);
    expect(log['L|0|2']['ex'], 'fp');
    expect(log['L|0|a1']['ex'], 'dc'); // mis de côté, pas effacé
    expect(log['L|0|a7']['ex'], 'sq'); // déjà mis de côté : intact
    expect(r['ts'], t0.millisecondsSinceEpoch);
  });

  test('modifier : un journal sans série validée qui perd son exercice est retiré', () {
    final doc = {
      'SEANCES': [
        {'nom': 'S', 'ex': [{'id': 'dc'}, {'id': 'sq'}]},
      ],
      'LOG': {'L|0|0': j('dc', ok: false)},
    };
    final r = modifierSeance(doc, 0, 'S', [const ExModifie('sq', 1)], cat);
    expect(r['LOG'], isEmpty);
  });

  test('modifier : un superset ne tient que si les deux restent côte à côte', () {
    final doc = {
      'SEANCES': [
        {
          'nom': 'S',
          'ex': [
            {'id': 'dc', 'sup': 1},
            {'id': 'fp'},
            {'id': 'sq', 'sup': 1},
            {'id': 'gain'},
          ],
        },
      ],
    };
    final r = modifierSeance(
        doc, 0, 'S', [const ExModifie('dc', 0), const ExModifie('fp', 1), const ExModifie('gain', 3), const ExModifie('sq', 2)], cat);
    final ex = r['SEANCES'][0]['ex'] as List;
    expect(ex[0]['sup'], 1);
    expect(ex[3].containsKey('sup'), isFalse);
  });

  test('supprimer : les journaux de la séance partent, ceux des suivantes sont recalés', () {
    final doc = {
      'SEANCES': [
        {'nom': 'A', 'ex': [{'id': 'sq'}]},
        {'nom': 'B', 'ex': [{'id': 'dc'}]},
        {'nom': 'C', 'ex': [{'id': 'fp'}]},
      ],
      'LOG': {'L|0|0': j('sq'), 'L|1|0': j('dc'), 'L|1|a0': j('dc'), 'L|2|0': j('fp'), '3|1|0': j('sq')},
      'HIST': [
        {'d': '2026-11-20', 's': 'L|1', 'nom': 'B'},
      ],
    };
    final r = supprimerSeance(doc, 1, maintenant: t0);
    expect([for (final s in r['SEANCES'] as List) s['nom']], ['A', 'C']);
    expect((r['LOG'] as Map).keys.toSet(), {'L|0|0', 'L|1|0', '3|1|0'});
    expect(r['LOG']['L|1|0']['ex'], 'fp');
    expect(r['HIST'], doc['HIST']); // l'historique reste, comme sur le site
    expect(r['ts'], t0.millisecondsSinceEpoch);
  });
}
