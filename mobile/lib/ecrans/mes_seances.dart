/* Mes séances (accueil du mode Suivi, comme web/components/repere/accueil-suivi.tsx) : la prochaine
   séance en grand avec « Commencer », puis les autres avec leur « Dernière fois ».
   Toucher une séance l'ouvre (ecrans/seance.dart) ; « Nouvelle séance » en crée une (ecrans/editer_seance.dart). */
import 'package:material_ui/material_ui.dart';

import '../donnees/compte.dart';
import '../logique/mode.dart';
import '../logique/modele.dart';
import 'editer_seance.dart';
import 'seance.dart';
import 'vignette.dart';

class EcranMesSeances extends StatelessWidget {
  const EcranMesSeances({super.key, required this.compte});
  final Compte compte;

  List<Photo?> _photos(Etat e, int i) => [for (final x in e.seances[i]!.ex.take(3)) compte.photos[x.id]];

  Future<void> _ouvrir(BuildContext context, int i) async {
    final fait = await Navigator.of(context).push<bool>(MaterialPageRoute(builder: (_) => EcranSeance(compte: compte, i: i)));
    if (fait == true && context.mounted) {
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(const SnackBar(content: Text('Séance enregistrée. Bravo !')));
    }
  }

  void _nouvelle(BuildContext context) =>
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => EcranEditerSeance(compte: compte)));

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
                  if (modeDe(e?.a) == Mode.guide) ...[
                    _Carte(
                      enfant: Text('Ton compte est en mode Guidé : les séances proposées par Oxa sont sur le site. Ici, tu notes tes séances à toi.',
                          style: TextStyle(fontSize: 13.5, height: 1.35, color: t.colorScheme.onSurfaceVariant)),
                    ),
                    const SizedBox(height: 8),
                  ],
                  if (p == null)
                    _Carte(
                      bordure: true,
                      enfant: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        const Text('Écris ta première séance', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 4),
                        Text('Choisis tes exercices : Oxa te proposera ta charge à chaque séance.',
                            style: TextStyle(fontSize: 14, height: 1.35, color: t.colorScheme.onSurfaceVariant)),
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          child: FilledButton.icon(
                            onPressed: () => _nouvelle(context),
                            icon: const Icon(Icons.add),
                            label: const Text('Nouvelle séance'),
                          ),
                        ),
                      ]),
                    )
                  else
                    _Carte(
                      bordure: true,
                      enfant: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                        Row(children: [
                          VignettesSeance(photos: _photos(e!, p), taille: 44),
                          const SizedBox(width: 12),
                          Expanded(child: _Titre(nom: e.seances[p]!.nom, sous: texteDerniere(e, p, auj, compte.catalogue, detail: true), grand: true)),
                        ]),
                        const SizedBox(height: 10),
                        FilledButton(onPressed: () => _ouvrir(context, p), child: const Text('Commencer')),
                      ]),
                    ),
                  for (final i in autres) ...[
                    const SizedBox(height: 8),
                    InkWell(
                      borderRadius: BorderRadius.circular(20),
                      onTap: () => _ouvrir(context, i),
                      child: _Carte(
                        enfant: Row(children: [
                          VignettesSeance(photos: _photos(e!, i)),
                          const SizedBox(width: 12),
                          Expanded(child: _Titre(nom: e.seances[i]!.nom, sous: texteDerniere(e, i, auj, compte.catalogue))),
                          Icon(Icons.chevron_right, size: 20, color: t.colorScheme.onSurfaceVariant),
                        ]),
                      ),
                    ),
                  ],
                  if (p != null) ...[
                    const SizedBox(height: 16),
                    OutlinedButton.icon(
                      onPressed: () => _nouvelle(context),
                      icon: const Icon(Icons.add),
                      label: const Text('Nouvelle séance'),
                      style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
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
