/* Connexion : l'adresse mail du compte Oxa, puis le code à six chiffres reçu par mail. */
import 'package:flutter/services.dart';
import 'package:material_ui/material_ui.dart';

import '../donnees/compte.dart';

class EcranConnexion extends StatefulWidget {
  const EcranConnexion({super.key, required this.compte});
  final Compte compte;

  @override
  State<EcranConnexion> createState() => _EcranConnexionState();
}

class _EcranConnexionState extends State<EcranConnexion> {
  final _mail = TextEditingController();
  final _code = TextEditingController();
  bool _attenteCode = false;
  bool _occupe = false;
  String? _err;

  Future<void> _agir() async {
    setState(() {
      _occupe = true;
      _err = null;
    });
    final err = _attenteCode
        ? await widget.compte.validerCode(_mail.text, _code.text)
        : await widget.compte.demanderCode(_mail.text);
    if (!mounted) return;
    setState(() {
      _occupe = false;
      _err = err;
      if (err == null && !_attenteCode) _attenteCode = true;
    });
  }

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
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
          children: [
            if (_attenteCode)
              Align(
                alignment: Alignment.centerLeft,
                child: TextButton.icon(
                  onPressed: () => setState(() {
                    _attenteCode = false;
                    _err = null;
                    _code.clear();
                  }),
                  icon: const Icon(Icons.chevron_left),
                  label: const Text('Retour'),
                  style: TextButton.styleFrom(foregroundColor: gris, padding: EdgeInsets.zero),
                ),
              ),
            const SizedBox(height: 24),
            Text('Oxa', style: t.textTheme.displaySmall?.copyWith(fontWeight: FontWeight.w800, color: t.colorScheme.primary)),
            const SizedBox(height: 16),
            Text(
              _attenteCode ? 'Entre le code' : 'Retrouve ton compte',
              style: t.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            Text(
              _attenteCode
                  ? 'On vient de t\'envoyer un code à six chiffres à ${_mail.text.trim()}.'
                  : 'L\'adresse mail de ton compte Oxa. On t\'envoie un code pour te connecter.',
              style: TextStyle(fontSize: 15, color: gris, height: 1.35),
            ),
            const SizedBox(height: 20),
            if (!_attenteCode)
              TextField(
                controller: _mail,
                autofocus: true,
                keyboardType: TextInputType.emailAddress,
                autocorrect: false,
                autofillHints: const [AutofillHints.email],
                textInputAction: TextInputAction.go,
                onSubmitted: (_) => _occupe ? null : _agir(),
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
                onSubmitted: (_) => _occupe ? null : _agir(),
                style: const TextStyle(fontSize: 34, fontWeight: FontWeight.w700, letterSpacing: 12),
                decoration: const InputDecoration(hintText: '000000'),
              ),
            if (_err != null) ...[
              const SizedBox(height: 12),
              Text(_err!, style: TextStyle(color: t.colorScheme.error, fontSize: 14)),
            ],
            const SizedBox(height: 20),
            FilledButton(
              onPressed: _occupe ? null : _agir,
              child: _occupe
                  ? const SizedBox.square(dimension: 20, child: CircularProgressIndicator(strokeWidth: 2.5))
                  : Text(_attenteCode ? 'Se connecter' : 'Recevoir le code'),
            ),
            if (!_attenteCode) ...[
              const SizedBox(height: 20),
              Text(
                'Pas encore de compte ? Crée-le sur le site Oxa, il sera aussi dans l\'appli.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: gris),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
