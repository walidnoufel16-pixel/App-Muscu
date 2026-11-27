/* Un jour du calendrier de Progrès, comme DetailJour et SeanceLue du site (web/app/progres,
   web/components/repere/seance-lue.tsx) : chaque séance du jour relue comme pendant l'entraînement
   (photo, muscles, résumé ; touchée, chaque série), rangée par parties, et « Retirer de mon
   historique » après confirmation. Le cardio se relit sur le site pour l'instant. */
import 'package:material_ui/material_ui.dart';

import '../donnees/compte.dart';
import '../logique/charge.dart' show resumeDe;
import '../logique/mode.dart' show dateDe, nb;
import '../logique/modele.dart';
import '../logique/retirer.dart';
import 'vignette.dart';

const _jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const _moisLongs = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

/// « Mardi 3 novembre ».
String jourLong(String j) {
  final d = dateDe(j);
  final t = '${_jours[d.weekday - 1]} ${d.day} ${_moisLongs[d.month - 1]}';
  return t[0].toUpperCase() + t.substring(1);
}

Future<void> ouvrirJour(BuildContext context, Compte compte, String jour) => showModalBottomSheet<void>(
  context: context,
  isScrollControlled: true,
  useSafeArea: true,
  showDragHandle: true,
  backgroundColor: Theme.of(context).colorScheme.surface,
  builder: (_) => ConstrainedBox(
    constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(context).height * 0.85),
    child: _Jour(compte: compte, jour: jour),
  ),
);

class _Jour extends StatefulWidget {
  const _Jour({required this.compte, required this.jour});
  final Compte compte;
  final String jour;

  @override
  State<_Jour> createState() => _JourState();
}

class _JourState extends State<_Jour> {
  bool _occupe = false;

  Future<void> _retirer(Etat e, LigneHist l) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: Text('Retirer « ${l.nom} » de ton historique ?'),
        content: Text(texteRetrait(e, l.s)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Annuler')),
          TextButton(
            onPressed: () => Navigator.pop(c, true),
            style: TextButton.styleFrom(foregroundColor: Theme.of(c).colorScheme.error),
            child: const Text('Retirer'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    setState(() => _occupe = true);
    final messager = ScaffoldMessenger.of(context);
    final err = await widget.compte.retirerDeHistorique(l.d, l.s);
    if (!mounted) return;
    setState(() => _occupe = false);
    messager.showSnackBar(SnackBar(content: Text(err ?? 'Séance retirée de ton historique')));
    final reste = widget.compte.etat?.hist.where((x) => x.d == widget.jour) ?? const [];
    if (err == null && reste.isEmpty && !(widget.compte.etat?.joursCardio.contains(widget.jour) ?? false)) {
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: widget.compte,
      builder: (context, _) {
        final e = widget.compte.etat ?? const Etat();
        final lignes = e.hist.where((l) => l.d == widget.jour).toList();
        final cardio = e.joursCardio.contains(widget.jour);
        final gris = Theme.of(context).colorScheme.onSurfaceVariant;
        return ListView(
          shrinkWrap: true,
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 28),
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Text(jourLong(widget.jour), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
            ),
            for (final l in lignes) ...[
              _SeanceLue(e: e, l: l, compte: widget.compte),
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton.icon(
                  onPressed: _occupe ? null : () => _retirer(e, l),
                  style: TextButton.styleFrom(
                    foregroundColor: Theme.of(context).colorScheme.error,
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    textStyle: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600),
                  ),
                  icon: const Icon(Icons.delete_outline, size: 18),
                  label: const Text('Retirer de mon historique'),
                ),
              ),
            ],
            if (cardio)
              Padding(
                padding: const EdgeInsets.fromLTRB(4, 12, 4, 0),
                child: Text(
                  'Du cardio ce jour-là : il se relit sur le site pour l\'instant.',
                  style: TextStyle(fontSize: 13.5, color: gris),
                ),
              ),
            if (lignes.isEmpty && !cardio)
              Padding(
                padding: const EdgeInsets.fromLTRB(4, 12, 4, 0),
                child: Text('Aucune séance ce jour-là.', style: TextStyle(fontSize: 14, color: gris)),
              ),
          ],
        );
      },
    );
  }
}

/// Une séance faite, relue : ses exercices rangés par parties, rien de modifiable.
class _SeanceLue extends StatelessWidget {
  const _SeanceLue({required this.e, required this.l, required this.compte});
  final Etat e;
  final LigneHist l;
  final Compte compte;

  @override
  Widget build(BuildContext context) {
    final cat = compte.catalogue;
    final det = detailDe(e, l, cat);
    final ordre = <Partie>[];
    for (final x in det) {
      final p = partieDe(cat[x.id]);
      if (!ordre.contains(p)) ordre.add(p);
    }
    final gris = Theme.of(context).colorScheme.onSurfaceVariant;
    var num = 0;
    return Padding(
      padding: const EdgeInsets.only(top: 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(4, 0, 4, 8),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Expanded(
                  child: Text(
                    l.nom.isEmpty ? 'Séance' : l.nom,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '${nb(l.ser)} série${l.ser >= 2 ? 's' : ''}${l.min != null ? ' · ${nb(l.min!)} min' : ''}',
                  style: TextStyle(fontSize: 12.5, color: gris),
                ),
              ],
            ),
          ),
          for (final p in ordre) ...[
            if (ordre.length > 1) _TitrePartie(p: p),
            for (final x in det.where((x) => partieDe(cat[x.id]) == p))
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _CarteLue(id: x.id, l: x.l, num: ++num, compte: compte),
              ),
          ],
        ],
      ),
    );
  }
}

class _TitrePartie extends StatelessWidget {
  const _TitrePartie({required this.p});
  final Partie p;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).colorScheme;
    final icone = p == Partie.soin
        ? Icons.healing
        : p == Partie.cardio
        ? Icons.monitor_heart
        : Icons.fitness_center;
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 6, 4, 8),
      child: Row(
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(color: c.primary.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(9)),
            child: Icon(icone, size: 16, color: c.primary),
          ),
          const SizedBox(width: 8),
          Text(nomPartie[p]!, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}

/// Carte d'exercice en lecture : repliée, le résumé des séries ; dépliée, chaque série.
class _CarteLue extends StatefulWidget {
  const _CarteLue({required this.id, required this.l, required this.num, required this.compte});
  final String id;
  final Journal l;
  final int num;
  final Compte compte;

  @override
  State<_CarteLue> createState() => _CarteLueState();
}

class _CarteLueState extends State<_CarteLue> {
  bool _ouvert = false;

  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).colorScheme;
    final x = widget.compte.catalogue[widget.id]!;
    final gris = c.onSurfaceVariant;
    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: c.surfaceContainer,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: c.primary.withValues(alpha: 0.35)),
      ),
      child: Column(
        children: [
          InkWell(
            onTap: () => setState(() => _ouvert = !_ouvert),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Vignette(photo: widget.compte.photos[widget.id], taille: 56),
                      Positioned(
                        left: -4,
                        top: -4,
                        child: Container(
                          width: 22,
                          height: 22,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(color: c.primary, shape: BoxShape.circle),
                          child: Icon(Icons.check, size: 14, color: c.onPrimary),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          x.n,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                        ),
                        if (x.m.isNotEmpty) ...[
                          const SizedBox(height: 3),
                          Row(
                            children: [
                              Icon(Icons.gps_fixed, size: 13, color: c.primary),
                              const SizedBox(width: 5),
                              Expanded(
                                child: Text(
                                  x.m,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w500, color: gris),
                                ),
                              ),
                            ],
                          ),
                        ],
                        const SizedBox(height: 3),
                        Text(
                          resumeDe(widget.l, x),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w500,
                            color: c.onSurface.withValues(alpha: 0.8),
                          ),
                        ),
                      ],
                    ),
                  ),
                  AnimatedRotation(
                    turns: _ouvert ? 0.5 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: Icon(Icons.expand_more, color: gris),
                  ),
                ],
              ),
            ),
          ),
          if (_ouvert)
            Container(
              decoration: BoxDecoration(
                border: Border(top: BorderSide(color: c.outline)),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Column(
                children: [
                  for (var i = 0; i < widget.l.series.length; i++)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Row(
                        children: [
                          SizedBox(
                            width: 24,
                            child: Text('${i + 1}', style: TextStyle(fontSize: 14.5, color: gris)),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              serieLue(x.ch, widget.l.series[i]),
                              style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w600),
                            ),
                          ),
                          Icon(Icons.check, size: 16, color: c.primary, semanticLabel: 'validée'),
                        ],
                      ),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// Une série, comme dans le tableau de la séance : « 10 kg × 10 », « 12 répétitions +5 kg », « 45 s ».
String serieLue(String ch, Serie s) {
  final lest = (s.lest ?? 0) > 0 ? ' +${nb(s.lest!)} kg' : '';
  if (ch == 'kg') return '${nb(s.v)} kg × ${nb(s.reps)}';
  if (ch == 'lest') return '+${nb(s.v)} kg × ${nb(s.reps)}';
  if (ch == 'temps') return '${nb(s.v)} s$lest';
  if (ch == 'dist') return '${nb(s.v)} m';
  return '${nb(s.v)} répétitions$lest';
}
