/* Le compte Oxa : connexion par code reçu par mail et lecture de l'état rangé par le site
   (table « etats »). Même projet Supabase que le site : mêmes comptes, mêmes données.
   Pour écrire (une séance faite), on relit le document sur le serveur juste avant, on y range la
   séance (logique/enregistrer.dart) et on le renvoie : rien de ce qu'un autre appareil a écrit
   entre-temps ne se perd, et le site fusionne de son côté. */
import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;
import 'package:material_ui/material_ui.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../logique/enregistrer.dart';
import '../logique/inscription.dart';
import '../logique/mode.dart';
import '../logique/modele.dart';
import '../logique/seances.dart' as seances;
import '../ecrans/vignette.dart' show Photo;
import 'brouillon.dart';

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
  String? get idUtilisateur => _c.auth.currentUser?.id;
  String? get mail => _c.auth.currentUser?.email;
  /// Compte sans adresse confirmée : il ne vit que sur ce téléphone (créé sans adresse, ou adresse pas encore confirmée).
  bool get sansAdresse => _c.auth.currentUser != null && (mail == null || mail!.isEmpty);
  String? _adresseDemandee;
  /// L'adresse en attente de son code (rattachée à la création ou depuis Profil).
  String? get adresseAConfirmer {
    final n = _c.auth.currentUser?.newEmail;
    return (n != null && n.isNotEmpty) ? n : _adresseDemandee;
  }
  /// Inscription en cours dans l'écran de connexion : le compte existe déjà, mais on reste sur l'écran
  /// tant que l'adresse n'est pas confirmée ou remise à plus tard.
  bool enInscription = false;
  /// Le mode Guidé ouvert par l'admin pour ce compte (ou compte admin), lu sur le serveur.
  bool guideOuvert = false;
  /// Compte limité au mode Suivi : arrivé après le verrou du site (A.suiviSeul) et mode Guidé pas
  /// ouvert pour lui (comme useSuiviSeul de web/lib/fonctionnalites.ts). Pas de choix de mode à montrer.
  bool get suiviSeul => etat?.a['suiviSeul'] == true && !guideOuvert;
  bool charge = false;
  String? erreur;
  Map<String, Exercice> catalogue = const {};
  Map<String, Photo> photos = const {};
  /// Les textes des fiches, par exercice : exécution (e), erreurs fréquentes (err), comment progresser (p).
  Map<String, dynamic> fiches = const {};

  Session? get session => _c.auth.currentSession;
  Stream<AuthState> get changements => _c.auth.onAuthStateChange;

  Future<void> chargerCatalogue() async {
    final j = jsonDecode(await rootBundle.loadString('assets/exercices.json')) as Map<String, dynamic>;
    catalogue = {for (final e in j.entries) e.key: Exercice.depuis(Map<String, dynamic>.from(e.value as Map))};
    final ph = jsonDecode(await rootBundle.loadString('assets/photos.json')) as Map<String, dynamic>;
    photos = {for (final e in ph.entries) e.key: Photo.depuis(Map<String, dynamic>.from(e.value as Map))};
    fiches = jsonDecode(await rootBundle.loadString('assets/fiches.json')) as Map<String, dynamic>;
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

  /// Crée le compte, comme « Créer mon compte » sur le site : connexion sans mot de passe, document du
  /// compte rangé dans « etats » (mode Suivi, Mes séances vide), puis l'adresse rattachée si elle est
  /// donnée (un code part tout de suite). Renvoie un message d'erreur, ou null. Un avertissement
  /// éventuel (adresse pas rattachée) est dans [avertissement].
  Future<String?> creerCompte(String pseudoSaisi, String mailSaisi) async {
    final p = pseudoPropre(pseudoSaisi);
    final m = mailSaisi.trim().toLowerCase();
    final err = erreurInscription(p, m, valideMail);
    if (err != null) return err;
    avertissement = null;
    enInscription = true;
    try {
      final r = await _c.auth.signInAnonymously();
      if (r.user == null) throw const AuthException('anonyme');
    } catch (e) {
      enInscription = false;
      final t = messageErreur(e, contexte: 'connexion');
      return t.startsWith('Envoi impossible') ? "Le serveur n'accepte pas de nouveau compte pour l'instant. Réessaie un peu plus tard." : t;
    }
    final doc = documentNouveauCompte();
    try {
      await _c.from('etats').upsert({
        'user_id': _c.auth.currentUser!.id,
        'pseudo': p,
        'etat': doc,
        'maj': DateTime.now().toUtc().toIso8601String(),
        'source': 'appli',
      });
    } catch (e) {
      /* Sans document, le compte serait vide partout : on referme la session pour repartir proprement. */
      enInscription = false;
      try {
        await _c.auth.signOut();
      } catch (_) {}
      return 'Création impossible : vérifie ta connexion et réessaie.';
    }
    etat = Etat.depuis(doc);
    pseudo = p;
    guideOuvert = false;
    if (m.isNotEmpty) avertissement = await rattacherAdresse(m);
    if (adresseAConfirmer == null) enInscription = false;
    notifyListeners();
    return null;
  }

  /// Message à montrer une fois le compte créé (adresse pas rattachée), ou null.
  String? avertissement;

  /// Rattache une adresse au compte : un code à six chiffres y est envoyé. Renvoie un message d'erreur, ou null.
  Future<String?> rattacherAdresse(String mailSaisi) async {
    final m = mailSaisi.trim().toLowerCase();
    if (!valideMail(m)) return "Cette adresse n'a pas l'air valide.";
    try {
      await _c.auth.updateUser(UserAttributes(email: m));
      _adresseDemandee = m;
      notifyListeners();
      return null;
    } catch (e) {
      if (RegExp(r'already|registered|exists', caseSensitive: false).hasMatch(e is AuthException ? e.message : '$e')) {
        return 'Cette adresse est déjà celle d\'un autre compte Oxa. Pour l\'ouvrir, déconnecte-toi puis « J\'ai déjà un compte ».';
      }
      return "Ton compte est créé, mais l'adresse n'a pas pu y être rattachée. Tu peux réessayer depuis Profil.";
    }
  }

  /// Confirme l'adresse avec le code reçu (comme SaisieCodeMail du site). Renvoie un message d'erreur, ou null.
  Future<String?> confirmerAdresse(String code) async {
    final m = adresseAConfirmer;
    final k = code.replaceAll(RegExp(r'\D'), '');
    if (m == null) return 'Aucune adresse à confirmer.';
    if (k.length != 6) return 'Le code fait six chiffres.';
    try {
      await _c.auth.verifyOTP(email: m, token: k, type: OtpType.emailChange);
      try {
        await _c.auth.refreshSession();
      } catch (_) {}
      _adresseDemandee = null;
      enInscription = false;
      notifyListeners();
      return null;
    } catch (e) {
      return messageErreur(e, contexte: 'code');
    }
  }

  /// Fin de l'inscription sans confirmer l'adresse : le code reste à saisir dans Profil.
  void finirInscription() {
    enInscription = false;
    notifyListeners();
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
      try {
        guideOuvert = await _c.rpc('guide_autorise') == true;
      } catch (_) {}
    } catch (e) {
      erreur = 'Impossible de lire ton compte. Vérifie ta connexion et réessaie.';
    }
    charge = false;
    notifyListeners();
  }

  /// Relit le document du compte sur le serveur, le modifie avec [changer] et le renvoie : rien de ce
  /// qu'un autre appareil a écrit entre-temps ne se perd. [changer] renvoie le document à écrire, ou
  /// un message d'erreur (String) pour ne rien écrire.
  Future<String?> _modifier(Object Function(Map<String, dynamic> doc) changer) async {
    final u = _c.auth.currentUser;
    if (u == null) return 'Tu as été déconnecté. Reconnecte-toi pour continuer.';
    final d = await _c.from('etats').select('etat,pseudo').eq('user_id', u.id).maybeSingle();
    if (d == null || d['etat'] is! Map) return 'Ton compte est introuvable sur le serveur.';
    final r = changer(Map<String, dynamic>.from(d['etat'] as Map));
    if (r is String) return r;
    final doc = r as Map<String, dynamic>;
    final p = (d['pseudo'] as String?) ?? '';
    await _c.from('etats').upsert({
      'user_id': u.id,
      if (p.isNotEmpty) 'pseudo': p,
      'etat': doc,
      'maj': DateTime.now().toUtc().toIso8601String(),
    });
    etat = Etat.depuis(doc);
    notifyListeners();
    return null;
  }

  /// Range la séance faite dans le compte. Renvoie un message d'erreur, ou null si c'est fait.
  Future<String?> enregistrer(int i, String signature, List<Journal?> journaux, {int? min}) async {
    if (_c.auth.currentUser == null) return 'Tu as été déconnecté. Reconnecte-toi pour enregistrer ta séance.';
    try {
      return await _modifier((doc) {
        final actuel = Etat.depuis(doc);
        if (i >= actuel.seances.length || actuel.seances[i]?.signature != signature) {
          return 'Cette séance a été modifiée sur le site entre-temps : enregistrement impossible.';
        }
        return enregistrerSeance(doc, i, journaux, catalogue, min: min);
      });
    } catch (e) {
      return 'Enregistrement impossible : vérifie ta connexion et réessaie. Ta séance est gardée sur ce téléphone.';
    }
  }

  /// Ajoute une séance à « Mes séances ». Renvoie un message d'erreur, ou null si c'est fait.
  Future<String?> creerSeance(String nom, List<String> ids) async {
    try {
      return await _modifier((doc) => seances.creerSeance(doc, nom, ids, catalogue));
    } catch (e) {
      return 'Enregistrement impossible : vérifie ta connexion et réessaie.';
    }
  }

  /// Modifie la séance `i`, si elle n'a pas changé sur le site entre-temps (`signature`).
  Future<String?> modifierSeance(int i, String signature, String nom, List<seances.ExModifie> ex) async {
    try {
      return await _modifier((doc) {
        final actuel = Etat.depuis(doc);
        if (i >= actuel.seances.length || actuel.seances[i]?.signature != signature) {
          return 'Cette séance a été modifiée sur le site entre-temps. Rouvre-la pour repartir de la dernière version.';
        }
        return seances.modifierSeance(doc, i, nom, ex, catalogue);
      });
    } catch (e) {
      return 'Enregistrement impossible : vérifie ta connexion et réessaie.';
    }
  }

  /// Supprime la séance `i`, si elle n'a pas changé sur le site entre-temps (`signature`).
  Future<String?> supprimerSeance(int i, String signature) async {
    try {
      final err = await _modifier((doc) {
        final actuel = Etat.depuis(doc);
        if (i >= actuel.seances.length || actuel.seances[i]?.signature != signature) {
          return 'Cette séance a été modifiée sur le site entre-temps : suppression annulée.';
        }
        return seances.supprimerSeance(doc, i);
      });
      final uid = idUtilisateur;
      if (err == null && uid != null) await Brouillons.oublier(uid, i);
      return err;
    } catch (e) {
      return 'Suppression impossible : vérifie ta connexion et réessaie.';
    }
  }

  /// Passe le compte en mode Suivi ou Guidé, comme le Profil du site (A.mode, et la carte
  /// d'explication du mode Suivi déjà vue). Changer ne perd rien : les données sont les mêmes.
  Future<String?> changerMode(Mode m) async {
    try {
      return await _modifier((doc) {
        final a = Map<String, dynamic>.from((doc['A'] as Map?) ?? const {});
        a['mode'] = m == Mode.suivi ? 'suivi' : 'guide';
        a['carteSuivi'] = true;
        return {...doc, 'A': a};
      });
    } catch (e) {
      return 'Changement impossible : vérifie ta connexion et réessaie.';
    }
  }

  /// Supprime le compte pour de bon (fonction Edge « oublier », comme « Tout effacer » sur le site) :
  /// le compte et tout ce qu'il contient, sur le serveur, puis ce qui reste sur ce téléphone.
  /// Le compte n'est déclaré supprimé que si le serveur l'a confirmé. Renvoie un message d'erreur, ou null.
  Future<String?> supprimerCompte() async {
    final uid = idUtilisateur;
    if (uid == null || session == null) return 'Tu as été déconnecté. Reconnecte-toi pour supprimer ton compte.';
    try {
      final r = await _c.functions.invoke('oublier', body: const <String, dynamic>{});
      if (r.status != 200) throw Exception('oublier ${r.status}');
    } catch (e) {
      return "La suppression n'a pas pu être confirmée par le serveur : rien n'a été effacé. Vérifie ta connexion et réessaie.";
    }
    await Brouillons.toutOublier(uid);
    await deconnecter();
    return null;
  }

  Future<void> deconnecter() async {
    /* Compte déjà supprimé ou réseau coupé : la session de ce téléphone est fermée quand même. */
    try {
      await _c.auth.signOut();
    } catch (_) {}
    etat = null;
    pseudo = '';
    guideOuvert = false;
    enInscription = false;
    _adresseDemandee = null;
    avertissement = null;
    notifyListeners();
  }
}
