/* Sous « Mes séances », le corps pour composer une séance par muscles, comme CorpsDuJour
   (web/components/repere/corps-du-jour.tsx) dans accueil-suivi.tsx : le corps de face ou de dos, teinté
   selon les séries des 7 derniers jours ; toucher des muscles fait apparaître « Choisir mes exercices »,
   qui propose leurs exercices rangés par rôle (la feuille d'ajout du mode Suivi, ajout-exercice.tsx),
   puis ouvre la création de séance avec ceux qu'on a cochés. Logique : lib/logique/muscles_du_jour.dart. */
import 'package:flutter/services.dart' show HapticFeedback;
import 'package:material_ui/material_ui.dart';

import '../donnees/compte.dart';
import '../logique/modele.dart';
import '../logique/muscles_du_jour.dart';
import '../logique/progres.dart' show nomMuscle, pat2musc;
import 'accueil_suivi.dart' show Silhouettes;
import 'editer_seance.dart';
import 'vignette.dart';

class CorpsDuJour extends StatefulWidget {
  const CorpsDuJour({super.key, required this.compte, required this.etat, required this.auj, required this.titre});
  final Compte compte;
  final Etat etat;
  final String auj;
  final String titre;

  @override
  State<CorpsDuJour> createState() => _CorpsDuJourState();
}

class _CorpsDuJourState extends State<CorpsDuJour> {
  final _m = <String>[];
  var _cote = 'front';

  void _basculer(String k) {
    HapticFeedback.selectionClick();
    setState(() => _m.contains(k) ? _m.remove(k) : _m.add(k));
  }

  Future<void> _choisir() async {
    HapticFeedback.lightImpact();
    final cree = await Navigator.of(context).push<bool>(MaterialPageRoute(
      builder: (_) => EcranExercicesMuscles(compte: widget.compte, muscles: List.of(_m)),
    ));
    if (cree == true && mounted) setState(_m.clear);
  }

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).colorScheme;
    final parM = seriesSemaine(widget.etat.hist, widget.auj, widget.compte.catalogue);
    final travaille = parM.values.any((n) => n > 0);
    final restants = travaille && _m.isEmpty ? pasEncore(parM) : null;
    Widget carre(Color k) => Container(
      width: 12,
      height: 12,
      margin: const EdgeInsets.only(right: 4),
      decoration: BoxDecoration(color: k, borderRadius: BorderRadius.circular(4)),
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(4, 0, 4, 8),
          child: Text(widget.titre, style: const TextStyle(fontSize: 20, height: 1.2, fontWeight: FontWeight.w700)),
        ),
        if (travaille)
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 0, 4, 8),
            child: DefaultTextStyle.merge(
              style: TextStyle(fontSize: 12, color: c.onSurfaceVariant),
              child: Row(children: [
                carre(c.primary),
                const Text('beaucoup'),
                const SizedBox(width: 12),
                carre(c.primary.withValues(alpha: 0.45)),
                const Text('un peu'),
                const SizedBox(width: 12),
                carre(c.onSurface.withValues(alpha: 0.35)),
                const Text('pas encore'),
                const Spacer(),
                const Text('7 derniers jours'),
              ]),
            ),
          ),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: c.surfaceContainer,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: c.outline.withValues(alpha: 0.8)),
          ),
          child: Column(children: [
            SizedBox(
              width: double.infinity,
              child: SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'front', label: Text('De face')),
                  ButtonSegment(value: 'back', label: Text('De dos')),
                ],
                selected: {_cote},
                showSelectedIcon: false,
                onSelectionChanged: (s) => setState(() => _cote = s.first),
              ),
            ),
            const SizedBox(height: 8),
            CorpsTactile(
              cote: _cote,
              femme: widget.etat.a['sexe'] == 1,
              hauteur: 400,
              choisis: _m,
              parM: travaille ? parM : null,
              onMuscle: _basculer,
            ),
            const SizedBox(height: 4),
            Text('Touche les muscles à travailler', style: TextStyle(fontSize: 11, color: c.onSurfaceVariant)),
          ]),
        ),
        if (restants != null)
          Container(
            margin: const EdgeInsets.only(top: 8),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(color: c.surfaceContainer, borderRadius: BorderRadius.circular(16)),
            child: Text.rich(
              TextSpan(children: [
                const TextSpan(text: 'Pas encore cette semaine : '),
                TextSpan(text: restants, style: const TextStyle(fontWeight: FontWeight.w600)),
              ]),
              style: const TextStyle(fontSize: 13, height: 1.35),
            ),
          ),
        if (_m.isNotEmpty) ...[
          const SizedBox(height: 10),
          SizedBox(
            height: 56,
            child: FilledButton(
              onPressed: _choisir,
              style: FilledButton.styleFrom(shape: const StadiumBorder()),
              child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                Flexible(
                  child: Text('Choisir mes exercices · ${_m.map(nomMuscle).join(', ')}',
                      maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.arrow_forward, size: 18),
              ]),
            ),
          ),
        ],
      ],
    );
  }
}

/// Le corps qu'on touche : chaque zone d'un muscle (mouvement connu) se choisit et se surligne.
class CorpsTactile extends StatelessWidget {
  const CorpsTactile({
    super.key,
    required this.cote,
    required this.femme,
    required this.hauteur,
    required this.choisis,
    required this.onMuscle,
    this.parM,
  });
  final String cote;
  final bool femme;
  final double hauteur;
  final List<String> choisis;
  final void Function(String muscle) onMuscle;
  /// Séries des 7 derniers jours par muscle, pour la teinte (null : pas de teinte).
  final Map<String, num>? parM;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).colorScheme;
    return FutureBuilder(
      future: Silhouettes.de(femme),
      builder: (context, s) {
        final x = s.data;
        if (x == null) return SizedBox(height: hauteur);
        final vb = x.vb[cote]!, zones = x.zones[cote]!;
        final taille = Size(hauteur * vb.width / vb.height, hauteur);
        final k = hauteur / vb.height;
        String? muscleEn(Offset o) {
          final p = Offset(o.dx / k + vb.left, o.dy / k + vb.top);
          /* d'abord la zone touchée, sinon la plus proche à quelques pixels (cible tactile plus grande) */
          for (final r in [0.0, 6.0, 12.0]) {
            for (final d in r == 0 ? const [Offset.zero] : _autour) {
              final q = p + d * (r / k);
              for (final z in zones.reversed) {
                final g = z.p == null ? null : pat2musc[z.p];
                if (g != null && z.d.contains(q)) return g;
              }
            }
          }
          return null;
        }

        return Semantics(
          label: 'Schéma du corps',
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTapUp: (d) {
              final g = muscleEn(d.localPosition);
              if (g != null) onMuscle(g);
            },
            child: CustomPaint(
              size: taille,
              painter: _CorpsTactile(zones, vb, choisis, parM, c.primary, c.onSurface, c.surfaceContainer),
            ),
          ),
        );
      },
    );
  }
}

const _autour = [
  Offset(1, 0), Offset(-1, 0), Offset(0, 1), Offset(0, -1),
  Offset(0.7, 0.7), Offset(-0.7, 0.7), Offset(0.7, -0.7), Offset(-0.7, -0.7),
];

class _CorpsTactile extends CustomPainter {
  _CorpsTactile(this.zones, this.vb, this.choisis, this.parM, this.feu, this.texte, this.carte);
  final List<({Path d, String? p})> zones;
  final Rect vb;
  final List<String> choisis;
  final Map<String, num>? parM;
  final Color feu, texte, carte;

  @override
  void paint(Canvas canvas, Size size) {
    final k = size.height / vb.height;
    canvas.scale(k);
    canvas.translate(-vb.left, -vb.top);
    final plein = Paint(),
        bord = Paint()
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.5 / k
          ..strokeJoin = StrokeJoin.round
          ..color = carte;
    for (final z in zones) {
      final g = z.p == null ? null : pat2musc[z.p];
      final t = parM == null ? 0.0 : teinte(z.p, parM!);
      plein.color = g == null
          ? texte.withValues(alpha: 0.10)
          : choisis.contains(g)
          ? feu
          : t > 0
          ? feu.withValues(alpha: 0.25 + t * 0.75)
          : texte.withValues(alpha: 0.35);
      canvas.drawPath(z.d, plein);
      canvas.drawPath(z.d, bord);
    }
  }

  @override
  bool shouldRepaint(_CorpsTactile o) => true;
}

/// Les exercices des muscles touchés, par muscle puis par rôle ; on coche les siens, puis
/// « Continuer » ouvre la création de séance avec ces exercices et le nom des muscles.
class EcranExercicesMuscles extends StatefulWidget {
  const EcranExercicesMuscles({super.key, required this.compte, required this.muscles});
  final Compte compte;
  final List<String> muscles;

  @override
  State<EcranExercicesMuscles> createState() => _EcranExercicesMusclesState();
}

class _EcranExercicesMusclesState extends State<EcranExercicesMuscles> {
  final _coches = <String>{};

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).colorScheme;
    final cat = widget.compte.catalogue;
    final groupes = [
      for (final x in exosParMuscle(widget.muscles, cat)) (x: x, r: parRole(x.l, cat, x.g)),
    ];
    /* l'ordre de la séance : celui de la liste (muscle, puis base, complément, isolation, gainage) */
    final ordre = <String>[
      for (final g in groupes)
        for (final r in g.r) ...r.ids,
    ];
    final choisis = [for (final o in ordre.toSet()) if (_coches.contains(o)) o];
    final petit = TextStyle(fontSize: 12, color: c.onSurfaceVariant);
    return Scaffold(
      appBar: AppBar(title: const Text('Choisir mes exercices', style: TextStyle(fontWeight: FontWeight.w700))),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 0, 4, 8),
            child: Text('Coche les exercices de ta séance. Tu pourras changer leur ordre ensuite.',
                style: TextStyle(fontSize: 14, height: 1.35, color: c.onSurfaceVariant)),
          ),
          for (final g in groupes) ...[
            Padding(
              padding: const EdgeInsets.fromLTRB(4, 12, 4, 4),
              child: Row(crossAxisAlignment: CrossAxisAlignment.baseline, textBaseline: TextBaseline.alphabetic, children: [
                Expanded(child: Text(nomMuscle(g.x.g), style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w700))),
                Text('${g.x.l.length}', style: petit),
              ]),
            ),
            if (g.x.aussi && g.x.l.isNotEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(4, 0, 4, 4),
                child: Text("Pas d'exercice d'isolation : ceux-ci le travaillent aussi.", style: petit),
              ),
            if (g.x.l.isEmpty) Padding(padding: const EdgeInsets.fromLTRB(4, 0, 4, 4), child: Text('Aucun exercice.', style: petit)),
            for (final r in g.r) ...[
              Padding(
                padding: const EdgeInsets.fromLTRB(4, 8, 4, 4),
                child: Text.rich(
                  TextSpan(children: [
                    TextSpan(
                      text: '${(nomsRoles[r.ro] ?? 'Autres').toUpperCase()} · ${r.ids.length}',
                      style: const TextStyle(fontSize: 11.5, letterSpacing: 0.8, fontWeight: FontWeight.w700),
                    ),
                    if (r.ro != null) TextSpan(text: '   ${courtsRoles[r.ro]}'),
                  ]),
                  style: petit,
                ),
              ),
              for (final o in r.ids) _ligne(o, cat[o]!, c),
            ],
          ],
        ],
      ),
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.fromLTRB(16, 8, 16, 12),
        child: SizedBox(
          height: 52,
          child: FilledButton(
            onPressed: choisis.isEmpty
                ? null
                : () async {
                    final cree = await Navigator.of(context).push<bool>(MaterialPageRoute(
                      builder: (_) => EcranEditerSeance(compte: widget.compte, nom: nomDesMuscles(widget.muscles), ids: choisis),
                    ));
                    if (cree == true && context.mounted) Navigator.pop(context, true);
                  },
            child: Text(
              choisis.isEmpty
                  ? 'Coche au moins un exercice'
                  : choisis.length == 1
                  ? 'Continuer · 1 exercice'
                  : 'Continuer · ${choisis.length} exercices',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
            ),
          ),
        ),
      ),
    );
  }

  Widget _ligne(String o, Exercice x, ColorScheme c) {
    final on = _coches.contains(o);
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Material(
        color: c.surfaceContainer,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(color: on ? c.primary : Colors.transparent, width: 2),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () {
            HapticFeedback.selectionClick();
            setState(() => on ? _coches.remove(o) : _coches.add(o));
          },
          child: Semantics(
            checked: on,
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Row(children: [
                Vignette(photo: widget.compte.photos[o], taille: 48),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(x.n, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                    if (x.m.isNotEmpty)
                      Text(x.m, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12.5, color: c.onSurfaceVariant)),
                  ]),
                ),
                Icon(on ? Icons.check_circle : Icons.radio_button_unchecked, color: on ? c.primary : c.onSurfaceVariant),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}
