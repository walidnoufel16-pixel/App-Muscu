/* Créer ou modifier une séance de « Mes séances », comme le composeur du site
   (web/app/entrainement/composer/page.tsx) : le nom, puis les exercices pris dans le catalogue,
   qu'on retire ou réordonne (poignée à droite). La séance s'enregistre dans le compte
   (document relu juste avant d'écrire) et apparaît aussi sur le site. Une séance existante
   peut être supprimée. Depuis le corps de Mes séances (ecrans/corps_du_jour.dart), elle arrive avec le
   nom des muscles et les exercices déjà cochés. */
import 'package:material_ui/material_ui.dart';

import '../donnees/compte.dart';
import '../logique/seances.dart';
import 'choix_exercices.dart';
import 'vignette.dart';

class _Ligne {
  final String id;
  /// Position dans la séance avant modification (null : ajouté ici).
  final int? o;
  const _Ligne(this.id, [this.o]);
}

class EcranEditerSeance extends StatefulWidget {
  /// `i` null : nouvelle séance ; sinon la séance `i` de la liste du compte.
  /// Pour une nouvelle séance, `nom` et `ids` la préremplissent (le corps de Mes séances).
  const EcranEditerSeance({super.key, required this.compte, this.i, this.nom, this.ids = const []});
  final Compte compte;
  final int? i;
  final String? nom;
  final List<String> ids;

  @override
  State<EcranEditerSeance> createState() => _EcranEditerSeanceState();
}

class _EcranEditerSeanceState extends State<EcranEditerSeance> {
  final _nom = TextEditingController();
  final _lignes = <_Ligne>[];
  String? _signature;
  bool _occupe = false;

  Compte get _compte => widget.compte;
  bool get _nouvelle => widget.i == null;

  @override
  void initState() {
    super.initState();
    final i = widget.i;
    final s = i == null ? null : _compte.etat?.seances[i];
    if (s != null) {
      _signature = s.signature;
      _nom.text = s.nom;
      for (var j = 0; j < s.ex.length; j++) {
        _lignes.add(_Ligne(s.ex[j].id, j));
      }
    } else if (i == null) {
      _nom.text = widget.nom ?? '';
      _lignes.addAll(widget.ids.map(_Ligne.new));
    }
  }

  @override
  void dispose() {
    _nom.dispose();
    super.dispose();
  }

  void _dire(String t) => ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(t)));

  Future<void> _ajouter() async {
    FocusScope.of(context).unfocus();
    final ids = await Navigator.of(context).push<List<String>>(MaterialPageRoute(
      builder: (_) => EcranChoixExercices(compte: _compte, dejaPris: {for (final l in _lignes) l.id}),
    ));
    if (ids == null || ids.isEmpty || !mounted) return;
    setState(() => _lignes.addAll(ids.map(_Ligne.new)));
  }

  Future<void> _enregistrer() async {
    FocusScope.of(context).unfocus();
    if (_nom.text.trim().isEmpty) return _dire('Donne un nom à ta séance.');
    if (_lignes.isEmpty) return _dire('Ajoute au moins un exercice.');
    setState(() => _occupe = true);
    final err = _nouvelle
        ? await _compte.creerSeance(_nom.text, [for (final l in _lignes) l.id])
        : await _compte.modifierSeance(
            widget.i!, _signature!, _nom.text, [for (final l in _lignes) ExModifie(l.id, l.o)]);
    if (!mounted) return;
    setState(() => _occupe = false);
    if (err != null) return _dire(err);
    _dire(_nouvelle ? 'Séance créée : ${nomOuDefaut(_nom.text)}' : 'Séance modifiée.');
    Navigator.pop(context, true);
  }

  Future<void> _supprimer() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: Text('Supprimer « ${_compte.etat?.seances[widget.i!]?.nom ?? _nom.text} » ?'),
        content: const Text(
            "Les charges enregistrées sur cette séance seront effacées aussi. Ce que tu as déjà fait reste dans Progrès."),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Annuler')),
          TextButton(
            onPressed: () => Navigator.pop(c, true),
            style: TextButton.styleFrom(foregroundColor: Theme.of(c).colorScheme.error),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );
    if (ok != true || !mounted) return;
    setState(() => _occupe = true);
    final err = await _compte.supprimerSeance(widget.i!, _signature!);
    if (!mounted) return;
    setState(() => _occupe = false);
    if (err != null) return _dire(err);
    _dire('Séance supprimée.');
    Navigator.pop(context, true);
  }

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    final gris = t.colorScheme.onSurfaceVariant;
    return Scaffold(
      appBar: AppBar(
        title: Text(_nouvelle ? 'Nouvelle séance' : 'Modifier la séance', style: const TextStyle(fontWeight: FontWeight.w700)),
        actions: [
          if (!_nouvelle)
            IconButton(
              tooltip: 'Supprimer la séance',
              icon: const Icon(Icons.delete_outline),
              onPressed: _occupe ? null : _supprimer,
            ),
        ],
      ),
      body: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        child: ReorderableListView.builder(
          buildDefaultDragHandles: false,
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 120),
          header: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            TextField(
              controller: _nom,
              autofocus: _nouvelle && _lignes.isEmpty,
              textCapitalization: TextCapitalization.sentences,
              textInputAction: TextInputAction.done,
              maxLength: 40,
              onChanged: (_) => setState(() {}),
              onSubmitted: (_) {
                if (_nouvelle && _lignes.isEmpty && _nom.text.trim().isNotEmpty) _ajouter();
              },
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
              decoration: InputDecoration(
                labelText: 'Nom de la séance',
                hintText: 'Par exemple : Haut du corps',
                counterText: '',
                filled: true,
                fillColor: t.colorScheme.surfaceContainer,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
              ),
            ),
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.fromLTRB(4, 0, 4, 8),
              child: Text(_lignes.isEmpty ? 'EXERCICES' : 'EXERCICES · ${_lignes.length}',
                  style: TextStyle(fontSize: 12, letterSpacing: 0.8, fontWeight: FontWeight.w700, color: gris)),
            ),
            if (_lignes.isEmpty)
              Padding(
                padding: const EdgeInsets.fromLTRB(4, 0, 4, 12),
                child: Text('Choisis les exercices de ta séance dans le catalogue. Tu pourras changer leur ordre ensuite.',
                    style: TextStyle(fontSize: 14, height: 1.35, color: gris)),
              ),
          ]),
          footer: Padding(
            padding: const EdgeInsets.only(top: 8),
            child: OutlinedButton.icon(
              onPressed: _occupe ? null : _ajouter,
              icon: const Icon(Icons.add),
              label: const Text('Ajouter des exercices'),
              style: OutlinedButton.styleFrom(minimumSize: const Size.fromHeight(48)),
            ),
          ),
          itemCount: _lignes.length,
          onReorderItem: (a, b) => setState(() => _lignes.insert(b, _lignes.removeAt(a))),
          proxyDecorator: (child, _, _) => Material(color: Colors.transparent, elevation: 4, borderRadius: BorderRadius.circular(16), child: child),
          itemBuilder: (context, k) {
            final l = _lignes[k], x = _compte.catalogue[l.id];
            return Padding(
              key: ValueKey(l.id),
              padding: const EdgeInsets.only(bottom: 6),
              child: Container(
                decoration: BoxDecoration(color: t.colorScheme.surfaceContainer, borderRadius: BorderRadius.circular(16)),
                padding: const EdgeInsets.fromLTRB(10, 8, 0, 8),
                child: Row(children: [
                  Vignette(photo: _compte.photos[l.id], taille: 44),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(x?.n ?? l.id, maxLines: 2, overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                      if ((x?.m ?? '').isNotEmpty)
                        Text(x!.m, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12.5, color: gris)),
                    ]),
                  ),
                  IconButton(
                    tooltip: 'Retirer',
                    icon: Icon(Icons.remove_circle_outline, color: gris),
                    onPressed: _occupe ? null : () => setState(() => _lignes.removeAt(k)),
                  ),
                  ReorderableDragStartListener(
                    index: k,
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(4, 8, 12, 8),
                      child: Icon(Icons.drag_handle, color: gris, semanticLabel: 'Déplacer'),
                    ),
                  ),
                ]),
              ),
            );
          },
        ),
      ),
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.fromLTRB(16, 8, 16, 12),
        child: SizedBox(
          height: 52,
          child: FilledButton(
            onPressed: _occupe ? null : _enregistrer,
            child: _occupe
                ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2.5))
                : Text(_nouvelle ? 'Créer la séance' : 'Enregistrer',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          ),
        ),
      ),
    );
  }
}
