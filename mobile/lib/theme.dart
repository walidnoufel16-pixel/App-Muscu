/* Les couleurs d'Oxa, reprises de web/app/globals.css (turquoise « plate », fonds façon iOS). */
import 'package:material_ui/material_ui.dart';

class Oxa {
  static const plate = Color(0xFF0FB5A3);
  static const plateSombre = Color(0xFF2DD4BF);
  static const plateInk = Color(0xFF0F766E);
  static const plateInkSombre = Color(0xFF5EEAD4);
}

ThemeData themeOxa(Brightness b) {
  final clair = b == Brightness.light;
  final plate = clair ? Oxa.plate : Oxa.plateSombre;
  final schema = ColorScheme(
    brightness: b,
    primary: plate,
    onPrimary: const Color(0xFF0A0A0C),
    secondary: clair ? Oxa.plateInk : Oxa.plateInkSombre,
    onSecondary: clair ? Colors.white : const Color(0xFF0A0A0C),
    error: const Color(0xFFDC2626),
    onError: Colors.white,
    surface: clair ? const Color(0xFFF2F2F4) : const Color(0xFF0A0A0C),
    onSurface: clair ? const Color(0xFF0A0A0C) : const Color(0xFFF5F5F7),
    surfaceContainer: clair ? Colors.white : const Color(0xFF1C1C22),
    onSurfaceVariant: clair ? const Color(0xFF62626C) : const Color(0xFF9D9DA7),
    outline: clair ? const Color(0xFFE2E2E6) : const Color(0xFF303038),
  );
  return ThemeData(
    colorScheme: schema,
    scaffoldBackgroundColor: schema.surface,
    appBarTheme: AppBarTheme(backgroundColor: schema.surface, surfaceTintColor: Colors.transparent, elevation: 0),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: plate,
        foregroundColor: const Color(0xFF0A0A0C),
        minimumSize: const Size.fromHeight(48),
        shape: const StadiumBorder(),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: schema.surfaceContainer,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    ),
  );
}
