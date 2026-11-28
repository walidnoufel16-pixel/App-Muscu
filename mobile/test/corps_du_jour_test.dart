// Le corps sous « Mes séances » : le titre selon les séances, puis les exercices des muscles touchés
// cochés, qui ouvrent la création de séance préremplie.
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';
import 'package:oxa/ecrans/corps_du_jour.dart';
import 'package:oxa/ecrans/mes_seances.dart';
import 'package:oxa/theme.dart';

import 'mes_seances_test.dart' show compteDe;

void main() {
  testWidgets('le titre change avec ou sans séance', (t) async {
    t.view.physicalSize = const Size(390 * 3, 2400 * 3);
    t.view.devicePixelRatio = 3;
    addTearDown(t.view.reset);
    Widget app(Map<String, dynamic> e) =>
        MaterialApp(theme: themeOxa(Brightness.light), home: EcranMesSeances(compte: compteDe(e)));
    await t.pumpWidget(app({'SEANCES': []}));
    expect(find.text("Qu'est-ce que tu travailles aujourd'hui ?"), findsOneWidget);
    await t.pumpWidget(app({
      'A': {'sexe': 0},
      'SEANCES': [
        {'nom': 'Jambes', 'ex': [{'id': 'sq'}]},
      ],
    }));
    expect(find.text("Envie d'autre chose ? Choisis tes muscles du jour"), findsOneWidget);
    expect(find.text('Touche les muscles à travailler'), findsOneWidget);
    expect(find.text('Sur quel corps afficher tes muscles ?'), findsNothing);
  });

  testWidgets('sexe pas réglé : on demande sur quel corps afficher les muscles', (t) async {
    t.view.physicalSize = const Size(390 * 3, 2400 * 3);
    t.view.devicePixelRatio = 3;
    addTearDown(t.view.reset);
    await t.pumpWidget(MaterialApp(theme: themeOxa(Brightness.light), home: EcranMesSeances(compte: compteDe({'SEANCES': []}))));
    expect(find.text('Sur quel corps afficher tes muscles ?'), findsOneWidget);
    expect(find.text('Femme'), findsOneWidget);
    expect(find.text('Homme'), findsOneWidget);
    expect(find.text('Touche les muscles à travailler'), findsNothing);
  });

  testWidgets('les exercices proposés suivent le matériel du Profil', (t) async {
    final c = compteDe({'A': {'materiel': 3}, 'SEANCES': []});
    await t.pumpWidget(MaterialApp(
      theme: themeOxa(Brightness.light),
      home: EcranExercicesMuscles(compte: c, muscles: const ['qua']),
    ));
    expect(find.text('Poids du corps'), findsOneWidget);
    expect(find.text('Squat barre'), findsNothing);
    expect(find.text('Aucun exercice avec ce matériel.'), findsOneWidget);
  });

  testWidgets('les exercices cochés ouvrent la création de séance, avec le nom des muscles', (t) async {
    final c = compteDe({'SEANCES': []});
    await t.pumpWidget(MaterialApp(
      theme: themeOxa(Brightness.light),
      home: EcranExercicesMuscles(compte: c, muscles: const ['qua', 'pec']),
    ));
    expect(find.text('Pectoraux'), findsOneWidget);
    expect(find.text('Quadriceps'), findsOneWidget);
    expect(find.text('Coche au moins un exercice'), findsOneWidget);
    await t.tap(find.text('Squat barre'));
    await t.tap(find.text('Développé couché barre'));
    await t.pump();
    await t.tap(find.text('Continuer · 2 exercices'));
    await t.pumpAndSettle();
    expect(find.text('Nouvelle séance'), findsOneWidget);
    expect(find.text('Quadriceps · Pectoraux'), findsOneWidget);
    expect(find.text('EXERCICES · 2'), findsOneWidget);
    /* l'ordre de la liste : les pectoraux d'abord, comme les muscles du site */
    expect(t.getTopLeft(find.text('Développé couché barre')).dy, lessThan(t.getTopLeft(find.text('Squat barre')).dy));
  });
}
