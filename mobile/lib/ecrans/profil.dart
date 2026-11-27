/* Profil (comme web/app/profil, en plus court) : le pseudo et l'adresse du compte, le mode
   Suivi / Guidé, les crédits des photos, la déconnexion et la suppression du compte (demandée par
   Apple pour toute appli où l'on a un compte). */
import 'package:material_ui/material_ui.dart';

import '../donnees/compte.dart';
import '../logique/mode.dart';
import 'credits.dart';

class EcranProfil extends StatefulWidget {
  const EcranProfil({super.key, required this.compte});
  final Compte compte;

  @override
  State<EcranProfil> createState() => _EcranProfilState();
}

class _EcranProfilState extends State<EcranProfil> {
  bool _occupe = false;

  Compte get compte => widget.compte;

  void _dire(String texte) => ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(texte)));

  Future<bool> _confirmer(String titre, String texte, String ok, {bool danger = false}) async {
    final r = await showDialog<bool>(
      context: context,
      builder: (c) => AlertDialog(
        title: Text(titre),
        content: Text(texte),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Annuler')),
          TextButton(
            onPressed: () => Navigator.pop(c, true),
            style: danger ? TextButton.styleFrom(foregroundColor: Theme.of(c).colorScheme.error) : null,
            child: Text(ok),
          ),
        ],
      ),
    );
    return r == true;
  }

  Future<void> _mode(Mode m) async {
    if (_occupe) return;
    setState(() => _occupe = true);
    final err = await compte.changerMode(m);
    if (!mounted) return;
    setState(() => _occupe = false);
    _dire(err ??
        (m == Mode.suivi
            ? 'Mode Suivi : tu notes tes séances, sans questionnaire ni séance proposée.'
            : 'Mode Guidé : Oxa te prépare tes séances. Pour l\'instant, il se fait sur le site.'));
  }

  Future<void> _sortir() async {
    final adresse = compte.mail;
    final ok = await _confirmer(
      'Se déconnecter ?',
      adresse == null || adresse.isEmpty
          ? 'Tes données restent sur ton compte.'
          : 'Tes données restent sur le compte $adresse. Pour y revenir, il suffira de saisir cette adresse et le code reçu par e-mail.',
      'Se déconnecter',
    );
    if (ok) await compte.deconnecter();
  }

  /// Ce qui disparaît, dit simplement (comme « Tout effacer » sur le site).
  List<String> _quoi() {
    final e = compte.etat;
    final q = <String>[];
    if (e?.cycle ?? false) q.add('ton cycle et tes réponses');
    final n = e?.seances.where((s) => s != null && !s.auto).length ?? 0;
    if (n > 0) q.add(n > 1 ? '$n séances composées' : '1 séance composée');
    if ((e?.log.isNotEmpty ?? false) || (e?.hist.isNotEmpty ?? false)) q.add('toutes tes charges et ton historique');
    final m = compte.mail;
    if (m != null && m.isNotEmpty) q.add('le compte $m');
    if (q.isEmpty) q.add('le peu qui est enregistré');
    return q;
  }

  Future<void> _supprimer() async {
    final ok = await _confirmer(
      'Supprimer ton compte ?',
      'Ce qui disparaît :\n· ${_quoi().join('\n· ')}\n\nDans l\'appli comme sur le site, et c\'est définitif.',
      'Supprimer',
      danger: true,
    );
    if (!ok || !mounted) return;
    setState(() => _occupe = true);
    final err = await compte.supprimerCompte();
    if (!mounted) return;
    setState(() => _occupe = false);
    if (err != null) _dire(err);
  }

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    final gris = t.colorScheme.onSurfaceVariant;
    return ListenableBuilder(
      listenable: compte,
      builder: (context, _) {
        final pseudo = compte.pseudo;
        final mode = modeDe(compte.etat?.a);
        final adresse = compte.mail;
        return Scaffold(
          appBar: AppBar(title: const Text('Profil', style: TextStyle(fontWeight: FontWeight.w700))),
          body: ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
            children: [
              _Bloc(enfants: [
                Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(children: [
                    CircleAvatar(
                      radius: 26,
                      backgroundColor: t.colorScheme.primary,
                      foregroundColor: t.colorScheme.onPrimary,
                      child: Text((pseudo.isEmpty ? '?' : pseudo.substring(0, 1)).toUpperCase(),
                          style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w700)),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(pseudo.isEmpty ? 'Toi' : pseudo,
                            maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                        if (adresse != null && adresse.isNotEmpty)
                          Text(adresse, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 13, color: gris)),
                      ]),
                    ),
                  ]),
                ),
              ]),
              if (!compte.suiviSeul) ...[
                const _Surtitre('MODE'),
                SegmentedButton<Mode>(
                  segments: const [
                    ButtonSegment(value: Mode.suivi, label: Text('Suivi')),
                    ButtonSegment(value: Mode.guide, label: Text('Guidé')),
                  ],
                  selected: {mode},
                  showSelectedIcon: false,
                  onSelectionChanged: _occupe || compte.etat == null ? null : (s) => _mode(s.first),
                ),
                Padding(
                  padding: const EdgeInsets.fromLTRB(4, 8, 4, 0),
                  child: Text(
                    '${mode == Mode.suivi ? 'Tu notes tes séries. Oxa garde ta charge d\'avant, ton max, ta récup et tes progrès.' : 'Quelques questions, puis Oxa te prépare tes séances selon ta récup et ton matériel.'} Tu peux changer quand tu veux : rien n\'est perdu.',
                    style: TextStyle(fontSize: 12.5, height: 1.35, color: gris),
                  ),
                ),
              ],
              const _Surtitre('COMPTE'),
              _Bloc(enfants: [
                _Ligne(
                  texte: 'Crédits des photos',
                  icone: Icons.photo_outlined,
                  auToucher: () => Navigator.of(context).push(MaterialPageRoute<void>(builder: (_) => EcranCredits(photos: compte.photos))),
                ),
                _Ligne(texte: 'Se déconnecter', icone: Icons.logout, auToucher: _occupe ? null : _sortir),
              ]),
              const SizedBox(height: 16),
              _Bloc(enfants: [
                _Ligne(texte: 'Supprimer mon compte', icone: Icons.delete_outline, danger: true, auToucher: _occupe ? null : _supprimer),
              ]),
              Padding(
                padding: const EdgeInsets.fromLTRB(4, 8, 4, 0),
                child: Text('Efface ton compte et tout ce qu\'il contient, ici comme sur le site.',
                    style: TextStyle(fontSize: 12.5, height: 1.35, color: gris)),
              ),
              if (_occupe) const Padding(padding: EdgeInsets.only(top: 20), child: Center(child: CircularProgressIndicator())),
            ],
          ),
        );
      },
    );
  }
}

class _Surtitre extends StatelessWidget {
  const _Surtitre(this.texte);
  final String texte;
  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(4, 20, 4, 8),
        child: Text(texte,
            style: TextStyle(
                fontSize: 12, letterSpacing: 0.8, fontWeight: FontWeight.w700, color: Theme.of(context).colorScheme.onSurfaceVariant)),
      );
}

class _Bloc extends StatelessWidget {
  const _Bloc({required this.enfants});
  final List<Widget> enfants;
  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).colorScheme;
    return Material(
      color: c.surfaceContainer,
      borderRadius: BorderRadius.circular(20),
      clipBehavior: Clip.antiAlias,
      child: Column(children: [
        for (var i = 0; i < enfants.length; i++) ...[
          if (i > 0) Divider(height: 1, indent: 52, color: c.outline),
          enfants[i],
        ],
      ]),
    );
  }
}

class _Ligne extends StatelessWidget {
  const _Ligne({required this.texte, required this.icone, required this.auToucher, this.danger = false});
  final String texte;
  final IconData icone;
  final VoidCallback? auToucher;
  final bool danger;
  @override
  Widget build(BuildContext context) {
    final c = Theme.of(context).colorScheme;
    final couleur = danger ? c.error : c.onSurface;
    return ListTile(
      leading: Icon(icone, color: danger ? c.error : c.onSurfaceVariant),
      title: Text(texte, style: TextStyle(fontSize: 15.5, fontWeight: FontWeight.w600, color: couleur)),
      trailing: danger ? null : Icon(Icons.chevron_right, size: 20, color: c.onSurfaceVariant),
      onTap: auToucher,
    );
  }
}
