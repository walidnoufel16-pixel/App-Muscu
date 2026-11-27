/* La séance en cours, mode Suivi (docs/produit/mode-suivi/cahier-des-charges.md, § 4) :
   - par exercice, la colonne « Précédent », la pastille « Ton record » et la charge proposée
     (« ↑ 5 kg », « Pourquoi 85 kg ? ») ;
   - les cases KG / RÉPS préremplies avec la proposition : on valide d'une touche si on la suit,
     on corrige sinon. Première fois sur un exercice à charge : case KG vide ;
   - le minuteur de repos après chaque série validée ;
   - « Terminer la séance » range la séance dans le compte (historique et Progrès du site).
   Pas de « Comment tu te sens ? » ni d'effort conseillé (RPE) en mode Suivi. */
import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/services.dart';
import 'package:material_ui/material_ui.dart';

import '../donnees/brouillon.dart';
import '../donnees/compte.dart';
import '../logique/charge.dart';
import '../logique/mode.dart' show nb;
import '../logique/modele.dart';
import 'vignette.dart';

num? _lire(String t) => num.tryParse(t.trim().replaceAll(',', '.'));
String _ecrire(num v) => v == 0 ? '' : nb(v);

class _Ligne {
  final TextEditingController v;
  final TextEditingController reps;
  bool ok;
  _Ligne(num v, num reps, {this.ok = false})
      : v = TextEditingController(text: _ecrire(v)),
        reps = TextEditingController(text: _ecrire(reps));
  void dispose() {
    v.dispose();
    reps.dispose();
  }
}

class _Exo {
  final int j; // index de l'exercice dans la séance
  final ExLibre ex;
  final Exercice x;
  final Ctx c;
  final List<_Ligne> lignes;
  int ts = 0;
  bool pourquoi = false;
  _Exo(this.j, this.ex, this.x, this.c, this.lignes);
  bool get deuxChamps => x.ch == 'kg' || x.ch == 'lest';
}

class EcranSeance extends StatefulWidget {
  const EcranSeance({super.key, required this.compte, required this.i});
  final Compte compte;
  final int i;

  @override
  State<EcranSeance> createState() => _EcranSeanceState();
}

class _EcranSeanceState extends State<EcranSeance> {
  late final SeanceLibre _s;
  final _exos = <_Exo>[];
  int _debut = DateTime.now().millisecondsSinceEpoch;
  bool _occupe = false;

  Timer? _minuteur;
  int _finRepos = 0;
  int _reste = 0;

  Compte get _compte => widget.compte;

  @override
  void initState() {
    super.initState();
    final e = _compte.etat!;
    _s = e.seances[widget.i]!;
    for (var j = 0; j < _s.ex.length; j++) {
      final c = ctxLibre(e, widget.i, j, _compte.catalogue);
      final x = _compte.catalogue[_s.ex[j].id];
      if (c == null || x == null) continue;
      final n = math.max(1, c.n);
      _exos.add(_Exo(j, _s.ex[j], x, c, [for (var k = 0; k < n; k++) _Ligne(c.v, c.reps)]));
    }
    _reprendre();
  }

  /// Une séance commencée sur ce téléphone (il y a moins de 6 h) : on la reprend telle quelle.
  Future<void> _reprendre() async {
    final uid = _compte.idUtilisateur;
    if (uid == null) return;
    final b = await Brouillons.lire(uid, widget.i, _s.signature);
    if (b == null || !mounted) return;
    setState(() {
      _debut = b.debut;
      for (var k = 0; k < _exos.length && k < b.ex.length; k++) {
        final e = _exos[k], m = b.ex[k];
        if (m.id != e.ex.id || m.series.isEmpty) continue;
        for (final l in e.lignes) {
          l.dispose();
        }
        e.lignes
          ..clear()
          ..addAll(m.series.map((s) => _Ligne(s.v, s.reps, ok: s.ok == true)));
        e.ts = m.ts;
      }
    });
  }

  List<Serie> _series(_Exo e) => [
        for (final l in e.lignes) Serie(v: _lire(l.v.text) ?? 0, reps: e.deuxChamps ? (_lire(l.reps.text) ?? 0) : 0, ok: l.ok),
      ];

  void _garder() {
    final uid = _compte.idUtilisateur;
    if (uid == null) return;
    Brouillons.garder(uid, widget.i, SeanceEnCours(_s.signature, _debut, [for (final e in _exos) ExEnCours(e.ex.id, _series(e), e.ts)]));
  }

  void _dire(String t) => ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(t)));

  void _valider(_Exo e, int k) {
    final l = e.lignes[k];
    if (l.ok) {
      setState(() => l.ok = false);
      _garder();
      return;
    }
    final v = _lire(l.v.text) ?? 0, reps = _lire(l.reps.text) ?? 0;
    if (e.x.ch == 'kg' && v <= 0) return _dire('Indique la charge de cette série.');
    if (e.deuxChamps && reps <= 0) return _dire('Indique le nombre de répétitions.');
    if (!e.deuxChamps && v <= 0) return _dire(e.x.ch == 'temps' ? 'Indique la durée tenue.' : e.x.ch == 'dist' ? 'Indique la distance.' : 'Indique le nombre de répétitions.');
    FocusScope.of(context).unfocus();
    HapticFeedback.lightImpact();
    setState(() {
      l.ok = true;
      e.ts = DateTime.now().millisecondsSinceEpoch;
      /* la série suivante, encore vide, part de celle qu'on vient de faire */
      if (k + 1 < e.lignes.length) {
        final s = e.lignes[k + 1];
        if (!s.ok && s.v.text.isEmpty) s.v.text = l.v.text;
        if (!s.ok && s.reps.text.isEmpty) s.reps.text = l.reps.text;
      }
    });
    _garder();
    _lancerRepos(secondesDe(e.ex.p));
  }

  void _ajouterSerie(_Exo e) {
    final d = e.lignes.isNotEmpty ? e.lignes.last : null;
    setState(() => e.lignes.add(_Ligne(_lire(d?.v.text ?? '') ?? 0, _lire(d?.reps.text ?? '') ?? 0)));
    _garder();
  }

  void _retirerSerie(_Exo e) {
    if (e.lignes.length <= 1 || e.lignes.last.ok) return;
    setState(() => e.lignes.removeLast().dispose());
    _garder();
  }

  void _lancerRepos(int sec) {
    _minuteur?.cancel();
    _finRepos = DateTime.now().millisecondsSinceEpoch + sec * 1000;
    _tic();
    _minuteur = Timer.periodic(const Duration(milliseconds: 500), (_) => _tic());
  }

  void _tic() {
    final r = ((_finRepos - DateTime.now().millisecondsSinceEpoch) / 1000).ceil();
    if (r <= 0) {
      _minuteur?.cancel();
      if (_reste > 0) HapticFeedback.heavyImpact();
    }
    if (mounted) setState(() => _reste = math.max(0, r));
  }

  void _decaler(int s) {
    _finRepos += s * 1000;
    _tic();
  }

  void _passer() {
    _minuteur?.cancel();
    setState(() => _reste = 0);
  }

  int get _validees => _exos.fold(0, (n, e) => n + e.lignes.where((l) => l.ok).length);
  int get _total => _exos.fold(0, (n, e) => n + e.lignes.length);

  Future<void> _terminer() async {
    if (_validees == 0) return _dire('Coche au moins une série pour enregistrer ta séance.');
    if (_validees < _total) {
      final ok = await showDialog<bool>(
        context: context,
        builder: (c) => AlertDialog(
          title: const Text('Terminer la séance ?'),
          content: Text('${_total - _validees} série${_total - _validees > 1 ? 's' : ''} pas cochée${_total - _validees > 1 ? 's' : ''} : elle${_total - _validees > 1 ? 's' : ''} ne compter${_total - _validees > 1 ? 'ont' : 'a'} pas.'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Continuer')),
            TextButton(onPressed: () => Navigator.pop(c, true), child: const Text('Terminer')),
          ],
        ),
      );
      if (ok != true || !mounted) return;
    }
    setState(() => _occupe = true);
    final maintenant = DateTime.now().millisecondsSinceEpoch;
    final journaux = [
      for (final e in _exos)
        () {
          final s = _series(e);
          if (!s.any((x) => x.ok == true)) return null;
          return Journal(
            ex: e.ex.id,
            done: s.every((x) => x.ok == true),
            series: s,
            nb: s.length,
            v: s.map((x) => x.v).reduce(math.max),
            reps: s.first.reps,
            ts: e.ts > 0 ? e.ts : maintenant,
            why: e.c.why,
          );
        }(),
    ];
    /* les journaux suivent l'ordre des exercices de la séance (un exercice inconnu est sauté) */
    final parIndex = List<Journal?>.filled(_s.ex.length, null);
    for (var k = 0; k < _exos.length; k++) {
      parIndex[_exos[k].j] = journaux[k];
    }
    final min = math.max(1, ((maintenant - _debut) / 60000).round());
    final err = await _compte.enregistrer(widget.i, _s.signature, parIndex, min: min);
    if (!mounted) return;
    setState(() => _occupe = false);
    if (err != null) return _dire(err);
    final uid = _compte.idUtilisateur;
    if (uid != null) await Brouillons.oublier(uid, widget.i);
    if (mounted) Navigator.pop(context, true);
  }

  @override
  void dispose() {
    _minuteur?.cancel();
    for (final e in _exos) {
      for (final l in e.lignes) {
        l.dispose();
      }
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(_s.nom, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700)),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Center(
              child: Text('$_validees/$_total séries',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: t.colorScheme.onSurfaceVariant)),
            ),
          ),
        ],
      ),
      body: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 140),
          children: [
            if (_exos.isEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 60),
                child: Text('Cette séance n\'a pas d\'exercice. Ajoute-les sur le site Oxa.',
                    textAlign: TextAlign.center, style: TextStyle(color: t.colorScheme.onSurfaceVariant)),
              ),
            for (final e in _exos) ...[_carte(e), const SizedBox(height: 12)],
            if (_exos.isNotEmpty)
              FilledButton(
                onPressed: _occupe ? null : _terminer,
                child: _occupe
                    ? const SizedBox.square(dimension: 20, child: CircularProgressIndicator(strokeWidth: 2.5))
                    : const Text('Terminer la séance'),
              ),
          ],
        ),
      ),
      bottomNavigationBar: _reste > 0 ? _barreRepos(t) : null,
    );
  }

  Widget _carte(_Exo e) {
    final t = Theme.of(context), c = t.colorScheme, gris = c.onSurfaceVariant;
    final var_ = e.c.variation(_compte.catalogue);
    final colValeur = switch (e.x.ch) { 'kg' => 'KG', 'lest' => '+KG', 'temps' => 'SEC', 'dist' => 'M', _ => 'RÉPS' };
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 8),
      decoration: BoxDecoration(color: c.surfaceContainer, borderRadius: BorderRadius.circular(20)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Vignette(photo: _compte.photos[e.ex.id], taille: 48),
          const SizedBox(width: 12),
          Expanded(child: Text(e.x.n, style: const TextStyle(fontSize: 16.5, fontWeight: FontWeight.w700))),
          if (var_ != 0) _pastille('${var_ > 0 ? '↑' : '↓'} ${nb(var_.abs())} kg', c.primary.withValues(alpha: 0.16), c.secondary),
        ]),
        const SizedBox(height: 3),
        Text(
          e.c.prev != null
              ? 'Précédent : ${resumeDe(e.c.prev!, e.x)}'
              : e.c.vide
                  ? 'Première fois : note ta charge, Oxa s\'en souviendra.'
                  : 'Première fois sur cet exercice.',
          style: TextStyle(fontSize: 13, color: gris),
        ),
        if (e.c.max != null) ...[
          const SizedBox(height: 6),
          _pastille('Ton record : ${fmtMax(e.x.ch, e.c.max!)}', const Color(0x1FF59E0B), const Color(0xFFB45309)),
        ],
        if (e.c.why != null) ...[
          const SizedBox(height: 4),
          InkWell(
            onTap: () => setState(() => e.pourquoi = !e.pourquoi),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Text(
                e.pourquoi ? e.c.why! : (e.x.ch == 'kg' ? 'Pourquoi ${nb(e.c.v)} kg ?' : 'Pourquoi ?'),
                style: TextStyle(fontSize: 13, height: 1.35, color: c.secondary, fontWeight: e.pourquoi ? FontWeight.w400 : FontWeight.w600),
              ),
            ),
          ),
        ],
        const SizedBox(height: 8),
        DefaultTextStyle(
          style: TextStyle(fontSize: 11, letterSpacing: 0.6, fontWeight: FontWeight.w700, color: gris),
          child: Row(children: [
            const SizedBox(width: 50, child: Text('SÉRIE')),
            const Expanded(child: Text('PRÉCÉDENT')),
            SizedBox(width: 66, child: Text(colValeur, textAlign: TextAlign.center)),
            if (e.deuxChamps) const SizedBox(width: 8),
            if (e.deuxChamps) const SizedBox(width: 56, child: Text('RÉPS', textAlign: TextAlign.center)),
            const SizedBox(width: 48),
          ]),
        ),
        for (var k = 0; k < e.lignes.length; k++) _ligne(e, k),
        Row(children: [
          TextButton.icon(
            onPressed: () => _ajouterSerie(e),
            icon: const Icon(Icons.add, size: 18),
            label: const Text('Série'),
            style: TextButton.styleFrom(foregroundColor: c.secondary, padding: const EdgeInsets.symmetric(horizontal: 4)),
          ),
          if (e.lignes.length > 1 && !e.lignes.last.ok)
            TextButton.icon(
              onPressed: () => _retirerSerie(e),
              icon: const Icon(Icons.remove, size: 18),
              label: const Text('Série'),
              style: TextButton.styleFrom(foregroundColor: gris, padding: const EdgeInsets.symmetric(horizontal: 4)),
            ),
        ]),
      ]),
    );
  }

  Widget _ligne(_Exo e, int k) {
    final c = Theme.of(context).colorScheme;
    final l = e.lignes[k];
    final p = e.c.prev;
    final ps = p == null || p.series.isEmpty ? null : p.series[math.min(k, p.series.length - 1)];
    final fond = l.ok ? c.primary.withValues(alpha: 0.12) : Colors.transparent;
    return Container(
      margin: const EdgeInsets.only(top: 6),
      decoration: BoxDecoration(color: fond, borderRadius: BorderRadius.circular(12)),
      child: Row(children: [
        SizedBox(width: 50, child: Padding(padding: const EdgeInsets.only(left: 12), child: Text('${k + 1}', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)))),
        Expanded(
          child: Text(ps == null ? '—' : fmtSerie(e.x, ps),
              maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13.5, color: c.onSurfaceVariant)),
        ),
        _champ(l.v, l.ok, 66, decimal: e.x.ch == 'kg' || e.x.ch == 'lest', indice: e.x.ch == 'lest' ? '0' : '—'),
        if (e.deuxChamps) const SizedBox(width: 8),
        if (e.deuxChamps) _champ(l.reps, l.ok, 56),
        SizedBox(
          width: 48,
          height: 44,
          child: IconButton(
            onPressed: () => _valider(e, k),
            tooltip: l.ok ? 'Décocher la série' : 'Valider la série',
            icon: Icon(l.ok ? Icons.check_circle : Icons.check_circle_outline, size: 30, color: l.ok ? c.primary : c.onSurfaceVariant),
          ),
        ),
      ]),
    );
  }

  Widget _champ(TextEditingController ctl, bool ok, double largeur, {bool decimal = false, String indice = '—'}) {
    final c = Theme.of(context).colorScheme;
    return SizedBox(
      width: largeur,
      height: 40,
      child: TextField(
        controller: ctl,
        readOnly: ok,
        textAlign: TextAlign.center,
        keyboardType: TextInputType.numberWithOptions(decimal: decimal),
        inputFormatters: [FilteringTextInputFormatter.allow(RegExp(decimal ? r'[0-9.,]' : r'[0-9]')), LengthLimitingTextInputFormatter(6)],
        onChanged: (_) => _garder(),
        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: c.onSurface),
        decoration: InputDecoration(
          hintText: indice,
          isDense: true,
          contentPadding: const EdgeInsets.symmetric(vertical: 10),
          fillColor: ok ? Colors.transparent : c.surface,
        ),
      ),
    );
  }

  Widget _pastille(String texte, Color fond, Color encre) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
        decoration: BoxDecoration(color: fond, borderRadius: BorderRadius.circular(99)),
        child: Text(texte, style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: encre)),
      );

  Widget _barreRepos(ThemeData t) {
    final m = _reste ~/ 60, s = (_reste % 60).toString().padLeft(2, '0');
    return SafeArea(
      child: Container(
        margin: const EdgeInsets.fromLTRB(12, 0, 12, 8),
        padding: const EdgeInsets.fromLTRB(16, 8, 8, 8),
        decoration: BoxDecoration(color: t.colorScheme.onSurface, borderRadius: BorderRadius.circular(20)),
        child: Row(children: [
          Expanded(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Text('Repos  $m:$s', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: t.colorScheme.surface)),
            ),
          ),
          for (final (txt, f) in [('−15', () => _decaler(-15)), ('+15', () => _decaler(15)), ('Passer', _passer)])
            TextButton(
              onPressed: f,
              style: TextButton.styleFrom(
                foregroundColor: t.colorScheme.primary,
                padding: const EdgeInsets.symmetric(horizontal: 10),
                minimumSize: const Size(44, 40),
                tapTargetSize: MaterialTapTargetSize.shrinkWrap,
              ),
              child: Text(txt),
            ),
        ]),
      ),
    );
  }
}
