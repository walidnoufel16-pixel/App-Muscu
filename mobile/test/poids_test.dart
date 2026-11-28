// Poids du corps dans Progrès : mêmes règles que SectionPoids et Poids de web/app/progres/page.tsx.
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';
import 'package:oxa/logique/poids.dart';

import 'progres_ecran_test.dart' show app, compteDe;

void main() {
  group('pesées', () {
    test('lues dans A.poids, les cases illisibles ignorées', () {
      expect(pesees({}), isEmpty);
      expect(pesees({'poids': 'x'}), isEmpty);
      final p = pesees({
        'poids': [['2026-10-01', 80.5], ['?'], ['2026-10-02', 'x'], ['2026-10-03', 80]],
      });
      expect(p.map((x) => x.d), ['2026-10-01', '2026-10-03']);
      expect(p.last.kg, 80);
    });
    test('suivi dès une pesée ; le dernier poids, sinon celui du questionnaire', () {
      expect(poidsSuivi({'profil': {'Poids': 75}}), isFalse);
      expect(dernierPoids({'profil': {'Poids': 75}}), 75);
      expect(dernierPoids({}), isNull);
      final a = {'profil': {'Poids': 75}, 'poids': [['2026-10-01', 78.4]]};
      expect(poidsSuivi(a), isTrue);
      expect(dernierPoids(a), 78.4);
    });
  });

  group('saisie', () {
    test('virgule ou point, arrondi au dixième', () {
      expect(lirePoids('78,46'), 78.5);
      expect(lirePoids(' 80.0 '), 80);
      expect(lirePoids('72.04'), 72);
    });
    test('hors de 30 à 300 kg ou illisible : rien', () {
      expect(lirePoids('29.9'), isNull);
      expect(lirePoids('300.1'), isNull);
      expect(lirePoids('30'), 30);
      expect(lirePoids('300'), 300);
      expect(lirePoids(''), isNull);
      expect(lirePoids('abc'), isNull);
    });
  });

  group('noter', () {
    test('ajoutée à la fin, le poids du Profil arrondi au kilo, le reste du document intact', () {
      final doc = {
        'A': {'mode': 'suivi', 'profil': {'Poids': 80, 'Taille': 180}, 'poids': [['2026-10-01', 80.2]]},
        'HIST': [],
      };
      final r = noterPoids(doc, '2026-10-05', 79.5);
      final a = r['A'] as Map;
      expect(a['poids'], [['2026-10-01', 80.2], ['2026-10-05', 79.5]]);
      expect(a['profil'], {'Poids': 80, 'Taille': 180});
      expect(a['mode'], 'suivi');
      expect(r['HIST'], same(doc['HIST']));
      expect(((doc['A'] as Map)['poids'] as List).length, 1); // le document relu n'est pas touché
      expect(((noterPoids(doc, '2026-10-05', 79.4)['A'] as Map)['profil'] as Map)['Poids'], 79);
    });
    test('une par jour : celle du même jour est remplacée', () {
      final doc = {'A': {'poids': [['2026-10-05', 80], ['2026-10-04', 81]]}};
      expect((noterPoids(doc, '2026-10-05', 79)['A'] as Map)['poids'], [['2026-10-04', 81], ['2026-10-05', 79]]);
    });
    test('les 120 dernières seulement ; un compte sans A', () {
      final l = [for (var i = 0; i < 120; i++) ['j$i', 80]];
      final p = (noterPoids({'A': {'poids': l}}, 'demain', 79)['A'] as Map)['poids'] as List;
      expect(p.length, 120);
      expect(p.first, ['j1', 80]);
      expect(p.last, ['demain', 79]);
      expect(noterPoids({}, '2026-10-05', 70)['A'], {'poids': [['2026-10-05', 70]], 'profil': {'Poids': 70}});
    });
  });

  group('écran', () {
    final hist = [
      {'d': '2026-10-06', 's': 'L|0', 'ser': 4, 'ex': {'dc': [90, 1000, 75, 6, 4]}},
    ];
    Future<void> descendre(WidgetTester t, Finder f) =>
        t.scrollUntilVisible(f, 300, scrollable: find.byType(Scrollable).first);

    testWidgets('sans pesée : « Suivre mon poids » ouvre le champ, le poids du questionnaire en rappel', (t) async {
      await t.pumpWidget(app(compteDe({'A': {'profil': {'Poids': 75}}, 'HIST': hist})));
      await descendre(t, find.text('Suivre mon poids'));
      expect(find.text('POIDS DU CORPS'), findsNothing);
      await t.tap(find.text('Suivre mon poids'));
      await t.pump();
      expect(find.text('POIDS DU CORPS'), findsOneWidget);
      expect(find.text('Dernier : 75 kg'), findsOneWidget);
      final noter = find.widgetWithText(FilledButton, 'Noter');
      expect(t.widget<FilledButton>(noter).onPressed, isNull);
      await t.enterText(find.byKey(const ValueKey('champ-poids')), '74,5');
      await t.pump();
      expect(t.widget<FilledButton>(noter).onPressed, isNotNull);
    });

    testWidgets('avec des pesées : la section et sa courbe, la dernière en rappel', (t) async {
      await t.pumpWidget(app(compteDe({
        'A': {'poids': [['2026-09-20', 81], ['2026-10-01', 80.2], ['2026-10-06', 79.6]]},
        'HIST': hist,
      })));
      await descendre(t, find.text('Dernier : 79,6 kg'));
      expect(find.text('Suivre mon poids'), findsNothing);
      expect(find.text('POIDS DU CORPS'), findsOneWidget);
      expect(find.bySemanticsLabel('Courbe : de 81 à 79,6 kg'), findsOneWidget);
    });
  });
}
