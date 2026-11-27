/* Choisir des exercices dans le catalogue, comme la bibliothèque du site : recherche, filtre par
   muscle, photos. On en coche autant qu'on veut, puis « Ajouter » les renvoie dans l'ordre où ils
   ont été cochés. */
import 'package:material_ui/material_ui.dart';

import '../donnees/compte.dart';
import '../logique/seances.dart';
import 'vignette.dart';

class EcranChoixExercices extends StatefulWidget {
  const EcranChoixExercices({super.key, required this.compte, this.dejaPris = const {}});
  final Compte compte;
  /// Les exercices déjà dans la séance : montrés, mais pas proposés une deuxième fois.
  final Set<String> dejaPris;

  @override
  State<EcranChoixExercices> createState() => _EcranChoixExercicesState();
}

class _EcranChoixExercicesState extends State<EcranChoixExercices> {
  final _texte = TextEditingController();
  String? _groupe;
  final _coches = <String>[];

  @override
  void dispose() {
    _texte.dispose();
    super.dispose();
  }

  void _basculer(String id) => setState(() => _coches.contains(id) ? _coches.remove(id) : _coches.add(id));

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    final cat = widget.compte.catalogue;
    final ids = chercherExercices(cat, texte: _texte.text, groupe: _groupe);
    return Scaffold(
      appBar: AppBar(title: const Text('Ajouter des exercices', style: TextStyle(fontWeight: FontWeight.w700))),
      body: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
          child: TextField(
            controller: _texte,
            onChanged: (_) => setState(() {}),
            textInputAction: TextInputAction.search,
            decoration: InputDecoration(
              hintText: 'Chercher un exercice ou un muscle',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _texte.text.isEmpty
                  ? null
                  : IconButton(
                      tooltip: 'Effacer',
                      icon: const Icon(Icons.close),
                      onPressed: () => setState(_texte.clear),
                    ),
              filled: true,
              fillColor: t.colorScheme.surfaceContainer,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ),
        SizedBox(
          height: 40,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            children: [
              for (final g in [null, ...groupes])
                Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: ChoiceChip(
                    label: Text(g ?? 'Tous'),
                    selected: _groupe == g,
                    showCheckmark: false,
                    onSelected: (_) => setState(() => _groupe = g),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 4),
        Expanded(
          child: ids.isEmpty
              ? Padding(
                  padding: const EdgeInsets.all(32),
                  child: Text('Aucun exercice ne correspond.',
                      textAlign: TextAlign.center, style: TextStyle(color: t.colorScheme.onSurfaceVariant)),
                )
              : ListView.builder(
                  padding: const EdgeInsets.fromLTRB(8, 4, 8, 100),
                  itemCount: ids.length,
                  itemBuilder: (context, k) {
                    final id = ids[k], x = cat[id]!;
                    final pris = widget.dejaPris.contains(id), coche = _coches.contains(id);
                    return ListTile(
                      key: ValueKey(id),
                      enabled: !pris,
                      onTap: pris ? null : () => _basculer(id),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      leading: Vignette(photo: widget.compte.photos[id], taille: 48),
                      title: Text(x.n, maxLines: 2, overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                      subtitle: Text(pris ? 'Déjà dans la séance' : x.m, maxLines: 1, overflow: TextOverflow.ellipsis),
                      trailing: pris
                          ? Icon(Icons.check, color: t.colorScheme.onSurfaceVariant)
                          : Icon(coche ? Icons.check_circle : Icons.add_circle_outline,
                              color: coche ? t.colorScheme.primary : t.colorScheme.onSurfaceVariant),
                    );
                  },
                ),
        ),
      ]),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
      floatingActionButton: _coches.isEmpty
          ? null
          : SizedBox(
              width: MediaQuery.sizeOf(context).width - 32,
              height: 52,
              child: FilledButton(
                onPressed: () => Navigator.pop(context, List<String>.from(_coches)),
                child: Text(_coches.length == 1 ? 'Ajouter 1 exercice' : 'Ajouter ${_coches.length} exercices',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              ),
            ),
    );
  }
}
