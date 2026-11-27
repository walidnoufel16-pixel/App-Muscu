/* Crédits des photos d'exercices, comme sur le site (web/lib/medias.ts, SOURCES). */
import 'package:material_ui/material_ui.dart';

import 'vignette.dart';

class EcranCredits extends StatelessWidget {
  const EcranCredits({super.key, required this.photos});
  final Map<String, Photo> photos;

  @override
  Widget build(BuildContext context) {
    final gris = Theme.of(context).colorScheme.onSurfaceVariant;
    final unsplash = {for (final p in photos.values) if (p.auteur != null) p.auteur!}.toList()..sort();
    Widget bloc(String titre, String texte) => Padding(
          padding: const EdgeInsets.only(bottom: 18),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(titre, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
            const SizedBox(height: 3),
            Text(texte, style: TextStyle(fontSize: 14, height: 1.4, color: gris)),
          ]),
        );
    return Scaffold(
      appBar: AppBar(title: const Text('Crédits des photos', style: TextStyle(fontWeight: FontWeight.w700))),
      body: ListView(padding: const EdgeInsets.fromLTRB(20, 8, 20, 32), children: [
        bloc('free-exercise-db', 'Illustrations des exercices, domaine public (Unlicense), retouche Oxa. github.com/yuhonas/free-exercise-db'),
        bloc('Pixabay', 'Photos sous licence du contenu Pixabay, retouche Oxa. pixabay.com'),
        bloc('Pexels', 'Photos sous licence Pexels. pexels.com'),
        bloc('Unsplash', 'Photos sous licence Unsplash, affichées depuis leurs serveurs${unsplash.isEmpty ? '' : ' : ${unsplash.join(', ')}'}. unsplash.com'),
      ]),
    );
  }
}
