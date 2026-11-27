/* Le compte Oxa : connexion par code reçu par mail et lecture de l'état rangé par le site
   (table « etats »). Même projet Supabase que le site : mêmes comptes, mêmes données.
   Cette première version ne fait que lire : rien n'est écrit dans le compte. */
import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;
import 'package:material_ui/material_ui.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../logique/modele.dart';

/* La clé publishable est publique par nature (la sécurité repose sur les règles RLS).
   Surchargeable à la construction : --dart-define=SUPABASE_URL=… --dart-define=SUPABASE_KEY=… */
const sbUrl = String.fromEnvironment('SUPABASE_URL', defaultValue: 'https://iyjiwfzrmyvcnmzwlgxe.supabase.co');
const sbKey = String.fromEnvironment('SUPABASE_KEY', defaultValue: 'sb_publishable_lZmQsTMMyzcaY9A80Zr26Q_V_zHmf3R');

bool valideMail(String m) => RegExp(r'^[^\s@]+@[^\s@]+\.[a-z]{2,}$', caseSensitive: false).hasMatch(m.trim());

/// Messages d'erreur Supabase dits simplement (repris de web/lib/supabase.ts).
String messageErreur(Object? e, {String contexte = 'envoi'}) {
  final t = e is AuthException ? e.message : (e?.toString() ?? '');
  if (RegExp(r'rate limit|429|too many|for security', caseSensitive: false).hasMatch(t)) {
    return 'Trop de demandes. Réessaie dans quelques minutes.';
  }
  if (contexte == 'recup' && RegExp(r'signups not allowed|not found|disabled', caseSensitive: false).hasMatch(t)) {
    return "Aucun compte n'est rattaché à cette adresse.";
  }
  if (contexte == 'code' && RegExp(r'expired|invalid', caseSensitive: false).hasMatch(t)) {
    return 'Code incorrect ou expiré. Demande-en un nouveau.';
  }
  if (e is AuthRetryableFetchException || RegExp(r'SocketException|Failed host lookup').hasMatch(t)) {
    return 'Pas de connexion internet. Réessaie dès que le réseau revient.';
  }
  return (contexte == 'code' ? 'Vérification impossible' : 'Envoi impossible') + (t.isNotEmpty ? ' : $t' : '.');
}

class Compte extends ChangeNotifier {
  Compte(this._c);
  final SupabaseClient _c;

  Etat? etat;
  String pseudo = '';
  bool charge = false;
  String? erreur;
  Map<String, Exercice> catalogue = const {};

  Session? get session => _c.auth.currentSession;
  Stream<AuthState> get changements => _c.auth.onAuthStateChange;

  Future<void> chargerCatalogue() async {
    final j = jsonDecode(await rootBundle.loadString('assets/exercices.json')) as Map<String, dynamic>;
    catalogue = {for (final e in j.entries) e.key: Exercice(e.value['n'] as String, e.value['ch'] as String)};
  }

  /// Envoie le code à six chiffres. Pas de création de compte ici : on retrouve celui du site.
  Future<String?> demanderCode(String mail) async {
    final m = mail.trim().toLowerCase();
    if (!valideMail(m)) return "Cette adresse n'a pas l'air valide.";
    try {
      await _c.auth.signInWithOtp(email: m, shouldCreateUser: false);
      return null;
    } catch (e) {
      return messageErreur(e, contexte: 'recup');
    }
  }

  Future<String?> validerCode(String mail, String code) async {
    final k = code.replaceAll(RegExp(r'\D'), '');
    if (k.length != 6) return 'Le code fait six chiffres.';
    try {
      final r = await _c.auth.verifyOTP(email: mail.trim().toLowerCase(), token: k, type: OtpType.email);
      if (r.user == null) return messageErreur(null, contexte: 'code');
      await recharger();
      return null;
    } catch (e) {
      return messageErreur(e, contexte: 'code');
    }
  }

  /// Relit l'état du compte sur le serveur.
  Future<void> recharger() async {
    final u = _c.auth.currentUser;
    if (u == null) return;
    charge = true;
    erreur = null;
    notifyListeners();
    try {
      final d = await _c.from('etats').select('etat,pseudo').eq('user_id', u.id).maybeSingle();
      etat = Etat.depuis(d?['etat'] is Map ? Map<String, dynamic>.from(d!['etat'] as Map) : null);
      pseudo = (d?['pseudo'] as String?) ?? '';
    } catch (e) {
      erreur = 'Impossible de lire ton compte. Vérifie ta connexion et réessaie.';
    }
    charge = false;
    notifyListeners();
  }

  Future<void> deconnecter() async {
    await _c.auth.signOut();
    etat = null;
    pseudo = '';
    notifyListeners();
  }
}
