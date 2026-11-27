// Écran « Mes séances » : la prochaine séance en grand, les autres en dessous, sans les séances
// de soin ni celles d'Oxa non gardées.
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';
import 'package:oxa/donnees/compte.dart';
import 'package:oxa/ecrans/mes_seances.dart';
import 'package:oxa/logique/mode.dart';
import 'package:oxa/logique/modele.dart';
import 'package:oxa/theme.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

Compte compteDe(Map<String, dynamic>? etat) {
  final c = Compte(SupabaseClient('https://exemple.supabase.co', 'sb_publishable_test',
      authOptions: const AuthClientOptions(autoRefreshToken: false)))
    ..catalogue = const {
      'sq': Exercice('Squat barre', 'kg', m: 'Quadriceps, fessiers', pat: 'eg'),
      'dc': Exercice('Développé couché barre', 'kg', m: 'Pectoraux, triceps', pat: 'ph'),
    }
    ..pseudo = 'Walid';
  c.etat = Etat.depuis(etat);
  return c;
}

Widget app(Compte c) => MaterialApp(theme: themeOxa(Brightness.light), home: EcranMesSeances(compte: c));

void main() {
  testWidgets('la prochaine séance, puis les autres', (t) async {
    final hier = jourDe(DateTime.now().subtract(const Duration(days: 1)));
    await t.pumpWidget(app(compteDe({
      'SEANCES': [
        {'nom': 'Jambes', 'ex': [{'id': 'sq'}]},
        {'nom': 'Pecs', 'ex': [{'id': 'dc'}]},
        {'nom': 'Mobilité', 'soin': 'dos', 'ex': []},
      ],
      'HIST': [
        {'d': hier, 's': 'L|0', 'ex': {'sq': [0, 0, 80, 10, 4]}},
      ],
    })));
    expect(find.text('Salut Walid'), findsOneWidget);
    expect(find.text('Pecs'), findsOneWidget);
    expect(find.text('Pas encore faite'), findsOneWidget);
    expect(find.text('Jambes'), findsOneWidget);
    expect(find.text('Dernière fois hier'), findsOneWidget);
    expect(find.text('Mobilité'), findsNothing);
    expect(find.text('Commencer'), findsOneWidget);
  });

  testWidgets('aucune séance : on invite à en écrire une', (t) async {
    await t.pumpWidget(app(compteDe({'SEANCES': []})));
    expect(find.text('Écris ta première séance'), findsOneWidget);
    expect(find.text('Commencer'), findsNothing);
    expect(find.text('Nouvelle séance'), findsOneWidget);
    expect(find.textContaining('crée tes séances sur le site'), findsNothing);
  });

  testWidgets('nouvelle séance : le nom, puis les exercices choisis dans le catalogue', (t) async {
    await t.pumpWidget(app(compteDe({'SEANCES': []})));
    await t.tap(find.text('Nouvelle séance'));
    await t.pumpAndSettle();
    expect(find.text('Créer la séance'), findsOneWidget);
    await t.enterText(find.byType(TextField), 'Haut du corps');
    await t.tap(find.text('Ajouter des exercices'));
    await t.pumpAndSettle();
    /* recherche sans accents */
    await t.enterText(find.byType(TextField), 'developpe');
    await t.pump();
    expect(find.text('Squat barre'), findsNothing);
    await t.tap(find.text('Développé couché barre'));
    await t.pump();
    await t.enterText(find.byType(TextField), '');
    await t.pump();
    /* filtre par muscle */
    await t.tap(find.widgetWithText(ChoiceChip, 'Quadriceps'));
    await t.pump();
    expect(find.text('Développé couché barre'), findsNothing);
    await t.tap(find.text('Squat barre'));
    await t.pumpAndSettle();
    await t.tap(find.text('Ajouter 2 exercices'));
    await t.pumpAndSettle();
    expect(find.text('EXERCICES · 2'), findsOneWidget);
    expect(find.text('Développé couché barre'), findsOneWidget);
    await t.tap(find.byTooltip('Retirer').first);
    await t.pump();
    expect(find.text('EXERCICES · 1'), findsOneWidget);
    expect(find.text('Développé couché barre'), findsNothing);
  });

  testWidgets('une séance existante se modifie et se supprime depuis la séance', (t) async {
    await t.pumpWidget(app(compteDe({
      'SEANCES': [
        {'nom': 'Jambes', 'ex': [{'id': 'sq'}, {'id': 'dc'}]},
      ],
    })));
    await t.tap(find.text('Commencer'));
    await t.pumpAndSettle();
    await t.tap(find.byTooltip('Modifier la séance'));
    await t.pumpAndSettle();
    expect(find.text('Modifier la séance'), findsOneWidget);
    expect(find.text('EXERCICES · 2'), findsOneWidget);
    expect(find.widgetWithText(TextField, 'Jambes'), findsOneWidget);
    await t.tap(find.byTooltip('Supprimer la séance'));
    await t.pumpAndSettle();
    expect(find.text('Supprimer « Jambes » ?'), findsOneWidget);
    await t.tap(find.text('Annuler'));
    await t.pumpAndSettle();
    expect(find.text('Enregistrer'), findsOneWidget);
  });
}
