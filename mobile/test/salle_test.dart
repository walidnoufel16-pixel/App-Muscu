// « Ma salle » : mêmes cas que web/tests/salle-street.test.ts (chaque machine a son poste, une machine absente
// retire ses exercices, rien n'est proposé sur une machine absente), et les réglages de FeuilleSalle
// (web/components/repere/ma-salle.tsx) : toucher un poste, Toutes, Aucune, le compte des disponibles.
import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';
import 'package:oxa/ecrans/ma_salle.dart';
import 'package:oxa/ecrans/materiel.dart';
import 'package:oxa/logique/materiel.dart';
import 'package:oxa/logique/muscles_du_jour.dart';
import 'package:oxa/logique/salle.dart';
import 'package:oxa/theme.dart';

import 'catalogue.dart';
import 'mes_seances_test.dart' show compteDe;

final salle = Salle.depuis(jsonDecode(File('assets/salle.json').readAsStringSync()) as Map<String, dynamic>);

void main() {
  group('les postes de la salle', () {
    test('les zones du site, dans l\'ordre, et chaque poste dans une zone', () {
      expect([for (final z in salle.zones) z.k], ['poly', 'jambes', 'haut', 'dos', 'bras', 'cardio', 'fonc', 'barre']);
      expect(salle.postes.length, 58);
      for (final p in salle.postes) {
        expect(salle.zones.any((z) => z.k == p.zone), isTrue, reason: p.id);
      }
    });
    test('chaque exercice machine (eq 0) hors soin a son poste, qui existe dans la salle', () {
      final sans = [for (final e in cat.entries) if (e.value.eq == 0 && e.value.pat != 'soin' && e.value.poste == null) e.key];
      expect(sans, isEmpty);
      final ids = {for (final p in salle.postes) p.id};
      for (final e in cat.values) {
        if (e.poste != null) expect(ids, contains(e.poste));
      }
    });
    test('la photo d\'un poste est celle d\'un exercice du catalogue', () {
      for (final p in salle.postes) {
        if (p.img != null) expect(cat, contains(p.img), reason: p.id);
      }
    });
    test('salle complète : machines et postes à barre ; home gym : postes à barre ; sinon rien', () {
      expect(salle.zonesPour(typesSalle(0)).length, 8);
      expect([for (final z in salle.zonesPour(typesSalle(1))) z.k], ['barre']);
      expect(salle.visibles(typesSalle(1)), ['rack', 'banc', 'pupitre', 'ez', 'trapbar', 'landmine']);
      expect(salle.visibles(typesSalle(2)), isEmpty);
      expect(salle.visibles(typesSalle(3)), isEmpty);
    });
  });

  group('machine absente', () {
    test('une machine absente retire ses exercices, les autres restent', () {
      final sel = selDeclare({'materiel': 0, 'sansPostes': ['presse']});
      expect(exoFiltre('pr', sel, cat), isFalse);
      expect(exoFiltre('hack', sel, cat), isTrue);
    });
    test('rien n\'est proposé sur une machine absente', () {
      final sel = selDeclare({'materiel': 0, 'sansPostes': [for (final p in salle.postes) if (p.zone != 'cardio') p.id]});
      for (final k in ['qua', 'pec', 'dos']) {
        final l = [for (final r in exosParMuscle([k], cat, sel)) ...r.l];
        expect(l, isNotEmpty, reason: k);
        expect(l.where((o) => cat[o]!.poste != null && cat[o]!.poste != 'rameur'), isEmpty, reason: k);
      }
    });
  });

  group('régler Ma salle : seul A.sansPostes change', () {
    final doc = {'A': {'mode': 'suivi', 'materiel': 0}, 'LOG': {'sq': 1}};
    test('toucher un poste l\'enlève, le toucher encore le remet', () {
      final d1 = basculerPoste(doc, 'presse');
      expect((d1['A'] as Map)['sansPostes'], ['presse']);
      expect((d1['A'] as Map)['mode'], 'suivi');
      expect(d1['LOG'], doc['LOG']);
      final d2 = basculerPoste(d1, 'hack');
      expect((d2['A'] as Map)['sansPostes'], ['presse', 'hack']);
      expect((basculerPoste(d2, 'presse')['A'] as Map)['sansPostes'], ['hack']);
      expect(doc['A'], {'mode': 'suivi', 'materiel': 0});
    });
    test('Toutes et Aucune ne touchent que les postes affichés', () {
      final vis = salle.visibles(typesSalle(1));
      final d = {'A': {'materiel': 1, 'sansPostes': ['presse', 'rack']}};
      final aucune = tousLesPostes(d, vis, false);
      expect((aucune['A'] as Map)['sansPostes'], ['presse', ...vis]);
      expect(postesDispo(aucune['A'] as Map<String, dynamic>, vis), 0);
      final toutes = tousLesPostes(aucune, vis, true);
      expect((toutes['A'] as Map)['sansPostes'], ['presse']);
      expect(postesDispo(toutes['A'] as Map<String, dynamic>, vis), 6);
    });
    test('compte qui ne l\'a jamais réglé : tout est là', () {
      expect(postesAbsents({}), isEmpty);
      expect(postesDispo({}, salle.visibles(typesSalle(0))), 58);
    });
  });

  group('écran', () {
    Widget app(Widget w) => MaterialApp(theme: themeOxa(Brightness.light), home: w);

    testWidgets('Mon matériel : la ligne Ma salle seulement en salle complète et en home gym', (t) async {
      final c = compteDe({'A': {'materiel': 0, 'sansPostes': ['presse', 'rack']}})..salle = salle;
      await t.pumpWidget(app(EcranMateriel(compte: c)));
      expect(find.text('Ma salle'), findsNothing); // dans un Text.rich
      expect(find.textContaining('56 sur 58 machines et postes', findRichText: true), findsOneWidget);
      final hg = compteDe({'A': {'materiel': 1, 'sansPostes': ['presse', 'rack']}})..salle = salle;
      await t.pumpWidget(app(EcranMateriel(compte: hg)));
      expect(find.textContaining('5 sur 6 machines et postes', findRichText: true), findsOneWidget);
      final pdc = compteDe({'A': {'materiel': 3}})..salle = salle;
      await t.pumpWidget(app(EcranMateriel(compte: pdc)));
      expect(find.textContaining('machines et postes', findRichText: true), findsNothing);
    });

    testWidgets('la planche : les zones, le compte des disponibles, la machine absente barrée', (t) async {
      final c = compteDe({'A': {'materiel': 1, 'sansPostes': ['rack']}})..salle = salle;
      await t.pumpWidget(app(EcranSalle(compte: c)));
      expect(find.text('POSTES À BARRE'), findsOneWidget);
      expect(find.text('JAMBES'), findsNothing);
      expect(find.text('5 sur 6 disponibles'), findsOneWidget);
      final rack = t.widget<Text>(find.text('Rack à squat'));
      expect(rack.style?.decoration, TextDecoration.lineThrough);
      final banc = t.widget<Text>(find.text('Banc de développé'));
      expect(banc.style?.decoration, isNull);
      expect(find.text('Toutes'), findsOneWidget);
      expect(find.text('Aucune'), findsOneWidget);
    });

    testWidgets('toucher la photo la montre en grand, la croix la ferme', (t) async {
      final c = compteDe({'A': {'materiel': 1}})..salle = salle;
      t.view.physicalSize = const Size(390 * 3, 1100 * 3);
      t.view.devicePixelRatio = 3;
      addTearDown(t.view.reset);
      await t.pumpWidget(app(EcranSalle(compte: c)));
      await t.tap(find.bySemanticsLabel('Voir en grand : Trap bar'));
      await t.pumpAndSettle();
      expect(find.text('Trap bar'), findsNWidgets(2));
      await t.tap(find.byTooltip('Fermer'));
      await t.pumpAndSettle();
      expect(find.text('Trap bar'), findsOneWidget);
    });
  });
}
