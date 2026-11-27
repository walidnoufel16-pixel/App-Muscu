/* Oxa, l'appli mobile (iOS et Android). Première version : le mode Suivi, branché sur le même
   compte Supabase que le site. Création du compte ou connexion par code, puis les trois onglets : Séances, Progrès, Profil. */
import 'package:material_ui/material_ui.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'donnees/compte.dart';
import 'ecrans/connexion.dart';
import 'ecrans/accueil.dart';
import 'theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Supabase.initialize(url: sbUrl, publishableKey: sbKey);
  final compte = Compte(Supabase.instance.client);
  await compte.chargerCatalogue();
  if (compte.session != null) compte.recharger();
  runApp(AppOxa(compte: compte));
}

class AppOxa extends StatelessWidget {
  const AppOxa({super.key, required this.compte});
  final Compte compte;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Oxa',
      debugShowCheckedModeBanner: false,
      theme: themeOxa(Brightness.light),
      darkTheme: themeOxa(Brightness.dark),
      home: StreamBuilder(
        stream: compte.changements,
        /* Pendant l'inscription, le compte existe déjà mais on reste sur l'écran jusqu'au code de l'adresse. */
        builder: (context, _) => ListenableBuilder(
          listenable: compte,
          builder: (context, _) => compte.session == null || compte.enInscription
              ? EcranConnexion(compte: compte)
              : EcranAccueil(compte: compte),
        ),
      ),
    );
  }
}
