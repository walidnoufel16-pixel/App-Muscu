/* Progrès : l'onglet est là, son contenu (records, courbes, comme web/app/progres) arrive ensuite. */
import 'package:material_ui/material_ui.dart';

class EcranProgres extends StatelessWidget {
  const EcranProgres({super.key});

  @override
  Widget build(BuildContext context) {
    final gris = Theme.of(context).colorScheme.onSurfaceVariant;
    return Scaffold(
      appBar: AppBar(title: const Text('Progrès', style: TextStyle(fontWeight: FontWeight.w700))),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.show_chart, size: 40, color: gris),
            const SizedBox(height: 12),
            const Text('Bientôt dans l\'appli', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
            const SizedBox(height: 6),
            Text('Tes records et tes courbes arrivent ici. En attendant, retrouve-les dans Progrès sur le site Oxa.',
                textAlign: TextAlign.center, style: TextStyle(fontSize: 14, height: 1.35, color: gris)),
          ]),
        ),
      ),
    );
  }
}
