// Le matériel du Profil : mêmes cas que web/tests/salle-street.test.ts (selDeclare, exoFiltre,
// barreDeclaree, Ma salle, TRX) et web/tests/premiere-seance.test.ts (exercices proposés avec ce matériel).
import 'package:flutter_test/flutter_test.dart';
import 'package:oxa/logique/materiel.dart';
import 'package:oxa/logique/muscles_du_jour.dart';

import 'catalogue.dart';

final tout = [for (final (t, _) in typesMateriel) t];

void main() {
  group('matériel déclaré', () {
    test('compte qui ne l\'a jamais réglé : celui du site, salle complète avec la barre de traction', () {
      expect(selDeclare({}), ['m3', 'm2', 'm1', 'm0', 'bt']);
      expect(lieux[lieuDe({})], 'Salle complète');
    });
    test('poids du corps seul', () {
      expect(selDeclare({'materiel': 3}), ['m3']);
      expect(selDeclare({'materiel': 2, 'acc': [0, 1]}), ['m3', 'm2', 'kb', 'el']);
    });
    test('une machine absente retire ses exercices, les autres restent', () {
      final sel = selDeclare({'materiel': 0, 'sansPostes': ['presse']});
      expect(sel, contains('x:presse'));
      expect(exoFiltre('pr', sel, cat), isFalse);
      expect(exoFiltre('hack', sel, cat), isTrue);
    });
  });

  group('barre de traction', () {
    test('salle et home gym l\'ont par défaut, le poids du corps seul non ; le Profil décide sinon', () {
      expect(barreDeclaree({'materiel': 0}), isTrue);
      expect(barreDeclaree({'materiel': 1}), isTrue);
      expect(barreDeclaree({'materiel': 3}), isFalse);
      expect(barreDeclaree({'materiel': 3, 'barre': true}), isTrue);
      expect(barreDeclaree({'materiel': 0, 'barre': false}), isFalse);
    });
    test('les tractions demandent la barre', () {
      expect(exoFiltre('tr', ['m3'], cat), isFalse);
      expect(exoFiltre('tr', ['m3', 'bt'], cat), isTrue);
      expect(exoFiltre('tr', ['bt'], cat), isTrue);
      expect(exoFiltre('pomp', ['m3'], cat), isTrue);
    });
  });

  group('TRX', () {
    final trx = [for (final e in cat.entries) if (e.value.acc == 'trx') e.key];
    test('20 exercices aux sangles, visibles seulement avec les sangles', () {
      expect(trx.length, 20);
      for (final o in trx) {
        expect(exoFiltre(o, ['trx'], cat), isTrue, reason: o);
        expect(exoFiltre(o, ['m3', 'm2', 'm1', 'm0', 'kb', 'el', 'bt'], cat), isFalse, reason: o);
      }
    });
    test('déclaré à part dans le Profil', () {
      expect(selDeclare({'materiel': 0, 'trx': true}), contains('trx'));
      expect(selDeclare({'materiel': 0, 'acc': [2]}), isNot(contains('trx')));
      expect(selDeclare({'materiel': 0, 'acc': [0, 1]}), isNot(contains('trx')));
    });
  });

  group('exercices proposés avec ce matériel', () {
    test('chaque muscle de la première séance a des exercices avec tout le matériel', () {
      for (final k in ['pec', 'dos', 'epa', 'bic', 'tri', 'qua', 'isc', 'mol', 'abd']) {
        expect(exosParMuscle([k], cat, tout).first.l, isNotEmpty, reason: k);
      }
    });
    test('au poids du corps, seulement des exercices faisables sans matériel', () {
      final l = exosParMuscle(['pec'], cat, ['m3']).first.l;
      expect(l, isNotEmpty);
      expect(l.every((o) => cat[o]!.eq == 3), isTrue);
    });
    test('la presse disparaît si elle manque à la salle', () {
      expect(exosParMuscle(['qua'], cat, selDeclare({})).first.l, contains('pr'));
      expect(exosParMuscle(['qua'], cat, selDeclare({'sansPostes': ['presse']})).first.l, isNot(contains('pr')));
    });
  });

  group('écrire dans le compte : seul le réglage change', () {
    final doc = {'A': {'mode': 'suivi'}, 'LOG': {}};
    test('lieu, barre, TRX, accessoires', () {
      expect(choisirLieu(doc, 3)['A'], {'mode': 'suivi', 'materiel': 3});
      expect(basculerBarre(doc)['A']['barre'], isFalse);
      expect(basculerBarre({'A': {'materiel': 3}})['A']['barre'], isTrue);
      expect(basculerTrx(doc)['A']['trx'], isTrue);
      expect(basculerAccessoire(doc, 1)['A']['acc'], [1]);
      expect(basculerAccessoire({'A': {'acc': [0, 1]}}, 0)['A']['acc'], [1]);
      expect(choisirLieu(doc, 1)['LOG'], same(doc['LOG']));
    });
    test('le corps à afficher', () {
      expect(silhouetteADemander({}), isTrue);
      expect(silhouetteADemander(reglerSexe(doc, 1)['A']), isFalse);
      expect(silhouetteFemme({'sexe': 1}), isTrue);
      expect(silhouetteFemme({'sexe': 2}), isFalse);
      expect(silhouetteADemander({'sexe': 2}), isFalse);
      expect(nomsMateriel(selDeclare({})), 'Poids du corps, Barre de traction, Haltères, Barre, Machines');
    });
  });
}
