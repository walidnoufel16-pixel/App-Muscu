/* Relire une séance passée et la retirer de l'historique, comme le site :
   - detailDe de web/lib/logic/historique.ts : le détail gardé dans l'historique, sinon le journal
     du jour s'il n'a pas été réécrit depuis, sinon le résumé par exercice ;
   - retirerDeHistorique de web/lib/logic/actions.ts : la ligne du jour, ses séries dans LOG et le
     cardio de ses blocs ce jour-là disparaissent ; la séance est notée dans RETIRES pour qu'un autre
     appareil ne la fasse pas revenir à la synchronisation. La séance reste dans Mes séances.
   Mêmes cas de test que web/tests/detail.test.ts et web/tests/retirer.test.ts. */
import 'dart:convert';

import 'charge.dart' show okDe;
import 'enregistrer.dart' show journauxDuJour, perfDe;
import 'mode.dart' show jourDe;
import 'modele.dart';

/// Les parties d'une séance relue, dans l'ordre où elles apparaissent.
enum Partie { soin, muscu, cardio }

const nomPartie = {Partie.soin: 'Soin & mobilité', Partie.muscu: 'Musculation', Partie.cardio: 'Cardio'};

Partie partieDe(Exercice? x) => x?.pat == 'soin'
    ? Partie.soin
    : x?.pat == 'ca'
    ? Partie.cardio
    : Partie.muscu;

Journal _lu(String id, List<List<num>> s, [int? f]) => Journal(
  ex: id,
  done: true,
  nb: s.length,
  feel: f,
  lest: s.any((x) => x.length > 2 && x[2] > 0),
  series: [for (final x in s) Serie(v: x[0], reps: x[1], ok: true, lest: x.length > 2 && x[2] > 0 ? x[2] : null)],
);

/// Détail d'une séance passée : chaque exercice et ses séries validées ce jour-là.
List<({String id, Journal l})> detailDe(Etat e, LigneHist l, Map<String, Exercice> cat) {
  if (l.det.isNotEmpty) {
    return [
      for (final x in l.det)
        if (cat.containsKey(x.id)) (id: x.id, l: _lu(x.id, x.s, x.f)),
    ];
  }
  final ks = journauxDuJour(e.log, l.s, l.d).where((k) => cat.containsKey(e.log[k]!.ex) && perfDe(e.log[k]!, cat) != null);
  if (ks.isNotEmpty) {
    return [
      for (final k in ks)
        (
          id: e.log[k]!.ex,
          l: _lu(e.log[k]!.ex, [
            for (final x in e.log[k]!.series)
              if (okDe(e.log[k]!, x)) [x.v, x.reps, if ((x.lest ?? 0) > 0) x.lest!],
          ], e.log[k]!.feel),
        ),
    ];
  }
  return [
    for (final x in l.ex.entries)
      if (cat.containsKey(x.key) && x.value.length >= 5)
        (
          id: x.key,
          /* poids du corps : la valeur est le nombre de répétitions, le meilleur lest à part */
          l: _lu(
            x.key,
            List.generate(
              x.value[4].toInt(),
              (_) => cat[x.key]!.ch == 'aucune' ? [x.value[3], 0, if (x.value[2] > 0) x.value[2]] : [x.value[2], x.value[3]],
            ),
          ),
        ),
  ];
}

/// Texte de la confirmation : une séance créée par l'appli pour une routine (auto) n'est pas dans Mes séances.
String texteRetrait(Etat e, String s) {
  final m = RegExp(r'^L\|(\d+)$').firstMatch(s);
  final i = m == null ? -1 : int.parse(m[1]!);
  final auto = i >= 0 && i < e.seances.length && e.seances[i]?.auto == true;
  return auto
      ? 'Ses séries de ce jour-là disparaissent de Progrès, des records et des charges proposées.'
      : 'Ses séries de ce jour-là disparaissent de Progrès, des records et des charges proposées. La séance reste dans Mes séances.';
}

/// Retire la séance `s` du jour `d` de l'historique (retirerDeHistorique du site). On part du document
/// brut : tout le reste est gardé tel quel.
Map<String, dynamic> retirerDeHistorique(Map<String, dynamic> brut, String d, String s, {DateTime? maintenant}) {
  final doc = jsonDecode(jsonEncode(brut)) as Map<String, dynamic>;
  final quand = (maintenant ?? DateTime.now()).millisecondsSinceEpoch;
  final e = Etat.depuis(doc);
  final log = doc['LOG'] is Map ? Map<String, dynamic>.from(doc['LOG'] as Map) : <String, dynamic>{};
  for (final k in journauxDuJour(e.log, s, d)) {
    log.remove(k);
  }
  doc['LOG'] = log;
  doc['HIST'] = [
    for (final l in (doc['HIST'] as List?) ?? const [])
      if (!(l is Map && l['d'] == d && l['s'] == s)) l,
  ];
  final i = s.startsWith('L|') ? int.tryParse(s.substring(2)) ?? -1 : -1;
  final seances = (doc['SEANCES'] as List?) ?? const [];
  final seance = i >= 0 && i < seances.length && seances[i] is Map ? seances[i] as Map : null;
  final blocs = {
    for (final b in (seance?['blocs'] as List?) ?? const [])
      if (b is Map) b['id'],
  };
  bool duBloc(Object? c) =>
      c is Map &&
      c['ref'] != null &&
      blocs.contains(c['ref']) &&
      c['ts'] is num &&
      jourDe(DateTime.fromMillisecondsSinceEpoch((c['ts'] as num).toInt())) == d;
  final cardio = (doc['CARDIO'] as List?) ?? const [];
  final retires = [
    for (final c in cardio)
      if (duBloc(c)) c as Map,
  ];
  if (doc['CARDIO'] is List) {
    doc['CARDIO'] = [
      for (final c in cardio)
        if (!duBloc(c)) c,
    ];
  }
  final r = [
    ...((doc['RETIRES'] as List?) ?? const []),
    '$d|$s@$quand',
    for (final c in retires) 'c|${(c['ts'] as num).toInt()}',
  ];
  doc['RETIRES'] = r.length > 300 ? r.sublist(r.length - 300) : r;
  doc['ts'] = quand;
  return doc;
}
