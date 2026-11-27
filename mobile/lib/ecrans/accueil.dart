/* Les trois onglets de l'appli, comme la barre du site en mode Suivi (web/components/repere/tab-bar.tsx) :
   Séances, Progrès, Profil. Chaque onglet garde sa position quand on passe à un autre. */
import 'package:material_ui/material_ui.dart';

import '../donnees/compte.dart';
import 'mes_seances.dart';
import 'profil.dart';
import 'progres.dart';

class EcranAccueil extends StatefulWidget {
  const EcranAccueil({super.key, required this.compte});
  final Compte compte;

  @override
  State<EcranAccueil> createState() => _EcranAccueilState();
}

class _EcranAccueilState extends State<EcranAccueil> {
  int _onglet = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _onglet, children: [
        EcranMesSeances(compte: widget.compte),
        const EcranProgres(),
        EcranProfil(compte: widget.compte),
      ]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _onglet,
        onDestinationSelected: (i) => setState(() => _onglet = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.fitness_center_outlined), selectedIcon: Icon(Icons.fitness_center), label: 'Séances'),
          NavigationDestination(icon: Icon(Icons.show_chart_outlined), selectedIcon: Icon(Icons.show_chart), label: 'Progrès'),
          NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profil'),
        ],
      ),
    );
  }
}
