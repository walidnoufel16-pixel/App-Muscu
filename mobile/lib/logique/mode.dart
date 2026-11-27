/* Le mode Suivi, logique pure (reprise de web/lib/logic/mode.ts, mêmes règles, mêmes tests).
   On note ses séances comme dans un carnet ; Oxa propose la séance à faire et rappelle la
   dernière fois. */
import 'modele.dart';

enum Mode { suivi, guide }

/// Le mode du compte ; « guide » par défaut (comptes d'avant le réglage compris).
Mode modeDe(Map<String, dynamic>? a) => a?['mode'] == 'suivi' ? Mode.suivi : Mode.guide;

String _deux(int n) => n.toString().padLeft(2, '0');

/// Jour local d'une date, « AAAA-MM-JJ ».
String jourDe(DateTime d) => '${d.year}-${_deux(d.month)}-${_deux(d.day)}';

DateTime dateDe(String j) {
  final p = j.split('-').map(int.parse).toList();
  return DateTime(p[0], p[1], p[2]);
}

String decaler(String j, int n) {
  final d = dateDe(j);
  return jourDe(DateTime(d.year, d.month, d.day + n));
}

/// Les séances qu'on note en mode Suivi : musculation à soi (ni soin, ni street, ni séance
/// d'Oxa non gardée). Renvoie leurs index dans la liste du compte.
List<int> seancesSuivies(Etat e) => [
      for (var i = 0; i < e.seances.length; i++)
        if (e.seances[i] case final s? when s.soin == null && s.street == null && !s.auto) i,
    ];

/// La dernière ligne de l'historique d'une séance libre (index i).
LigneHist? derniereLigne(List<LigneHist> h, int i) {
  LigneHist? best;
  for (final l in h) {
    if (l.s != 'L|$i') continue;
    if (best == null) {
      best = l;
      continue;
    }
    final c = l.d.compareTo(best.d);
    if (c > 0 || (c == 0 && (l.ts ?? 0) > (best.ts ?? 0))) best = l;
  }
  return best;
}

class PerfDerniere {
  final String id;
  final num v;
  final num reps;
  const PerfDerniere(this.id, this.v, this.reps);
  @override
  bool operator ==(Object other) => other is PerfDerniere && other.id == id && other.v == v && other.reps == reps;
  @override
  int get hashCode => Object.hash(id, v, reps);
}

class DerniereFois {
  final String d;
  final PerfDerniere? ex;
  const DerniereFois(this.d, [this.ex]);
  @override
  bool operator ==(Object other) => other is DerniereFois && other.d == d && other.ex == ex;
  @override
  int get hashCode => Object.hash(d, ex);
}

/// « Dernière fois » d'une séance : le jour, et le premier exercice à charge de la séance tel
/// qu'il a été fait (charge × répétitions de la meilleure série).
DerniereFois? derniereFois(Etat e, int i, Map<String, Exercice> catalogue) {
  final l = derniereLigne(e.hist, i);
  if (l == null) return null;
  final s = i >= 0 && i < e.seances.length ? e.seances[i] : null;
  final ids = [...?s?.ex.map((x) => x.id), ...l.ex.keys];
  for (final id in ids) {
    final p = l.ex[id];
    if (catalogue[id]?.ch == 'kg' && p != null && p.length > 3 && p[2] > 0) {
      return DerniereFois(l.d, PerfDerniere(id, p[2], p[3]));
    }
  }
  return DerniereFois(l.d);
}

/// La séance à proposer en premier (« Commencer ») : une jamais faite, dans l'ordre de la liste,
/// sinon celle faite il y a le plus longtemps.
int? prochaineSeance(Etat e, [List<int>? liste]) {
  final l = liste ?? seancesSuivies(e);
  if (l.isEmpty) return null;
  for (final i in l) {
    if (derniereLigne(e.hist, i) == null) return i;
  }
  final tri = [...l]..sort((a, b) => derniereLigne(e.hist, a)!.d.compareTo(derniereLigne(e.hist, b)!.d));
  return tri.first;
}

/// Le jour d'une séance passée dit simplement : « auj », « hier », le jour de la semaine
/// (0 dimanche … 6 samedi) dans la semaine écoulée, sinon null.
Object? quandRelatif(String d, String auj) {
  if (d == auj) return 'auj';
  if (d == decaler(auj, -1)) return 'hier';
  if (d.compareTo(decaler(auj, -6)) >= 0 && d.compareTo(auj) < 0) return dateDe(d).weekday % 7;
  return null;
}

const _jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const _mois = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];

/// Nombre à la française : 82.5 → « 82,5 ».
String nb(num v) => (v == v.roundToDouble() ? v.toInt().toString() : v.toString()).replaceAll('.', ',');

/// « Dernière fois jeudi · squat barre 80 × 10 », ou « Pas encore faite ».
String texteDerniere(Etat e, int i, String auj, Map<String, Exercice> catalogue, {bool detail = false}) {
  final f = derniereFois(e, i, catalogue);
  if (f == null) return 'Pas encore faite';
  final q = quandRelatif(f.d, auj);
  final d = dateDe(f.d);
  final jour = q == 'auj'
      ? "aujourd'hui"
      : q == 'hier'
          ? 'hier'
          : q is int
              ? _jours[q]
              : 'le ${d.day} ${_mois[d.month - 1]}';
  final ex = detail && f.ex != null
      ? ' · ${(catalogue[f.ex!.id]?.n ?? '').toLowerCase()} ${nb(f.ex!.v)} × ${nb(f.ex!.reps)}'
      : '';
  return 'Dernière fois $jour$ex';
}
