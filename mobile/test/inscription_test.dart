// Créer son compte dans l'appli, comme le site : le formulaire (surnom, adresse facultative) et le
// document rangé à la création (mode Suivi verrouillé, Mes séances vide, accueil du site passé).
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';
import 'package:oxa/donnees/compte.dart';
import 'package:oxa/ecrans/adresse.dart';
import 'package:oxa/ecrans/connexion.dart';
import 'package:oxa/ecrans/mes_seances.dart';
import 'package:oxa/logique/inscription.dart';
import 'package:oxa/logique/mode.dart';
import 'package:oxa/logique/modele.dart';
import 'package:oxa/theme.dart';

import 'mes_seances_test.dart' show compteDe;

Widget app(Widget w) => MaterialApp(theme: themeOxa(Brightness.light), home: w);

void main() {
  group('formulaire', () {
    test('le surnom : sans espaces autour ni balises', () {
      expect(pseudoPropre('  Walid '), 'Walid');
      expect(pseudoPropre('<b>Wa</b>'), 'bWa/b');
    });
    test('deux caractères au minimum, adresse facultative mais valide', () {
      expect(erreurInscription('W', '', valideMail), 'Deux caractères au minimum.');
      expect(erreurInscription('Wa', '', valideMail), isNull);
      expect(erreurInscription('Wa', 'walid@exemple.fr', valideMail), isNull);
      expect(erreurInscription('Wa', 'walid@', valideMail), contains("n'a pas l'air valide"));
    });
  });

  group('document du nouveau compte', () {
    final doc = documentNouveauCompte(maintenant: DateTime.utc(2026, 11, 27));
    test('le même que le site : état vide, mode Suivi verrouillé, accueil passé', () {
      expect(doc['A'], {'mode': 'suivi', 'suiviSeul': true, 'accueilPasse': true});
      expect(doc['SEANCES'], isEmpty);
      expect(doc['LOG'], isEmpty);
      expect(doc['PLAN'], isNull);
      expect(doc['FINI'], false);
      expect(doc['ts'], DateTime.utc(2026, 11, 27).millisecondsSinceEpoch);
    });
    test('lu par l\'appli : mode Suivi, sans choix de mode, sans cycle', () {
      final e = Etat.depuis(doc);
      expect(modeDe(e.a), Mode.suivi);
      expect(e.seances, isEmpty);
      expect(e.cycle, isFalse);
      expect((compteDe(doc)).suiviSeul, isTrue);
    });
  });

  testWidgets('un nouveau compte arrive sur Mes séances vide, avec « Nouvelle séance »', (t) async {
    await t.pumpWidget(app(EcranMesSeances(compte: compteDe(documentNouveauCompte()))));
    expect(find.text('Écris ta première séance'), findsOneWidget);
    expect(find.text('Nouvelle séance'), findsOneWidget);
    expect(find.textContaining('mode Guidé'), findsNothing);
  });

  testWidgets('entrée : créer son compte ou retrouver le sien', (t) async {
    await t.pumpWidget(app(EcranConnexion(compte: compteDe(null))));
    expect(find.text('Créer mon compte'), findsOneWidget);
    await t.tap(find.text('J\'ai déjà un compte'));
    await t.pumpAndSettle();
    expect(find.text('Retrouve ton compte'), findsOneWidget);
    await t.tap(find.text('Retour'));
    await t.pumpAndSettle();
    await t.tap(find.text('Créer mon compte'));
    await t.pumpAndSettle();
    expect(find.text('Ton surnom'), findsWidgets);
    expect(find.textContaining('ne vit que sur ce téléphone'), findsOneWidget);
  });

  testWidgets('créer : le formulaire est vérifié avant tout envoi', (t) async {
    await t.pumpWidget(app(EcranConnexion(compte: compteDe(null))));
    await t.tap(find.text('Créer mon compte'));
    await t.pumpAndSettle();
    await t.enterText(find.byType(TextField).first, 'W');
    await t.tap(find.widgetWithText(FilledButton, 'Créer mon compte'));
    await t.pumpAndSettle();
    expect(find.text('Deux caractères au minimum.'), findsOneWidget);
    await t.enterText(find.byType(TextField).first, 'Walid');
    await t.enterText(find.byType(TextField).last, 'walid@');
    await t.tap(find.widgetWithText(FilledButton, 'Créer mon compte'));
    await t.pumpAndSettle();
    expect(find.textContaining("n'a pas l'air valide"), findsOneWidget);
  });

  testWidgets('adresse depuis Profil : la saisir, vérifiée avant l\'envoi', (t) async {
    final Compte c = compteDe(documentNouveauCompte());
    await t.pumpWidget(app(EcranAdresse(compte: c)));
    expect(find.text('Ajoute ton adresse'), findsOneWidget);
    await t.enterText(find.byType(TextField), 'pas-une-adresse');
    await t.tap(find.text('Recevoir le code'));
    await t.pumpAndSettle();
    expect(find.textContaining("n'a pas l'air valide"), findsOneWidget);
    expect(find.text('Plus tard'), findsNothing);
  });
}
