/* Progrès en mode Suivi, comme web/app/progres (onglet « Mon évolution ») : la semaine (série de
   semaines, objectif, séries, calendrier), les muscles travaillés sur 7 jours, la progression par
   exercice et les records. Lecture seule : tout vient du document du compte (logique/progres.dart).
   Plus tard : cardio, poids du corps, défis et badges. */
import 'dart:math' as math;

import 'package:material_ui/material_ui.dart';

import '../donnees/compte.dart';
import '../logique/mode.dart';
import '../logique/modele.dart';
import '../logique/progres.dart';
import 'jour.dart';

const _feu = Color(0xFFFF7A1A);
const _succes = Color(0xFF16A34A);
const _mois = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];

String _court(String j) {
  final d = dateDe(j);
  return '${d.day} ${_mois[d.month - 1]}';
}

String _s(num n) => n >= 2 ? 's' : '';

class EcranProgres extends StatelessWidget {
  const EcranProgres({super.key, required this.compte, this.auj});
  final Compte compte;
  /// Le jour affiché (aujourd'hui par défaut ; fixé dans les tests).
  final String? auj;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: compte,
      builder: (context, _) {
        final e = compte.etat;
        final jour = auj ?? jourDe(DateTime.now());
        return Scaffold(
          appBar: AppBar(title: const Text('Progrès', style: TextStyle(fontWeight: FontWeight.w700))),
          body: RefreshIndicator(
            onRefresh: compte.recharger,
            child: e == null
                ? ListView(children: [
                    if (compte.charge)
                      const Padding(padding: EdgeInsets.only(top: 80), child: Center(child: CircularProgressIndicator())),
                  ])
                : _Contenu(e: e, compte: compte, auj: jour),
          ),
        );
      },
    );
  }
}

class _Contenu extends StatefulWidget {
  const _Contenu({required this.e, required this.compte, required this.auj});
  final Etat e;
  final Compte compte;
  Map<String, Exercice> get cat => compte.catalogue;
  final String auj;

  @override
  State<_Contenu> createState() => _ContenuState();
}

class _ContenuState extends State<_Contenu> {
  String? _exo;
  final _cleExo = GlobalKey();

  void _choisir(String id) {
    setState(() => _exo = id);
    final c = _cleExo.currentContext;
    if (c != null) Scrollable.ensureVisible(c, duration: const Duration(milliseconds: 300), alignment: 0.1);
  }

  @override
  Widget build(BuildContext context) {
    final e = widget.e;
    final vide = e.hist.isEmpty && e.joursCardio.isEmpty;
    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 32),
      children: vide
          ? const [_Vide()]
          : [
              _Section(titre: 'Cette semaine', enfants: [
                _Regularite(s: serieSemaines(e.hist, e.joursCardio, objectifHebdo(e.a), widget.auj)),
                const SizedBox(height: 8),
                _Series(h: e.hist, auj: widget.auj),
                const SizedBox(height: 8),
                _Calendrier(
                  act: activite(e.hist, e.joursCardio),
                  auj: widget.auj,
                  onJour: (j) => ouvrirJour(context, widget.compte, j),
                ),
              ]),
              _Section(titre: 'Muscles travaillés · 7 derniers jours', enfants: [
                _Muscles(parM: seriesParMuscle(e.hist, decaler(widget.auj, -6), widget.auj, widget.cat)),
              ]),
              _Section(titre: 'Ma progression par exercice', enfants: [
                KeyedSubtree(key: _cleExo, child: _Progression(e: e, cat: widget.cat, id: _exo, choisir: (id) => setState(() => _exo = id))),
                _Records(r: meilleursRecords(e.hist, widget.cat), cat: widget.cat, choisir: _choisir),
              ]),
            ],
    );
  }
}

/* ---------------- éléments communs ---------------- */

class _Section extends StatelessWidget {
  const _Section({required this.titre, required this.enfants});
  final String titre;
  final List<Widget> enfants;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: 16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          _Eyebrow(titre),
          ...enfants,
        ]),
      );
}

class _Eyebrow extends StatelessWidget {
  const _Eyebrow(this.texte, {this.action});
  final String texte;
  final Widget? action;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(4, 0, 4, 8),
        child: Row(children: [
          Expanded(
            child: Text(texte.toUpperCase(),
                style: TextStyle(
                    fontSize: 12, letterSpacing: 0.8, fontWeight: FontWeight.w700, color: Theme.of(context).colorScheme.onSurfaceVariant)),
          ),
          ?action,
        ]),
      );
}

class _Carte extends StatelessWidget {
  const _Carte({required this.child, this.padding = const EdgeInsets.all(16)});
  final Widget child;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: s.surfaceContainer,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: s.outline.withValues(alpha: 0.8)),
      ),
      child: child,
    );
  }
}

Color _plate(BuildContext c) => Theme.of(c).colorScheme.primary;
Color _encre(BuildContext c) => Theme.of(c).colorScheme.secondary;
Color _gris(BuildContext c) => Theme.of(c).colorScheme.onSurfaceVariant;
Color _creux(BuildContext c) => Theme.of(c).brightness == Brightness.light ? const Color(0xFFE9E9EC) : const Color(0xFF2A2A31);

class _Vide extends StatelessWidget {
  const _Vide();

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: s.surfaceContainer,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: s.outline),
        ),
        child: Column(children: [
          Icon(Icons.show_chart, size: 40, color: _plate(context)),
          const SizedBox(height: 12),
          const Text('Ta première séance remplira cet écran',
              textAlign: TextAlign.center, style: TextStyle(fontSize: 19, fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          Text(
            "Chaque série validée s'ajoute ici : tes charges, tes records, le volume de chaque muscle et ta régularité.",
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 14, height: 1.45, color: _gris(context)),
          ),
        ]),
      ),
    );
  }
}

/* ---------------- la semaine ---------------- */

class _Regularite extends StatelessWidget {
  const _Regularite({required this.s});
  final SerieSemaines s;

  @override
  Widget build(BuildContext context) {
    final fait = s.cetteSemaine >= s.objectif;
    final cases = math.max(s.objectif, math.min(s.cetteSemaine, 7));
    return _Carte(
      padding: const EdgeInsets.all(14),
      child: Row(children: [
        Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: s.semaines > 0 ? _feu.withValues(alpha: 0.12) : _creux(context),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Icon(s.semaines > 0 ? Icons.local_fire_department : Icons.local_fire_department_outlined,
              size: 28, color: s.semaines > 0 ? _feu : _gris(context)),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(
              s.semaines > 0 ? "${s.semaines} semaine${_s(s.semaines)} d'affilée" : 'Lance ta régularité cette semaine',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, height: 1.2),
            ),
            const SizedBox(height: 6),
            Semantics(
              label: '${s.cetteSemaine} séance(s) sur ${s.objectif} cette semaine',
              child: Row(children: [
                for (var i = 0; i < cases; i++)
                  Container(
                    width: 20,
                    height: 6,
                    margin: const EdgeInsets.only(right: 4),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(3),
                      color: i < s.cetteSemaine ? (i < s.objectif ? _plate(context) : _succes) : _creux(context),
                    ),
                  ),
                const SizedBox(width: 2),
                Flexible(
                  child: Text(fait ? 'objectif atteint' : '${s.cetteSemaine}/${s.objectif} cette semaine',
                      overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: _gris(context))),
                ),
              ]),
            ),
          ]),
        ),
      ]),
    );
  }
}

class _Series extends StatelessWidget {
  const _Series({required this.h, required this.auj});
  final List<LigneHist> h;
  final String auj;

  @override
  Widget build(BuildContext context) {
    final s = seriesSemaine(h, auj), p = ecart(s.cette, s.avant);
    return _Carte(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
        Text(nb(s.cette), style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, height: 1)),
        const SizedBox(width: 6),
        Text(s.cette >= 2 ? 'séries cette semaine' : 'série cette semaine',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: _gris(context))),
        const Spacer(),
        if (p != null)
          p == 0
              ? Text('= semaine dernière', style: TextStyle(fontSize: 12, color: _gris(context)))
              : Row(children: [
                  Icon(p > 0 ? Icons.arrow_upward : Icons.arrow_downward, size: 13, color: p > 0 ? _succes : _gris(context)),
                  Text('${p.abs()} %',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: p > 0 ? _succes : _gris(context))),
                ]),
      ]),
    );
  }
}

/// Les 4 dernières semaines, une par ligne (lundi → dimanche).
class _Calendrier extends StatelessWidget {
  const _Calendrier({required this.act, required this.auj, required this.onJour});
  final Map<String, ({bool muscu, bool cardio})> act;
  final String auj;
  /// Toucher un jour d'entraînement ouvre ses séances.
  final void Function(String jour) onJour;

  @override
  Widget build(BuildContext context) {
    final debut = decaler(lundiDe(auj), -21);
    final cardio = Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.45);
    Widget legende(Color c, String t) => Row(mainAxisSize: MainAxisSize.min, children: [
          Container(width: 10, height: 10, decoration: BoxDecoration(color: c, borderRadius: BorderRadius.circular(3))),
          const SizedBox(width: 4),
          Text(t, style: TextStyle(fontSize: 12, color: _gris(context))),
        ]);
    return _Carte(
      child: Column(children: [
        Row(children: [
          for (final l in const ['L', 'M', 'M', 'J', 'V', 'S', 'D'])
            Expanded(child: Text(l, textAlign: TextAlign.center, style: TextStyle(fontSize: 10.5, color: _gris(context)))),
        ]),
        for (var w = 0; w < 4; w++)
          Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Row(children: [
              for (var i = 0; i < 7; i++)
                Expanded(child: _case(context, decaler(debut, w * 7 + i), cardio)),
            ]),
          ),
        const SizedBox(height: 12),
        Row(mainAxisAlignment: MainAxisAlignment.end, children: [
          legende(_plate(context), 'Muscu'),
          const SizedBox(width: 12),
          legende(cardio, 'Cardio'),
        ]),
      ]),
    );
  }

  Widget _case(BuildContext context, String j, Color cardio) {
    final a = act[j], futur = j.compareTo(auj) > 0;
    final plate = _plate(context);
    final c = Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2),
      child: Container(
        height: 20,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(5),
          color: futur ? Colors.transparent : a == null ? _creux(context) : (a.muscu ? plate : cardio),
          gradient: a != null && a.muscu && a.cardio && !futur
              ? LinearGradient(colors: [plate, plate, cardio, cardio], stops: const [0, .5, .5, 1], begin: Alignment.topLeft, end: Alignment.bottomRight)
              : null,
          border: j == auj ? Border.all(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.5), width: 2) : null,
        ),
      ),
    );
    if (a == null || futur) return c;
    return Semantics(
      button: true,
      label: 'Revoir les séances du $j',
      child: GestureDetector(key: ValueKey('jour-$j'), behavior: HitTestBehavior.opaque, onTap: () => onJour(j), child: c),
    );
  }
}

/* ---------------- muscles ---------------- */

class _Muscles extends StatelessWidget {
  const _Muscles({required this.parM});
  final Map<String, num> parM;

  @override
  Widget build(BuildContext context) {
    if (parM.isEmpty) {
      return _Carte(child: Text('Aucune série de musculation ces 7 derniers jours.', style: TextStyle(fontSize: 14, color: _gris(context))));
    }
    final liste = parM.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
    final restants = [for (final k in principaux) if (parM[k] == null) nomMuscle(k).toLowerCase()];
    final s = Theme.of(context).colorScheme;
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Text('De 10 à 20 séries par semaine, un muscle progresse bien.', style: TextStyle(fontSize: 12.5, color: _gris(context))),
      const SizedBox(height: 8),
      Wrap(spacing: 6, runSpacing: 6, children: [
        for (final m in liste)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(99),
              color: m.value >= 10 ? _plate(context).withValues(alpha: 0.14) : s.surfaceContainer,
              border: Border.all(color: m.value >= 10 ? _plate(context).withValues(alpha: 0.4) : s.outline),
            ),
            child: Text.rich(TextSpan(style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w500), children: [
              TextSpan(text: '${nomMuscle(m.key)} '),
              TextSpan(text: nb(m.value), style: TextStyle(fontWeight: FontWeight.w700, color: _encre(context))),
            ])),
          ),
      ]),
      if (restants.isNotEmpty) ...[
        const SizedBox(height: 8),
        _Carte(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Text.rich(TextSpan(style: const TextStyle(fontSize: 13, height: 1.35), children: [
            const TextSpan(text: 'Pas encore cette semaine : '),
            TextSpan(text: restants.join(', '), style: const TextStyle(fontWeight: FontWeight.w600)),
          ])),
        ),
      ],
    ]);
  }
}

/* ---------------- progression par exercice ---------------- */

enum _Vue { charge, series, force }

class _Progression extends StatefulWidget {
  const _Progression({required this.e, required this.cat, required this.id, required this.choisir});
  final Etat e;
  final Map<String, Exercice> cat;
  final String? id;
  final void Function(String id) choisir;

  @override
  State<_Progression> createState() => _ProgressionState();
}

class _ProgressionState extends State<_Progression> {
  _Vue _vue = _Vue.charge;

  Future<void> _tous(List<({String id, int n, String dernier})> faits, String courant) async {
    final id = await showModalBottomSheet<String>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (c) => ConstrainedBox(
        constraints: BoxConstraints(maxHeight: MediaQuery.sizeOf(c).height * 0.7),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(20, 0, 20, 2),
            child: Text('Choisir un exercice', style: TextStyle(fontSize: 19, fontWeight: FontWeight.w700)),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
            child: Text('Les exercices que tu as déjà faits', style: TextStyle(fontSize: 13, color: _gris(c))),
          ),
          Flexible(
            child: ListView(shrinkWrap: true, children: [
              for (final f in faits)
                ListTile(
                  selected: f.id == courant,
                  title: Text(widget.cat[f.id]!.n, maxLines: 1, overflow: TextOverflow.ellipsis),
                  subtitle: Text('${f.n} séance${_s(f.n)} · dernière le ${_court(f.dernier)}'),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () => Navigator.pop(c, f.id),
                ),
            ]),
          ),
        ]),
      ),
    );
    if (id != null) widget.choisir(id);
  }

  @override
  Widget build(BuildContext context) {
    final cat = widget.cat, h = widget.e.hist;
    final faits = exercicesFaits(h).where((f) => cat[f.id] != null).toList();
    final courant = (widget.id != null && cat[widget.id] != null)
        ? widget.id!
        : faits.where((f) => cat[f.id]!.ch == 'kg' && f.n > 1).firstOrNull?.id ?? faits.firstOrNull?.id;
    if (courant == null) {
      return _Carte(child: Text('Fais une séance pour voir ta progression.', style: TextStyle(fontSize: 14, color: _gris(context))));
    }
    final x = cat[courant]!, pts = courbe(h, courant);
    final kg = x.ch == 'kg', lest = x.ch == 'lest' && pts.any((p) => p.max > 0);
    final pdc = (x.ch == 'aucune' || x.ch == 'lest') && !lest;
    final v = !kg && _vue == _Vue.force ? _Vue.charge : _vue;
    String serie(PointEx p) => kg
        ? '${nb(p.max)} × ${nb(p.reps)}'
        : lest
            ? '+${nb(p.max)} × ${nb(p.reps)}'
            : pdc
                ? '${nb(p.reps)} réps'
                : x.ch == 'temps'
                    ? '${nb(p.max)} s'
                    : '${nb(p.max)} m';
    String serieLongue(PointEx p) => kg ? '${nb(p.max)} kg × ${nb(p.reps)}' : lest ? '+${nb(p.max)} kg × ${nb(p.reps)}' : serie(p);
    num val(PointEx p) => v == _Vue.force ? p.rm : pdc ? p.reps : p.max;
    String etiquette(PointEx p) => v == _Vue.force ? '${nb((p.rm * 10).round() / 10)} kg' : serie(p);
    final vus = pts.length > 8 ? pts.sublist(pts.length - 8) : pts;
    final haut = math.max(vus.map(val).fold<num>(0, math.max), 1);
    final premier = pts.first, dernier = pts.last;
    final gain = pdc ? dernier.reps - premier.reps : dernier.max - premier.max;
    final unite = kg || lest ? ' kg' : pdc ? ' réps' : x.ch == 'temps' ? ' s' : ' m';
    final progres = gain > 0 || (gain == 0 && (kg || lest) && dernier.reps > premier.reps);
    final suite = prochaineFois(widget.e, courant, cat, dernier);
    final plate = _plate(context), encre = _encre(context), s = Theme.of(context).colorScheme;

    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      /* les exercices faits, du plus récent au plus ancien ; « Tous » ouvre la liste complète */
      SizedBox(
        height: 38,
        child: ListView(scrollDirection: Axis.horizontal, children: [
          for (final f in faits.take(8))
            Padding(
              padding: const EdgeInsets.only(right: 6),
              child: _Pastille(texte: cat[f.id]!.n, actif: f.id == courant, onTap: () => widget.choisir(f.id)),
            ),
          if (faits.length > 8)
            _Pastille(texte: 'Tous', icone: Icons.expand_more, onTap: () => _tous(faits, courant)),
        ]),
      ),
      const SizedBox(height: 10),
      _Carte(
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text(x.n, style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w700, height: 1.15)),
          const SizedBox(height: 2),
          Text(
            '${v == _Vue.series ? 'Toutes tes séries, séance par séance' : v == _Vue.force ? "1RM estimé (formule d'Epley) à chaque séance" : 'Ta meilleure série à chaque séance'}'
            ' · ${pts.length} séance${_s(pts.length)}',
            style: TextStyle(fontSize: 13, color: _gris(context)),
          ),
          if (v == _Vue.series)
            ..._seriesParJour(context, h, courant, x, pts, serieLongue)
          else ...[
            const SizedBox(height: 16),
            SizedBox(
              height: 210,
              child: Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
                for (var i = 0; i < vus.length; i++)
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 3),
                      child: Column(mainAxisAlignment: MainAxisAlignment.end, children: [
                        FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text(etiquette(vus[i]),
                              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: i == vus.length - 1 ? encre : null)),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          constraints: const BoxConstraints(maxWidth: 40),
                          height: math.max(8, (150 * val(vus[i]) / haut).roundToDouble()),
                          decoration: BoxDecoration(
                            color: i == vus.length - 1 ? plate : _creux(context),
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(10), bottom: Radius.circular(4)),
                          ),
                        ),
                        const SizedBox(height: 6),
                        FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Text(_court(vus[i].d), style: TextStyle(fontSize: 11.5, color: _gris(context))),
                        ),
                      ]),
                    ),
                  ),
              ]),
            ),
          ],
          if (pts.length > 1) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: plate.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(16)),
              child: Row(children: [
                Transform.rotate(
                  angle: progres ? 0 : math.pi / 2,
                  child: Icon(Icons.north_east, size: 20, color: progres ? encre : _gris(context)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text.rich(TextSpan(style: const TextStyle(fontSize: 14, height: 1.3), children: [
                      const TextSpan(text: 'De '),
                      TextSpan(text: serieLongue(premier), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                      const TextSpan(text: ' à '),
                      TextSpan(text: serieLongue(dernier), style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: encre)),
                    ])),
                    Text(
                      gain > 0
                          ? '+${nb((gain * 10).round() / 10)}$unite en ${duree(premier.d, dernier.d)}'
                          : 'en ${duree(premier.d, dernier.d)}',
                      style: TextStyle(fontSize: 12.5, color: _gris(context)),
                    ),
                  ]),
                ),
              ]),
            ),
          ],
          const SizedBox(height: 12),
          Wrap(spacing: 6, children: [
            for (final (k, n) in [
              (_Vue.charge, kg ? 'Charge' : 'Meilleure série'),
              (_Vue.series, 'Séries'),
              if (kg) (_Vue.force, 'Force estimée'),
            ])
              Semantics(
                inMutuallyExclusiveGroup: true,
                checked: _vue == k,
                child: GestureDetector(
                  onTap: () => setState(() => _vue = k),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: _vue == k ? s.onSurface : null,
                      borderRadius: BorderRadius.circular(99),
                      border: _vue == k ? null : Border.all(color: s.outline),
                    ),
                    child: Text(n,
                        style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: _vue == k ? s.surface : _gris(context))),
                  ),
                ),
              ),
          ]),
        ]),
      ),
      if (suite != null) ...[
        const SizedBox(height: 10),
        _Carte(
          padding: const EdgeInsets.all(14),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            CircleAvatar(radius: 18, backgroundColor: plate.withValues(alpha: 0.14), child: Icon(Icons.auto_awesome, size: 16, color: encre)),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text.rich(TextSpan(style: const TextStyle(fontSize: 14, height: 1.3), children: [
                  const TextSpan(text: 'Prochaine fois', style: TextStyle(fontWeight: FontWeight.w700)),
                  const TextSpan(text: ' · Oxa te proposera '),
                  TextSpan(text: '${nb(suite.v)} kg × ${nb(suite.reps)}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                ])),
                if (suite.t != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 2),
                    child: Text(suite.t!, style: TextStyle(fontSize: 12.5, color: _gris(context))),
                  ),
              ]),
            ),
          ]),
        ),
      ],
    ]);
  }

  /// Séance par séance, la plus récente en haut : « 3 × 10 kg × 10 ».
  List<Widget> _seriesParJour(BuildContext context, List<LigneHist> h, String id, Exercice x, List<PointEx> pts,
      String Function(PointEx) serieLongue) {
    final jours = seriesParJour(h, id, x.ch);
    return [
      const SizedBox(height: 8),
      for (var i = 0; i < jours.length; i++)
        Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            border: i == jours.length - 1 ? null : Border(bottom: BorderSide(color: Theme.of(context).colorScheme.outline)),
          ),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            SizedBox(
              width: 56,
              child: Text(_court(jours[i].d),
                  style: TextStyle(
                      fontSize: 13,
                      fontWeight: i == 0 ? FontWeight.w600 : FontWeight.w400,
                      color: i == 0 ? _encre(context) : _gris(context))),
            ),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                if (jours[i].groupes != null)
                  for (final g in jours[i].groupes!)
                    Text('${g.n > 1 ? '${g.n} × ' : ''}${g.t}', style: const TextStyle(fontSize: 16.5, fontWeight: FontWeight.w700))
                else
                  Text('Meilleure série : ${serieLongue(pts.firstWhere((p) => p.d == jours[i].d))}',
                      style: TextStyle(fontSize: 14, color: _gris(context))),
              ]),
            ),
            Text('${nb(jours[i].total)} série${_s(jours[i].total)}', style: TextStyle(fontSize: 12, color: _gris(context))),
          ]),
        ),
    ];
  }
}

class _Pastille extends StatelessWidget {
  const _Pastille({required this.texte, this.actif = false, this.icone, required this.onTap});
  final String texte;
  final bool actif;
  final IconData? icone;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final s = Theme.of(context).colorScheme;
    return Material(
      color: actif ? s.primary : s.surfaceContainer,
      shape: StadiumBorder(side: actif ? BorderSide.none : BorderSide(color: s.outline)),
      child: InkWell(
        customBorder: const StadiumBorder(),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Text(texte, style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600, color: actif ? s.onPrimary : null)),
            if (icone != null) Icon(icone, size: 16),
          ]),
        ),
      ),
    );
  }
}

/* ---------------- records ---------------- */

class _Records extends StatefulWidget {
  const _Records({required this.r, required this.cat, required this.choisir});
  final List<RecordEx> r;
  final Map<String, Exercice> cat;
  final void Function(String id) choisir;

  @override
  State<_Records> createState() => _RecordsState();
}

class _RecordsState extends State<_Records> {
  bool _tout = false;

  String _detail(RecordEx r) {
    final ch = widget.cat[r.id]?.ch;
    final t = ch == 'kg'
        ? '${nb(r.max)} kg × ${nb(r.reps)}'
        : ch == 'aucune' || ch == 'lest'
            ? (r.max != 0 ? '+${nb(r.max)} kg × ${nb(r.reps)}' : '${nb(r.reps)} reps')
            : ch == 'temps'
                ? '${nb(r.max)} s'
                : '${nb(r.max)} m';
    return '${_court(r.d)} · $t';
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.r;
    if (r.isEmpty) return const SizedBox.shrink();
    final vus = r.take(_tout ? 40 : 5).toList();
    final s = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        _Eyebrow(
          'Records · ${r.length}',
          action: r.length > 5
              ? GestureDetector(
                  onTap: () => setState(() => _tout = !_tout),
                  child: Text(_tout ? 'Moins' : 'Voir tout',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: _encre(context))),
                )
              : null,
        ),
        Container(
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            color: s.surfaceContainer,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: s.outline.withValues(alpha: 0.8)),
          ),
          child: Column(children: [
            for (var i = 0; i < vus.length; i++)
              Material(
                type: MaterialType.transparency,
                child: InkWell(
                  onTap: () => widget.choisir(vus[i].id),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    decoration: BoxDecoration(border: i == 0 ? null : Border(top: BorderSide(color: s.outline))),
                    child: Row(children: [
                      CircleAvatar(
                        radius: 18,
                        backgroundColor: _plate(context).withValues(alpha: 0.14),
                        child: Icon(Icons.emoji_events, size: 18, color: _encre(context)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(widget.cat[vus[i].id]?.n ?? vus[i].id,
                              maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w500)),
                          Text(_detail(vus[i]), style: TextStyle(fontSize: 12, color: _gris(context))),
                        ]),
                      ),
                      if (widget.cat[vus[i].id]?.ch == 'kg' && vus[i].rm > 0)
                        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                          Text(nb((vus[i].rm * 10).round() / 10), style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
                          Text('1RM est.', style: TextStyle(fontSize: 10, color: _gris(context))),
                        ]),
                    ]),
                  ),
                ),
              ),
          ]),
        ),
      ]),
    );
  }
}

