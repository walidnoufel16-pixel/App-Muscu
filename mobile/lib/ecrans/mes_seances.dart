/* Mes séances (accueil du mode Suivi, comme web/components/repere/accueil-suivi.tsx) : la prochaine
   séance en grand avec « Commencer », puis les autres avec leur « Dernière fois ».
   La séance en cours arrive à l'étape suivante : « Commencer » le dit pour l'instant. */
import 'package:material_ui/material_ui.dart';

import '../donnees/compte.dart';
import '../logique/mode.dart';

class EcranMesSeances extends StatelessWidget {
  const EcranMesSeances({super.key, required this.compte});
  final Compte compte;

  void _bientot(BuildContext context) => ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(const SnackBar(content: Text('La séance arrive dans la prochaine version de l\'appli.')));

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return ListenableBuilder(
      listenable: compte,
      builder: (context, _) {
        final e = compte.etat;
        final auj = jourDe(DateTime.now());
        final liste = e == null ? const <int>[] : seancesSuivies(e);
        final p = e == null ? null : prochaineSeance(e, liste);
        final autres = liste.where((i) => i != p).toList();
        return Scaffold(
          appBar: AppBar(
            title: Text(compte.pseudo.isEmpty ? 'Entraînement' : 'Salut ${compte.pseudo}',
                style: const TextStyle(fontWeight: FontWeight.w700)),
            actions: [
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_horiz),
                onSelected: (v) => v == 'sortir' ? compte.deconnecter() : null,
                itemBuilder: (_) => const [PopupMenuItem(value: 'sortir', child: Text('Se déconnecter'))],
              ),
            ],
          ),
          body: RefreshIndicator(
            onRefresh: compte.recharger,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
              children: [
                if (compte.charge && e == null)
                  const Padding(padding: EdgeInsets.only(top: 80), child: Center(child: CircularProgressIndicator()))
                else if (compte.erreur != null && e == null)
                  _Erreur(texte: compte.erreur!, reessayer: compte.recharger)
                else ...[
                  Padding(
                    padding: const EdgeInsets.fromLTRB(4, 4, 4, 8),
                    child: Text('MES SÉANCES',
                        style: TextStyle(fontSize: 12, letterSpacing: 0.8, fontWeight: FontWeight.w700, color: t.colorScheme.onSurfaceVariant)),
                  ),
                  if (p == null)
                    _Carte(
                      bordure: true,
                      enfant: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        const Text('Écris ta première séance', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        Text('Pour l\'instant, crée tes séances sur le site Oxa : elles apparaîtront ici.',
                            style: TextStyle(fontSize: 14, height: 1.35, color: t.colorScheme.onSurfaceVariant)),
                      ]),
                    )
                  else
                    _Carte(
                      bordure: true,
                      enfant: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                        _Titre(nom: e!.seances[p]!.nom, sous: texteDerniere(e, p, auj, compte.catalogue, detail: true), grand: true),
                        const SizedBox(height: 10),
                        FilledButton(onPressed: () => _bientot(context), child: const Text('Commencer')),
                      ]),
                    ),
                  for (final i in autres) ...[
                    const SizedBox(height: 8),
                    InkWell(
                      borderRadius: BorderRadius.circular(20),
                      onTap: () => _bientot(context),
                      child: _Carte(
                        enfant: Row(children: [
                          Expanded(child: _Titre(nom: e!.seances[i]!.nom, sous: texteDerniere(e, i, auj, compte.catalogue))),
                          Icon(Icons.chevron_right, size: 20, color: t.colorScheme.onSurfaceVariant),
                        ]),
                      ),
                    ),
                  ],
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}

class _Carte extends StatelessWidget {
  const _Carte({required this.enfant, this.bordure = false});
  final Widget enfant;
  final bool bordure;
  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: c.surfaceContainer,
        borderRadius: BorderRadius.circular(20),
        border: bordure ? Border.all(color: c.primary, width: 2) : null,
      ),
      child: enfant,
    );
  }
}

class _Titre extends StatelessWidget {
  const _Titre({required this.nom, required this.sous, this.grand = false});
  final String nom;
  final String sous;
  final bool grand;
  @override
  Widget build(BuildContext context) {
    final gris = Theme.of(context).colorScheme.onSurfaceVariant;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(nom,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(fontSize: grand ? 17 : 15.5, fontWeight: grand ? FontWeight.w700 : FontWeight.w600)),
      const SizedBox(height: 2),
      Text(sous, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, color: gris)),
    ]);
  }
}

class _Erreur extends StatelessWidget {
  const _Erreur({required this.texte, required this.reessayer});
  final String texte;
  final Future<void> Function() reessayer;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: 60),
        child: Column(children: [
          Text(texte, textAlign: TextAlign.center),
          const SizedBox(height: 12),
          OutlinedButton(onPressed: reessayer, child: const Text('Réessayer')),
        ]),
      );
}
