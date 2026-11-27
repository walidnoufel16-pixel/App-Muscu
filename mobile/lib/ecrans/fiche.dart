/* La fiche d'un exercice (comme web/components/repere/fiche-exercice.tsx) : les photos départ et
   fin qui alternent en fondu pour montrer le mouvement, le nom, les muscles, puis Exécution,
   Erreurs fréquentes et Comment progresser. S'ouvre en touchant un exercice pendant la séance. */
import 'package:material_ui/material_ui.dart';

import '../donnees/compte.dart';
import 'vignette.dart';

Future<void> ouvrirFiche(BuildContext context, Compte compte, String id) => showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      showDragHandle: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      builder: (_) => FractionallySizedBox(heightFactor: 0.92, child: _Fiche(compte: compte, id: id)),
    );

class _Fiche extends StatelessWidget {
  const _Fiche({required this.compte, required this.id});
  final Compte compte;
  final String id;

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context), gris = t.colorScheme.onSurfaceVariant;
    final x = compte.catalogue[id];
    Widget titre(String s) => Padding(
          padding: const EdgeInsets.only(top: 22, bottom: 8),
          child: Text(s.toUpperCase(), style: TextStyle(fontSize: 12, letterSpacing: 0.8, fontWeight: FontWeight.w700, color: gris)),
        );
    const corps = TextStyle(fontSize: 15, height: 1.5);
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
      children: [
        Duo(photo: compte.photos[id]),
        const SizedBox(height: 16),
        Text(x?.n ?? '', style: const TextStyle(fontSize: 26, height: 1.15, fontWeight: FontWeight.w700, letterSpacing: -0.4)),
        if ((x?.m ?? '').isNotEmpty) ...[
          const SizedBox(height: 4),
          Text(x!.m, style: TextStyle(fontSize: 14.5, color: gris)),
        ],
        Builder(
          builder: (context) {
            final f = compte.fiches[id];
            if (f is! Map) return const SizedBox.shrink();
            final err = (f['err'] as List?)?.whereType<String>().toList() ?? const <String>[];
            return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              if (f['e'] is String) ...[titre('Exécution'), Text(f['e'] as String, style: corps)],
              if (err.isNotEmpty) ...[
                titre('Erreurs fréquentes'),
                for (final e in err)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Container(
                        margin: const EdgeInsets.only(top: 9, right: 10),
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(color: t.colorScheme.error, shape: BoxShape.circle),
                      ),
                      Expanded(child: Text(e, style: corps)),
                    ]),
                  ),
              ],
              if (f['p'] is String) ...[
                titre('Comment progresser'),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(color: t.colorScheme.primary.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(16)),
                  child: Text(f['p'] as String, style: corps),
                ),
              ],
            ]);
          },
        ),
      ],
    );
  }
}

enum _Mode { photo, anime, cote }

/// Photos départ / fin : elles alternent en fondu pour suggérer le mouvement. Un exercice avec une
/// photo choisie l'affiche d'abord ; « Animation » montre le duo, « Photo » y revient.
class Duo extends StatefulWidget {
  const Duo({super.key, required this.photo});
  final Photo? photo;

  @override
  State<Duo> createState() => _DuoState();
}

class _DuoState extends State<Duo> with SingleTickerProviderStateMixin {
  /* comme @keyframes duo du site : fin invisible jusqu'à 38 %, visible de 50 à 88 %, 2,4 s */
  late final _ctl = AnimationController(vsync: this, duration: const Duration(milliseconds: 2400))..repeat();
  late final Animation<double> _fin = TweenSequence<double>([
    TweenSequenceItem(tween: ConstantTween(0), weight: 38),
    TweenSequenceItem(tween: Tween(begin: 0.0, end: 1.0).chain(CurveTween(curve: Curves.easeInOut)), weight: 12),
    TweenSequenceItem(tween: ConstantTween(1), weight: 38),
    TweenSequenceItem(tween: Tween(begin: 1.0, end: 0.0).chain(CurveTween(curve: Curves.easeInOut)), weight: 12),
  ]).animate(_ctl);
  late _Mode _mode = _aPhoto ? _Mode.photo : _Mode.anime;

  bool get _aPhoto => widget.photo?.grande != null || widget.photo?.unsplash != null;
  bool get _aDuo => widget.photo?.duo != null;

  @override
  void dispose() {
    _ctl.dispose();
    super.dispose();
  }

  Widget _img(String fichier) => Image.asset('assets/fiche/$fichier', fit: BoxFit.cover, width: double.infinity, height: double.infinity);

  Widget _bouton(String label, _Mode vers) => Positioned(
        right: 10,
        bottom: 10,
        child: Material(
          color: Theme.of(context).colorScheme.surface.withValues(alpha: 0.88),
          shape: const StadiumBorder(),
          child: InkWell(
            customBorder: const StadiumBorder(),
            onTap: () => setState(() => _mode = vers),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
              child: Text(label, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600)),
            ),
          ),
        ),
      );

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).colorScheme;
    final p = widget.photo;
    Widget cadre(Widget enfant) => ClipRRect(
          borderRadius: BorderRadius.circular(22),
          child: AspectRatio(aspectRatio: 3 / 2, child: ColoredBox(color: c.surfaceContainer, child: enfant)),
        );
    if (!_aPhoto && !_aDuo) {
      return cadre(Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.fitness_center, size: 40, color: c.onSurfaceVariant.withValues(alpha: 0.6)),
          const SizedBox(height: 6),
          Text('Photo à venir', style: TextStyle(fontSize: 13, color: c.onSurfaceVariant)),
        ]),
      ));
    }
    if (_mode == _Mode.photo || !_aDuo) {
      final photo = p!.grande != null
          ? _img(p.grande!)
          : Image.network(urlUnsplash(p.unsplash!, grand: true),
              fit: BoxFit.cover, width: double.infinity, height: double.infinity, errorBuilder: (_, _, _) => const SizedBox.shrink());
      return cadre(Stack(children: [Positioned.fill(child: photo), if (_aDuo) _bouton('Animation', _Mode.anime)]));
    }
    final d = p!.duo!;
    final retour = _aPhoto
        ? _bouton('Photo', _Mode.photo)
        : _mode == _Mode.anime
            ? _bouton('Côte à côte', _Mode.cote)
            : _bouton('Animer', _Mode.anime);
    if (_mode == _Mode.anime) {
      return cadre(Stack(children: [
        Positioned.fill(child: _img(d[0])),
        Positioned.fill(child: FadeTransition(opacity: _fin, child: _img(d[1]))),
        retour,
      ]));
    }
    Widget moitie(String f, String legende) => Expanded(
          child: Stack(children: [
            Positioned.fill(child: _img(f)),
            Positioned(
              left: 8,
              bottom: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(color: c.surface.withValues(alpha: 0.85), borderRadius: BorderRadius.circular(6)),
                child: Text(legende, style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, letterSpacing: 0.6)),
              ),
            ),
          ]),
        );
    return ClipRRect(
      borderRadius: BorderRadius.circular(22),
      child: Stack(children: [
        AspectRatio(
          aspectRatio: 3,
          child: Row(children: [moitie(d[0], 'DÉPART'), const SizedBox(width: 1), moitie(d[1], 'FIN')]),
        ),
        retour,
      ]),
    );
  }
}
