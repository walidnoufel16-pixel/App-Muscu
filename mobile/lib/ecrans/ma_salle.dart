/* Profil › Mon matériel › Ma salle, comme le site (FeuilleSalle et LienSalle de web/components/repere/ma-salle.tsx) :
   les machines et postes par zone ; toucher le nom (ou la coche) d'une machine dit que la salle ne l'a pas, ses
   exercices disparaissent des propositions ; toucher sa photo la montre en grand. Seulement en salle complète
   (machines et postes à barre) et en home gym (postes à barre). Logique : lib/logique/salle.dart. */
import 'package:material_ui/material_ui.dart';

import '../donnees/compte.dart';
import '../logique/materiel.dart' show lieuDe;
import '../logique/salle.dart';
import 'vignette.dart';

/// La ligne « Ma salle · 24 sur 31 machines et postes » de Mon matériel, qui ouvre la planche.
class LienSalle extends StatelessWidget {
  const LienSalle({super.key, required this.compte});
  final Compte compte;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).colorScheme;
    final a = compte.etat?.a ?? const <String, dynamic>{};
    final visibles = compte.salle.visibles(typesSalle(lieuDe(a)));
    if (visibles.isEmpty) return const SizedBox.shrink();
    return Material(
      color: c.surfaceContainerHighest.withValues(alpha: 0.6),
      borderRadius: BorderRadius.circular(16),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => EcranSalle(compte: compte))),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(children: [
            Icon(Icons.apartment, size: 20, color: c.primary),
            const SizedBox(width: 12),
            Expanded(
              child: Text.rich(TextSpan(children: [
                const TextSpan(text: 'Ma salle', style: TextStyle(fontWeight: FontWeight.w600)),
                TextSpan(
                  text: ' · ${postesDispo(a, visibles)} sur ${visibles.length} machines et postes',
                  style: TextStyle(color: c.onSurfaceVariant),
                ),
              ]), style: const TextStyle(fontSize: 14)),
            ),
            Icon(Icons.chevron_right, size: 20, color: c.onSurfaceVariant),
          ]),
        ),
      ),
    );
  }
}

class EcranSalle extends StatefulWidget {
  const EcranSalle({super.key, required this.compte});
  final Compte compte;

  @override
  State<EcranSalle> createState() => _EcranSalleState();
}

class _EcranSalleState extends State<EcranSalle> {
  /// Les changements partent l'un après l'autre : chacun relit le document du compte juste avant.
  Future<void> _file = Future.value();

  void _regler(Map<String, dynamic> Function(Map<String, dynamic>) changer) {
    _file = _file.then((_) async {
      final err = await widget.compte.reglerProfil(changer);
      if (err != null && mounted) {
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(SnackBar(content: Text(err)));
      }
    });
  }

  void _enGrand(Poste p) {
    final ph = p.img == null ? null : widget.compte.photos[p.img];
    final icone = Icon(Icons.fitness_center, size: 96, color: Colors.white.withValues(alpha: 0.5));
    Widget image = icone;
    if (ph?.grande != null) {
      image = Image.asset('assets/fiche/${ph!.grande}', fit: BoxFit.contain, errorBuilder: (_, _, _) => icone);
    } else if (ph?.unsplash != null) {
      image = Image.network(urlUnsplash(ph!.unsplash!, grand: true), fit: BoxFit.contain, errorBuilder: (_, _, _) => icone);
    } else if (ph?.fichier != null) {
      image = Image.asset('assets/photos/${ph!.fichier}', fit: BoxFit.contain, errorBuilder: (_, _, _) => icone);
    }
    showDialog<void>(
      context: context,
      barrierColor: Colors.black.withValues(alpha: 0.95),
      builder: (context) => GestureDetector(
        onTap: () => Navigator.of(context).pop(),
        child: Material(
          color: Colors.transparent,
          child: SafeArea(
            child: Stack(children: [
              Center(
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  ConstrainedBox(
                    constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.72),
                    child: ClipRRect(borderRadius: BorderRadius.circular(16), child: image),
                  ),
                  const SizedBox(height: 12),
                  Text(p.n, textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600)),
                ]),
              ),
              Positioned(
                top: 8,
                right: 8,
                child: IconButton.filledTonal(
                  tooltip: 'Fermer',
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.close),
                ),
              ),
            ]),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).colorScheme;
    final salle = widget.compte.salle;
    return ListenableBuilder(
      listenable: widget.compte,
      builder: (context, _) {
        final a = widget.compte.etat?.a ?? const <String, dynamic>{};
        final types = typesSalle(lieuDe(a));
        final visibles = salle.visibles(types);
        final sans = postesAbsents(a);
        Widget bouton(String t, bool dispo) => TextButton(
              onPressed: () => _regler((d) => tousLesPostes(d, visibles, dispo)),
              style: TextButton.styleFrom(
                backgroundColor: c.surfaceContainerHighest,
                foregroundColor: c.onSurface,
                minimumSize: const Size(0, 32),
                padding: const EdgeInsets.symmetric(horizontal: 12),
                shape: const StadiumBorder(),
                textStyle: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w500),
              ),
              child: Text(t),
            );
        return Scaffold(
          appBar: AppBar(title: const Text('Ma salle', style: TextStyle(fontWeight: FontWeight.w700))),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 32),
            children: [
              Text(
                "Touche le nom d'une machine pour dire que ta salle ne l'a pas : ses exercices disparaissent des "
                'exercices proposés. Touche sa photo pour la voir en grand.',
                style: TextStyle(fontSize: 13.5, height: 1.35, color: c.onSurfaceVariant),
              ),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(
                  child: Text('${postesDispo(a, visibles)} sur ${visibles.length} disponibles',
                      style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w500)),
                ),
                bouton('Toutes', true),
                const SizedBox(width: 6),
                bouton('Aucune', false),
              ]),
              for (final z in salle.zonesPour(types)) ...[
                const SizedBox(height: 18),
                Padding(
                  padding: const EdgeInsets.only(left: 4, bottom: 8),
                  child: Text(z.n.toUpperCase(),
                      style: TextStyle(fontSize: 11.5, letterSpacing: 0.8, fontWeight: FontWeight.w600, color: c.onSurfaceVariant)),
                ),
                GridView.count(
                  crossAxisCount: 3,
                  mainAxisSpacing: 8,
                  crossAxisSpacing: 8,
                  childAspectRatio: 0.74,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  children: [
                    for (final p in salle.postesDe(z.k))
                      _CartePoste(
                        poste: p,
                        photo: p.img == null ? null : widget.compte.photos[p.img],
                        dispo: !sans.contains(p.id),
                        onBasculer: () => _regler((d) => basculerPoste(d, p.id)),
                        onPhoto: () => _enGrand(p),
                      ),
                  ],
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}

class _CartePoste extends StatelessWidget {
  const _CartePoste({required this.poste, required this.photo, required this.dispo, required this.onBasculer, required this.onPhoto});
  final Poste poste;
  final Photo? photo;
  final bool dispo;
  final VoidCallback onBasculer;
  final VoidCallback onPhoto;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: c.surfaceContainer,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: dispo ? c.primary : Colors.transparent, width: 2),
      ),
      child: Stack(clipBehavior: Clip.none, children: [
        Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          LayoutBuilder(
            builder: (context, k) => Semantics(
              button: true,
              label: 'Voir en grand : ${poste.n}',
              child: GestureDetector(
                onTap: onPhoto,
                child: Opacity(
                  opacity: dispo ? 1 : 0.4,
                  child: ColorFiltered(
                    colorFilter: dispo
                        ? const ColorFilter.mode(Colors.transparent, BlendMode.dst)
                        : const ColorFilter.matrix([
                            0.2126, 0.7152, 0.0722, 0, 0, //
                            0.2126, 0.7152, 0.0722, 0, 0,
                            0.2126, 0.7152, 0.0722, 0, 0,
                            0, 0, 0, 1, 0,
                          ]),
                    child: Vignette(photo: photo, taille: k.maxWidth),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 6),
          Expanded(
            child: Semantics(
              button: true,
              toggled: dispo,
              child: GestureDetector(
                behavior: HitTestBehavior.opaque,
                onTap: onBasculer,
                child: Text(
                  poste.n,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 12,
                    height: 1.2,
                    fontWeight: FontWeight.w500,
                    color: dispo ? c.onSurface : c.onSurfaceVariant,
                    decoration: dispo ? null : TextDecoration.lineThrough,
                  ),
                ),
              ),
            ),
          ),
        ]),
        Positioned(
          top: -4,
          right: -4,
          child: ExcludeSemantics(
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: onBasculer,
              child: SizedBox(
                width: 36,
                height: 36,
                child: Center(
                  child: Container(
                    width: 22,
                    height: 22,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: dispo ? c.primary : c.surfaceContainerHighest,
                      border: Border.all(color: c.surfaceContainer, width: 2),
                    ),
                    child: dispo ? Icon(Icons.check, size: 13, color: c.onPrimary) : null,
                  ),
                ),
              ),
            ),
          ),
        ),
      ]),
    );
  }
}
