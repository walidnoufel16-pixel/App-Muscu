/* Créer, modifier et supprimer une séance de « Mes séances », comme le site
   (web/app/entrainement/composer/page.tsx et web/lib/logic/actions.ts) :
   - un exercice ajouté à la main reçoit la prescription par défaut du site (exParDefaut) ;
   - à la modification, chaque journal en cours suit son exercice ; ceux qui ne le retrouvent pas
     sont mis de côté, pas effacés (reattacherJournaux) ;
   - à la suppression, les journaux de la séance partent et ceux des suivantes sont recalés
     (supprimerSeance).
   On part toujours du document brut du compte : tout ce que l'appli ne connaît pas est gardé tel
   quel. ts du document mis à jour : le site voit qu'un autre appareil a écrit et reprend ses séances. */
import 'dart:convert';

import 'charge.dart' show okDe;
import 'modele.dart';

/// Les groupes de muscles du filtre, comme la bibliothèque du site (PAT2GRP de referentiels.ts).
const groupesDePat = {
  'ph': 'Pectoraux',
  'pv': 'Épaules',
  'ep': 'Épaules',
  're': 'Épaules',
  'tv': 'Dos',
  'th': 'Dos',
  'eg': 'Quadriceps',
  'fh': 'Fessiers et ischio-jambiers',
  'fc': 'Bras',
  'ec': 'Bras',
  'ae': 'Abdominaux et lombaires',
  'ft': 'Abdominaux et lombaires',
  'lo': 'Abdominaux et lombaires',
  'mol': 'Mollets',
  'tra': 'Trapèzes',
  'avb': 'Avant-bras',
  'add': 'Adducteurs',
};
const cardioMobilite = 'Cardio et mobilité';

/// Les groupes dans l'ordre des pastilles du filtre.
const groupes = [
  'Pectoraux',
  'Dos',
  'Épaules',
  'Bras',
  'Quadriceps',
  'Fessiers et ischio-jambiers',
  'Abdominaux et lombaires',
  'Mollets',
  'Trapèzes',
  'Avant-bras',
  'Adducteurs',
  cardioMobilite,
];

String groupeDe(Exercice x) => groupesDePat[x.pat] ?? cardioMobilite;

/// Minuscules sans accents, pour chercher « developpe » comme « Développé ».
String sansAccents(String t) {
  const de = 'àâäáãåçéèêëíìîïñóòôöõúùûüýÿœæ', vers = 'aaaaaaceeeeiiiinooooouuuuyy';
  final b = StringBuffer();
  for (final c in t.toLowerCase().split('')) {
    final k = de.indexOf(c);
    b.write(k < 0 ? c : k < vers.length ? vers[k] : (c == 'œ' ? 'oe' : 'ae'));
  }
  return b.toString();
}

/// Les exercices du catalogue à proposer, dans l'ordre du catalogue : sans les routines de soin
/// (elles ont leurs propres séances), filtrés par groupe de muscles et par texte (nom ou muscles).
List<String> chercherExercices(Map<String, Exercice> cat, {String texte = '', String? groupe}) {
  final mots = sansAccents(texte.trim()).split(RegExp(r'\s+')).where((m) => m.isNotEmpty).toList();
  return [
    for (final e in cat.entries)
      if (e.value.pat != 'soin' &&
          (groupe == null || groupeDe(e.value) == groupe) &&
          mots.every((m) => sansAccents('${e.value.n} ${e.value.m}').contains(m)))
        e.key,
  ];
}

/// La prescription par défaut quand on ajoute un exercice à la main (exParDefaut du site).
Map<String, dynamic> exParDefaut(String id, Map<String, Exercice> cat) {
  final x = cat[id];
  return {
    'id': id,
    's': 3,
    'r': x?.ch == 'temps' ? 45 : x?.ch == 'dist' ? 250 : 10,
    'p': x?.pat == 'eg' || x?.pat == 'fh' ? '2 min 30' : '90 s',
  };
}

Map<String, dynamic> _copie(Map<String, dynamic> brut) => jsonDecode(jsonEncode(brut)) as Map<String, dynamic>;

List<dynamic> _seances(Map<String, dynamic> doc) => doc['SEANCES'] is List ? List<dynamic>.from(doc['SEANCES'] as List) : [];

Map<String, dynamic> _log(Map<String, dynamic> doc) =>
    doc['LOG'] is Map ? Map<String, dynamic>.from(doc['LOG'] as Map) : <String, dynamic>{};

String nomOuDefaut(String nom) => nom.trim().isEmpty ? 'Séance libre' : nom.trim();

/// Met de côté le journal en cours `k` (« L|i|n » → « L|i|an ») s'il a une série validée ;
/// sinon il est simplement retiré (archiver du site).
void archiver(Map<String, dynamic> log, String k) {
  final l = log.remove(k);
  if (l is! Map) return;
  final j = Journal.depuis(Map<String, dynamic>.from(l));
  if (!j.series.any((s) => okDe(j, s))) return;
  final p = k.split('|');
  var n = '${p[0]}|${p[1]}|a${p[2].replaceFirst(RegExp('^a'), '')}';
  while (log.containsKey(n)) {
    n += '+';
  }
  log[n] = l;
}

/// Ajoute une séance à la fin de « Mes séances ».
Map<String, dynamic> creerSeance(Map<String, dynamic> brut, String nom, List<String> ids, Map<String, Exercice> cat,
    {DateTime? maintenant}) {
  final doc = _copie(brut);
  doc['SEANCES'] = [
    ..._seances(doc),
    {'nom': nomOuDefaut(nom), 'ex': [for (final id in ids) exParDefaut(id, cat)]},
  ];
  doc['ts'] = (maintenant ?? DateTime.now()).millisecondsSinceEpoch;
  return doc;
}

/// Un exercice de la séance modifiée : sa position d'avant (`o`, null s'il est nouveau) et son id.
class ExModifie {
  final int? o;
  final String id;
  const ExModifie(this.id, [this.o]);
}

/// Modifie la séance `i` : nouveau nom, exercices gardés (avec leurs réglages), ajoutés, retirés
/// ou déplacés. Les journaux en cours suivent leur exercice (reattacherJournaux du site).
Map<String, dynamic> modifierSeance(
    Map<String, dynamic> brut, int i, String nom, List<ExModifie> ex, Map<String, Exercice> cat,
    {DateTime? maintenant}) {
  final doc = _copie(brut);
  final seances = _seances(doc);
  final avant = Map<String, dynamic>.from(seances[i] as Map);
  final anciens = (avant['ex'] as List?) ?? const [];
  final liste = <Map<String, dynamic>>[];
  for (var n = 0; n < ex.length; n++) {
    final e = ex[n], o = e.o;
    final a = o != null && o < anciens.length && anciens[o] is Map ? Map<String, dynamic>.from(anciens[o] as Map) : null;
    final x = a != null && a['id'] == e.id ? a : exParDefaut(e.id, cat);
    /* un superset ne tient que si les deux exercices restent côte à côte, dans le même ordre */
    final suivant = n + 1 < ex.length ? ex[n + 1].o : null;
    if (x['sup'] != null && (o == null || suivant != o + 1)) x.remove('sup');
    liste.add(x);
  }
  /* blocs cardio d'une séance combinée : ils restent placés au plus après le dernier exercice */
  if (avant['blocs'] is List) {
    avant['blocs'] = [
      for (final b in avant['blocs'] as List)
        if (b is Map) {...Map<String, dynamic>.from(b), 'apres': ((b['apres'] as num?) ?? 0).clamp(0, liste.length)} else b,
    ];
  }
  seances[i] = {...avant, 'nom': nomOuDefaut(nom), 'ex': liste};
  doc['SEANCES'] = seances;

  final log = _log(doc);
  final re = RegExp('^L\\|$i\\|(\\d+)\$');
  final enCours = <int, dynamic>{};
  for (final k in log.keys.toList()) {
    final m = re.firstMatch(k);
    if (m != null) enCours[int.parse(m.group(1)!)] = log.remove(k);
  }
  for (var n = 0; n < ex.length; n++) {
    final o = ex[n].o;
    if (o != null && enCours.containsKey(o)) log['L|$i|$n'] = enCours.remove(o);
  }
  for (final e in enCours.entries) {
    log['L|$i|${e.key}'] = e.value;
    archiver(log, 'L|$i|${e.key}');
  }
  doc['LOG'] = log;
  doc['ts'] = (maintenant ?? DateTime.now()).millisecondsSinceEpoch;
  return doc;
}

/// Supprime la séance `i` : ses journaux sont effacés, ceux des séances suivantes sont recalés
/// (supprimerSeance du site).
Map<String, dynamic> supprimerSeance(Map<String, dynamic> brut, int i, {DateTime? maintenant}) {
  final doc = _copie(brut);
  final seances = _seances(doc);
  final log = _log(doc);
  log.removeWhere((k, _) => k.startsWith('L|$i|'));
  for (var j = i + 1; j < seances.length; j++) {
    for (final k in log.keys.where((k) => k.startsWith('L|$j|')).toList()) {
      log['L|${j - 1}|${k.split('|')[2]}'] = log.remove(k);
    }
  }
  seances.removeAt(i);
  doc['SEANCES'] = seances;
  doc['LOG'] = log;
  doc['ts'] = (maintenant ?? DateTime.now()).millisecondsSinceEpoch;
  return doc;
}
