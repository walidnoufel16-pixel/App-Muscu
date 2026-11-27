/* Créer son compte, comme le site (web/app/bienvenue « Créer mon compte » et creerCompte de
   web/lib/store.ts) : un surnom (deux caractères au moins), une adresse mail facultative.
   Le compte est créé sans mot de passe (connexion anonyme Supabase) ; l'adresse, si elle est
   donnée, y est rattachée par un code reçu par mail. Sans adresse, le compte ne vit que sur ce
   téléphone.
   Le document rangé dans « etats » est celui qu'écrit le site pour un nouveau compte : l'état vide
   (vide() de store.ts), puis l'accueil du site pour un compte sans mode Guidé : mode Suivi verrouillé
   (A.suiviSeul) et accueil passé (sinon le site rouvrirait ses questions au premier passage). */

/// Le surnom tel qu'il est rangé : sans espaces autour, sans < ni > (sansBalise du site).
String pseudoPropre(String p) => p.trim().replaceAll(RegExp(r'[<>]'), '');

const pseudoMax = 24;

/// Le message à montrer si le formulaire ne va pas, ou null. [pseudo] et [mail] déjà nettoyés.
String? erreurInscription(String pseudo, String mail, bool Function(String) mailValide) {
  if (pseudo.length < 2) return 'Deux caractères au minimum.';
  if (mail.isNotEmpty && !mailValide(mail)) return "Cette adresse n'a pas l'air valide. Corrige-la, ou laisse le champ vide.";
  return null;
}

/// Le document du compte à sa création.
Map<String, dynamic> documentNouveauCompte({DateTime? maintenant}) => {
      'A': {'mode': 'suivi', 'suiviSeul': true, 'accueilPasse': true},
      'LOG': <String, dynamic>{},
      'SWAP': <String, dynamic>{},
      'SWAPP': <String, dynamic>{},
      'PLAN': null,
      'SEANCES': <dynamic>[],
      'wk': 0,
      'day': 0,
      'FINI': false,
      'ts': (maintenant ?? DateTime.now()).millisecondsSinceEpoch,
    };
