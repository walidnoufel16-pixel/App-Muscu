// Le vrai catalogue des exercices (assets/exercices.json), pour tester avec les mêmes données que l'appli.
import 'dart:convert';
import 'dart:io';

import 'package:oxa/logique/modele.dart';

final Map<String, Exercice> cat = {
  for (final e in (jsonDecode(File('assets/exercices.json').readAsStringSync()) as Map<String, dynamic>).entries)
    e.key: Exercice.depuis(Map<String, dynamic>.from(e.value as Map)),
};
