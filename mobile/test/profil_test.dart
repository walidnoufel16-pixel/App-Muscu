// Les trois onglets et le Profil : pseudo, choix du mode (sauf compte limité au mode Suivi),
// déconnexion et suppression du compte avec confirmation.
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';
import 'package:oxa/donnees/compte.dart';
import 'package:oxa/ecrans/accueil.dart';
import 'package:oxa/ecrans/profil.dart';
import 'package:oxa/theme.dart';

import 'mes_seances_test.dart' show compteDe;

Widget app(Widget w) => MaterialApp(theme: themeOxa(Brightness.light), home: w);

/// Un téléphone assez haut pour tout le Profil.
void grand(WidgetTester t) {
  t.view.physicalSize = const Size(390 * 3, 1100 * 3);
  t.view.devicePixelRatio = 3;
  addTearDown(t.view.reset);
}

void main() {
  testWidgets('les trois onglets : Séances, Progrès, Profil', (t) async {
    grand(t);
    await t.pumpWidget(app(EcranAccueil(compte: compteDe({'SEANCES': []}))));
    expect(find.text('Salut Walid'), findsOneWidget);
    await t.tap(find.text('Progrès'));
    await t.pumpAndSettle();
    expect(find.text('Ta première séance remplira cet écran'), findsOneWidget);
    await t.tap(find.text('Profil').last);
    await t.pumpAndSettle();
    expect(find.text('Supprimer mon compte'), findsOneWidget);
  });

  testWidgets('le pseudo et le mode du compte', (t) async {
    await t.pumpWidget(app(EcranProfil(compte: compteDe({'A': {'mode': 'suivi'}}))));
    expect(find.text('Walid'), findsOneWidget);
    expect(find.text('W'), findsOneWidget);
    expect(find.text('Suivi'), findsOneWidget);
    expect(find.text('Guidé'), findsOneWidget);
    expect(find.textContaining('Tu notes tes séries'), findsOneWidget);
  });

  testWidgets('compte limité au mode Suivi : pas de choix de mode', (t) async {
    await t.pumpWidget(app(EcranProfil(compte: compteDe({'A': {'mode': 'suivi', 'suiviSeul': true}}))));
    expect(find.text('Guidé'), findsNothing);
    expect(find.text('Se déconnecter'), findsOneWidget);
  });

  testWidgets('mode Guidé ouvert par l\'admin : le choix revient', (t) async {
    final c = compteDe({'A': {'mode': 'suivi', 'suiviSeul': true}})..guideOuvert = true;
    await t.pumpWidget(app(EcranProfil(compte: c)));
    expect(find.text('Guidé'), findsOneWidget);
  });

  testWidgets('supprimer : on dit ce qui disparaît, et Annuler ne touche à rien', (t) async {
    grand(t);
    final Compte c = compteDe({
      'SEANCES': [
        {'nom': 'Jambes', 'ex': [{'id': 'sq'}]},
        {'nom': 'Pecs', 'ex': [{'id': 'dc'}]},
      ],
      'LOG': {'sq': {'h': []}},
    });
    await t.pumpWidget(app(EcranProfil(compte: c)));
    await t.tap(find.text('Supprimer mon compte'));
    await t.pumpAndSettle();
    expect(find.text('Supprimer ton compte ?'), findsOneWidget);
    expect(find.textContaining('2 séances composées'), findsOneWidget);
    expect(find.textContaining('définitif'), findsOneWidget);
    await t.tap(find.text('Annuler'));
    await t.pumpAndSettle();
    expect(find.text('Supprimer ton compte ?'), findsNothing);
    expect(c.etat, isNotNull);
  });

  testWidgets('sexe et matériel dans Profil : celui du site par défaut', (t) async {
    await t.pumpWidget(app(EcranProfil(compte: compteDe({'A': {'mode': 'suivi'}}))));
    expect(find.text('Sexe'), findsOneWidget);
    expect(find.text('À régler'), findsOneWidget);
    expect(find.text('Salle complète'), findsOneWidget);
    await t.pumpWidget(app(EcranProfil(compte: compteDe({'A': {'sexe': 1, 'materiel': 3}}))));
    expect(find.text('Femme'), findsOneWidget);
    expect(find.text('Poids du corps'), findsOneWidget);
    await t.tap(find.text('Mon matériel'));
    await t.pumpAndSettle();
    expect(find.text("Où tu t'entraînes"), findsOneWidget);
    expect(find.text('Barre de traction'), findsOneWidget);
    expect(find.text('Kettlebell'), findsOneWidget);
  });
}
