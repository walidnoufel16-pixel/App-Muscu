/* L'adresse mail du compte : la rattacher (compte créé sans adresse) et la confirmer avec le code à
   six chiffres reçu par mail (comme SaisieCodeMail du site). Ouvert juste après « Créer mon compte »
   quand une adresse a été donnée, ou depuis Profil. */
import 'package:flutter/services.dart';
import 'package:material_ui/material_ui.dart';

import '../donnees/compte.dart';

class EcranAdresse extends StatefulWidget {
  const EcranAdresse({super.key, required this.compte, this.inscription = false});
  final Compte compte;

  /// Juste après la création du compte : « Plus tard » entre dans l'appli au lieu de revenir au Profil.
  final bool inscription;

  @override
  State<EcranAdresse> createState() => _EcranAdresseState();
}

class _EcranAdresseState extends State<EcranAdresse> {
  final _mail = TextEditingController();
  final _code = TextEditingController();
  bool _occupe = false;
  String? _msg;
  bool _ok = false;

  Compte get compte => widget.compte;

  void _dire(String? t, {bool ok = false}) => setState(() {
        _msg = t;
        _ok = ok;
      });

  Future<void> _envoyer() async {
    if (_occupe) return;
    setState(() => _occupe = true);
    final err = await compte.rattacherAdresse(_mail.text);
    if (!mounted) return;
    setState(() => _occupe = false);
    _dire(err);
  }

  Future<void> _renvoyer() async {
    final m = compte.adresseAConfirmer;
    if (m == null || _occupe) return;
    setState(() => _occupe = true);
    final err = await compte.rattacherAdresse(m);
    if (!mounted) return;
    setState(() => _occupe = false);
    _dire(err ?? 'Nouveau code envoyé à $m.', ok: err == null);
  }

  Future<void> _confirmer() async {
    if (_occupe) return;
    setState(() => _occupe = true);
    final err = await compte.confirmerAdresse(_code.text);
    if (!mounted) return;
    setState(() => _occupe = false);
    if (err != null) return _dire(err);
    if (!widget.inscription) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Adresse confirmée : ton compte est maintenant récupérable sur un autre appareil.')));
      Navigator.of(context).pop();
    }
  }

  void _plusTard() => widget.inscription ? compte.finirInscription() : Navigator.of(context).pop();

  @override
  void dispose() {
    _mail.dispose();
    _code.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final t = Theme.of(context);
    final gris = t.colorScheme.onSurfaceVariant;
    return ListenableBuilder(
      listenable: compte,
      builder: (context, _) {
        final attente = compte.adresseAConfirmer;
        return Scaffold(
          appBar: widget.inscription ? null : AppBar(),
          body: SafeArea(
            child: ListView(
              padding: EdgeInsets.fromLTRB(24, widget.inscription ? 56 : 8, 24, 24),
              children: [
                Text(attente == null ? 'Ajoute ton adresse' : 'Confirme ton adresse',
                    style: t.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                Text(
                  attente == null
                      ? 'Sans adresse, ton compte ne vit que sur ce téléphone. Avec, tu le retrouves partout, sur le site comme dans l\'appli, grâce à un code reçu par mail.'
                      : 'Six chiffres viennent d\'être envoyés à $attente. Pense à regarder tes indésirables.',
                  style: TextStyle(fontSize: 15, color: gris, height: 1.35),
                ),
                const SizedBox(height: 20),
                if (attente == null)
                  TextField(
                    controller: _mail,
                    autofocus: true,
                    keyboardType: TextInputType.emailAddress,
                    autocorrect: false,
                    autofillHints: const [AutofillHints.email],
                    onSubmitted: (_) => _envoyer(),
                    style: const TextStyle(fontSize: 17),
                    decoration: const InputDecoration(hintText: 'prenom@exemple.fr'),
                  )
                else
                  TextField(
                    controller: _code,
                    autofocus: true,
                    keyboardType: TextInputType.number,
                    autofillHints: const [AutofillHints.oneTimeCode],
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(6)],
                    textAlign: TextAlign.center,
                    onChanged: (v) => v.length == 6 ? _confirmer() : null,
                    onSubmitted: (_) => _confirmer(),
                    style: const TextStyle(fontSize: 34, fontWeight: FontWeight.w700, letterSpacing: 12),
                    decoration: const InputDecoration(hintText: '000000'),
                  ),
                if (_msg != null) ...[
                  const SizedBox(height: 12),
                  Text(_msg!, style: TextStyle(color: _ok ? t.colorScheme.primary : t.colorScheme.error, fontSize: 14)),
                ],
                const SizedBox(height: 20),
                if (attente == null)
                  FilledButton(
                    onPressed: _occupe ? null : _envoyer,
                    child: _occupe ? const _Rond() : const Text('Recevoir le code'),
                  )
                else
                  Row(children: [
                    Expanded(
                      child: FilledButton(
                        onPressed: _occupe ? null : _confirmer,
                        child: _occupe ? const _Rond() : const Text('Confirmer l\'adresse'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    OutlinedButton(
                      onPressed: _occupe ? null : _renvoyer,
                      style: OutlinedButton.styleFrom(minimumSize: const Size(0, 52)),
                      child: const Text('Renvoyer'),
                    ),
                  ]),
                if (widget.inscription) ...[
                  const SizedBox(height: 28),
                  TextButton(onPressed: _occupe ? null : _plusTard, child: const Text('Plus tard')),
                  Text('Le code restera à saisir dans Profil.',
                      textAlign: TextAlign.center, style: TextStyle(fontSize: 13, color: gris)),
                ],
              ],
            ),
          ),
        );
      },
    );
  }
}

class _Rond extends StatelessWidget {
  const _Rond();
  @override
  Widget build(BuildContext context) =>
      const SizedBox.square(dimension: 20, child: CircularProgressIndicator(strokeWidth: 2.5));
}
