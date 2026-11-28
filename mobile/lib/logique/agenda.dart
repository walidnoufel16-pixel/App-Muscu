/* La semaine en anneaux de l'accueil, logique pure. Reprise de web/lib/logic/agenda.ts (joursAgenda,
   faitsParJour, seancesEnCours, tombeLe) avec les mêmes cas de test. Le fait vient de l'historique
   (musculation, cardio seul, sorties de course) ; le prévu vient d'AGENDA, les séances programmées
   sur le site (l'appli ne programme pas encore). Une séance en cours n'est pas encore faite. */
import 'charge.dart' show okDe;
import 'enregistrer.dart' show ecartSeance;
import 'mode.dart';
import 'modele.dart';

enum Famille { muscu, cardio, course }

/// Une séance programmée (AGENDA du site), réduite à ce que lit la semaine.
class Prevu {
  final String d;
  final String nom;
  final Famille famille;
  final bool hebdo;
  final List<String> sauf;
  const Prevu(this.d, this.nom, {this.famille = Famille.muscu, this.hebdo = false, this.sauf = const []});

  factory Prevu.depuis(Map<String, dynamic> j) {
    final t = (j['quoi'] as Map?)?['t'];
    return Prevu(
      j['d']?.toString() ?? '',
      j['nom']?.toString() ?? '',
      famille: t == 'cardio'
          ? Famille.cardio
          : t == 'course'
          ? Famille.course
          : Famille.muscu,
      hebdo: j['hebdo'] == true,
      sauf: [for (final x in (j['sauf'] as List?) ?? const []) x.toString()],
    );
  }
}

/// Le prévu tombe-t-il ce jour-là ?
bool tombeLe(Prevu p, String d) {
  if (p.sauf.contains(d)) return false;
  if (!p.hebdo) return p.d == d;
  if (d.compareTo(p.d) < 0) return false;
  return (dateDe(d).difference(dateDe(p.d)).inHours / 24).round() % 7 == 0;
}

class Fait {
  final String nom;
  final Famille famille;
  final String? s;
  const Fait(this.nom, this.famille, [this.s]);
}

class EnCours {
  final int i;
  final String s, d, nom;
  int ts = 0, series = 0;
  EnCours(this.i, this.s, this.d, this.nom);
}

String _jourTs(int ts) => jourDe(DateTime.fromMillisecondsSinceEpoch(ts));

/// Séances commencées et pas encore rangées : des séries validées il y a moins de 6 heures dans
/// leur journal (LOG « L|i|k »). Elles ne comptent pas encore comme faites.
List<EnCours> seancesEnCours(Etat e, [int? maintenant]) {
  final t = maintenant ?? DateTime.now().millisecondsSinceEpoch;
  final m = <int, EnCours>{};
  final cle = RegExp(r'^L\|(\d+)\|\d+$');
  for (final x in e.log.entries) {
    final r = cle.firstMatch(x.key), l = x.value;
    if (r == null || l.ts == 0 || t - l.ts > ecartSeance) continue;
    final n = l.series.where((s) => okDe(l, s)).length;
    if (n == 0) continue;
    final i = int.parse(r.group(1)!);
    final s = i < e.seances.length ? e.seances[i] : null;
    if (s == null) continue;
    final c = m.putIfAbsent(i, () => EnCours(i, 'L|$i', _jourTs(l.ts), s.nom));
    c.series += n;
    if (l.ts > c.ts) c.ts = l.ts;
  }
  return m.values.toList()..sort((a, b) => b.ts - a.ts);
}

/// L'historique sans les séances en cours (la série de semaines ne les compte pas).
List<LigneHist> histSansEnCours(Etat e, [int? maintenant]) {
  final k = {for (final c in seancesEnCours(e, maintenant)) '${c.d}|${c.s}'};
  return e.hist.where((l) => !k.contains('${l.d}|${l.s}')).toList();
}

/// Ce qui a été fait, jour par jour (une séance en cours n'y est pas encore).
Map<String, List<Fait>> faitsParJour(Etat e, [int? maintenant]) {
  final m = <String, List<Fait>>{};
  void ajouter(String d, Fait f) => (m[d] ??= []).add(f);
  for (final l in histSansEnCours(e, maintenant)) {
    ajouter(l.d, Fait(l.nom, Famille.muscu, l.s));
  }
  /* un bloc cardio d'une séance combinée (ref) est déjà dans sa séance */
  for (final c in e.cardio) {
    if (c['ref'] == null && c['run'] != true && c['ts'] is num) {
      ajouter(_jourTs((c['ts'] as num).toInt()), Fait(c['nom']?.toString() ?? '', Famille.cardio));
    }
  }
  for (final s in e.sorties) {
    if (s['d'] is String) ajouter(s['d'] as String, Fait(s['course'] == true ? 'Course' : 'Course à pied', Famille.course));
  }
  return m;
}

class JourAgenda {
  final String d;
  final List<Fait> fait;
  final List<Prevu> prevus, manques;
  const JourAgenda(this.d, this.fait, this.prevus, this.manques);
}

/// Les jours de l'agenda : n jours à partir du lundi `debut`. Un prévu est « fait » quand une séance
/// de la même famille a été faite ce jour-là ; passé et pas fait, il est « manqué ».
List<JourAgenda> joursAgenda(Etat e, String debut, String auj, [int n = 14, int? maintenant]) {
  final faits = faitsParJour(e, maintenant), A = [for (final p in e.agenda) Prevu.depuis(p)];
  return List.generate(n, (k) {
    final d = decaler(debut, k), fait = faits[d] ?? const <Fait>[];
    final restants = A.where((p) => tombeLe(p, d) && !fait.any((f) => f.famille == p.famille)).toList();
    final avenir = d.compareTo(auj) >= 0;
    return JourAgenda(d, fait, avenir ? restants : const [], avenir ? const [] : restants);
  });
}
