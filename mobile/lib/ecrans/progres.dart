/* Progrès en mode Suivi, comme web/app/progres (onglet « Mon évolution ») : la semaine (série de
   semaines, objectif, séries, calendrier), les muscles travaillés sur 7 jours, la progression par
   exercice, les records et le poids du corps. Tout vient du document du compte (logique/progres.dart,
   logique/poids.dart) ; « Objectif » règle les séances par semaine (A.objHebdo), avec le joker du mois
   et le record ; « Noter » ajoute la pesée du jour (A.poids).
   Plus tard : cardio, défis et badges. */
import 'dart:math' as math;

import 'package:material_ui/material_ui.dart';

import '../donnees/compte.dart';
import '../logique/mode.dart';
import '../logique/modele.dart';
import '../logique/poids.dart';
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
              _Section(
                  titre: 'Cette semaine',
                  action: TextButton.icon(
                    onPressed: () => ouvrirObjectif(context, widget.compte, widget.auj),
                    style: TextButton.styleFrom(
                        foregroundColor: _encre(context),
                        padding: const EdgeInsets.symmetric(horizontal: 6),
                        minimumSize: const Size(0, 24),
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        visualDensity: VisualDensity.compact,
                        textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                    icon: const Icon(Icons.settings, size: 16),
                    label: const Text('Objectif'),
                  ),
                  enfants: [
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
              _SectionPoids(a: e.a, compte: widget.compte),
            ],
    );
  }
}

/* ---------------- éléments communs ---------------- */

class _Section extends StatelessWidget {
  const _Section({required this.titre, required this.enfants, this.action});
  final String titre;
  final List<Widget> enfants;
  final Widget? action;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(top: 16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          _Eyebrow(titre, action: action),
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
  const _Regularite({required this.s, this.regler});
  final SerieSemaines s;
  /// Feuille Objectif : le joker du mois, le record et les boutons − / + (null : carte seule ;
  /// la fonction reçoit le nouvel objectif, et n'est pas donnée pendant un enregistrement).
  final _Regler? regler;

  @override
  Widget build(BuildContext context) {
    final fait = s.cetteSemaine >= s.objectif;
    final cases = math.max(s.objectif, math.min(s.cetteSemaine, 7));
    final haut = Padding(
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
    final r = regler;
    if (r == null) return _Carte(padding: EdgeInsets.zero, child: haut);
    final s2 = Theme.of(context).colorScheme;
    return _Carte(
      padding: EdgeInsets.zero,
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        haut,
        Container(
          padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
          decoration: BoxDecoration(border: Border(top: BorderSide(color: s2.outline.withValues(alpha: 0.7)))),
          child: Row(children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  const Icon(Icons.verified_user, size: 16, color: _succes),
                  const SizedBox(width: 4),
                  Flexible(
                    child: Text(s.jokerDispo ? 'Joker du mois disponible' : 'Joker du mois utilisé',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                  ),
                ]),
                const SizedBox(height: 2),
                Text(
                  'Une semaine manquée par mois ne casse pas ta série.'
                  '${s.record > s.semaines ? ' Record : ${s.record} semaine${_s(s.record)}.' : ''}',
                  style: TextStyle(fontSize: 13, height: 1.35, color: _gris(context)),
                ),
              ]),
            ),
            const SizedBox(width: 12),
            Semantics(
              label: 'Objectif de séances par semaine',
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(color: _creux(context), borderRadius: BorderRadius.circular(999)),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  _BoutonRond(
                      icone: Icons.remove,
                      etiquette: 'Objectif : moins',
                      onTap: r.changer != null && s.objectif > 1 ? () => r.changer!(s.objectif - 1) : null),
                  SizedBox(
                    width: 48,
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Text('${s.objectif}', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, height: 1)),
                      Text('/ sem.', style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w500, color: _gris(context))),
                    ]),
                  ),
                  _BoutonRond(
                      icone: Icons.add,
                      etiquette: 'Objectif : plus',
                      onTap: r.changer != null && s.objectif < 6 ? () => r.changer!(s.objectif + 1) : null),
                ]),
              ),
            ),
          ]),
        ),
        if (r.erreur != null)
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 0, 14, 10),
            child: Text(r.erreur!, style: TextStyle(fontSize: 13, color: s2.error)),
          ),
      ]),
    );
  }
}

class _Regler {
  const _Regler({this.changer, this.erreur});
  final void Function(int n)? changer;
  final String? erreur;
}

class _BoutonRond extends StatelessWidget {
  const _BoutonRond({required this.icone, required this.etiquette, this.onTap});
  final IconData icone;
  final String etiquette;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => Semantics(
        button: true,
        label: etiquette,
        child: Opacity(
          opacity: onTap == null ? 0.4 : 1,
          child: Material(
            color: Theme.of(context).colorScheme.surfaceContainer,
            shape: const CircleBorder(),
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: onTap,
              child: SizedBox(width: 28, height: 28, child: Icon(icone, size: 14)),
            ),
          ),
        ),
      );
}

/// Feuille « Objectif de la semaine », comme le site : le nombre de séances qui compte pour la série,
/// le joker du mois et le record. Chaque − / + s'écrit tout de suite dans le compte.
Future<void> ouvrirObjectif(BuildContext context, Compte compte, String auj) => showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (c) => _FeuilleObjectif(compte: compte, auj: auj),
    );

class _FeuilleObjectif extends StatefulWidget {
  const _FeuilleObjectif({required this.compte, required this.auj});
  final Compte compte;
  final String auj;

  @override
  State<_FeuilleObjectif> createState() => _FeuilleObjectifState();
}

class _FeuilleObjectifState extends State<_FeuilleObjectif> {
  bool _occupe = false;
  String? _erreur;

  Future<void> _changer(int n) async {
    setState(() {
      _occupe = true;
      _erreur = null;
    });
    final err = await widget.compte.reglerObjectif(n);
    if (!mounted) return;
    setState(() {
      _occupe = false;
      _erreur = err;
    });
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(
        listenable: widget.compte,
        builder: (context, _) {
          final e = widget.compte.etat;
          if (e == null) return const SizedBox(height: 120);
          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
              child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 4),
                  child: Text('Objectif de la semaine', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(4, 2, 4, 12),
                  child: Text('Le nombre de séances qui compte pour ta série, et le joker du mois.',
                      style: TextStyle(fontSize: 13.5, color: _gris(context))),
                ),
                _Regularite(
                  s: serieSemaines(e.hist, e.joursCardio, objectifHebdo(e.a), widget.auj),
                  regler: _Regler(changer: _occupe ? null : _changer, erreur: _erreur),
                ),
              ]),
            ),
          );
        },
      );
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


/* ---------------- poids du corps ---------------- */

/// Comme SectionPoids du site : une ligne « Suivre mon poids » tant qu'aucune pesée n'est notée,
/// puis la courbe des pesées (dès deux) et le champ du poids du jour.
class _SectionPoids extends StatefulWidget {
  const _SectionPoids({required this.a, required this.compte});
  final Map<String, dynamic> a;
  final Compte compte;

  @override
  State<_SectionPoids> createState() => _SectionPoidsState();
}

class _SectionPoidsState extends State<_SectionPoids> {
  bool _ouvert = false, _envoi = false;
  final _champ = TextEditingController();

  @override
  void initState() {
    super.initState();
    _champ.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _champ.dispose();
    super.dispose();
  }

  Future<void> _noter() async {
    final kg = lirePoids(_champ.text);
    if (kg == null || _envoi) return;
    setState(() => _envoi = true);
    final err = await widget.compte.noterPoids(kg);
    if (!mounted) return;
    setState(() => _envoi = false);
    if (err != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err)));
    } else {
      _champ.clear();
      FocusScope.of(context).unfocus();
    }
  }

  @override
  Widget build(BuildContext context) {
    final a = widget.a;
    if (!poidsSuivi(a) && !_ouvert) {
      return Padding(
        padding: const EdgeInsets.only(top: 16),
        child: Material(
          color: Theme.of(context).colorScheme.surfaceContainer,
          borderRadius: BorderRadius.circular(18),
          clipBehavior: Clip.antiAlias,
          child: ListTile(
            leading: Icon(Icons.monitor_weight_outlined, color: _gris(context)),
            title: const Text('Suivre mon poids', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w500)),
            trailing: Icon(Icons.chevron_right, color: _gris(context)),
            onTap: () => setState(() => _ouvert = true),
          ),
        ),
      );
    }
    final p = pesees(a), dernier = dernierPoids(a);
    return _Section(titre: 'Poids du corps', enfants: [
      _Carte(
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          if (p.length > 1) ...[
            _CourbePoids(points: [for (final x in p) (x: _court(x.d), y: x.kg)]),
            const SizedBox(height: 12),
          ],
          Row(children: [
            Icon(Icons.monitor_weight_outlined, color: _gris(context)),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                key: const ValueKey('champ-poids'),
                controller: _champ,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                textInputAction: TextInputAction.done,
                onSubmitted: (_) => _noter(),
                style: const TextStyle(fontSize: 16),
                decoration: InputDecoration(
                  isDense: true,
                  hintText: dernier != null ? 'Dernier : ${nb(dernier)} kg' : 'Ton poids, en kg',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
            const SizedBox(width: 8),
            FilledButton(
              onPressed: _champ.text.trim().isEmpty || _envoi ? null : _noter,
              style: FilledButton.styleFrom(minimumSize: const Size(0, 44), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              child: const Text('Noter'),
            ),
          ]),
        ]),
      ),
    ]);
  }
}

/// La courbe du site (Courbe de graphes.tsx) : aire en dégradé, un point par pesée, la bulle du point
/// touché (le dernier d'office) et le premier et le dernier jour en bas.
class _CourbePoids extends StatefulWidget {
  const _CourbePoids({required this.points});
  final List<({String x, num y})> points;

  @override
  State<_CourbePoids> createState() => _CourbePoidsState();
}

class _CourbePoidsState extends State<_CourbePoids> {
  int? _sel;

  void _toucher(Offset o, double w) {
    final n = widget.points.length;
    const px = 10.0;
    final i = n == 1 ? 0 : (((o.dx - px) / (w - 2 * px)) * (n - 1)).round().clamp(0, n - 1);
    setState(() => _sel = i);
  }

  @override
  Widget build(BuildContext context) {
    final pts = widget.points, s = Theme.of(context).colorScheme;
    final i = (_sel ?? pts.length - 1).clamp(0, pts.length - 1);
    return Semantics(
      label: 'Courbe : de ${nb(pts.first.y)} à ${nb(pts.last.y)} kg',
      child: LayoutBuilder(
        builder: (c, k) => GestureDetector(
          onTapDown: (d) => _toucher(d.localPosition, k.maxWidth),
          onHorizontalDragUpdate: (d) => _toucher(d.localPosition, k.maxWidth),
          child: CustomPaint(
            size: Size(k.maxWidth, 130),
            painter: _PeintreCourbe(pts, i, _feu, s.outline, s.surfaceContainer, s.onSurface, s.surface, _gris(context)),
          ),
        ),
      ),
    );
  }
}

class _PeintreCourbe extends CustomPainter {
  _PeintreCourbe(this.pts, this.sel, this.feu, this.trait, this.fond, this.encre, this.papier, this.gris);
  final List<({String x, num y})> pts;
  final int sel;
  final Color feu, trait, fond, encre, papier, gris;

  void _texte(Canvas c, String t, Offset o, TextStyle st, {double ancre = 0}) {
    final tp = TextPainter(text: TextSpan(text: t, style: st), textDirection: TextDirection.ltr)..layout();
    tp.paint(c, o - Offset(tp.width * ancre, tp.height / 2));
  }

  @override
  void paint(Canvas c, Size size) {
    final w = size.width, h = size.height;
    const px = 10.0, haut = 26.0, bas = 22.0;
    final ys = [for (final p in pts) p.y.toDouble()];
    var mn = ys.reduce(math.min), mx = ys.reduce(math.max);
    if (mx - mn < 1e-6) {
      mn -= 1;
      mx += 1;
    }
    final marge = (mx - mn) * 0.15;
    mn = math.max(0, mn - marge);
    mx += marge;
    double X(int i) => pts.length == 1 ? w / 2 : px + i * (w - 2 * px) / (pts.length - 1);
    double Y(double v) => haut + (1 - (v - mn) / (mx - mn)) * (h - haut - bas);
    final pointille = Paint()
      ..color = trait
      ..strokeWidth = 1;
    for (final t in [0.25, 0.5, 0.75]) {
      final y = haut + t * (h - haut - bas);
      for (var x = 0.0; x < w; x += 6) {
        c.drawLine(Offset(x, y), Offset(math.min(x + 2, w), y), pointille);
      }
    }
    final ligne = Path();
    for (var i = 0; i < pts.length; i++) {
      i == 0 ? ligne.moveTo(X(i), Y(ys[i])) : ligne.lineTo(X(i), Y(ys[i]));
    }
    final aire = Path.from(ligne)
      ..lineTo(X(pts.length - 1), h - bas)
      ..lineTo(X(0), h - bas)
      ..close();
    c.drawPath(
        aire,
        Paint()
          ..shader = LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [feu.withValues(alpha: 0.28), feu.withValues(alpha: 0)],
          ).createShader(Rect.fromLTWH(0, haut, w, h - haut - bas)));
    c.drawPath(
        ligne,
        Paint()
          ..color = feu
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2.5
          ..strokeJoin = StrokeJoin.round
          ..strokeCap = StrokeCap.round);
    final xs = X(sel);
    for (var y = haut - 2; y < h - bas; y += 6) {
      c.drawLine(Offset(xs, y), Offset(xs, math.min(y + 3, h - bas)), Paint()..color = feu.withValues(alpha: 0.4));
    }
    for (var i = 0; i < pts.length; i++) {
      final o = Offset(X(i), Y(ys[i]));
      if (i == sel) {
        c.drawCircle(o, 5, Paint()..color = feu);
        c.drawCircle(o, 5, Paint()
          ..color = fond
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2.5);
      } else if (pts.length <= 24) {
        c.drawCircle(o, 2.6, Paint()..color = fond);
        c.drawCircle(o, 2.6, Paint()
          ..color = feu
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1.6);
      }
    }
    final bx = math.min(w - 60, math.max(60.0, xs));
    c.drawRRect(RRect.fromRectAndRadius(Rect.fromCenter(center: Offset(bx, 12), width: 116, height: 20), const Radius.circular(10)), Paint()..color = encre);
    _texte(c, '${nb((ys[sel] * 10).round() / 10)} kg · ${pts[sel].x}', Offset(bx, 12),
        TextStyle(color: papier, fontSize: 10.5, fontWeight: FontWeight.w600), ancre: 0.5);
    final petit = TextStyle(color: gris, fontSize: 9.5);
    _texte(c, pts.first.x, Offset(2, h - 8), petit);
    _texte(c, pts.last.x, Offset(w - 2, h - 8), petit, ancre: 1);
  }

  @override
  bool shouldRepaint(_PeintreCourbe o) => o.pts != pts || o.sel != sel || o.feu != feu || o.encre != encre;
}
