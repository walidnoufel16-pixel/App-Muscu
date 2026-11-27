/* Entrée dans l'appli, comme web/app/bienvenue :
   - « Créer mon compte » : un surnom et une adresse facultative ; le compte est créé tout de suite
     (sans mot de passe), puis l'adresse se confirme avec le code reçu (ecrans/adresse.dart) ;
   - « J'ai déjà un compte » : l'adresse du compte, puis le code à six chiffres reçu par mail. */
import 'package:flutter/services.dart';
import 'package:material_ui/material_ui.dart';

import '../donnees/compte.dart';
import '../logique/inscription.dart' show pseudoMax;
import 'adresse.dart';

enum _Etape { accueil, compte, recup, code }

class EcranConnexion extends StatefulWidget {
  const EcranConnexion({super.key, required this.compte});
  final Compte compte;

  @override
  State<EcranConnexion> createState() => _EcranConnexionState();
}

class _EcranConnexionState extends State<EcranConnexion> {
  final _pseudo = TextEditingController();
  final _mail = TextEditingController();
  final _code = TextEditingController();
  var _etape = _Etape.accueil;
  bool _occupe = false;
  String? _err;

  Future<void> _agir() async {
    if (_occupe) return;
    setState(() {
      _occupe = true;
      _err = null;
    });
    final c = widget.compte;
    final err = switch (_etape) {
      _Etape.compte => await c.creerCompte(_pseudo.text, _mail.text),
      _Etape.recup => await c.demanderCode(_mail.text),
      _Etape.code => await c.validerCode(_mail.text, _code.text),
      _Etape.accueil => null,
    };
    if (!mounted) return;
    setState(() {
      _occupe = false;
      _err = err;
      if (err == null && _etape == _Etape.recup) _etape = _Etape.code;
    });
    final avert = c.avertissement;
    if (err == null && avert != null) {
      c.avertissement = null;
      ScaffoldMessenger.maybeOf(context)?.showSnackBar(SnackBar(content: Text(avert), duration: const Duration(seconds: 8)));
    }
  }

  void _aller(_Etape e) => setState(() {
        _etape = e;
        _err = null;
        if (e != _Etape.code) _code.clear();
      });

  @override
  void dispose() {
    _pseudo.dispose();
    _mail.dispose();
    _code.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    /* Compte créé avec une adresse : on la confirme avant d'entrer (ou « Plus tard »). */
    if (widget.compte.enInscription && widget.compte.session != null && !_occupe) {
      return EcranAdresse(compte: widget.compte, inscription: true);
    }
    final t = Theme.of(context);
    final gris = t.colorScheme.onSurfaceVariant;
    final (titre, texte, bouton) = switch (_etape) {
      _Etape.accueil => ('Note tes séances, vois tes progrès', 'Ta charge d\'avant, ton record et ta récup, à chaque série. Sur ton téléphone comme sur le site.', ''),
      _Etape.compte => ('Ton surnom', 'Il sert juste à t\'accueillir. Pas de mot de passe : ton compte est créé tout de suite.', 'Créer mon compte'),
      _Etape.recup => ('Retrouve ton compte', 'L\'adresse mail de ton compte Oxa. On t\'envoie un code pour te connecter.', 'Recevoir le code'),
      _Etape.code => ('Entre le code', 'On vient de t\'envoyer un code à six chiffres à ${_mail.text.trim()}. Pense à regarder tes indésirables.', 'Se connecter'),
    };
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
          children: [
            if (_etape != _Etape.accueil)
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton.icon(
                  onPressed: _occupe ? null : () => _aller(_etape == _Etape.code ? _Etape.recup : _Etape.accueil),
                  icon: const Icon(Icons.chevron_left),
                  label: const Text('Retour'),
                  style: TextButton.styleFrom(foregroundColor: gris, padding: EdgeInsets.zero),
                ),
              ),
            SizedBox(height: _etape == _Etape.accueil ? 72 : 24),
            Text('Oxa', style: t.textTheme.displaySmall?.copyWith(fontWeight: FontWeight.w800, color: t.colorScheme.primary)),
            const SizedBox(height: 16),
            Text(titre, style: t.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 6),
            Text(texte, style: TextStyle(fontSize: 15, color: gris, height: 1.35)),
            const SizedBox(height: 20),
            ...switch (_etape) {
              _Etape.accueil => [
                  const SizedBox(height: 12),
                  FilledButton(onPressed: () => _aller(_Etape.compte), child: const Text('Créer mon compte')),
                  const SizedBox(height: 8),
                  TextButton(onPressed: () => _aller(_Etape.recup), child: const Text('J\'ai déjà un compte')),
                ],
              _Etape.compte => [
                  TextField(
                    controller: _pseudo,
                    autofocus: true,
                    textCapitalization: TextCapitalization.words,
                    inputFormatters: [LengthLimitingTextInputFormatter(pseudoMax)],
                    autofillHints: const [AutofillHints.nickname],
                    textInputAction: TextInputAction.next,
                    style: const TextStyle(fontSize: 17),
                    decoration: const InputDecoration(hintText: 'Ton surnom'),
                  ),
                  const SizedBox(height: 20),
                  Text.rich(TextSpan(children: [
                    const TextSpan(text: 'Ton adresse e-mail ', style: TextStyle(fontWeight: FontWeight.w600)),
                    TextSpan(text: '— facultatif', style: TextStyle(color: gris)),
                  ]), style: const TextStyle(fontSize: 14)),
                  const SizedBox(height: 8),
                  _ChampMail(controleur: _mail, auto: false, valider: _agir),
                  const SizedBox(height: 8),
                  Text(
                    'Sans adresse, ton compte ne vit que sur ce téléphone. Avec, tu retrouves tes séances partout, grâce à un code reçu par mail. Tu pourras l\'ajouter plus tard.',
                    style: TextStyle(fontSize: 13, height: 1.4, color: gris),
                  ),
                ],
              _Etape.recup => [_ChampMail(controleur: _mail, auto: true, valider: _agir)],
              _Etape.code => [
                  TextField(
                    controller: _code,
                    autofocus: true,
                    keyboardType: TextInputType.number,
                    autofillHints: const [AutofillHints.oneTimeCode],
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(6)],
                    textAlign: TextAlign.center,
                    onSubmitted: (_) => _agir(),
                    style: const TextStyle(fontSize: 34, fontWeight: FontWeight.w700, letterSpacing: 12),
                    decoration: const InputDecoration(hintText: '000000'),
                  ),
                ],
            },
            if (_err != null) ...[
              const SizedBox(height: 12),
              Text(_err!, style: TextStyle(color: t.colorScheme.error, fontSize: 14)),
            ],
            if (_etape != _Etape.accueil) ...[
              const SizedBox(height: 20),
              FilledButton(
                onPressed: _occupe ? null : _agir,
                child: _occupe
                    ? const SizedBox.square(dimension: 20, child: CircularProgressIndicator(strokeWidth: 2.5))
                    : Text(bouton),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ChampMail extends StatelessWidget {
  const _ChampMail({required this.controleur, required this.auto, required this.valider});
  final TextEditingController controleur;
  final bool auto;
  final VoidCallback valider;
  @override
  Widget build(BuildContext context) => TextField(
        controller: controleur,
        autofocus: auto,
        keyboardType: TextInputType.emailAddress,
        autocorrect: false,
        autofillHints: const [AutofillHints.email],
        textInputAction: TextInputAction.go,
        onSubmitted: (_) => valider(),
        style: const TextStyle(fontSize: 17),
        decoration: const InputDecoration(hintText: 'prenom@exemple.fr'),
      );
}
