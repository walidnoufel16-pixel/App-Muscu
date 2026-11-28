/* L'accueil Séances du mode Suivi, au-dessus de « Mes séances », comme web/components/repere/accueil-suivi.tsx :
   la semaine en anneaux et la série (SemaineAnneaux de accueil-entrainement.tsx), puis la récupération
   des muscles (LigneRecuperation de recuperation.tsx), en lecture seule. Rien pour un compte sans séance. */
import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;
import 'package:material_ui/material_ui.dart';
import 'package:path_drawing/path_drawing.dart';

import '../donnees/compte.dart';
import '../logique/agenda.dart';
import '../logique/modele.dart';
import '../logique/progres.dart' show lundiDe, objectifHebdo, pat2musc, serieSemaines;
import '../logique/recuperation.dart';
import 'jour.dart' show ouvrirJour;

const _run = Color(0xFFC2622A);
const _feu = Color(0xFFFF7A1A);

/// En récupération (orange système, comme le site).
const orangeRecup = Color(0xFFFF9F0A);
const _initiales = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

/// Un compte qui n'a encore rien fait : pas de semaine ni de récupération.
bool debutant(Etat e) => e.hist.isEmpty && e.cardio.isEmpty && e.sorties.isEmpty;

/// Les deux blocs de l'accueil, ou rien pour un débutant.
class AccueilSuivi extends StatelessWidget {
  const AccueilSuivi({super.key, required this.compte, required this.etat, required this.auj});
  final Compte compte;
  final Etat etat;
  final String auj;

  @override
  Widget build(BuildContext context) {
    if (debutant(etat)) return const SizedBox.shrink();
    final r = recuperation(etat, auj, compte.catalogue);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SemaineAnneaux(etat: etat, auj: auj, onJour: (d) => ouvrirJour(context, compte, d)),
        if (r != null) ...[const SizedBox(height: 8), LigneRecuperation(r: r, femme: etat.a['sexe'] == 1)],
        const SizedBox(height: 12),
      ],
    );
  }
}

class SemaineAnneaux extends StatelessWidget {
  const SemaineAnneaux({super.key, required this.etat, required this.auj, required this.onJour});
  final Etat etat;
  final String auj;
  final void Function(String d) onJour;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).colorScheme;
    final enCours = {for (final x in seancesEnCours(etat)) x.d};
    final J = joursAgenda(etat, lundiDe(auj), auj, 7);
    /* la série ne compte pas une séance en cours */
    final S = serieSemaines(histSansEnCours(etat), etat.joursCardio, objectifHebdo(etat.a), auj);
    return Container(
      padding: const EdgeInsets.fromLTRB(10, 10, 10, 8),
      decoration: BoxDecoration(color: c.surfaceContainer, borderRadius: BorderRadius.circular(20)),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 0, 4, 6),
            child: Row(
              children: [
                Icon(
                  S.semaines > 0 ? Icons.local_fire_department : Icons.local_fire_department_outlined,
                  size: 17,
                  color: S.semaines > 0 ? _feu : c.onSurfaceVariant,
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    S.semaines > 0 ? "${S.semaines} semaine${S.semaines > 1 ? 's' : ''} d'affilée" : 'Lance ta régularité cette semaine',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                ),
                Text('${S.cetteSemaine} sur ${S.objectif} cette semaine', style: TextStyle(fontSize: 13, color: c.onSurfaceVariant)),
              ],
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              for (var i = 0; i < J.length; i++)
                _Jour(j: J[i], ini: _initiales[i], auj: auj, enCours: enCours.contains(J[i].d), onJour: onJour),
            ],
          ),
        ],
      ),
    );
  }
}

class _Jour extends StatelessWidget {
  const _Jour({required this.j, required this.ini, required this.auj, required this.enCours, required this.onJour});
  final JourAgenda j;
  final String ini, auj;
  final bool enCours;
  final void Function(String d) onJour;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).colorScheme;
    final ajd = j.d == auj, jour = int.parse(j.d.substring(8));
    /* toucher un jour fait relit ses séances (comme le calendrier de Progrès) */
    final touche = j.fait.isNotEmpty;
    return Semantics(
      button: touche,
      label:
          '$ini $jour${j.fait.isNotEmpty
              ? ' · fait'
              : j.prevus.isNotEmpty
              ? ' · prévu'
              : ''}',
      excludeSemantics: true,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: touche ? () => onJour(j.d) : null,
        child: SizedBox(
          width: 44,
          child: Column(
            children: [
              Text(
                ini,
                style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: ajd ? c.onSurface : c.onSurfaceVariant),
              ),
              const SizedBox(height: 4),
              _Anneau(j: j, enCours: enCours),
              const SizedBox(height: 4),
              Container(
                height: 18,
                constraints: const BoxConstraints(minWidth: 20),
                padding: const EdgeInsets.symmetric(horizontal: 4),
                alignment: Alignment.center,
                decoration: ajd ? BoxDecoration(color: c.onSurface, borderRadius: BorderRadius.circular(9)) : null,
                child: Text(
                  '$jour',
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w700,
                    color: ajd
                        ? c.surface
                        : j.d.compareTo(auj) < 0
                        ? c.onSurfaceVariant
                        : c.onSurface,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Fait : rond plein coché (orange course pour une sortie) ; commencé : à moitié rempli ;
/// prévu : anneau pointillé ; manqué : anneau un peu plus marqué ; sinon anneau discret.
class _Anneau extends StatelessWidget {
  const _Anneau({required this.j, required this.enCours});
  final JourAgenda j;
  final bool enCours;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).colorScheme;
    final f = j.fait.isEmpty ? null : j.fait.first, p = j.prevus.isEmpty ? null : j.prevus.first;
    final run = (f?.famille ?? p?.famille) == Famille.course;
    if (f != null) {
      return Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(shape: BoxShape.circle, color: run ? _run : c.primary),
        child: Icon(run ? Icons.directions_run : Icons.check, size: 17, color: run ? Colors.white : c.onPrimary),
      );
    }
    final fond = c.onSurface.withValues(alpha: 0.12);
    return CustomPaint(
      size: const Size(32, 32),
      painter: _Cercle(
        couleur: p != null
            ? (run ? _run : c.primary)
            : j.manques.isNotEmpty
            ? c.onSurface.withValues(alpha: 0.25)
            : fond,
        pointille: p != null,
        moitie: enCours ? c.primary : null,
        fond: fond,
      ),
    );
  }
}

class _Cercle extends CustomPainter {
  _Cercle({required this.couleur, required this.pointille, required this.fond, this.moitie});
  final Color couleur, fond;
  final bool pointille;
  final Color? moitie;

  @override
  void paint(Canvas canvas, Size size) {
    const r = 13.0, w = 2.6;
    final centre = size.center(Offset.zero), rect = Rect.fromCircle(center: centre, radius: r);
    final pinceau = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = w;
    if (moitie != null) {
      canvas.drawCircle(centre, r, pinceau..color = fond);
      canvas.drawArc(
        rect,
        -1.5708,
        3.1416,
        false,
        pinceau
          ..color = moitie!
          ..strokeCap = StrokeCap.round,
      );
      return;
    }
    pinceau.color = couleur;
    if (!pointille) {
      canvas.drawCircle(centre, r, pinceau);
      return;
    }
    /* pointillés de 4,2 sur 3,4, comme le site */
    const tour = 2 * 3.14159265 * r, trait = 4.2, vide = 3.4;
    for (var x = 0.0; x < tour; x += trait + vide) {
      canvas.drawArc(rect, x / r, trait / r, false, pinceau);
    }
  }

  @override
  bool shouldRepaint(_Cercle o) => o.couleur != couleur || o.pointille != pointille || o.moitie != moitie;
}

/* ---------------- récupération ---------------- */

/// Les silhouettes (assets/corps.json, tracés du site), lues une fois.
class Silhouettes {
  final Map<String, Rect> vb;
  final Map<String, List<({Path d, String? p})>> zones;
  Silhouettes(this.vb, this.zones);

  static final Map<bool, Future<Silhouettes>> _cache = {};
  static Future<Silhouettes> de(bool femme) => _cache[femme] ??= () async {
    final j = jsonDecode(await rootBundle.loadString('assets/corps.json')) as Map<String, dynamic>;
    final s = j[femme ? 'femme' : 'homme'] as Map<String, dynamic>;
    Rect rect(String v) {
      final n = v.split(' ').map(double.parse).toList();
      return Rect.fromLTWH(n[0], n[1], n[2], n[3]);
    }

    return Silhouettes(
      {
        for (final c in ['front', 'back']) c: rect((s['vb'] as Map)[c] as String),
      },
      {
        for (final c in ['front', 'back'])
          c: [for (final r in (s[c] as List).cast<Map>()) (d: parseSvgPathData(r['d'] as String), p: r['p'] as String?)],
      },
    );
  }();
}

class Corps extends StatelessWidget {
  const Corps({super.key, required this.cote, required this.e, required this.hauteur, required this.femme});
  final String cote;
  final Map<String, EtatGroupe> e;
  final double hauteur;
  final bool femme;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).colorScheme;
    return FutureBuilder(
      future: Silhouettes.de(femme),
      builder: (context, s) {
        final x = s.data;
        if (x == null) return SizedBox(height: hauteur, width: hauteur / 2);
        final vb = x.vb[cote]!;
        return CustomPaint(
          size: Size(hauteur * vb.width / vb.height, hauteur),
          painter: _Corps(x.zones[cote]!, vb, e, c.primary, c.onSurface.withValues(alpha: 0.10), c.surfaceContainer),
        );
      },
    );
  }
}

class _Corps extends CustomPainter {
  _Corps(this.zones, this.vb, this.e, this.pret, this.neutre, this.trait);
  final List<({Path d, String? p})> zones;
  final Rect vb;
  final Map<String, EtatGroupe> e;
  final Color pret, neutre, trait;

  @override
  void paint(Canvas canvas, Size size) {
    final k = size.height / vb.height;
    canvas.scale(k);
    canvas.translate(-vb.left, -vb.top);
    final plein = Paint(),
        bord = Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.2 / k
          ..color = trait;
    for (final z in zones) {
      final g = z.p == null ? null : pat2musc[z.p];
      final x = g == null ? null : e[g];
      plein.color = x == null
          ? neutre
          : x.recupere
          ? pret
          : orangeRecup;
      canvas.drawPath(z.d, plein);
      canvas.drawPath(z.d, bord);
    }
  }

  @override
  bool shouldRepaint(_Corps o) => o.e != e || o.pret != pret || o.zones != zones;
}

class LigneRecuperation extends StatelessWidget {
  const LigneRecuperation({super.key, required this.r, required this.femme});
  final Recuperation r;
  final bool femme;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).colorScheme;
    return Material(
      color: c.surfaceContainer,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () => _feuille(context),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(8, 8, 12, 8),
          child: Row(
            children: [
              Corps(cote: 'front', e: r.e, hauteur: 60, femme: femme),
              Corps(cote: 'back', e: r.e, hauteur: 60, femme: femme),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'RÉCUPÉRATION',
                      style: TextStyle(fontSize: 11, letterSpacing: 0.9, fontWeight: FontWeight.w600, color: c.onSurfaceVariant),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      r.titre,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w600),
                    ),
                    if (r.sous != null)
                      Text(
                        r.sous!,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 12.5, color: c.onSurfaceVariant),
                      ),
                  ],
                ),
              ),
              Icon(Icons.chevron_right, size: 20, color: c.onSurfaceVariant),
            ],
          ),
        ),
      ),
    );
  }

  /// Le détail : corps de face et de dos, et le délai par muscle (sans bouton : lecture seule).
  Future<void> _feuille(BuildContext context) => showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    showDragHandle: true,
    backgroundColor: Theme.of(context).colorScheme.surface,
    builder: (context) {
      final c = Theme.of(context).colorScheme;
      Widget point(Color k) => Container(
        width: 10,
        height: 10,
        decoration: BoxDecoration(color: k, shape: BoxShape.circle),
      );
      return ConstrainedBox(
        constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.92),
        child: ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
          children: [
            const Text('Récupération', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
            Text("D'après tes séances des 14 derniers jours.", style: TextStyle(fontSize: 13, color: c.onSurfaceVariant)),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Corps(cote: 'front', e: r.e, hauteur: 190, femme: femme),
                const SizedBox(width: 8),
                Corps(cote: 'back', e: r.e, hauteur: 190, femme: femme),
              ],
            ),
            const SizedBox(height: 8),
            DefaultTextStyle.merge(
              style: TextStyle(fontSize: 12, color: c.onSurfaceVariant),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  point(c.primary),
                  const SizedBox(width: 6),
                  const Text('prêt'),
                  const SizedBox(width: 16),
                  point(orangeRecup),
                  const SizedBox(width: 6),
                  const Text('en récupération'),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Container(
              decoration: BoxDecoration(color: c.surfaceContainer, borderRadius: BorderRadius.circular(18)),
              child: Column(
                children: [
                  for (final (k, g) in r.tri.indexed)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: k == 0
                          ? null
                          : BoxDecoration(
                              border: Border(top: BorderSide(color: c.outline.withValues(alpha: 0.6))),
                            ),
                      child: Row(
                        children: [
                          point(r.e[g]!.recupere ? c.primary : orangeRecup),
                          const SizedBox(width: 12),
                          Expanded(child: Text(nomRecup(g), style: const TextStyle(fontSize: 15))),
                          Text(r.delai(g), style: TextStyle(fontSize: 13.5, color: c.onSurfaceVariant)),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      );
    },
  );
}
