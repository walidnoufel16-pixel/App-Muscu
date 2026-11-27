// Écran de séance : proposition affichée, cases préremplies, validation d'une série, minuteur.
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';
import 'package:oxa/donnees/compte.dart';
import 'package:oxa/ecrans/seance.dart';
import 'package:oxa/ecrans/vignette.dart';
import 'package:oxa/logique/mode.dart';
import 'package:oxa/logique/modele.dart';
import 'package:oxa/theme.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'catalogue.dart';

Compte compteDe(Map<String, dynamic> etat) => Compte(SupabaseClient('https://exemple.supabase.co', 'sb_publishable_test',
    authOptions: const AuthClientOptions(autoRefreshToken: false)))
  ..catalogue = cat
  ..etat = Etat.depuis(etat);

void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));
  final hier = DateTime.now().subtract(const Duration(days: 2));
  final etat = {
    'A': {'mode': 'suivi'},
    'SEANCES': [
      {'nom': 'Jambes', 'ex': [{'id': 'sq', 's': 3, 'r': 8, 'p': '90 s'}, {'id': 'pomp', 's': 2, 'r': 12, 'p': '60 s'}]},
    ],
    'HIST': [
      {'d': jourDe(hier), 's': 'L|0', 'ex': {'sq': [0, 0, 80, 10, 3]}, 'det': [{'id': 'sq', 's': [[80, 10], [80, 10], [80, 10]]}]},
    ],
  };

  testWidgets('la charge proposée, le précédent, puis une série validée', (t) async {
    await t.binding.setSurfaceSize(const Size(390, 1400));
    await t.pumpWidget(MaterialApp(theme: themeOxa(Brightness.light), home: EcranSeance(compte: compteDe(etat), i: 0)));
    await t.pumpAndSettle();
    expect(find.text('Squat barre'), findsOneWidget);
    expect(find.text('Précédent : 3 × 80 kg × 10'), findsOneWidget);
    expect(find.text('↑ 5 kg'), findsOneWidget);
    expect(find.text('Pourquoi 85 kg ?'), findsOneWidget);
    expect(find.text('85'), findsNWidgets(3));
    expect(find.text('0/5 séries'), findsOneWidget);

    await t.tap(find.text('Pourquoi 85 kg ?'));
    await t.pump();
    expect(find.textContaining('+5 kg, et tu repars à 6 répétitions'), findsOneWidget);

    await t.tap(find.byTooltip('Valider la série').first);
    await t.pump();
    expect(find.text('1/5 séries'), findsOneWidget);
    expect(find.text('Repos  1:30'), findsOneWidget);
    await t.tap(find.text('Passer'));
    await t.pump();
    expect(find.textContaining('Repos'), findsNothing);
  });

  testWidgets('rien de coché : on ne peut pas encore terminer', (t) async {
    await t.binding.setSurfaceSize(const Size(390, 1400));
    await t.pumpWidget(MaterialApp(theme: themeOxa(Brightness.light), home: EcranSeance(compte: compteDe(etat), i: 0)));
    await t.pumpAndSettle();
    await t.tap(find.text('Terminer la séance'));
    await t.pump();
    expect(find.text('Coche au moins une série pour enregistrer ta séance.'), findsOneWidget);
  });

  testWidgets('première fois sur un exercice à charge : case KG vide, à remplir avant de valider', (t) async {
    await t.binding.setSurfaceSize(const Size(390, 1400));
    final neuf = {...etat, 'HIST': []};
    await t.pumpWidget(MaterialApp(theme: themeOxa(Brightness.light), home: EcranSeance(compte: compteDe(neuf), i: 0)));
    await t.pumpAndSettle();
    expect(find.text('Première fois : note ta charge, Oxa s\'en souviendra.'), findsOneWidget);
    await t.tap(find.byTooltip('Valider la série').first);
    await t.pump();
    expect(find.text('Indique la charge de cette série.'), findsOneWidget);
  });

  testWidgets('toucher un exercice ouvre sa fiche, avec l\'animation et l\'exécution', (t) async {
    await t.binding.setSurfaceSize(const Size(390, 1400));
    final c = compteDe(etat)
      ..fiches = {'sq': {'e': 'Descends les hanches.', 'err': ['Genoux qui rentrent.'], 'p': 'Ajoute du poids.'}}
      ..photos = {'sq': const Photo(fichier: 'ex-sq.webp', grande: 'ex-sq.webp', duo: ['Barbell_Squat_0.webp', 'Barbell_Squat_1.webp'])};
    await t.pumpWidget(MaterialApp(theme: themeOxa(Brightness.light), home: EcranSeance(compte: c, i: 0)));
    await t.pumpAndSettle();
    await t.tap(find.text('Squat barre'));
    await t.pumpAndSettle();
    expect(find.text('Animation'), findsOneWidget);
    expect(find.text('EXÉCUTION'), findsOneWidget);
    await t.tap(find.text('Animation'));
    await t.pump(const Duration(milliseconds: 500));
    expect(find.text('Photo'), findsOneWidget);
    expect(find.byType(FadeTransition), findsWidgets);
  });
}
