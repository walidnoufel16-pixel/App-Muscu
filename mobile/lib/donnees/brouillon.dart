/* La séance en cours, gardée sur le téléphone à chaque geste : si l'appli est fermée en pleine
   séance (appel, téléphone verrouillé longtemps), on la retrouve en rouvrant la séance.
   Une séance commencée il y a plus de 6 h n'est plus reprise (comme sur le site). */
import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../logique/enregistrer.dart' show ecartSeance;
import '../logique/modele.dart';

class ExEnCours {
  final String id;
  final List<Serie> series;
  int ts;
  ExEnCours(this.id, this.series, [this.ts = 0]);
}

class SeanceEnCours {
  final String signature;
  final int debut;
  final List<ExEnCours> ex;
  SeanceEnCours(this.signature, this.debut, this.ex);

  Map<String, dynamic> versJson() => {
        'signature': signature,
        'debut': debut,
        'ex': [
          for (final e in ex) {'id': e.id, 'ts': e.ts, 'series': e.series.map((s) => s.versJson()).toList()},
        ],
      };

  static SeanceEnCours? depuis(Map<String, dynamic> j) {
    final ex = j['ex'];
    if (ex is! List || j['signature'] is! String || j['debut'] is! int) return null;
    return SeanceEnCours(j['signature'] as String, j['debut'] as int, [
      for (final e in ex.whereType<Map>())
        ExEnCours(
          e['id']?.toString() ?? '',
          [for (final s in ((e['series'] as List?) ?? const []).whereType<Map>()) Serie.depuis(Map<String, dynamic>.from(s))],
          (e['ts'] as num?)?.toInt() ?? 0,
        ),
    ]);
  }
}

class Brouillons {
  static String _cle(String uid, int i) => 'seance-en-cours:$uid:$i';

  static Future<SeanceEnCours?> lire(String uid, int i, String signature) async {
    try {
      final p = await SharedPreferences.getInstance();
      final t = p.getString(_cle(uid, i));
      if (t == null) return null;
      final s = SeanceEnCours.depuis(jsonDecode(t) as Map<String, dynamic>);
      final trop = s == null || DateTime.now().millisecondsSinceEpoch - s.debut > ecartSeance;
      if (trop || s.signature != signature) {
        await p.remove(_cle(uid, i));
        return null;
      }
      return s;
    } catch (_) {
      return null;
    }
  }

  static Future<void> garder(String uid, int i, SeanceEnCours s) async {
    try {
      final p = await SharedPreferences.getInstance();
      await p.setString(_cle(uid, i), jsonEncode(s.versJson()));
    } catch (_) {}
  }

  static Future<void> oublier(String uid, int i) async {
    try {
      final p = await SharedPreferences.getInstance();
      await p.remove(_cle(uid, i));
    } catch (_) {}
  }
}
