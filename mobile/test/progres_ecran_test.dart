// Écran Progrès : le message du site sans séance, puis la semaine, les muscles et la progression.
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';
import 'package:oxa/donnees/compte.dart';
import 'package:oxa/ecrans/progres.dart';
import 'package:oxa/logique/modele.dart';
import 'package:oxa/theme.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'catalogue.dart';

Compte compteDe(Map<String, dynamic> etat) => Compte(SupabaseClient('https://exemple.supabase.co', 'sb_publishable_test',
    authOptions: const AuthClientOptions(autoRefreshToken: false)))
  ..catalogue = cat
  ..etat = Etat.depuis(etat);

Widget app(Compte c) =>
    MaterialApp(theme: themeOxa(Brightness.light), home: EcranProgres(compte: c, auj: '2026-10-08'));

void main() {
  testWidgets('compte sans séance : le message du site', (t) async {
    await t.pumpWidget(app(compteDe({})));
    expect(find.text('Ta première séance remplira cet écran'), findsOneWidget);
  });

  testWidgets('la semaine, les muscles, la progression et les records', (t) async {
    await t.pumpWidget(app(compteDe({
      'A': {'objHebdo': 2},
      'HIST': [
        {'d': '2026-09-29', 's': 'L|0', 'ser': 4, 'ex': {'dc': [80, 1000, 70, 5, 4]}},
        {'d': '2026-10-01', 's': 'L|0', 'ser': 4, 'ex': {'dc': [85, 1000, 72.5, 5, 4]}},
        {'d': '2026-10-06', 's': 'L|0', 'ser': 4, 'ex': {'dc': [90, 1000, 75, 6, 4]}},
      ],
    })));
    expect(find.text('2 semaines d\'affilée'), findsNothing);
    expect(find.text('1 semaine d\'affilée'), findsOneWidget);
    expect(find.text('1/2 cette semaine'), findsOneWidget);
    expect(find.text('séries cette semaine'), findsOneWidget);
    expect(find.textContaining('Pectoraux'), findsWidgets);
    expect(find.text('Développé couché barre'), findsWidgets);
    await t.scrollUntilVisible(find.text('RECORDS · 1'), 300, scrollable: find.byType(Scrollable).first);
    expect(find.text('90'), findsOneWidget); // 1RM estimé
    await t.ensureVisible(find.text('Séries'));
    await t.pumpAndSettle();
    await t.tap(find.text('Séries'));
    await t.pump();
    expect(find.text('Toutes tes séries, séance par séance · 3 séances'), findsOneWidget);
  });
}
