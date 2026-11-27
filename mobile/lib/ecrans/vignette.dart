/* La vignette d'un exercice, comme sur le site (web/components/repere/exercice-carte.tsx) :
   la photo recadrée au carré (cadrage relevé photo par photo), une icône si l'exercice n'a pas
   encore de photo. Photos dans assets/photos (outils/exporter-photos.py) ; celles d'Unsplash
   s'affichent depuis leurs serveurs, comme sur le site. */
import 'package:material_ui/material_ui.dart';

/// Où trouver la photo d'un exercice (assets/photos.json).
class Photo {
  final String? fichier;
  final String? unsplash;
  final String? auteur;
  final int? x;
  const Photo({this.fichier, this.unsplash, this.auteur, this.x});

  factory Photo.depuis(Map<String, dynamic> j) =>
      Photo(fichier: j['f'] as String?, unsplash: j['u'] as String?, auteur: j['a'] as String?, x: (j['x'] as num?)?.toInt());

  /// Position horizontale dans la photo : 0 bord gauche, 50 centre, 100 bord droit.
  Alignment get alignement => Alignment(((x ?? 50) / 50) - 1, 0);
}

String urlUnsplash(String id) => 'https://images.unsplash.com/$id?w=420&h=280&fit=crop&crop=faces,entropy&fm=jpg&q=70';

class Vignette extends StatelessWidget {
  const Vignette({super.key, required this.photo, this.taille = 48, this.bordure});
  final Photo? photo;
  final double taille;
  final Color? bordure;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).colorScheme;
    final icone = Icon(Icons.fitness_center, size: taille * 0.45, color: c.onSurfaceVariant.withValues(alpha: 0.6));
    final p = photo;
    Widget image = icone;
    if (p?.fichier != null) {
      image = Image.asset('assets/photos/${p!.fichier}',
          fit: BoxFit.cover, alignment: p.alignement, errorBuilder: (_, _, _) => icone);
    } else if (p?.unsplash != null) {
      image = Image.network(urlUnsplash(p!.unsplash!),
          fit: BoxFit.cover, alignment: p.alignement, errorBuilder: (_, _, _) => icone);
    }
    final r = taille * 0.27;
    return Container(
      width: taille,
      height: taille,
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: BorderRadius.circular(r),
        border: bordure != null ? Border.all(color: bordure!, width: 2) : null,
      ),
      clipBehavior: Clip.antiAlias,
      child: Center(child: SizedBox.expand(child: image)),
    );
  }
}

/// Les vignettes des premiers exercices d'une séance, qui se chevauchent (comme sur le site).
class VignettesSeance extends StatelessWidget {
  const VignettesSeance({super.key, required this.photos, this.taille = 40});
  final List<Photo?> photos;
  final double taille;

  @override
  Widget build(BuildContext context) {
    final l = photos.take(3).toList();
    if (l.isEmpty) return const SizedBox.shrink();
    final pas = taille * 0.7;
    final fond = Theme.of(context).colorScheme.surfaceContainer;
    return SizedBox(
      width: taille + pas * (l.length - 1) + 4,
      height: taille + 4,
      child: Stack(children: [
        for (var k = l.length - 1; k >= 0; k--)
          Positioned(left: pas * k, child: Vignette(photo: l[k], taille: taille + 4, bordure: fond)),
      ]),
    );
  }
}
