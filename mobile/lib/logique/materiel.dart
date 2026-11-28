/* Le matériel du Profil, comme le site (web/lib/logic/core.ts : accDeclares, barreDeclaree, sansPostes,
   selDeclare, exoFiltre ; Profil › Mon matériel, web/components/repere/mon-materiel.tsx), dans les mêmes
   champs du document du compte : A.materiel (0 salle complète, 1 home gym, 2 haltères seuls, 3 poids du
   corps ; sans réponse : salle complète), A.barre, A.trx, A.acc (indices de ACC), A.sansPostes (machines
   absentes, réglées dans « Ma salle » sur le site). Et le corps à afficher (A.sexe), demandé une fois
   comme ChoixSilhouette (web/components/repere/schema-corps.tsx). Logique pure. */
import 'modele.dart';

/// « Où tu t'entraînes » (MATN du site).
const lieux = ['Salle complète', 'Home gym', 'Haltères seuls', 'Poids du corps'];

/// Les accessoires déclarés à part (ACC du site) : leur indice est rangé dans A.acc.
const accessoires = [('kb', 'Kettlebell'), ('el', 'Élastiques')];

/// Les types du filtre « Matériel disponible », dans l'ordre du site (TYPES).
const typesMateriel = [
  ('m3', 'Poids du corps'),
  ('bt', 'Barre de traction'),
  ('m2', 'Haltères'),
  ('m1', 'Barre'),
  ('m0', 'Machines'),
  ('kb', 'Kettlebell'),
  ('el', 'Élastiques'),
  ('trx', 'TRX'),
];

int lieuDe(Map<String, dynamic> a) => (a['materiel'] as num?)?.toInt() ?? 0;

List<int> _acc(Map<String, dynamic> a) => [for (final i in (a['acc'] as List?) ?? const []) if (i is num) i.toInt()];

/// Les accessoires déclarés (kb, el).
List<String> accDeclares(Map<String, dynamic> a) => [for (final i in _acc(a)) if (i >= 0 && i < accessoires.length) accessoires[i].$1];

/// Avec les sangles TRX, déclarées à part.
List<String> _enPlus(Map<String, dynamic> a) => [...accDeclares(a), if (a['trx'] == true) 'trx'];

/// Barre de traction : déclarée dans Profil ; sans réponse, présente en salle et en home gym.
bool barreDeclaree(Map<String, dynamic> a) => a['barre'] is bool ? a['barre'] as bool : lieuDe(a) <= 1;

/// Machines et postes absents de la salle : « `x:poste` ».
List<String> sansPostes(Map<String, dynamic> a) => [for (final p in (a['sansPostes'] as List?) ?? const []) if (p is String) 'x:$p'];

/// Le matériel du Profil, pour filtrer : m0…m3 (champ eq), kb, el et trx (champ acc), bt (barre de
/// traction), `x:poste` (machine absente).
List<String> selDeclare(Map<String, dynamic> a) => [
      for (final v in const [3, 2, 1, 0]) if (v >= lieuDe(a)) 'm$v',
      ..._enPlus(a),
      if (barreDeclaree(a)) 'bt',
      ...sansPostes(a),
    ];

/// L'exercice se fait-il avec ce matériel ?
bool exoFiltre(String o, List<String> sel, Map<String, Exercice> cat) {
  final e = cat[o];
  if (e == null) return false;
  if (e.poste != null && sel.contains('x:${e.poste}')) return false;
  if (e.acc != null) return sel.contains(e.acc);
  if (e.bt) return sel.contains('bt');
  return sel.contains('m${e.eq}') || (e.ou != null && sel.contains(e.ou));
}

/// « Poids du corps, Barre de traction, Haltères… » : le matériel coché, en une ligne.
String nomsMateriel(List<String> sel) {
  final n = [for (final (t, nom) in typesMateriel) if (sel.contains(t)) nom];
  return n.isEmpty ? 'Aucun matériel coché' : n.join(', ');
}

/* ---- écrire dans le document du compte : seul le champ réglé change ---- */

Map<String, dynamic> _avecA(Map<String, dynamic> doc, void Function(Map<String, dynamic> a) changer) {
  final a = Map<String, dynamic>.from((doc['A'] as Map?) ?? const {});
  changer(a);
  return {...doc, 'A': a};
}

/// « Où tu t'entraînes ».
Map<String, dynamic> choisirLieu(Map<String, dynamic> doc, int i) => _avecA(doc, (a) => a['materiel'] = i);

/// Barre de traction : l'inverse de ce qui est déclaré (ou supposé sans réponse).
Map<String, dynamic> basculerBarre(Map<String, dynamic> doc) => _avecA(doc, (a) => a['barre'] = !barreDeclaree(a));

Map<String, dynamic> basculerTrx(Map<String, dynamic> doc) => _avecA(doc, (a) => a['trx'] = a['trx'] != true);

/// Un accessoire de ACC (son indice).
Map<String, dynamic> basculerAccessoire(Map<String, dynamic> doc, int i) => _avecA(doc, (a) {
      final l = _acc(a);
      a['acc'] = l.contains(i) ? [for (final x in l) if (x != i) x] : [...l, i];
    });

/// Le sexe du Profil (0 homme, 1 femme, 2 je préfère ne pas répondre) : il choisit aussi le corps affiché.
const sexes = ['Homme', 'Femme', 'Je préfère ne pas répondre'];

Map<String, dynamic> reglerSexe(Map<String, dynamic> doc, int v) => _avecA(doc, (a) => a['sexe'] = v);

/// Le corps à demander avant d'afficher les muscles : le sexe n'est pas réglé.
bool silhouetteADemander(Map<String, dynamic> a) => a['sexe'] == null;

/// Silhouette de femme si elle a été choisie, sinon d'homme (aussi pour « je préfère ne pas répondre »).
bool silhouetteFemme(Map<String, dynamic> a) => a['sexe'] == 1;
