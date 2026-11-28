/* Profil › Mon matériel, comme le site (web/components/repere/mon-materiel.tsx) : où tu t'entraînes, et en
   plus la barre de traction, le TRX, la kettlebell et les élastiques. Il filtre les exercices proposés sous
   Mes séances. Et le choix du corps à afficher (ChoixSilhouette de web/components/repere/schema-corps.tsx).
   Logique : lib/logique/materiel.dart. */
import 'package:material_ui/material_ui.dart';

import '../donnees/compte.dart';
import '../logique/materiel.dart';

class EcranMateriel extends StatefulWidget {
  const EcranMateriel({super.key, required this.compte});
  final Compte compte;

  @override
  State<EcranMateriel> createState() => _EcranMaterielState();
}

class _EcranMaterielState extends State<EcranMateriel> {
  bool _occupe = false;

  Future<void> _regler(Map<String, dynamic> Function(Map<String, dynamic>) changer) async {
    if (_occupe) return;
    setState(() => _occupe = true);
    final err = await widget.compte.reglerProfil(changer);
    if (!mounted) return;
    setState(() => _occupe = false);
    if (err != null) {
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(err)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).colorScheme;
    final gris = TextStyle(fontSize: 14.5, color: c.onSurfaceVariant);
    return ListenableBuilder(
      listenable: widget.compte,
      builder: (context, _) {
        final a = widget.compte.etat?.a ?? const <String, dynamic>{};
        final lieu = lieuDe(a);
        final acc = accDeclares(a);
        Widget puce(String nom, bool on, Map<String, dynamic> Function(Map<String, dynamic>) changer) => FilterChip(
              label: Text(nom),
              selected: on,
              showCheckmark: false,
              shape: const StadiumBorder(),
              onSelected: _occupe ? null : (_) => _regler(changer),
            );
        return Scaffold(
          appBar: AppBar(title: const Text('Mon matériel', style: TextStyle(fontWeight: FontWeight.w700))),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(color: c.surfaceContainer, borderRadius: BorderRadius.circular(22)),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text("Où tu t'entraînes", style: gris),
                  const SizedBox(height: 8),
                  Wrap(spacing: 6, runSpacing: 6, children: [
                    for (var i = 0; i < lieux.length; i++) puce(lieux[i], lieu == i, (d) => choisirLieu(d, i)),
                  ]),
                  const SizedBox(height: 16),
                  Text('En plus', style: gris),
                  const SizedBox(height: 8),
                  Wrap(spacing: 6, runSpacing: 6, children: [
                    puce('Barre de traction', barreDeclaree(a), basculerBarre),
                    puce('TRX', a['trx'] == true, basculerTrx),
                    for (var i = 0; i < accessoires.length; i++)
                      puce(accessoires[i].$2, acc.contains(accessoires[i].$1), (d) => basculerAccessoire(d, i)),
                  ]),
                ]),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(4, 8, 4, 0),
                child: Text(
                  'Sert à choisir les exercices proposés quand tu touches tes muscles sous Mes séances.'
                  '${lieu <= 1 ? ' Les machines absentes de ta salle se règlent sur le site (Profil › Mon matériel › Ma salle).' : ''}',
                  style: TextStyle(fontSize: 12.5, height: 1.35, color: c.onSurfaceVariant),
                ),
              ),
              if (_occupe) const Padding(padding: EdgeInsets.only(top: 20), child: Center(child: CircularProgressIndicator())),
            ],
          ),
        );
      },
    );
  }
}

/// « Sur quel corps afficher tes muscles ? » : demandé une fois, quand le sexe n'est pas réglé. Le choix
/// remplit Profil › Sexe dans le compte, comme le site.
class ChoixSilhouette extends StatefulWidget {
  const ChoixSilhouette({super.key, required this.compte});
  final Compte compte;

  @override
  State<ChoixSilhouette> createState() => _ChoixSilhouetteState();
}

class _ChoixSilhouetteState extends State<ChoixSilhouette> {
  bool _occupe = false;

  Future<void> _choisir(int v) async {
    if (_occupe) return;
    setState(() => _occupe = true);
    final err = await widget.compte.reglerSexe(v);
    if (!mounted) return;
    setState(() => _occupe = false);
    if (err != null) {
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(err)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: c.surfaceContainer,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: c.outline.withValues(alpha: 0.8)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        const Text('Sur quel corps afficher tes muscles ?', style: TextStyle(fontSize: 17, height: 1.3, fontWeight: FontWeight.w700)),
        const SizedBox(height: 4),
        Text(
          "Les muscles ne se dessinent pas pareil sur une silhouette de femme et d'homme. Ton choix sert aussi au calcul de ta dépense d'énergie et de tes portions dans Repas.",
          style: TextStyle(fontSize: 13, height: 1.35, color: c.onSurfaceVariant),
        ),
        const SizedBox(height: 12),
        Row(children: [
          for (final (v, n) in const [(1, 'Femme'), (0, 'Homme')]) ...[
            if (v == 0) const SizedBox(width: 8),
            Expanded(
              child: SizedBox(
                height: 56,
                child: OutlinedButton(
                  onPressed: _occupe ? null : () => _choisir(v),
                  style: OutlinedButton.styleFrom(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    side: BorderSide(color: c.outline, width: 2),
                    foregroundColor: c.onSurface,
                  ),
                  child: Text(n, style: const TextStyle(fontSize: 15.5, fontWeight: FontWeight.w700)),
                ),
              ),
            ),
          ],
        ]),
        const SizedBox(height: 8),
        Text('Modifiable à tout moment dans Profil › Sexe.',
            textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: c.onSurfaceVariant)),
      ]),
    );
  }
}
